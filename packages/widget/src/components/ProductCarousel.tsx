/**
 * packages/widget/src/components/ProductCarousel.tsx
 *
 * Product carousel with two toggleable action panels per card:
 *   - "Add to Cart": variant/size selector + quantity → sends chat message
 *   - "Show Details": toggleable product description panel
 *
 * Images use the featuredImage from Shopify MCP JSON extraction.
 * Both panels are closable/openable independently.
 */

import { useRef, useCallback, useState } from 'preact/hooks';
import type { ProductSearchResult, ShopifyProduct, ProductVariant } from '../types.js';

interface ProductCarouselProps {
  data: ProductSearchResult;
  onSendMessage?: (text: string) => void;
}

function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function isSale(product: ShopifyProduct): boolean {
  if (!product.compareAtPriceRange) return false;
  const compare = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
  const current = parseFloat(product.priceRange.minVariantPrice.amount);
  return compare > current;
}

function discountPercent(product: ShopifyProduct): number {
  if (!product.compareAtPriceRange) return 0;
  const compare = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
  const current = parseFloat(product.priceRange.minVariantPrice.amount);
  if (compare <= 0) return 0;
  return Math.round(((compare - current) / compare) * 100);
}

// ── Add to Cart Panel ────────────────────────────────────────────────

function AddToCartPanel({
  product,
  onSendMessage,
  onClose,
}: {
  product: ShopifyProduct;
  onSendMessage?: (text: string) => void;
  onClose: () => void;
}) {
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0 && !(variants.length === 1 && variants[0].title === 'Default Title');

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? variants[0] : null,
  );
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (!onSendMessage) return;
    const variantLabel = selectedVariant && selectedVariant.title !== 'Default Title'
      ? ` (${selectedVariant.title})`
      : '';
    onSendMessage(`Add ${quantity} of ${product.title}${variantLabel} to cart`);
    onClose();
  };

  const isAvailable = selectedVariant
    ? selectedVariant.availableForSale !== false
    : product.availableForSale;

  return (
    <div class="sb-atc-panel">
      <div class="sb-atc-header">
        <span class="sb-atc-title">Add to Cart</span>
        <button class="sb-atc-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {hasVariants && (
        <div class="sb-atc-variants">
          <label class="sb-atc-label">Variant</label>
          <div class="sb-atc-variant-list">
            {variants.map((v) => (
              <button
                key={v.id}
                class={`sb-atc-variant-btn ${selectedVariant?.id === v.id ? 'sb-atc-variant-active' : ''} ${v.availableForSale === false ? 'sb-atc-variant-oos' : ''}`}
                onClick={() => { if (v.availableForSale !== false) setSelectedVariant(v); }}
                disabled={v.availableForSale === false}
                title={v.availableForSale === false ? 'Sold out' : v.title}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div class="sb-atc-qty-row">
        <label class="sb-atc-label">Qty</label>
        <div class="sb-atc-qty-controls">
          <button
            class="sb-atc-qty-btn"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span class="sb-atc-qty-value">{quantity}</span>
          <button
            class="sb-atc-qty-btn"
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            disabled={quantity >= 10}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <button
        class="sb-atc-submit"
        onClick={handleAdd}
        disabled={!isAvailable}
      >
        {isAvailable ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            Add {quantity} to Cart
          </>
        ) : 'Sold Out'}
      </button>
    </div>
  );
}

// ── Show Details Panel ───────────────────────────────────────────────

function DetailsPanel({
  product,
  onClose,
}: {
  product: ShopifyProduct;
  onClose: () => void;
}) {
  const shopDomain = (window as any).__shopbot_domain__ as string | undefined;
  const productUrl = shopDomain
    ? `https://${shopDomain}/products/${product.handle}`
    : `/products/${product.handle}`;
  const price = product.priceRange.minVariantPrice;

  return (
    <div class="sb-detail-panel">
      <div class="sb-detail-header">
        <span class="sb-detail-title">Details</span>
        <button class="sb-detail-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div class="sb-detail-body">
        <p class="sb-detail-name">{product.title}</p>
        <p class="sb-detail-price">{formatPrice(price.amount, price.currencyCode)}</p>
        {product.description ? (
          <p class="sb-detail-desc">{product.description.length > 200
            ? product.description.slice(0, 200) + '...'
            : product.description
          }</p>
        ) : (
          <p class="sb-detail-desc sb-detail-no-desc">No description available.</p>
        )}
        <a href={productUrl} target="_blank" rel="noopener noreferrer" class="sb-detail-link">
          View on Store
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────

function ProductCard({
  product,
  onSendMessage,
}: {
  product: ShopifyProduct;
  onSendMessage?: (text: string) => void;
}) {
  const [activePanel, setActivePanel] = useState<'cart' | 'details' | null>(null);
  const price = product.priceRange.minVariantPrice;
  const onSale = isSale(product);
  const discount = discountPercent(product);

  return (
    <div class="sb-product-card">
      <div class="sb-product-img-wrap">
        {product.featuredImage?.url ? (
          <>
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              class="sb-product-img"
              loading="lazy"
              decoding="async"
              crossOrigin="anonymous"
              onError={(e) => {
                // Hide broken image and show placeholder
                const img = e.currentTarget as HTMLImageElement;
                img.style.display = 'none';
                const next = img.nextElementSibling as HTMLElement | null;
                if (next) next.style.display = 'flex';
              }}
            />
            <div class="sb-product-img-placeholder" style={{ display: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          </>
        ) : (
          <div class="sb-product-img-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {onSale && discount > 0 && (
          <span class="sb-sale-badge">-{discount}%</span>
        )}
        {!product.availableForSale && (
          <span class="sb-oos-badge">Sold Out</span>
        )}
      </div>

      <div class="sb-product-info">
        <p class="sb-product-title" title={product.title}>{product.title}</p>
        <p class="sb-product-price-line">
          <span class={onSale ? 'sb-price-sale' : ''}>{formatPrice(price.amount, price.currencyCode)}</span>
          {onSale && product.compareAtPriceRange && (
            <span class="sb-product-compare">
              {formatPrice(
                product.compareAtPriceRange.minVariantPrice.amount,
                product.compareAtPriceRange.minVariantPrice.currencyCode,
              )}
            </span>
          )}
        </p>

        <div class="sb-product-actions">
          <button
            class={`sb-product-btn sb-btn-cart ${activePanel === 'cart' ? 'sb-btn-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'cart' ? null : 'cart')}
            disabled={!product.availableForSale}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            Add to Cart
          </button>
          <button
            class={`sb-product-btn sb-btn-details ${activePanel === 'details' ? 'sb-btn-active' : ''}`}
            onClick={() => setActivePanel(activePanel === 'details' ? null : 'details')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Details
          </button>
        </div>
      </div>

      {/* Expandable panels */}
      {activePanel === 'cart' && (
        <AddToCartPanel
          product={product}
          {...(onSendMessage ? { onSendMessage } : {})}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === 'details' && (
        <DetailsPanel
          product={product}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}

// ── Carousel ─────────────────────────────────────────────────────────

export function ProductCarousel({ data, onSendMessage }: ProductCarouselProps) {
  const { products, query } = data;
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);

  const scroll = useCallback((dir: -1 | 1) => {
    if (!trackRef.current) return;
    const cardWidth = 180;
    trackRef.current.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const idx = Math.round(trackRef.current.scrollLeft / 180);
    setScrollIdx(idx);
  }, []);

  if (!products.length) {
    return (
      <div class="sb-no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        No products found for "{query}"
      </div>
    );
  }

  return (
    <div class="sb-carousel-wrap">
      <div class="sb-carousel-header">
        <p class="sb-carousel-label">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
          </svg>
          {products.length} {products.length === 1 ? 'product' : 'products'} found
        </p>
        {products.length > 1 && (
          <div class="sb-carousel-nav">
            <button class="sb-carousel-nav-btn" onClick={() => scroll(-1)} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button class="sb-carousel-nav-btn" onClick={() => scroll(1)} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        )}
      </div>

      <div class="sb-carousel-track" ref={trackRef} role="list" onScroll={handleScroll}>
        {products.map((p) => (
          <div role="listitem" key={p.id}>
            <ProductCard product={p} {...(onSendMessage ? { onSendMessage } : {})} />
          </div>
        ))}
      </div>

      {products.length > 2 && (
        <div class="sb-carousel-dots">
          {products.map((_, i) => (
            <span key={i} class={`sb-dot ${i === scrollIdx ? 'sb-dot-active' : ''}`} />
          ))}
        </div>
      )}
    </div>
  );
}
