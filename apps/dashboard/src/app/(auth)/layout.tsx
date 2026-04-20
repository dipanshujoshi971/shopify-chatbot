import Link from 'next/link'
import { LogoLockup } from '@/components/logo'

function MountainHorizon() {
  return (
    <svg
      viewBox="0 0 1440 560"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] w-full"
    >
      <defs>
        <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05070f" stopOpacity="0" />
          <stop offset="45%" stopColor="#331a3a" stopOpacity="0.55" />
          <stop offset="72%" stopColor="#a63a66" stopOpacity="0.75" />
          <stop offset="90%" stopColor="#ff7849" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffb347" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="auth-farMtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1a44" />
          <stop offset="100%" stopColor="#1a1232" />
        </linearGradient>
        <linearGradient id="auth-nearMtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0e22" />
          <stop offset="100%" stopColor="#05070f" />
        </linearGradient>
        <radialGradient id="auth-sun" cx="0.62" cy="0.82" r="0.18">
          <stop offset="0%" stopColor="#fff3d6" stopOpacity="1" />
          <stop offset="45%" stopColor="#ffb347" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ff7849" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1440" height="560" fill="url(#auth-sky)" />
      <rect x="0" y="0" width="1440" height="560" fill="url(#auth-sun)" />
      <path
        d="M0 360 L140 300 L240 340 L340 260 L460 330 L580 240 L700 310 L830 220 L960 300 L1080 250 L1200 320 L1320 260 L1440 310 L1440 560 L0 560 Z"
        fill="url(#auth-farMtn)"
        opacity="0.85"
      />
      <path
        d="M0 460 L90 400 L200 450 L320 360 L430 440 L560 370 L680 430 L820 340 L950 420 L1060 380 L1180 440 L1300 390 L1440 430 L1440 560 L0 560 Z"
        fill="url(#auth-nearMtn)"
      />
    </svg>
  )
}

function FloatingRock({
  size = 80,
  style,
  className,
}: {
  size?: number
  style?: React.CSSProperties
  className?: string
}) {
  const id = `auth-rock-${size}`
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
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 70% 0%, rgba(99,102,241,0.18), transparent 60%),
          radial-gradient(ellipse 60% 40% at 20% 30%, rgba(34,230,255,0.08), transparent 60%),
          linear-gradient(180deg, #05070f 0%, #0a1030 50%, #070b1a 100%)
        `,
        color: '#fff',
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

      <FloatingRock size={110} style={{ top: 90, left: '6%' }} className="sifu-floaty-slow hidden md:block" />
      <FloatingRock size={70} style={{ top: 220, left: '12%' }} className="sifu-floaty hidden md:block" />
      <FloatingRock size={90} style={{ top: 130, right: '5%' }} className="sifu-floaty-fast hidden md:block" />
      <FloatingRock size={60} style={{ top: 300, right: '12%' }} className="sifu-floaty-slow hidden lg:block" />

      <div
        className="absolute top-20 right-[22%] h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ background: '#7df9ff', boxShadow: '0 0 12px rgba(125,249,255,0.6)' }}
      />
      <div
        className="absolute top-40 left-[28%] h-2 w-2 rounded-full animate-pulse"
        style={{ background: '#ffb347', boxShadow: '0 0 14px rgba(255,179,71,0.6)', animationDelay: '1s' }}
      />
      <div
        className="absolute top-[55%] right-[18%] h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ background: '#a78bfa', animationDelay: '2s' }}
      />

      <header className="relative z-10 mx-auto flex max-w-[1240px] items-center justify-between px-6 py-5 md:px-8">
        <Link href="/" className="inline-flex">
          <LogoLockup size={34} tagline />
        </Link>
        <Link
          href="/"
          className="sifu-display text-[11px] font-semibold transition-colors hover:text-white"
          style={{ color: '#b5bfd9', letterSpacing: '0.16em' }}
        >
          ← BACK HOME
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-10 sm:px-6">
        <div className="w-full max-w-[440px] sifu-rise">{children}</div>
      </main>

      <footer className="relative z-10 mx-auto max-w-[1240px] px-6 pb-8 pt-4 md:px-8">
        <div
          className="sifu-mono text-center text-[10.5px]"
          style={{ color: '#475569', letterSpacing: '0.08em' }}
        >
          © {new Date().getFullYear()} SHOPSIFU · BUILT FOR THE FRONTIER
        </div>
      </footer>
    </div>
  )
}
