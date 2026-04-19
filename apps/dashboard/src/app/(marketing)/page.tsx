import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { SHOW_BILLING } from '@/lib/flags';
import {
  Sparkles,
  Zap,
  ShoppingCart,
  Package,
  Brain,
  ArrowRight,
  MessageSquare,
  BarChart3,
  Bot,
  Shield,
  Check,
} from 'lucide-react';

const APP_NAME = 'ShopSifu';

const features = [
  {
    icon: Zap,
    title: 'Live product data',
    desc: 'Always synced with your Shopify catalog. Zero manual upkeep.',
    color: 'text-emerald-400 bg-emerald-400/10',
  },
  {
    icon: ShoppingCart,
    title: 'Cart inside chat',
    desc: 'Customers add items and check out without leaving the widget.',
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    icon: Package,
    title: 'Order tracking',
    desc: 'Real-time order status from the Shopify Admin API.',
    color: 'text-violet-400 bg-violet-400/10',
  },
  {
    icon: Brain,
    title: 'RAG-powered answers',
    desc: 'Trained on your FAQs, shipping policies, and product guides.',
    color: 'text-amber-400 bg-amber-400/10',
  },
  {
    icon: BarChart3,
    title: 'Conversation analytics',
    desc: 'See what customers ask and where your bot needs tuning.',
    color: 'text-pink-400 bg-pink-400/10',
  },
  {
    icon: Shield,
    title: 'Human handoff',
    desc: 'Escalate tricky tickets to your team with full context.',
    color: 'text-teal-400 bg-teal-400/10',
  },
];

const stats = [
  { value: '< 30KB', label: 'Widget size' },
  { value: '< 1s', label: 'Response time' },
  { value: '24/7', label: 'Always online' },
];

const pricing = [
  {
    name: 'Starter',
    price: '$0',
    tagline: 'For trying things out',
    features: ['500 conversations / mo', '1 connected store', 'Email support', 'Basic analytics'],
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$49',
    tagline: 'For growing Shopify stores',
    features: [
      '10,000 conversations / mo',
      'Unlimited stores',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
    ],
    highlighted: true,
  },
  {
    name: 'Scale',
    price: 'Custom',
    tagline: 'For high-volume brands',
    features: [
      'Unlimited conversations',
      'Dedicated success manager',
      'Custom integrations',
      'SLA & uptime guarantees',
    ],
    highlighted: false,
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div className="relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[300px] -right-[200px] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          {SHOW_BILLING && (
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          )}
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          AI Chatbot for Shopify
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.05] max-w-4xl mx-auto">
          Your store,
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
            always open.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mt-8 max-w-2xl mx-auto leading-relaxed">
          Install {APP_NAME} once and let AI handle product discovery, order tracking, and customer
          support — around the clock, on every device.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            href={isSignedIn ? '/dashboard' : '/sign-up'}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 transition-all"
          >
            {isSignedIn ? 'Open dashboard' : 'Start for free'}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3 rounded-xl glass-card text-sm font-semibold text-foreground hover:bg-accent/30 transition-all"
          >
            See how it works
          </a>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-8 border-t border-[var(--glass-border)] max-w-2xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Everything your shop needs
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            From product recommendations to order tracking, {APP_NAME} wraps your entire customer
            experience in a single chat widget.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card p-6 hover:border-primary/20 transition-all group"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-5`}
              >
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Live in minutes, not weeks
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: ShoppingCart, title: 'Connect Shopify', desc: 'One-click install from the Shopify App Store — no code required.' },
            { step: '02', icon: Bot, title: 'Tune your bot', desc: 'Upload FAQs, adjust the tone, and preview answers in the playground.' },
            { step: '03', icon: MessageSquare, title: 'Go live', desc: 'Paste the widget snippet and start converting visitors into customers.' },
          ].map((s) => (
            <div key={s.step} className="glass-card p-6 relative">
              <span className="absolute top-5 right-6 text-5xl font-black text-primary/10 select-none">
                {s.step}
              </span>
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      {SHOW_BILLING && (
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Simple, usage-based plans
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Start free. Upgrade when you outgrow it. No credit card required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pricing.map((p) => (
            <div
              key={p.name}
              className={
                p.highlighted
                  ? 'relative rounded-2xl p-7 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 overflow-hidden'
                  : 'glass-card p-7'
              }
            >
              {p.highlighted && (
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              )}
              <div className="relative z-10">
                <h3 className={`text-sm font-bold tracking-wide uppercase ${p.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {p.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${p.highlighted ? 'text-white' : 'text-foreground'}`}>
                    {p.price}
                  </span>
                  {p.price !== 'Custom' && (
                    <span className={`text-sm ${p.highlighted ? 'text-white/70' : 'text-muted-foreground'}`}>
                      /mo
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-2 ${p.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {p.tagline}
                </p>

                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-center gap-2 text-sm ${p.highlighted ? 'text-white/90' : 'text-foreground'}`}
                    >
                      <Check className={`w-4 h-4 flex-shrink-0 ${p.highlighted ? 'text-white' : 'text-primary'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={isSignedIn ? '/dashboard' : '/sign-up'}
                  className={
                    p.highlighted
                      ? 'mt-7 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-600 text-sm font-semibold hover:bg-white/90 transition-all'
                      : 'mt-7 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/15 transition-all'
                  }
                >
                  {p.price === 'Custom' ? 'Contact sales' : 'Get started'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-12">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: `Does ${APP_NAME} work with my existing Shopify theme?`,
              a: 'Yes. The widget is a single lightweight script that drops into any Shopify theme without touching your Liquid files.',
            },
            {
              q: 'What AI model powers the chatbot?',
              a: 'OpenAI GPT-4-class models by default, with optional routing to custom providers on request.',
            },
            {
              q: 'Can I customize the bot\u2019s personality and responses?',
              a: 'Absolutely. Upload your knowledge base, set a tone, and preview answers live in the AI Playground before going live.',
            },
            {
              q: 'What happens when the bot cannot answer something?',
              a: 'It creates a support ticket and hands the conversation to your team with full context, so no customer is left hanging.',
            },
          ].map((item) => (
            <div key={item.q} className="glass-card p-6">
              <h3 className="text-base font-semibold text-foreground">{item.q}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-24">
        <div className="glass-card p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Ready to let AI run your storefront?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Install {APP_NAME} in under 5 minutes. Start free, no credit card required.
            </p>
            <Link
              href={isSignedIn ? '/dashboard' : '/sign-up'}
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 transition-all"
            >
              {isSignedIn ? 'Go to dashboard' : 'Start for free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--glass-border)] mt-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground">{APP_NAME}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
