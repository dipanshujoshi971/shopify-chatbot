'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Store, Loader2, ArrowRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/logo';

export function ConnectStoreForm() {
  const router = useRouter();
  const clerk = useClerk();
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const connectedRef = useRef(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await clerk.signOut({ redirectUrl: '/sign-in' });
    } finally {
      setSigningOut(false);
    }
  }

  // Auto-logout if the user abandons this page without connecting a store.
  useEffect(() => {
    const logoutBeacon = () => {
      if (connectedRef.current) return;
      try {
        // Best-effort async signout — fire and forget on unload.
        void clerk.signOut();
      } catch {
        // swallow
      }
    };
    window.addEventListener('pagehide', logoutBeacon);
    window.addEventListener('beforeunload', logoutBeacon);
    return () => {
      window.removeEventListener('pagehide', logoutBeacon);
      window.removeEventListener('beforeunload', logoutBeacon);
    };
  }, [clerk]);

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
      connectedRef.current = true;
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Signout button — top-right */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="absolute top-5 right-5 z-20 inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-background/40 backdrop-blur px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-destructive/40 hover:bg-destructive/5 transition-all disabled:opacity-60"
      >
        {signingOut ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LogOut className="w-3.5 h-3.5" />
        )}
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>

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
          <div className="relative mx-auto mb-5 flex w-16 h-16 items-center justify-center">
            <LogoMark size={64} />
            <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-lg -z-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Connect Your Store</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            Enter your Shopify store domain to link it to your ShopSifu account
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
        </div>
      </div>
    </div>
  );
}
