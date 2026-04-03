/**
 * packages/widget/src/components/CartCard.tsx
 *
 * Renders a styled cart summary card when the AI calls get_cart or update_cart.
 * Shows line items, total, and a checkout button linking to the Shopify checkout.
 */

import type { CartResult } from '../types.js';

interface CartCardProps {
  data: CartResult;
}

function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function CartCard({ data }: CartCardProps) {
  const { checkoutUrl, totalQuantity, lines, cost } = data;

  return (
    <div class="sb-cart-card">
      <div class="sb-cart-header">
        <div class="sb-cart-header-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sb-cart-icon">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          <span class="sb-cart-title">Your Cart</span>
        </div>
        <span class="sb-cart-count">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</span>
      </div>

      {lines.length > 0 && (
        <div class="sb-cart-items">
          {lines.map((line, i) => (
            <div class="sb-cart-item" key={i}>
              {line.image && (
                <img src={line.image} alt={line.title} class="sb-cart-item-img" loading="lazy" />
              )}
              <div class="sb-cart-item-info">
                <p class="sb-cart-item-title">{line.title}</p>
                {line.variant && line.variant !== 'Default Title' && (
                  <p class="sb-cart-item-variant">{line.variant}</p>
                )}
              </div>
              <div class="sb-cart-item-right">
                <span class="sb-cart-item-qty">{line.quantity}x</span>
                {line.price && (
                  <span class="sb-cart-item-price">
                    {formatPrice(line.price.amount, line.price.currencyCode)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div class="sb-cart-footer">
        {cost?.totalAmount && (
          <div class="sb-cart-total">
            <span>Total</span>
            <span class="sb-cart-total-price">
              {formatPrice(cost.totalAmount.amount, cost.totalAmount.currencyCode)}
            </span>
          </div>
        )}
        {checkoutUrl && (
          <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" class="sb-cart-checkout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Checkout
          </a>
        )}
      </div>
    </div>
  );
}
