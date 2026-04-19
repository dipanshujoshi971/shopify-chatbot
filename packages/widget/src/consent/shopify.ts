/**
 * packages/widget/src/consent/shopify.ts
 *
 * Shopify Customer Privacy API wrapper (GDPR / CCPA compliance).
 *
 * FIX: requestConsent() was returning 'unknown' in production builds for
 * non-Shopify environments, so clicking "Accept & Chat" had no effect.
 * Now always resolves to 'granted' when the user explicitly clicks accept.
 */

import type { ConsentStatus } from '../types.js';

// ------------------------------------------------------------------ //
// Shopify global type augmentation
// ------------------------------------------------------------------ //

declare global {
  interface Window {
    Shopify?: {
      customerPrivacy?: ShopifyCustomerPrivacy;
    };
  }
}

interface ShopifyCustomerPrivacy {
  userCanBeTracked(): boolean;
  currentVisitorConsent(): VisitorConsent;
  setTrackingConsent(
    consent: { analyticsProcessingAllowed: boolean; marketingAllowed: boolean },
    callback: (err?: Error) => void,
  ): void;
  onVisitorConsentCollected(handler: (consent: VisitorConsent) => void): void;
}

interface VisitorConsent {
  analyticsProcessingAllowed: boolean;
  marketingAllowed          : boolean;
  preferences               : boolean;
  sale_of_data              : boolean;
}

// ------------------------------------------------------------------ //
// Fallback localStorage key (non-Shopify environments)
// ------------------------------------------------------------------ //

const FALLBACK_CONSENT_KEY = 'shopbot_consent';

// ------------------------------------------------------------------ //
// Public API
// ------------------------------------------------------------------ //

/**
 * getConsentStatus
 *
 * Returns the current consent status:
 *   'granted' — widget may load and track sessions
 *   'denied'  — widget must not load
 *   'unknown' — consent not yet collected
 */
export function getConsentStatus(): ConsentStatus {
  // ── Shopify storefront path ────────────────────────────────────────
  if (window.Shopify?.customerPrivacy) {
    const cp = window.Shopify.customerPrivacy;

    try {
      if (cp.userCanBeTracked()) return 'granted';

      const consent = cp.currentVisitorConsent();
      const hasExplicitConsent =
        consent.analyticsProcessingAllowed !== undefined;

      return hasExplicitConsent ? 'denied' : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // ── Fallback: non-Shopify environment (dev, headless, test server) ─
  const stored = localStorage.getItem(FALLBACK_CONSENT_KEY);
  if (stored === 'granted') return 'granted';
  if (stored === 'denied')  return 'denied';
  return 'unknown';
}

/**
 * requestConsent
 *
 * Called when the user clicks "Accept & Chat".
 *
 * On real Shopify storefronts: delegates to Shopify's native consent API.
 * On non-Shopify hosts (test server, headless, custom domains):
 *   Always resolves 'granted' because the user just explicitly clicked accept.
 *   Stores the decision in localStorage so it persists across page loads.
 *
 * FIX: Previously returned 'unknown' in production (non-DEV) builds for
 * non-Shopify environments, making the "Accept & Chat" button a no-op.
 */
export function requestConsent(): Promise<ConsentStatus> {
  return new Promise((resolve) => {
    if (window.Shopify?.customerPrivacy) {
      const cp = window.Shopify.customerPrivacy;

      // Subscribe BEFORE triggering banner so we don't miss the event
      cp.onVisitorConsentCollected((consent) => {
        const status: ConsentStatus = consent.analyticsProcessingAllowed
          ? 'granted'
          : 'denied';
        resolve(status);
      });

      cp.setTrackingConsent(
        { analyticsProcessingAllowed: true, marketingAllowed: false },
        (err) => {
          if (err) {
            console.warn('[shopsifu] Consent API error:', err);
            resolve('unknown');
          }
        },
      );
      return;
    }

    // ── Non-Shopify fallback (dev AND production without Shopify privacy API) ──
    // The user explicitly clicked "Accept & Chat" — always grant.
    // In a production headless setup, replace this with your own consent modal.
    // widgetAuth on the server validates the domain — this is the client-side gate.
    try {
      localStorage.setItem(FALLBACK_CONSENT_KEY, 'granted');
    } catch {
      // localStorage blocked (e.g. sandboxed iframe) — grant in-memory only
    }
    resolve('granted');
  });
}

/**
 * onConsentChange
 *
 * Subscribes to future consent changes (e.g. customer withdraws consent
 * via Shopify's consent manager). Returns an unsubscribe function.
 */
export function onConsentChange(
  handler: (status: ConsentStatus) => void,
): () => void {
  if (!window.Shopify?.customerPrivacy) return () => {};

  window.Shopify.customerPrivacy.onVisitorConsentCollected((consent) => {
    handler(consent.analyticsProcessingAllowed ? 'granted' : 'denied');
  });

  // Shopify doesn't provide an unsubscribe mechanism
  return () => {};
}