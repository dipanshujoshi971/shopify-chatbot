'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Loader2 } from 'lucide-react';

export function ConnectStoreForm() {
  const router  = useRouter();
  const [domain, setDomain]   = useState('');
  const [error,  setError]    = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let shopDomain = domain.trim().toLowerCase();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    try {
      const res  = await fetch('/api/merchant/connect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ shopDomain }),
      });
      const data = await res.json() as { error?: string; success?: boolean };
      if (!res.ok) { setError(data.error ?? 'Connection failed'); return; }
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            💬
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Connect Your Store</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Enter your Shopify store domain to link it to your account.
            Make sure you've installed ShopChat from the Shopify App Store first.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Your Shopify domain
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="your-store"
                className="w-full pl-9 pr-3 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <span className="flex items-center text-sm text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-lg px-3">
              .myshopify.com
            </span>
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!domain.trim() || loading}
            className="mt-4 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Connecting…' : 'Connect Store'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-4">
          Need to install the app first?{' '}
          <a href="https://apps.shopify.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium">
            Visit the Shopify App Store →
          </a>
        </p>
      </div>
    </div>
  );
}