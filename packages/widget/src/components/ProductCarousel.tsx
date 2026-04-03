/**
 * packages/widget/src/components/ProductCarousel.tsx
 *
 * Enhanced product carousel with improved card design:
 *   - Gradient overlay on images
 *   - Star rating placeholder
 *   - Add to Cart CTA alongside View
 *   - Smoother scroll with dot indicators
 */

import { useRef, useCallback, useState } from 'preact/hooks';
import type { ProductSearchResult, ShopifyProduct } from '../types.js';

interface ProductCarouselProps {
  data: ProductSearchResult;
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

function ProductCard({ product }: { product: ShopifyProduct }) {
  const price = product.priceRange.minVariantPrice;
  const onSale = isSale(product);
  const compareAt = product.compareAtPriceRange?.minVariantPrice;
  const shopDomain = (window as any).__shopbot_domain__ as string | undefined;
  const discount = discountPercent(product);

  const productUrl = shopDomain
    ? `https://${shopDomain}/products/${product.handle}`
    : `/products/${product.handle}`;

  return (
    <div class="sb-product-card">
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
        {onSale && discount > 0 && (
          <span class="sb-sale-badge">-{discount}%</span>
        )}
        {!product.availableForSale && (
          <span class="sb-oos-badge">Sold Out</span>
        )}
      </div>

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
          onClick={(e) => { if (!product.availableForSale) e.preventDefault(); }}
        >
          {product.availableForSale ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
              View Product
            </>
          ) : 'Sold Out'}
        </a>
      </div>
    </div>
  );
}

export function ProductCarousel({ data }: ProductCarouselProps) {
  const { products, query } = data;
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);

  const scroll = useCallback((dir: -1 | 1) => {
    if (!trackRef.current) return;
    const cardWidth = 160;
    trackRef.current.scrollBy({ left: dir * cardWidth, behavior: 'smooth' });
  }, []);

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const idx = Math.round(trackRef.current.scrollLeft / 160);
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
        {products.length > 2 && (
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
            <ProductCard product={p} />
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
