'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Key, Shield, Loader2 } from 'lucide-react';

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
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    fetch('/api/merchant')
      .then((r) => r.json())
      .then((d: { merchant: Merchant | null }) => setMerchant(d.merchant));
  }, []);

  if (!merchant) return (
    <div className="max-w-3xl space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="h-40 glass-card animate-pulse" />
      ))}
    </div>
  );

  async function handleOpenThemeEditor() {
    setRedirecting(true);
    try {
      const res = await fetch('/api/merchant/theme-editor-url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback: open general themes page
        const handle = merchant!.shopDomain.replace('.myshopify.com', '');
        window.open(`https://admin.shopify.com/store/${handle}/themes`, '_blank', 'noopener,noreferrer');
      }
    } catch {
      const handle = merchant!.shopDomain.replace('.myshopify.com', '');
      window.open(`https://admin.shopify.com/store/${handle}/themes`, '_blank', 'noopener,noreferrer');
    } finally {
      setRedirecting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page intro */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Install Your Chatbot</h2>
        <p className="text-sm text-muted-foreground mt-1">Enable {process.env.NEXT_PUBLIC_APP_NAME || 'ShopChat'} on your Shopify store in one click</p>
      </div>

      {/* Theme Editor — primary action */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ExternalLink className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Enable on Your Store</h3>
            <p className="text-xs text-muted-foreground">Toggle the chatbot widget on or off from your Shopify theme editor</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Click the button below to open your Shopify theme editor. Find <strong>{process.env.NEXT_PUBLIC_APP_NAME || 'ShopChat'} AI</strong> in the App embeds section and toggle it on. Your API key is configured automatically.
        </p>
        <button
          onClick={handleOpenThemeEditor}
          disabled={redirecting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          {redirecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {redirecting ? 'Opening...' : 'Open Theme Editor'}
        </button>
      </div>

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
