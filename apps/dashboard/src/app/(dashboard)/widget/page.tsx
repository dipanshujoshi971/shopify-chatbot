'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Code2, Key, AlertCircle } from 'lucide-react';

interface Merchant {
  shopDomain: string;
  publishableApiKey: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function WidgetPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch('/api/merchant')
      .then((r) => r.json())
      .then((d: { merchant: Merchant | null }) => setMerchant(d.merchant));
  }, []);

  if (!merchant) return (
    <div className="max-w-2xl space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-zinc-100 rounded-xl" />
      ))}
    </div>
  );

  // NEXT_PUBLIC_API_URL must be set in your .env.local / deployment config.
  // Example:  NEXT_PUBLIC_API_URL=https://api.yourapp.com
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrlMissing = !apiBaseUrl;
  const displayUrl = apiBaseUrl ?? 'https://api.yourapp.com';

  const embedCode = `<script
  src="${displayUrl}/widget.iife.js"
  data-api-key="${merchant.publishableApiKey}"
  data-shop-domain="{{ shop.permanent_domain }}"
  data-title="{{ shop.name }}"
  data-position="right"
  async
></script>`;

  return (
    <div className="max-w-2xl space-y-5">

      {/* Missing env warning */}
      {apiUrlMissing && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              NEXT_PUBLIC_API_URL not set
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_API_URL=https://your-api-domain.com</code> to
              your <code className="bg-amber-100 px-1 rounded">.env.local</code> file so the embed code
              points to your live API server.
            </p>
          </div>
        </div>
      )}

      {/* API Key */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900">Publishable API Key</h2>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono text-zinc-700 truncate">
            {merchant.publishableApiKey}
          </code>
          <CopyButton text={merchant.publishableApiKey} />
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          This key is safe to use in public — it is domain-locked to your store.
        </p>
      </div>

      {/* Embed Code */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Embed Code</h2>
          </div>
          <CopyButton text={embedCode} />
        </div>
        <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto">
          <code>{embedCode}</code>
        </pre>
        <p className="text-xs text-zinc-400 mt-3">
          Paste this snippet just before the closing{' '}
          <code className="bg-zinc-100 px-1 rounded">&lt;/body&gt;</code> tag
          in your Shopify theme's <strong>theme.liquid</strong> file.
        </p>
      </div>

      {/* Installation guide */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Installation Steps</h2>
        <ol className="space-y-3">
          {[
            { n: '1', title: 'Open Theme Editor', desc: 'Go to Online Store → Themes → Edit code' },
            { n: '2', title: 'Find theme.liquid',  desc: 'Open the layout/theme.liquid file' },
            { n: '3', title: 'Paste the snippet',  desc: 'Add the embed code before </body>' },
            { n: '4', title: 'Save & Preview',     desc: 'Save the file and visit your store' },
          ].map(({ n, title, desc }) => (
            <li key={n} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {n}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{title}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <a
          href={`https://${merchant.shopDomain}/admin/themes`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700"
        >
          Open Shopify Theme Editor
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}