/**
 * packages/widget/src/consent/shopify.ts
 *
 * Shopify Customer Privacy API wrapper (GDPR / CCPA compliance).
 *
 * The widget MUST NOT load session tracking or LLM calls until the
 * customer has granted consent.  This module wraps Shopify's built-in
 * consent API which is available on all Online Store 2.0 storefronts.
 *
 * Spec reference:
 *   https://shopify.dev/docs/api/consent-tracking
 *
 * Degradation strategy:
 *   - If customerPrivacy is unavailable (non-Shopify env / headless),
 *     we fall back to localStorage consent flag so the widget still
 *     works in dev/test environments.
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
  /** True if the customer can be tracked (consent granted OR region doesn't require it) */
  userCanBeTracked(): boolean;
  /** Returns the current consent status object */
  currentVisitorConsent(): VisitorConsent;
  /** Renders the Shopify consent banner (if not already shown) */
  setTrackingConsent(
    consent: { analyticsProcessingAllowed: boolean; marketingAllowed: boolean },
    callback: (err?: Error) => void,
  ): void;
  /** Subscribe to consent changes */
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
      // userCanBeTracked() returns true if:
      //   • customer granted consent, OR
      //   • customer's region doesn't require explicit consent (e.g. US)
      if (cp.userCanBeTracked()) return 'granted';

      // Check if consent was explicitly denied vs never collected
      const consent = cp.currentVisitorConsent();
      const hasExplicitConsent =
        consent.analyticsProcessingAllowed !== undefined;

      return hasExplicitConsent ? 'denied' : 'unknown';
    } catch {
      // API threw — treat as unknown so widget can prompt
      return 'unknown';
    }
  }

  // ── Fallback: non-Shopify environment (dev, headless) ─────────────
  const stored = localStorage.getItem(FALLBACK_CONSENT_KEY);
  if (stored === 'granted') return 'granted';
  if (stored === 'denied')  return 'denied';
  return 'unknown';
}

/**
 * requestConsent
 *
 * Asks Shopify to show its native consent banner.
 * Resolves with the final consent status once the customer interacts.
 *
 * On non-Shopify environments, resolves immediately with 'granted'
 * (suitable for dev/test only — never ship wildcard consent!).
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

      // Request analytics + marketing consent for full widget functionality
      cp.setTrackingConsent(
        { analyticsProcessingAllowed: true, marketingAllowed: false },
        (err) => {
          if (err) {
            console.warn('[shopbot] Consent API error:', err);
            resolve('unknown');
          }
        },
      );
      return;
    }

    // ── Non-Shopify fallback ─────────────────────────────────────────
    // In a real headless setup, implement your own consent UI here.
    // For dev/test, auto-grant.
    if (import.meta.env.DEV) {
      localStorage.setItem(FALLBACK_CONSENT_KEY, 'granted');
      resolve('granted');
    } else {
      resolve('unknown');
    }
  });
}

/**
 * onConsentChange
 *
 * Subscribes to future consent changes (e.g. customer withdraws consent
 * via Shopify's consent manager).  Returns an unsubscribe function.
 */
export function onConsentChange(
  handler: (status: ConsentStatus) => void,
): () => void {
  if (!window.Shopify?.customerPrivacy) return () => {};

  window.Shopify.customerPrivacy.onVisitorConsentCollected((consent) => {
    handler(consent.analyticsProcessingAllowed ? 'granted' : 'denied');
  });

  // Shopify doesn't provide an unsubscribe mechanism, so no-op
  return () => {};
}