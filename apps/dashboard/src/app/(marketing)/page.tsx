import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { SHOW_BILLING } from '@/lib/flags';
import { LogoLockup, LogoMark } from '@/components/logo';
import {
  Search,
  ShoppingCart,
  Package,
  Brain,
  Hand,
  UserCircle2,
  ArrowRight,
  Check,
  Zap,
  Sparkles,
  Send,
  Mail,
  MessageCircle,
  BookOpen,
} from 'lucide-react';

const APP_NAME = 'ShopSifu';

/* ──────────── shared primitives ──────────── */

function EyebrowPill({
  children,
  tone = 'cyan',
}: {
  children: React.ReactNode;
  tone?: 'cyan' | 'sunset' | 'white';
}) {
  const tones = {
    cyan: { bg: 'rgba(34,230,255,0.08)', border: 'rgba(125,249,255,0.28)', text: '#7df9ff' },
    sunset: { bg: 'rgba(255,120,73,0.08)', border: 'rgba(255,140,80,0.28)', text: '#ffb385' },
    white: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.18)', text: '#e2e8f0' },
  }[tone];
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase backdrop-blur-md"
      style={{
        background: tones.bg,
        border: `1px solid ${tones.border}`,
        color: tones.text,
        letterSpacing: '0.18em',
      }}
    >
      {children}
    </div>
  );
}

function PillBtn({
  children,
  href,
  large,
  ghost,
  light,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  large?: boolean;
  ghost?: boolean;
  light?: boolean;
  className?: string;
}) {
  const classes = [
    'sifu-pill group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full font-semibold transition-all duration-300',
    large ? 'px-6 py-4 text-[14.5px]' : 'px-5 py-2.5 text-[13px]',
    light
      ? 'bg-white text-[#0a0f1e] hover:bg-white hover:-translate-y-0.5 shadow-[0_10px_30px_-12px_rgba(255,255,255,0.4)] hover:shadow-[0_18px_40px_-10px_rgba(255,255,255,0.5)]'
      : ghost
        ? 'bg-white/5 border border-[rgba(125,249,255,0.25)] text-white hover:bg-white/10 hover:border-[rgba(125,249,255,0.55)] hover:-translate-y-0.5 hover:shadow-[0_0_32px_-8px_rgba(34,230,255,0.45)]'
        : 'bg-[#0a0f1e] text-white border border-[rgba(125,249,255,0.2)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] hover:-translate-y-0.5 hover:border-[rgba(125,249,255,0.55)] hover:shadow-[0_14px_40px_-10px_rgba(99,102,241,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]',
    'active:translate-y-[1px]',
    className ?? '',
  ].join(' ');
  const inner = (
    <>
      <span
        aria-hidden
        className="sifu-pill-sheen pointer-events-none absolute inset-y-0 -left-full w-1/2 opacity-0 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(125,249,255,0.28), transparent)',
        }}
      />
      <span className="relative inline-flex items-center gap-2.5">{children}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return <button className={classes}>{inner}</button>;
}

/* ──────────── mountain horizon SVG (hero background) ──────────── */

function MountainHorizon() {
  return (
    <svg
      viewBox="0 0 1440 560"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] w-full"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05070f" stopOpacity="0" />
          <stop offset="45%" stopColor="#331a3a" stopOpacity="0.55" />
          <stop offset="72%" stopColor="#a63a66" stopOpacity="0.75" />
          <stop offset="90%" stopColor="#ff7849" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="farMtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1a44" />
          <stop offset="100%" stopColor="#1a1232" />
        </linearGradient>
        <linearGradient id="nearMtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0e22" />
          <stop offset="100%" stopColor="#05070f" />
        </linearGradient>
        <radialGradient id="sun" cx="0.62" cy="0.82" r="0.18">
          <stop offset="0%" stopColor="#fff3d6" stopOpacity="1" />
          <stop offset="45%" stopColor="#ffb347" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff7849" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1440" height="560" fill="url(#sky)" />
      <rect x="0" y="0" width="1440" height="560" fill="url(#sun)" />
      <path
        d="M0 360 L140 300 L240 340 L340 260 L460 330 L580 240 L700 310 L830 220 L960 300 L1080 250 L1200 320 L1320 260 L1440 310 L1440 560 L0 560 Z"
        fill="url(#farMtn)"
        opacity="0.85"
      />
      <path
        d="M0 460 L90 400 L200 450 L320 360 L430 440 L560 370 L680 430 L820 340 L950 420 L1060 380 L1180 440 L1300 390 L1440 430 L1440 560 L0 560 Z"
        fill="url(#nearMtn)"
      />
      <g transform="translate(560 340)">
        <circle cx="0" cy="-6" r="3" fill="#05070f" />
        <path d="M-2 -3 L-3 10 L-4 20 L4 20 L3 10 L2 -3 Z" fill="#05070f" />
      </g>
      <line x1="0" y1="430" x2="1440" y2="430" stroke="rgba(255,180,70,0.25)" strokeWidth="1" />
    </svg>
  );
}

