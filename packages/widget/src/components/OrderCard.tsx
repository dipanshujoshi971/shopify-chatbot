/**
 * packages/widget/src/components/OrderCard.tsx
 *
 * Renders the order status rich card when the AI calls get_order_status.
 * Shows: order number, financial/fulfillment status, line items, tracking.
 */

import { h } from 'preact';
import type { OrderStatusResult } from '../types.js';

interface OrderCardProps {
  data: OrderStatusResult;
}

// ------------------------------------------------------------------ //
// Status pill colours
// ------------------------------------------------------------------ //

type PillVariant = 'green' | 'amber' | 'red' | 'blue' | 'grey';

const FINANCIAL_STATUS_MAP: Record<string, PillVariant> = {
  PAID       : 'green',
  PARTIALLY_PAID: 'amber',
  PENDING    : 'amber',
  REFUNDED   : 'blue',
  VOIDED     : 'grey',
  AUTHORIZED : 'blue',
};

const FULFILLMENT_STATUS_MAP: Record<string, PillVariant> = {
  FULFILLED       : 'green',
  PARTIALLY_FULFILLED: 'amber',
  UNFULFILLED     : 'amber',
  RESTOCKED       : 'grey',
  SCHEDULED       : 'blue',
  IN_PROGRESS     : 'blue',
};

function statusVariant(
  map: Record<string, PillVariant>,
  status: string,
): PillVariant {
  return map[status.toUpperCase()] ?? 'grey';
}

// ------------------------------------------------------------------ //
// Sub-components
// ------------------------------------------------------------------ //

function StatusPill({ label, variant }: { label: string; variant: PillVariant }) {
  return <span class={`sb-pill sb-pill-${variant}`}>{label}</span>;
}

function OrderRow({ label, children }: { label: string; children: preact.ComponentChildren }) {
  return (
    <div class="sb-order-row">
      <span class="sb-order-row-label">{label}</span>
      <span class="sb-order-row-value">{children}</span>
    </div>
  );
}

// ------------------------------------------------------------------ //
// Main card
// ------------------------------------------------------------------ //

export function OrderCard({ data }: OrderCardProps) {
  const {
    orderNumber,
    displayFinancialStatus,
    displayFulfillmentStatus,
    processedAt,
    lineItems,
    shippingAddress,
    trackingInfo,
    totalPrice,
  } = data;

  const date = new Date(processedAt).toLocaleDateString(navigator.language, {
    year : 'numeric',
    month: 'short',
    day  : 'numeric',
  });

  const total = new Intl.NumberFormat(navigator.language, {
    style   : 'currency',
    currency: totalPrice.currencyCode,
  }).format(parseFloat(totalPrice.amount));

  return (
    <div class="sb-order-card">
      {/* Header */}
      <div class="sb-order-header">
        <div>
          <p class="sb-order-number">Order #{orderNumber}</p>
          <p class="sb-order-date">{date}</p>
        </div>
        <div class="sb-order-pills">
          <StatusPill
            label={displayFinancialStatus}
            variant={statusVariant(FINANCIAL_STATUS_MAP, displayFinancialStatus)}
          />
          <StatusPill
            label={displayFulfillmentStatus}
            variant={statusVariant(FULFILLMENT_STATUS_MAP, displayFulfillmentStatus)}
          />
        </div>
      </div>

      {/* Divider */}
      <hr class="sb-divider" />

      {/* Line items */}
      {lineItems.length > 0 && (
        <div class="sb-order-items">
          {lineItems.map((item, i) => (
            <div class="sb-order-item" key={i}>
              <span class="sb-item-qty">{item.quantity}×</span>
              <span class="sb-item-name">
                {item.title}
                {item.variant?.title && item.variant.title !== 'Default Title'
                  ? ` — ${item.variant.title}`
                  : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <hr class="sb-divider" />

      {/* Details */}
      <div class="sb-order-details">
        <OrderRow label="Total">{total}</OrderRow>

        {shippingAddress && (
          <OrderRow label="Ship to">
            {shippingAddress.name}, {shippingAddress.city},{' '}
            {shippingAddress.province}
          </OrderRow>
        )}

        {/* Tracking */}
        {trackingInfo && (
          <OrderRow label="Tracking">
            {trackingInfo.url ? (
              <a
                href={trackingInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                class="sb-tracking-link"
              >
                {trackingInfo.number} ({trackingInfo.company})
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="sb-external-icon"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ) : (
              `${trackingInfo.number} (${trackingInfo.company})`
            )}
          </OrderRow>
        )}
      </div>
    </div>
  );
}