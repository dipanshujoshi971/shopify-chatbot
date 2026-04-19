// NEXT_PUBLIC_SHOW_BILLING gates every pricing/plan/billing surface in the UI.
// Off while the app is listed as Free for Shopify App Store review; flip on
// once pricing is finalized and the listing is updated.
export const SHOW_BILLING = process.env.NEXT_PUBLIC_SHOW_BILLING === 'true';
