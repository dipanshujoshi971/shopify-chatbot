'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Code2, Key, AlertCircle, Terminal, Globe, Shield, Zap } from 'lucide-react';

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
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function InstallationPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetch('/api/merchant')
      .then((r) => r.json())
      .then((d: { merchant: Merchant | null }) => setMerchant(d.merchant));
  }, []);

  if (!merchant) return (
    <div className="max-w-3xl space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-40 glass-card animate-pulse" />
      ))}
    </div>
  );

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
><\/script>`;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page intro */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Install Your Chatbot</h2>
        <p className="text-sm text-muted-foreground mt-1">Follow these steps to add {process.env.NEXT_PUBLIC_APP_NAME || 'ShopChat'} to your Shopify store</p>
      </div>

      {/* Missing env warning */}
      {apiUrlMissing && (
        <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">API URL not configured</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add <code className="px-1.5 py-0.5 rounded bg-accent text-xs font-mono">NEXT_PUBLIC_API_URL=https://your-api-domain.com</code> to your <code className="px-1.5 py-0.5 rounded bg-accent text-xs font-mono">.env.local</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Key */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Key className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Publishable API Key</h3>
            <p className="text-xs text-muted-foreground">Domain-locked, safe for public use</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 glass-input rounded-xl px-4 py-2.5 text-sm font-mono text-foreground truncate">
            {merchant.publishableApiKey}
          </code>
          <CopyButton text={merchant.publishableApiKey} />
        </div>
      </div>

      {/* Embed Code */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center">
              <Code2 className="w-4.5 h-4.5 text-chart-2" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Embed Code</h3>
              <p className="text-xs text-muted-foreground">Paste into your theme.liquid</p>
            </div>
          </div>
          <CopyButton text={embedCode} />
        </div>
        <div className="relative rounded-xl overflow-hidden">
          <div className="absolute top-3 left-4 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <pre className="bg-[oklch(0.12_0_0)] text-emerald-300 rounded-xl p-4 pt-9 text-xs leading-relaxed overflow-x-auto">
            <code>{embedCode}</code>
          </pre>
        </div>
      </div>

      {/* Installation steps */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Installation Steps</h3>
        <div className="space-y-4">
          {[
            { icon: Globe, title: 'Open Theme Editor', desc: 'Navigate to Online Store > Themes > Edit code in your Shopify admin', color: 'bg-emerald-500/10 text-emerald-500' },
            { icon: Terminal, title: 'Find theme.liquid', desc: 'Open the layout/theme.liquid file from the file tree', color: 'bg-blue-500/10 text-blue-500' },
            { icon: Code2, title: 'Paste the snippet', desc: 'Add the embed code just before the closing </body> tag', color: 'bg-violet-500/10 text-violet-500' },
            { icon: Zap, title: 'Save & Preview', desc: 'Save the file and visit your store to see the chatbot', color: 'bg-amber-500/10 text-amber-500' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                {i < 3 && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-4 bg-border" />
                )}
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
          <a
            href={`https://${merchant.shopDomain}/admin/themes`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Open Shopify Theme Editor
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Security note */}
      <div className="glass-card p-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Secure by default</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your API key is domain-locked and validated server-side. Only requests from your verified Shopify domain are accepted.
          </p>
        </div>
      </div>
    </div>
  );
}
