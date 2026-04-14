'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Loader2, Sparkles, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectStoreForm() {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let shopDomain = domain.trim().toLowerCase();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    try {
      const res = await fetch('/api/merchant/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain }),
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
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[200px] -right-[100px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[150px] -left-[100px] w-[400px] h-[400px] rounded-full bg-chart-2/5 blur-[100px]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-chart-3/3 blur-[80px]" />
      </div>

      {/* Floating dots */}
      <div className="absolute top-20 right-1/4 w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
      <div className="absolute bottom-32 left-1/3 w-1.5 h-1.5 rounded-full bg-chart-2/30 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-chart-3/20 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/25">
            <Sparkles className="w-8 h-8 text-white" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
            <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-lg -z-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Connect Your Store</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            Enter your Shopify store domain to link it to your {process.env.NEXT_PUBLIC_APP_NAME || 'ShopChat'} account
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card p-7">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Shopify store domain
            </label>
            <div className="flex gap-2">
              <div className={cn(
                'relative flex-1 rounded-xl transition-all duration-200',
                focused && 'ring-2 ring-primary/30',
              )}>
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="your-store"
                  className="w-full pl-10 pr-3 py-3 glass-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
              <div className="flex items-center text-xs text-muted-foreground glass-input rounded-xl px-3 font-mono">
                .myshopify.com
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <div className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-[10px] font-bold">!</span>
                </div>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!domain.trim() || loading}
              className="mt-5 w-full py-3 bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect Store
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 pt-5 border-t border-[var(--glass-border)]">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: 'Secure', desc: 'AES-256' },
                { icon: Zap, label: 'Fast', desc: '< 1s setup' },
                { icon: Globe, label: 'Global', desc: '10K+ stores' },
              ].map((trust) => (
                <div key={trust.label} className="text-center">
                  <trust.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-[11px] font-semibold text-foreground">{trust.label}</p>
                  <p className="text-[10px] text-muted-foreground">{trust.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-5">
          Need to install the app first?{' '}
          <a
            href="https://apps.shopify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:text-primary/80 transition-colors"
          >
            Visit the Shopify App Store
          </a>
        </p>
      </div>
    </div>
  );
}
