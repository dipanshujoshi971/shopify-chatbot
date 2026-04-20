import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — ShopSifu',
  description:
    'How ShopSifu collects, uses, and protects merchant and shopper data.',
};

const LAST_UPDATED = 'April 17, 2026';
const COMPANY = 'ShopSifu';
const CONTACT_EMAIL = 'privacy@shopsifu.com';
const SUPPORT_EMAIL = 'support@shopsifu.com';
const WEBSITE = 'https://shopsifu.com';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-100">
      <Link
        href="/"
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← Back to home
      </Link>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Last updated: {LAST_UPDATED}
      </p>

      <section className="prose prose-invert mt-10 max-w-none space-y-8 text-neutral-200">
        <p>
          {COMPANY} (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates
          an AI-powered chatbot and live-chat service for Shopify merchants,
          available through the Shopify App Store and at {WEBSITE}. This Privacy
          Policy explains what information we collect, why we collect it, how we
          use and share it, and the choices and rights you have. By installing
          or using {COMPANY} you agree to this policy.
        </p>

        <h2 className="text-2xl font-semibold">1. Who this policy applies to</h2>
        <ul className="list-disc pl-6">
          <li>
            <strong>Merchants</strong> — Shopify store owners and staff who
            install {COMPANY} on their store and use our dashboard.
          </li>
          <li>
            <strong>Shoppers</strong> — customers of those stores who interact
            with the chatbot widget on a merchant&apos;s storefront.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold">2. Information we collect</h2>

        <h3 className="text-xl font-semibold">From Shopify (when a merchant installs the app)</h3>
        <ul className="list-disc pl-6">
          <li>Shop domain, shop ID, shop name, plan, country and timezone.</li>
          <li>
            An encrypted OAuth access token that lets us call the Shopify Admin
            API on the merchant&apos;s behalf, scoped to{' '}
            <code>read_products</code>, <code>read_orders</code>, and{' '}
            <code>read_customers</code>.
          </li>
          <li>
            Product catalog, order, and customer data <em>only when queried
            live</em> to answer a shopper&apos;s question (e.g. &ldquo;where is
            my order?&rdquo;). We do not create a persistent mirror of the
            merchant&apos;s catalog.
          </li>
        </ul>

        <h3 className="text-xl font-semibold">From merchants (dashboard usage)</h3>
        <ul className="list-disc pl-6">
          <li>Account details via Clerk (email, name, authentication metadata).</li>
          <li>Chatbot configuration, tone, custom instructions, and branding choices.</li>
          <li>Knowledge-base documents the merchant uploads to train the bot.</li>
        </ul>

        <h3 className="text-xl font-semibold">From shoppers (chat widget)</h3>
        <ul className="list-disc pl-6">
          <li>Messages the shopper types into the chat widget.</li>
          <li>A session identifier stored in the browser (local storage) to keep the conversation coherent across page loads.</li>
          <li>
            Email address and order number <em>only if the shopper voluntarily
            provides them</em> (e.g. to look up an order or open a support
            ticket).
          </li>
          <li>
            Technical data: IP address, user agent, the page the widget is on,
            timestamps. We use this for rate limiting, abuse prevention, and
            debugging.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold">3. How we use this information</h2>
        <ul className="list-disc pl-6">
          <li>Power the chatbot: generate answers, look up products, check order status, open support tickets.</li>
          <li>Show merchants their conversations, analytics, and support queue in the dashboard.</li>
          <li>Enforce usage limits, detect abuse, and rate-limit traffic.</li>
          <li>Provide customer support and respond to inquiries.</li>
          <li>Comply with legal obligations, including Shopify&apos;s mandatory privacy webhooks.</li>
          <li>Improve the product — we do <strong>not</strong> use merchant or shopper data to train third-party foundation models.</li>
        </ul>

        <h2 className="text-2xl font-semibold">4. Sub-processors and sharing</h2>
        <p>
          We share data only with the sub-processors needed to operate the
          service. Each is bound by a data-protection agreement.
        </p>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              <th className="py-2 text-left">Sub-processor</th>
              <th className="py-2 text-left">Purpose</th>
              <th className="py-2 text-left">Data region</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-800">
              <td className="py-2">Microsoft Azure OpenAI</td>
              <td className="py-2">LLM inference and embeddings</td>
              <td className="py-2">United States / EU</td>
            </tr>
            <tr className="border-b border-neutral-800">
              <td className="py-2">Neon (Postgres)</td>
              <td className="py-2">Primary database</td>
              <td className="py-2">United States</td>
            </tr>
            <tr className="border-b border-neutral-800">
              <td className="py-2">Cloudflare R2</td>
              <td className="py-2">Knowledge-base file storage</td>
              <td className="py-2">Global edge</td>
            </tr>
            <tr className="border-b border-neutral-800">
              <td className="py-2">Clerk</td>
              <td className="py-2">Merchant authentication</td>
              <td className="py-2">United States</td>
            </tr>
            <tr className="border-b border-neutral-800">
              <td className="py-2">Resend</td>
              <td className="py-2">Transactional email (support tickets)</td>
              <td className="py-2">United States</td>
            </tr>
            <tr>
              <td className="py-2">Shopify</td>
              <td className="py-2">OAuth, Admin API, Storefront MCP</td>
              <td className="py-2">Global</td>
            </tr>
          </tbody>
        </table>
        <p>
          We do not sell personal data. We do not share personal data for
          behavioral advertising.
        </p>

        <h2 className="text-2xl font-semibold">5. Tenant isolation &amp; security</h2>
        <ul className="list-disc pl-6">
          <li>Each merchant&apos;s data is stored in an isolated Postgres schema (<code>tenant_&lt;id&gt;</code>) so one merchant cannot access another&apos;s data.</li>
          <li>Shopify OAuth tokens are encrypted at rest with AES-256.</li>
          <li>All traffic is served over HTTPS with HSTS enabled.</li>
          <li>Chat widget requests are authenticated via a per-merchant publishable API key and Origin validation.</li>
          <li>Access to production systems is restricted to a limited number of authorized personnel on a need-to-know basis, requires multi-factor authentication, and all privileged access is recorded in an audit log.</li>
          <li>Staff with access to merchant or shopper personal data are bound by written confidentiality obligations and receive periodic security training.</li>
          <li>Our staff cannot view merchant–shopper conversations by default. Conversation content is only exposed to our support team when the merchant explicitly opens a support ticket linked to that conversation, and every such escalation is recorded in our audit log.</li>
        </ul>

        <h2 className="text-2xl font-semibold">6. Data retention</h2>
        <ul className="list-disc pl-6">
          <li>Conversations and messages: retained while the merchant&apos;s account is active, unless the merchant configures a shorter retention period.</li>
          <li>Support tickets: 24 months after resolution.</li>
          <li>Audit logs: 12 months.</li>
          <li>When a merchant uninstalls the app, the account enters a 30-day grace period. After that, or upon a <code>shop/redact</code> webhook from Shopify (whichever comes first), the merchant&apos;s entire tenant schema is deleted.</li>
        </ul>

        <h2 className="text-2xl font-semibold">7. Shopify mandatory webhooks</h2>
        <p>
          We honor Shopify&apos;s privacy compliance webhooks:
        </p>
        <ul className="list-disc pl-6">
          <li>
            <code>customers/data_request</code> — within 30 days we compile a
            merchant-retrievable export of the shopper&apos;s chat data,
            support tickets, and any other personal information we hold.
          </li>
          <li>
            <code>customers/redact</code> — we delete conversations, messages,
            and support tickets associated with the identified shopper.
          </li>
          <li>
            <code>shop/redact</code> — Shopify fires this webhook 48 hours
            after a merchant uninstalls. On receipt we drop the merchant&apos;s
            tenant schema and all associated files in object storage. If the
            merchant reinstalls within the 30-day grace period described in
            §6, their data is restored; once <code>shop/redact</code> is
            received, deletion is permanent.
          </li>
        </ul>

        <h2 className="text-2xl font-semibold">8. Your rights</h2>
        <p>
          Depending on where you live (GDPR in the EU/UK, CCPA/CPRA in
          California, LGPD in Brazil, and similar laws elsewhere) you may have
          the right to:
        </p>
        <ul className="list-disc pl-6">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Delete your data (&ldquo;right to be forgotten&rdquo;).</li>
          <li>Port your data in a machine-readable format.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent where processing is consent-based.</li>
          <li>Lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>
          Shoppers should contact the merchant whose store they were chatting
          with — the merchant is the data controller. Merchants can contact us
          directly at {CONTACT_EMAIL}.
        </p>

        <h2 className="text-2xl font-semibold">9. International data transfers</h2>
        <p>
          Our infrastructure is primarily in the United States. If you access
          the service from outside the US, your information will be transferred
          to and processed in the US and other jurisdictions where our
          sub-processors operate. We rely on Standard Contractual Clauses where
          required.
        </p>

        <h2 className="text-2xl font-semibold">10. Cookies and local storage</h2>
        <p>
          The chat widget stores a small session identifier in the browser&apos;s
          local storage so the conversation continues across page loads. The
          dashboard uses cookies set by Clerk for authentication. We do not use
          advertising or tracking cookies.
        </p>

        <h2 className="text-2xl font-semibold">11. Children</h2>
        <p>
          {COMPANY} is not directed at children under 13 (or the equivalent age
          in your jurisdiction) and we do not knowingly collect data from them.
          If you believe a child has provided us personal data, please contact{' '}
          {CONTACT_EMAIL} and we will delete it.
        </p>

        <h2 className="text-2xl font-semibold">12. AI disclosure</h2>
        <p>
          The chatbot uses large language models (currently provided by Azure
          OpenAI) to generate responses. AI-generated answers may occasionally
          be inaccurate. Shoppers should treat chatbot replies as informational
          and verify anything important — especially order, shipping, or
          refund details — with the merchant directly.
        </p>

        <h2 className="text-2xl font-semibold">13. Changes to this policy</h2>
        <p>
          We will update this page when our practices change. If the changes
          are material, we will notify merchants by email and update the
          &ldquo;Last updated&rdquo; date at the top of this page.
        </p>

        <h2 className="text-2xl font-semibold">14. Data breach notification</h2>
        <p>
          In the event of a personal data breach that affects merchant or
          shopper data, we will notify affected merchants without undue delay
          and, where feasible, within 72 hours of becoming aware of the breach,
          consistent with GDPR Article 33. Notifications will describe the
          nature of the breach, the categories and approximate number of
          records affected, likely consequences, and the measures taken or
          proposed to address it. Merchants are responsible for notifying their
          shoppers and, where applicable, their local data protection
          authority.
        </p>

        <h2 className="text-2xl font-semibold">15. Contact</h2>
        <p>
          Privacy questions: <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <br />
          General support: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </section>
    </main>
  );
}
