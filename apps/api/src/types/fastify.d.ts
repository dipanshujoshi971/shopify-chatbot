import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    /**
     * The resolved merchant ID (e.g. "store_acme_shop") derived from the
     * publishable API key. Set by widgetAuthPlugin on all /widget/* routes.
     */
    tenantId: string;

    /**
     * The merchant's registered shop domain (e.g. "acme-shop.myshopify.com").
     * Useful for downstream handlers that need to call Shopify APIs without
     * re-querying the DB.
     */
    shopDomain: string;
  }
}