function FloatingRock({
  size = 80,
  style,
  className,
}: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const id = `rock-${size}`;
  return (
    <div className={`absolute ${className ?? ''}`} style={{ width: size, height: size * 0.7, ...style }}>
      <svg viewBox="0 0 100 70" width="100%" height="100%">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b2050" />
            <stop offset="60%" stopColor="#1a1232" />
            <stop offset="100%" stopColor="#0a0f1e" />
          </linearGradient>
        </defs>
        <path
          d="M10 28 L22 18 L42 12 L66 14 L84 22 L92 32 L78 44 L60 52 L38 54 L20 46 L8 38 Z"
          fill={`url(#${id})`}
          stroke="rgba(125,249,255,0.12)"
          strokeWidth="0.8"
        />
        <path d="M22 18 L42 12 L66 14 L84 22" stroke="rgba(255,180,71,0.45)" strokeWidth="1" fill="none" />
        <circle cx="45" cy="12" r="2" fill="#6366f1" opacity="0.6" />
        <circle cx="58" cy="11" r="1.5" fill="#22e6ff" opacity="0.6" />
      </svg>
    </div>
  );
}

/* ──────────── bracketed corner frame ──────────── */

function BracketFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  const corners = [
    { top: -1, left: -1, transform: 'none' },
    { top: -1, right: -1, transform: 'scaleX(-1)' },
    { bottom: -1, left: -1, transform: 'scaleY(-1)' },
    { bottom: -1, right: -1, transform: 'scale(-1)' },
  ] as const;
  return (
    <div className={`relative ${className ?? ''}`}>
      {corners.map((pos, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className="absolute z-[2]"
          style={pos as React.CSSProperties}
        >
          <path d="M1 10 V1 H10" stroke="#7df9ff" strokeWidth="1.6" fill="none" />
        </svg>
      ))}
      {children}
    </div>
  );
}

/* ──────────── chat widget ──────────── */

