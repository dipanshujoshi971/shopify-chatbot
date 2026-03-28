/**
 * packages/widget/src/components/ProductCarousel.tsx
 *
 * Renders the product carousel when the AI calls search_shop_catalog.
 * Handles: featured image, title, price, sale badge, OOS state, CTA.
 */

import { useRef, useCallback } from 'preact/hooks';
import type { ProductSearchResult, ShopifyProduct } from '../types.js';

interface ProductCarouselProps {
  data: ProductSearchResult;
}

// ------------------------------------------------------------------ //
// Helpers
// ------------------------------------------------------------------ //

function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat(navigator.language, {
    style   : 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function isSale(product: ShopifyProduct): boolean {
  if (!product.compareAtPriceRange) return false;
  const compare = parseFloat(
    product.compareAtPriceRange.minVariantPrice.amount,
  );
  const current = parseFloat(product.priceRange.minVariantPrice.amount);
  return compare > current;
}

// ------------------------------------------------------------------ //
// Single Product Card
// ------------------------------------------------------------------ //

function ProductCard({ product }: { product: ShopifyProduct }) {
  const price      = product.priceRange.minVariantPrice;
  const onSale     = isSale(product);
  const compareAt  = product.compareAtPriceRange?.minVariantPrice;
  const shopDomain = (window as any).__shopbot_domain__ as string | undefined;

  const productUrl = shopDomain
    ? `https://${shopDomain}/products/${product.handle}`
    : `/products/${product.handle}`;

  return (
    <div class="sb-product-card">
      {/* Image */}
      <div class="sb-product-img-wrap">
        {product.featuredImage ? (
          <img
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            class="sb-product-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div class="sb-product-img-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {onSale && <span class="sb-sale-badge">Sale</span>}
        {!product.availableForSale && (
          <span class="sb-oos-badge">Sold Out</span>
        )}
      </div>

      {/* Info */}
      <div class="sb-product-info">
        <p class="sb-product-title" title={product.title}>
          {product.title}
        </p>

        <div class="sb-product-price-row">
          <span class={`sb-product-price ${onSale ? 'sb-price-sale' : ''}`}>
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          {onSale && compareAt && (
            <span class="sb-product-compare">
              {formatPrice(compareAt.amount, compareAt.currencyCode)}
            </span>
          )}
        </div>

        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          class={`sb-product-cta ${!product.availableForSale ? 'sb-cta-disabled' : ''}`}
          aria-disabled={!product.availableForSale}
          onClick={(e) => {
            if (!product.availableForSale) e.preventDefault();
          }}
        >
          {product.availableForSale ? 'View Product' : 'Unavailable'}
        </a>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ //
// Carousel (horizontally scrollable row)
// ------------------------------------------------------------------ //

export function ProductCarousel({ data }: ProductCarouselProps) {
  const { products, query } = data;
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: -1 | 1) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 200, behavior: 'smooth' });
  }, []);

  if (!products.length) {
    return (
      <div class="sb-no-results">
        No products found for "{query}".
      </div>
    );
  }

  return (
    <div class="sb-carousel-wrap">
      <p class="sb-carousel-label">
        {products.length === 1
          ? '1 product found'
          : `${products.length} products found`}
      </p>

      <div class="sb-carousel-viewport">
        {/* Scroll left */}
        {products.length > 1 && (
          <button
            class="sb-carousel-arrow sb-arrow-left"
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Track */}
        <div class="sb-carousel-track" ref={trackRef} role="list">
          {products.map((p) => (
            <div role="listitem" key={p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {/* Scroll right */}
        {products.length > 1 && (
          <button
            class="sb-carousel-arrow sb-arrow-right"
            onClick={() => scroll(1)}
            aria-label="Scroll right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}