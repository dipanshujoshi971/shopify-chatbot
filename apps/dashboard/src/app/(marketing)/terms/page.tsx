import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — ShopSifu',
  description:
    'The terms that govern merchant use of the ShopSifu Shopify app and service.',
};

const LAST_UPDATED = 'April 17, 2026';
const COMPANY = 'ShopSifu';
const SUPPORT_EMAIL = 'support@shopsifu.com';
const LEGAL_EMAIL = 'legal@shopsifu.com';
const WEBSITE = 'https://shopsifu.com';
const GOVERNING_LAW_JURISDICTION = 'Delaware, United States';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-neutral-100">
      <Link
        href="/"
        className="text-sm text-neutral-400 hover:text-neutral-200"
      >
        ← Back to home
      </Link>

      <h1 className="mt-6 text-4xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Last updated: {LAST_UPDATED}
      </p>

      <section className="prose prose-invert mt-10 max-w-none space-y-8 text-neutral-200">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and
          use of the {COMPANY} Shopify application, dashboard, APIs, and
          related services (collectively, the &ldquo;Service&rdquo;) operated
          at {WEBSITE}. By installing the app, creating an account, or using
          the Service in any way, you agree to these Terms. If you do not agree,
          do not install or use the Service.
        </p>

        <h2 className="text-2xl font-semibold">1. Who these Terms apply to</h2>
        <p>
          These Terms are between {COMPANY} and the Shopify merchant that
          installs the app (&ldquo;you&rdquo; or &ldquo;Merchant&rdquo;).
          Shoppers who interact with the chatbot widget on a Merchant&apos;s
          storefront are not parties to these Terms; their relationship is
          with the Merchant. Merchants are responsible for disclosing the
          presence of the chatbot to their shoppers where required by law.
        </p>

        <h2 className="text-2xl font-semibold">2. Account &amp; eligibility</h2>
        <ul className="list-disc pl-6">
          <li>You must have an active Shopify store and the authority to install apps on it.</li>
          <li>You must be at least 18 years old or the age of majority in your jurisdiction.</li>
          <li>You are responsible for keeping your login credentials secure and for everything that happens under your account.</li>
          <li>You must provide accurate information and keep it up to date.</li>
        </ul>

        <h2 className="text-2xl font-semibold">3. The Service</h2>
        <p>
          {COMPANY} provides an AI-powered chatbot, live-chat, and knowledge-base
          service that integrates with Shopify stores. Features include product
          search, order-status lookup, support ticketing, a merchant dashboard,
          and configuration of chatbot behavior. Features may be added, changed,
          or removed over time; we will make reasonable efforts to provide
          notice of material removals.
        </p>

        <h2 className="text-2xl font-semibold">4. Fees, billing &amp; plans</h2>
        <p>
          The Service is currently offered free of charge. The following terms
          will apply if and when paid plans are introduced:
        </p>
        <ul className="list-disc pl-6">
          <li>Paid plans, if offered, will be described in the app listing or dashboard at that time.</li>
          <li>Billing, if introduced, will be processed through Shopify&apos;s billing system. By subscribing to a paid plan, you would authorize Shopify to charge the applicable recurring fee.</li>
          <li>Any fees would be non-refundable except where required by law or expressly stated otherwise. Shopify&apos;s refund policies may also apply.</li>
          <li>We may change prices on reasonable notice. Changes would take effect at the start of your next billing period.</li>
          <li>Free plans, trials, and promotional credits may be subject to usage limits and may be withdrawn at our discretion.</li>
        </ul>

        <h2 className="text-2xl font-semibold">5. Usage limits &amp; fair use</h2>
        <p>
          The Service includes limits on conversations, AI tokens, turns per
          conversation, knowledge-base size, and similar resources. Requests in
          excess of the limits may be throttled, queued, or rejected. Automated
          or scripted use designed to circumvent the limits is prohibited.
        </p>

        <h2 className="text-2xl font-semibold">6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6">
          <li>Use the Service for anything illegal, deceptive, or fraudulent.</li>
          <li>Use the chatbot to provide medical, legal, financial, or other regulated advice where prohibited by law.</li>
          <li>Sell or promote prohibited goods (firearms, controlled substances, counterfeit items, CSAM, etc.) through the chatbot.</li>
          <li>Attempt to reverse-engineer, decompile, or extract the underlying AI models.</li>
          <li>Attempt to jailbreak, bypass safety systems, or use the Service to generate disallowed content.</li>
          <li>Upload malware, scrape the Service, or probe it for vulnerabilities outside our security program (see <a className="underline" href="/.well-known/security.txt">security policy</a>).</li>
          <li>Submit another person&apos;s data to the Service without lawful basis.</li>
          <li>Resell, sublicense, or white-label the Service without a written agreement.</li>
          <li>Use the Service to compete with {COMPANY} or to build a substantially similar product.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules, with
          or without notice depending on severity.
        </p>

        <h2 className="text-2xl font-semibold">7. Your data &amp; responsibilities</h2>
        <ul className="list-disc pl-6">
          <li>You retain ownership of all data you upload (knowledge-base documents, custom instructions, etc.).</li>
          <li>You grant {COMPANY} a limited, non-exclusive license to host, process, and display that data solely to operate the Service for you.</li>
          <li>You represent that you have the rights and consents necessary to provide the data to us.</li>
          <li>You are responsible for complying with applicable laws, including consumer-protection, privacy (GDPR, CCPA, etc.), and AI-disclosure laws in the jurisdictions where your shoppers are located.</li>
          <li>You are responsible for reviewing AI-generated responses. You acknowledge that AI output may be inaccurate and that you are responsible for how it is surfaced to your shoppers.</li>
        </ul>

        <h2 className="text-2xl font-semibold">8. Privacy</h2>
        <p>
          Our collection and use of personal data is described in our{' '}
          <Link className="underline" href="/privacy">Privacy Policy</Link>,
          which forms part of these Terms. We honor Shopify&apos;s mandatory
          privacy compliance webhooks (<code>customers/data_request</code>,{' '}
          <code>customers/redact</code>, <code>shop/redact</code>).
        </p>

        <h2 className="text-2xl font-semibold">9. Third-party services</h2>
        <p>
          The Service integrates with Shopify and uses sub-processors such as
          Microsoft Azure OpenAI, Neon, Cloudflare R2, Clerk, and Resend. Your
          use of those services through {COMPANY} is also subject to their
          respective terms. {COMPANY} is not responsible for outages or
          behavior of third-party services outside our reasonable control.
        </p>

        <h2 className="text-2xl font-semibold">10. Intellectual property</h2>
        <p>
          The Service, including our software, design, trademarks, and
          documentation, is owned by {COMPANY} and protected by intellectual
          property laws. These Terms grant you a limited, revocable,
          non-transferable license to use the Service during the term of your
          subscription. All rights not expressly granted are reserved.
        </p>
        <p>
          Feedback you send us about the Service is non-confidential and may
          be used by us without obligation to you.
        </p>

        <h2 className="text-2xl font-semibold">11. AI disclaimer</h2>
        <p>
          The chatbot uses large language models to generate responses. Output
          can be inaccurate, incomplete, biased, or outdated. You agree that:
        </p>
        <ul className="list-disc pl-6">
          <li>You will not rely on the Service as a sole source for decisions that have legal, medical, or financial consequences.</li>
          <li>You are responsible for disclosing AI use to shoppers where required by law.</li>
          <li>{COMPANY} makes no guarantee that AI output is fit for any particular purpose.</li>
        </ul>

        <h2 className="text-2xl font-semibold">12. Service availability</h2>
        <p>
          We aim for high availability but do not promise uninterrupted service.
          Maintenance, third-party outages, bugs, or force-majeure events may
          cause downtime. We may schedule maintenance windows with notice where
          practical.
        </p>

        <h2 className="text-2xl font-semibold">13. Suspension &amp; termination</h2>
        <ul className="list-disc pl-6">
          <li>You may cancel at any time by uninstalling the app from your Shopify admin. If paid plans apply, uninstallation immediately stops billing of future periods; fees already paid are not refunded except where required by law.</li>
          <li>Upon uninstall, your data enters a 30-day grace period, after which the tenant schema is deleted. Shopify&apos;s <code>shop/redact</code> webhook may delete data sooner.</li>
          <li>We may suspend or terminate your access immediately if you violate these Terms, if required by law, or if continuing to provide the Service would expose us or others to harm.</li>
        </ul>

        <h2 className="text-2xl font-semibold">14. Warranty disclaimer</h2>
        <p className="uppercase text-sm">
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;.
          To the maximum extent permitted by law, {COMPANY} disclaims all
          warranties, express or implied, including merchantability, fitness
          for a particular purpose, non-infringement, and any warranties
          arising from course of dealing or usage of trade.
        </p>

        <h2 className="text-2xl font-semibold">15. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {COMPANY}&apos;s total
          aggregate liability arising out of or relating to these Terms or the
          Service will not exceed the greater of (a) the fees you paid us in
          the twelve (12) months before the event giving rise to the liability
          or (b) one hundred US dollars (US $100). {COMPANY} will not be
          liable for indirect, incidental, consequential, special, exemplary,
          or punitive damages, or for lost profits, revenue, goodwill, or data,
          even if advised of the possibility of such damages.
        </p>

        <h2 className="text-2xl font-semibold">16. Indemnification</h2>
        <p>
          You agree to defend, indemnify, and hold harmless {COMPANY} and its
          officers, directors, employees, and affiliates from any claims,
          damages, liabilities, and expenses (including reasonable attorneys&apos;
          fees) arising from (a) your use of the Service, (b) your violation
          of these Terms, (c) your violation of any law or third-party right,
          or (d) the content or data you submit to the Service.
        </p>

        <h2 className="text-2xl font-semibold">17. Governing law &amp; disputes</h2>
        <p>
          These Terms are governed by the laws of {GOVERNING_LAW_JURISDICTION},
          without regard to its conflict-of-laws rules. Except where prohibited
          by law, you and {COMPANY} agree to resolve disputes in the state or
          federal courts located in {GOVERNING_LAW_JURISDICTION}, and each
          party consents to personal jurisdiction there. You waive any right to
          a jury trial and to participate in a class action.
        </p>

        <h2 className="text-2xl font-semibold">18. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. If changes are material,
          we will notify Merchants by email or through the dashboard. Continued
          use of the Service after the effective date constitutes acceptance of
          the updated Terms.
        </p>

        <h2 className="text-2xl font-semibold">19. Miscellaneous</h2>
        <ul className="list-disc pl-6">
          <li>If any provision of these Terms is held unenforceable, the remaining provisions remain in full effect.</li>
          <li>Our failure to enforce a provision is not a waiver.</li>
          <li>You may not assign these Terms without our written consent. We may assign them in connection with a merger, acquisition, or sale of assets.</li>
          <li>These Terms are the entire agreement between you and {COMPANY} regarding the Service and supersede prior agreements on the same subject.</li>
        </ul>

        <h2 className="text-2xl font-semibold">20. Contact</h2>
        <p>
          General support: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          <br />
          Legal notices: <a className="underline" href={`mailto:${LEGAL_EMAIL}`}>{LEGAL_EMAIL}</a>
        </p>
      </section>
    </main>
  );
}