function ChatBubble({ from, children }: { from: 'user' | 'bot'; children: React.ReactNode }) {
  const isUser = from === 'user';
  return (
    <div className={`mb-2.5 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[82%] px-3.5 py-2.5 text-[13.5px] leading-relaxed"
        style={{
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'rgba(125,249,255,0.06)',
          border: isUser ? 'none' : '1px solid rgba(125,249,255,0.15)',
          color: isUser ? '#ffffff' : '#e2e8f0',
          fontWeight: isUser ? 500 : 400,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ProductInChat({ name, price, subtitle, hue }: { name: string; price: string; subtitle: string; hue: number }) {
  return (
    <div
      className="mb-2 flex gap-2.5 rounded-[12px] border p-2.5"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(125,249,255,0.12)' }}
    >
      <div
        className="h-[52px] w-[52px] shrink-0 rounded-[10px] border"
        style={{
          background: `linear-gradient(135deg, oklch(0.35 0.1 ${hue}), oklch(0.2 0.05 ${hue}))`,
          borderColor: 'rgba(125,249,255,0.1)',
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold" style={{ color: '#e2e8f0' }}>
          {name}
        </div>
        <div className="text-[11px]" style={{ color: '#6b7796' }}>
          {subtitle}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[12.5px] font-bold" style={{ color: '#7df9ff' }}>
            {price}
          </span>
          <button
            className="rounded-full border px-2.5 py-1 text-[10.5px] font-semibold text-white"
            style={{ background: '#0a0f1e', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            Add to cart →
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderCard() {
  return (
    <div
      className="rounded-[12px] border p-3"
      style={{ background: 'rgba(255,120,73,0.06)', borderColor: 'rgba(255,140,80,0.25)' }}
    >
      <div className="mb-2.5 flex justify-between">
        <div>
          <div className="sifu-mono text-[10px] uppercase" style={{ color: '#b5bfd9', letterSpacing: '0.14em' }}>
            Order
          </div>
          <div className="sifu-mono text-[12px] font-semibold" style={{ color: '#e2e8f0' }}>
            #SPF-8420
          </div>
        </div>
        <div
          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={{ background: 'rgba(34,230,255,0.12)', color: '#7df9ff' }}
        >
          In transit
        </div>
      </div>
      <div className="mb-2 flex gap-[2px]">
        {[1, 1, 1, 0].map((v, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-[2px]"
            style={{ background: v ? '#ff9a56' : 'rgba(255,255,255,0.07)' }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: '#b5bfd9' }}>
        <span>Placed</span>
        <span>Packed</span>
        <span>Shipped</span>
        <span>Delivered</span>
      </div>
      <div className="mt-2.5 text-[11.5px]" style={{ color: '#cbd5e1' }}>
        Expected{' '}
        <span className="font-semibold" style={{ color: '#ffb347' }}>
          Thu, Apr 23
        </span>{' '}
        · Mumbai hub
      </div>
    </div>
  );
}

function ChatWidget() {
  return (
    <div
      className="flex w-full max-w-[380px] flex-col overflow-hidden rounded-[20px] border"
      style={{
        background: 'linear-gradient(180deg, #0e1530 0%, #070b1a 100%)',
        borderColor: 'rgba(125,249,255,0.18)',
        boxShadow:
          '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(125,249,255,0.06), 0 0 60px rgba(99,102,241,0.15)',
      }}
    >
      <div
        className="flex items-center gap-3 border-b px-4 py-3.5"
        style={{ borderColor: 'rgba(125,249,255,0.1)', background: 'rgba(99,102,241,0.04)' }}
      >
        <div className="relative">
          <LogoMark size={36} />
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
            style={{ background: '#3ddc84', borderColor: '#0e1530' }}
          />
        </div>
        <div className="flex-1">
          <div className="sifu-display text-[12px] font-bold text-white" style={{ letterSpacing: '0.1em' }}>
            SHOPSIFU
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#7df9ff' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#3ddc84' }} />
            Online · replies instantly
          </div>
        </div>
      </div>
      <div className="flex min-h-[360px] flex-col p-4">
        <div
          className="sifu-mono mb-3.5 text-center text-[10px] uppercase"
          style={{ color: '#475569', letterSpacing: '0.16em' }}
        >
          Today · 4:12 PM
        </div>
        <ChatBubble from="bot">
          Welcome 🏔️ I&apos;m your store&apos;s Sifu. I can find gear, track orders, or answer questions.
          What brings you in?
        </ChatBubble>
        <ChatBubble from="user">Looking for a lightweight running jacket under $120 — wind resistant</ChatBubble>
        <ChatBubble from="bot">Found 2 that match your budget and weather. Both breathable, under 280g:</ChatBubble>
        <div className="mb-2.5">
          <ProductInChat name="Stratus Windshell" subtitle="3-layer · 240g · 4 colors" price="$98" hue={210} />
          <ProductInChat name="Kite Runner Jacket" subtitle="Ripstop · 265g · Unisex" price="$112" hue={40} />
        </div>
        <ChatBubble from="user">Where&apos;s my order SPF-8420?</ChatBubble>
        <ChatBubble from="bot">Here&apos;s the latest — shipped from our Mumbai hub:</ChatBubble>
        <div className="mb-2.5 flex">
          <div className="max-w-[92%]">
            <OrderCard />
          </div>
        </div>
        <div className="mb-1 flex gap-1">
          <div
            className="rounded-[14px] border px-3 py-2"
            style={{ background: 'rgba(125,249,255,0.04)', borderColor: 'rgba(125,249,255,0.1)' }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="sifu-typing-dot inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: '#7df9ff' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-2 border-t p-3"
        style={{ borderColor: 'rgba(125,249,255,0.1)', background: 'rgba(0,0,0,0.25)' }}
      >
        <div
          className="flex flex-1 items-center gap-2 rounded-full border px-3.5 py-2.5 text-[13px]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(125,249,255,0.1)',
            color: '#6b7796',
          }}
        >
          Ask anything about the shop…
        </div>
        <button
          className="grid h-10 w-10 place-items-center rounded-full text-white"
          style={{
            background: 'linear-gradient(135deg,#6366f1,#4338ca)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
          }}
        >
          <Send className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      </div>
      <div
        className="sifu-mono flex items-center justify-center gap-1.5 py-2 text-center text-[10px] uppercase"
        style={{ color: '#475569', background: 'rgba(0,0,0,0.35)', letterSpacing: '0.12em' }}
      >
        <Zap className="h-2.5 w-2.5" /> Powered by ShopSifu
      </div>
    </div>
  );
}

/* ──────────── data ──────────── */

const features = [
  { icon: Search, title: 'Live Product Search', desc: "Synced with your Shopify catalog. Recommends, compares, filters — in natural language.", accent: 'cyan' as const },
  { icon: ShoppingCart, title: 'Cart Inside Chat', desc: 'Add, vary, and checkout without leaving the conversation. Less drop-off, more close.', accent: 'sunset' as const },
  { icon: Package, title: 'Order Tracking', desc: 'Real-time status from the Shopify Admin API. Tracking, ETA, carrier — in one breath.', accent: 'cyan' as const },
  { icon: Brain, title: 'RAG-Powered FAQ', desc: "Feeds on your policies, guides, and docs. Cites sources. Says 'I don't know' when it doesn't.", accent: 'sunset' as const },
  { icon: Hand, title: 'Human Escalation', desc: 'When the Sifu meets its match, it hands off to your team with full context and intent.', accent: 'cyan' as const },
  { icon: UserCircle2, title: 'Custom Personality', desc: 'Playful, formal, or brand-perfect. Tune the tone in 30 seconds — preview before you publish.', accent: 'sunset' as const },
];

const steps = [
  { n: '01', title: 'Connect Shopify', desc: 'One-click install from the App Store. No code, no theme edits. Sifu sees your catalog the moment you approve.', time: '~30s', tag: 'no code' },
  { n: '02', title: 'Train Your Sifu', desc: 'Upload FAQs, drop in policy URLs, pick a tone. Preview answers live in the playground before any customer sees them.', time: '~5 min', tag: 'no dev' },
  { n: '03', title: 'Launch & Learn', desc: 'Flip the switch. Sifu starts handling product, order, and support questions — 24 / 7 / always.', time: '1 click', tag: 'no stress' },
];

const pricing = [
  { name: 'Starter', price: '$0', tagline: 'For trying things out', features: ['500 conversations / mo', '1 connected store', 'Email support', 'Basic analytics'], highlighted: false },
  { name: 'Growth', price: '$49', tagline: 'For growing Shopify stores', features: ['10,000 conversations / mo', 'Unlimited stores', 'Priority support', 'Advanced analytics', 'Custom branding'], highlighted: true },
  { name: 'Scale', price: 'Custom', tagline: 'For high-volume brands', features: ['Unlimited conversations', 'Dedicated success manager', 'Custom integrations', 'SLA & uptime guarantees'], highlighted: false },
];

const faqs = [
  { q: `Does ${APP_NAME} work with my existing Shopify theme?`, a: 'Yes. The widget is a single lightweight script that drops into any Shopify theme without touching your Liquid files.' },
  { q: 'What AI model powers the chatbot?', a: 'Azure OpenAI GPT-4-class models by default, with optional routing to custom providers on request.' },
  { q: "Can I customize the bot's personality and responses?", a: 'Absolutely. Upload your knowledge base, set a tone, and preview answers live in the AI Playground before going live.' },
  { q: 'What happens when the bot cannot answer something?', a: 'It creates a support ticket and hands the conversation to your team with full context, so no customer is left hanging.' },
];

/* ──────────── page ──────────── */

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div className="relative overflow-hidden">
      {/* ─── Nav ─── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-xl"
        style={{ background: 'rgba(5,7,15,0.7)', borderColor: 'rgba(125,249,255,0.08)' }}
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-4">
          <Link href="/">
            <LogoLockup size={36} tagline />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ['Features', '#features'],
              ['How it works', '#how-it-works'],
              ['Widget', '#widget'],
              ...(SHOW_BILLING ? ([['Pricing', '#pricing']] as const) : []),
              ['FAQ', '#faq'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="sifu-display text-[11px] font-semibold"
                style={{
                  color: '#e2e8f0',
                  letterSpacing: '0.16em',
                  textShadow: '0 0 12px rgba(34,230,255,0.15)',
                }}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <PillBtn href="/dashboard">
                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
              </PillBtn>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="sifu-display hidden text-[11px] font-semibold md:block"
                  style={{ color: '#b5bfd9', letterSpacing: '0.16em' }}
                >
                  SIGN IN
                </Link>
                <PillBtn href="/sign-up">
                  Sign up <ArrowRight className="h-3.5 w-3.5" />
                </PillBtn>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 70% 0%, rgba(99,102,241,0.18), transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 30%, rgba(34,230,255,0.08), transparent 60%),
            linear-gradient(180deg, #05070f 0%, #0a1030 50%, #070b1a 100%)
          `,
        }}
      >
        <div
          className="sifu-dotgrid absolute inset-0"
          style={{
            maskImage: 'radial-gradient(ellipse at 50% 10%, #000 20%, transparent 60%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 10%, #000 20%, transparent 60%)',
          }}
        />
        <MountainHorizon />
        <FloatingRock size={110} style={{ top: 140, left: '6%' }} className="sifu-floaty-slow" />
        <FloatingRock size={70} style={{ top: 260, left: '14%' }} className="sifu-floaty" />
        <FloatingRock size={90} style={{ top: 180, right: '4%' }} className="sifu-floaty-fast" />
        <FloatingRock size={60} style={{ top: 340, right: '10%' }} className="sifu-floaty-slow" />

        <div className="relative z-10 mx-auto max-w-[1240px] px-8 pb-28 pt-24">
          <div className="mx-auto max-w-[960px] text-center">
            <div className="sifu-rise">
              <EyebrowPill tone="cyan">
                <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                Built for Shopify · Install in minutes
              </EyebrowPill>
            </div>

            <h1
              className="sifu-display sifu-rise sifu-rise-d1 mx-auto mb-3 mt-7"
              style={{
                fontSize: 'clamp(32px, 4.6vw, 60px)',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                textTransform: 'uppercase',
              }}
            >
              <span className="sifu-glow-cyan">Your store&apos;s own</span>
              <br />
              <span
                className="sifu-chrome"
                style={{ fontSize: 'clamp(44px, 6.8vw, 88px)', letterSpacing: '-0.04em' }}
              >
                AI CONCIERGE
              </span>
            </h1>

            <p
              className="sifu-rise sifu-rise-d2 mx-auto mb-9 mt-7 max-w-[640px] text-[17px] leading-relaxed"
              style={{ color: '#b5bfd9' }}
            >
              {APP_NAME} plugs into your Shopify catalog, reads your policies, and chats with shoppers in your
              brand&apos;s voice. Product questions, order lookups, and support — answered the moment they&apos;re asked.
            </p>

            <div className="sifu-rise sifu-rise-d3 flex flex-wrap justify-center gap-3">
              <PillBtn href={isSignedIn ? '/dashboard' : '/sign-up'} large>
                {isSignedIn ? 'Open dashboard' : 'Get started — it\u2019s free'}
                <ArrowRight className="h-4 w-4" />
              </PillBtn>
              <PillBtn href="#features" large ghost>
                See what it does
              </PillBtn>
            </div>

            <div
              className="sifu-rise sifu-rise-d4 mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px]"
              style={{ color: '#6b7796' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: '#7df9ff' }} />
                No credit card
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: '#7df9ff' }} />
                Works with any Shopify theme
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: '#7df9ff' }} />
                Uninstall anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="mx-auto max-w-[1240px] px-8 py-16">
        <div className="mb-14 text-center">
          <EyebrowPill tone="cyan">The Sifu&apos;s Six Disciplines</EyebrowPill>
          <h2
            className="sifu-display mx-auto mt-[18px] mb-3.5"
            style={{
              fontSize: 'clamp(38px, 5vw, 60px)',
              letterSpacing: '-0.03em',
              lineHeight: 0.98,
            }}
          >
            Every skill your shop
            <br />
            <span className="sifu-chrome">ever needed.</span>
          </h2>
          <p className="mx-auto max-w-[560px] text-[16px]" style={{ color: '#b5bfd9' }}>
            Six disciplines, honed on millions of conversations. Each one learns your store.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const accentColor = f.accent === 'sunset' ? '#ff9a56' : '#7df9ff';
            const accentBg = f.accent === 'sunset' ? 'rgba(255,120,73,0.1)' : 'rgba(34,230,255,0.08)';
            const accentBorder = f.accent === 'sunset' ? 'rgba(255,140,80,0.3)' : 'rgba(125,249,255,0.25)';
            return (
              <BracketFrame key={f.title}>
                <div
                  className="sifu-card h-full rounded-[14px] border p-6"
                  style={{
                    background: 'linear-gradient(180deg, rgba(14,21,48,0.9), rgba(7,11,26,0.9))',
                    borderColor: 'rgba(125,249,255,0.1)',
                  }}
                >
                  <div
                    className="mb-[18px] grid h-[42px] w-[42px] place-items-center rounded-[12px] border"
                    style={{ background: accentBg, borderColor: accentBorder, color: accentColor }}
                  >
                    <f.icon className="h-[19px] w-[19px]" strokeWidth={2} />
                  </div>
                  <h3
                    className="sifu-display mb-2 text-[14px] font-semibold"
                    style={{ color: '#fff', letterSpacing: '0.04em' }}
                  >
                    {f.title}
                  </h3>
                  <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: '#b5bfd9' }}>
                    {f.desc}
                  </p>
                </div>
              </BracketFrame>
            );
          })}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section
        id="how-it-works"
        className="relative py-20"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(99,102,241,0.04), transparent)' }}
      >
        <div
          className="absolute inset-x-[10%] top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(125,249,255,0.35), transparent)' }}
        />
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="mb-14 text-center">
            <EyebrowPill tone="sunset">The Path</EyebrowPill>
            <h2
              className="sifu-display mt-[18px] mb-3"
              style={{ fontSize: 'clamp(38px, 5vw, 60px)', letterSpacing: '-0.03em', lineHeight: 0.98 }}
            >
              Three steps to
              <br />
              <span className="sifu-chrome">the summit.</span>
            </h2>
            <p className="mx-auto max-w-[560px] text-[16px]" style={{ color: '#b5bfd9' }}>
              A store that answers itself. No developers required.
            </p>
          </div>

          <div className="relative grid gap-5 md:grid-cols-3">
            <div
              className="absolute inset-x-[14%] top-14 hidden h-px md:block"
              style={{ borderTop: '1px dashed rgba(125,249,255,0.3)' }}
            />
            {steps.map((s, i) => (
              <BracketFrame key={s.n}>
                <div
                  className="sifu-card relative h-full rounded-[14px] border p-7"
                  style={{
                    background: 'linear-gradient(180deg, rgba(14,21,48,0.9), rgba(7,11,26,0.9))',
                    borderColor: 'rgba(125,249,255,0.1)',
                  }}
                >
                  <div
                    className="sifu-display absolute right-5 top-4 select-none text-[68px] leading-none"
                    style={{
                      color: 'transparent',
                      WebkitTextStroke: '1.2px rgba(125,249,255,0.3)',
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    className="mb-[18px] grid h-9 w-9 place-items-center rounded-full border text-[12px] font-bold"
                    style={{
                      background: '#05070f',
                      borderColor: 'rgba(125,249,255,0.4)',
                      color: '#7df9ff',
                      boxShadow: '0 0 16px rgba(34,230,255,0.25)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="sifu-display mb-2.5 text-[17px]" style={{ letterSpacing: '0.02em' }}>
                    {s.title}
                  </h3>
                  <p className="m-0 text-[13.5px] leading-relaxed" style={{ color: '#b5bfd9' }}>
                    {s.desc}
                  </p>
                  <div
                    className="mt-5 flex gap-2.5 border-t pt-4 text-[11px]"
                    style={{ borderColor: 'rgba(125,249,255,0.08)', color: '#6b7796' }}
                  >
                    <span className="sifu-mono" style={{ color: '#7df9ff' }}>
                      {s.time}
                    </span>
                    <span>·</span>
                    <span className="sifu-mono">{s.tag}</span>
                  </div>
                </div>
              </BracketFrame>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Widget preview ─── */}
      <section id="widget" className="relative py-20">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div>
              <EyebrowPill tone="cyan">The Widget</EyebrowPill>
              <h2
                className="sifu-display mt-[18px] mb-5"
                style={{ fontSize: 'clamp(40px, 5vw, 58px)', letterSpacing: '-0.03em', lineHeight: 0.98 }}
              >
                Teach it once.
                <br />
                <span className="sifu-chrome">Answers forever.</span>
              </h2>
              <p
                className="mb-7 max-w-[460px] text-[16px] leading-relaxed"
                style={{ color: '#b5bfd9' }}
              >
                Sifu reads your catalog, policies, and past tickets — then responds in your brand&apos;s voice.
                Every conversation sharpens the master.
              </p>
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {[
                  ['Recommends products in natural language', "No more \u201csearch didn\u2019t match\u201d"],
                  ['Checks order status without an email chain', 'Pulls carrier, ETA, and tracking'],
                  ['Answers policy questions from your docs', 'Returns, shipping, sizing — sourced'],
                  ["Hands off when it\u2019s out of its depth", 'Full transcript attached to the ticket'],
                ].map(([title, sub]) => (
                  <li key={title} className="flex gap-3.5">
                    <div
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border"
                      style={{
                        background: 'rgba(34,230,255,0.12)',
                        borderColor: 'rgba(125,249,255,0.4)',
                        color: '#7df9ff',
                      }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-[14.5px] font-semibold" style={{ color: '#e2e8f0' }}>
                        {title}
                      </div>
                      <div className="mt-0.5 text-[12.5px]" style={{ color: '#6b7796' }}>
                        {sub}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex gap-2.5">
                <PillBtn href={isSignedIn ? '/dashboard' : '/sign-up'}>
                  Try it live <ArrowRight className="h-3.5 w-3.5" />
                </PillBtn>
                <PillBtn href="#faq" ghost>
                  Read the FAQ
                </PillBtn>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div
                className="pointer-events-none absolute -inset-10"
                style={{
                  background: 'radial-gradient(ellipse, rgba(99,102,241,0.22), transparent 65%)',
                  filter: 'blur(32px)',
                }}
              />
              <ChatWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      {SHOW_BILLING && (
        <section id="pricing" className="mx-auto max-w-[1240px] px-8 py-20">
          <div className="mb-14 text-center">
            <EyebrowPill tone="cyan">Pricing</EyebrowPill>
            <h2
              className="sifu-display mt-[18px] mb-3"
              style={{ fontSize: 'clamp(38px, 5vw, 60px)', letterSpacing: '-0.03em', lineHeight: 0.98 }}
            >
              Simple,
              <span className="sifu-chrome"> usage-based</span> plans
            </h2>
            <p className="mx-auto max-w-[560px] text-[16px]" style={{ color: '#b5bfd9' }}>
              Start free. Upgrade when you outgrow it. No credit card required.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {pricing.map((p) => (
              <BracketFrame key={p.name}>
                <div
                  className={`sifu-card h-full rounded-[14px] border p-7 ${
                    p.highlighted ? 'relative overflow-hidden' : ''
                  }`}
                  style={{
                    background: p.highlighted
                      ? 'linear-gradient(160deg, rgba(99,102,241,0.25), rgba(34,230,255,0.1) 60%, rgba(14,21,48,0.9))'
                      : 'linear-gradient(180deg, rgba(14,21,48,0.9), rgba(7,11,26,0.9))',
                    borderColor: p.highlighted ? 'rgba(125,249,255,0.35)' : 'rgba(125,249,255,0.1)',
                    boxShadow: p.highlighted ? '0 30px 60px -30px rgba(99,102,241,0.6)' : undefined,
                  }}
                >
                  {p.highlighted && (
                    <div className="mb-3 inline-block">
                      <EyebrowPill tone="sunset">Most popular</EyebrowPill>
                    </div>
                  )}
                  <h3
                    className="sifu-display text-[12px] font-bold uppercase"
                    style={{ color: '#7df9ff', letterSpacing: '0.18em' }}
                  >
                    {p.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="sifu-display text-[44px]" style={{ letterSpacing: '-0.03em' }}>
                      {p.price}
                    </span>
                    {p.price !== 'Custom' && (
                      <span className="text-[13px]" style={{ color: '#6b7796' }}>
                        /mo
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[13px]" style={{ color: '#b5bfd9' }}>
                    {p.tagline}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {p.features.map((fx) => (
                      <li key={fx} className="flex items-center gap-2 text-[13px]" style={{ color: '#e2e8f0' }}>
                        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#7df9ff' }} strokeWidth={3} />
                        {fx}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <PillBtn
                      href={isSignedIn ? '/dashboard' : '/sign-up'}
                      light={p.highlighted}
                      ghost={!p.highlighted}
                      className="w-full justify-center"
                    >
                      {p.price === 'Custom' ? 'Contact sales' : 'Get started'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </PillBtn>
                  </div>
                </div>
              </BracketFrame>
            ))}
          </div>
        </section>
      )}

      {/* ─── FAQ ─── */}
      <section id="faq" className="mx-auto max-w-4xl px-8 py-20">
        <div className="mb-12 text-center">
          <EyebrowPill tone="cyan">FAQ</EyebrowPill>
          <h2
            className="sifu-display mt-[18px]"
            style={{ fontSize: 'clamp(38px, 5vw, 54px)', letterSpacing: '-0.03em', lineHeight: 0.98 }}
          >
            Common <span className="sifu-chrome">questions.</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="sifu-card group rounded-[14px] border p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(14,21,48,0.9), rgba(7,11,26,0.9))',
                borderColor: 'rgba(125,249,255,0.1)',
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-white">
                {item.q}
                <span
                  className="ml-4 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-transform group-open:rotate-45"
                  style={{ borderColor: 'rgba(125,249,255,0.35)', color: '#7df9ff' }}
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: '#b5bfd9' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section id="contact" className="mx-auto max-w-[1240px] px-8 py-20">
        <div className="mb-12 text-center">
          <EyebrowPill tone="sunset">Talk to a human</EyebrowPill>
          <h2
            className="sifu-display mt-[18px] mb-3"
            style={{ fontSize: 'clamp(38px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 0.98 }}
          >
            Questions? <span className="sifu-chrome">We&apos;re listening.</span>
          </h2>
          <p className="mx-auto max-w-[540px] text-[15.5px]" style={{ color: '#b5bfd9' }}>
            Stuck on setup, curious about a feature, or want a custom integration? Reach out directly — a
            real person reads every message.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              icon: Mail,
              label: 'Email us',
              value: 'support@shopsifu.com',
              sub: 'Replies within one business day',
              href: 'mailto:support@shopsifu.com',
              tone: 'cyan' as const,
            },
            {
              icon: MessageCircle,
              label: 'See it in action',
              value: 'Preview the widget',
              sub: 'Scroll up to see how Sifu chats with your shoppers',
              href: '#widget',
              tone: 'sunset' as const,
            },
            {
              icon: BookOpen,
              label: 'Read the docs',
              value: 'FAQ & setup guides',
              sub: 'Answers to the most common questions',
              href: '#faq',
              tone: 'cyan' as const,
            },
          ].map((c) => {
            const accentColor = c.tone === 'sunset' ? '#ff9a56' : '#7df9ff';
            const accentBg = c.tone === 'sunset' ? 'rgba(255,120,73,0.1)' : 'rgba(34,230,255,0.08)';
            const accentBorder = c.tone === 'sunset' ? 'rgba(255,140,80,0.3)' : 'rgba(125,249,255,0.25)';
            return (
              <BracketFrame key={c.label}>
                <a
                  href={c.href}
                  className="sifu-card flex h-full flex-col rounded-[14px] border p-6 transition-all"
                  style={{
                    background: 'linear-gradient(180deg, rgba(14,21,48,0.9), rgba(7,11,26,0.9))',
                    borderColor: 'rgba(125,249,255,0.1)',
                  }}
                >
                  <div
                    className="mb-[18px] grid h-[42px] w-[42px] place-items-center rounded-[12px] border"
                    style={{ background: accentBg, borderColor: accentBorder, color: accentColor }}
                  >
                    <c.icon className="h-[19px] w-[19px]" strokeWidth={2} />
                  </div>
                  <div
                    className="sifu-mono mb-1.5 text-[10.5px] uppercase"
                    style={{ color: '#6b7796', letterSpacing: '0.14em' }}
                  >
                    {c.label}
                  </div>
                  <div className="mb-2 text-[15.5px] font-semibold" style={{ color: '#fff' }}>
                    {c.value}
                  </div>
                  <p className="m-0 text-[12.5px] leading-relaxed" style={{ color: '#b5bfd9' }}>
                    {c.sub}
                  </p>
                </a>
              </BracketFrame>
            );
          })}
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="mx-auto max-w-[1240px] px-8 py-20">
        <div
          className="relative overflow-hidden rounded-3xl border p-12 text-center md:p-20"
          style={{
            background: `
              radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.35), transparent 55%),
              radial-gradient(ellipse at 90% 100%, rgba(255,120,73,0.28), transparent 55%),
              linear-gradient(180deg, #0a1030, #05070f)
            `,
            borderColor: 'rgba(125,249,255,0.2)',
            boxShadow: '0 40px 100px -30px rgba(99,102,241,0.35)',
          }}
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] w-full opacity-60"
          >
            <path
              d="M0 80 L150 50 L280 70 L400 30 L540 60 L680 40 L820 70 L980 45 L1120 65 L1200 55 L1200 120 L0 120 Z"
              fill="#05070f"
            />
          </svg>
          <div
            className="sifu-display pointer-events-none absolute -bottom-28 -right-10 select-none text-[340px] leading-none"
            style={{ color: 'rgba(125,249,255,0.06)' }}
          >
            師
          </div>

          <div className="relative">
            <EyebrowPill tone="sunset">The Final Ridge</EyebrowPill>
            <h2
              className="sifu-display mx-auto mt-6 mb-4 max-w-[880px] uppercase"
              style={{ fontSize: 'clamp(48px, 7vw, 92px)', letterSpacing: '-0.035em', lineHeight: 0.95 }}
            >
              <span className="sifu-glow-cyan">Your store</span>
              <br />
              <span className="sifu-chrome">deserves a SIFU.</span>
            </h2>
            <p className="mx-auto mb-9 max-w-[520px] text-[17px]" style={{ color: '#b5bfd9' }}>
              Five minutes to install. A lifetime of lessons learned.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <PillBtn href={isSignedIn ? '/dashboard' : '/sign-up'} light large>
                {isSignedIn ? 'Open dashboard' : 'Sign up — it\u2019s free'}
                <ArrowRight className="h-4 w-4" />
              </PillBtn>
              <PillBtn href="mailto:support@shopsifu.com" large ghost>
                Book a walkthrough
              </PillBtn>
            </div>
            <div
              className="mt-6 flex flex-wrap justify-center gap-4 text-[12px]"
              style={{ color: '#6b7796' }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: '#7df9ff' }} />
                No credit card
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: '#7df9ff' }} />
                Free install
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: '#7df9ff' }} />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t" style={{ borderColor: 'rgba(125,249,255,0.1)' }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 px-8 py-10">
          <div className="flex flex-col gap-2.5">
            <LogoLockup size={36} tagline />
            <p className="m-0 max-w-[400px] text-[12.5px]" style={{ color: '#6b7796' }}>
              The AI shopping master for Shopify.
            </p>
          </div>
          <div
            className="sifu-display flex flex-wrap gap-7 text-[12px] uppercase"
            style={{ color: '#b5bfd9', letterSpacing: '0.1em' }}
          >
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="#contact">Contact</a>
            <a href="#faq">FAQ</a>
            {SHOW_BILLING && <a href="#pricing">Pricing</a>}
          </div>
          <div
            className="sifu-mono text-[10.5px]"
            style={{ color: '#475569', letterSpacing: '0.08em' }}
          >
            © {new Date().getFullYear()} SHOPSIFU · BUILT FOR THE FRONTIER
          </div>
        </div>
      </footer>
    </div>
  );
}
