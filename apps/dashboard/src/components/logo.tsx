import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoMarkProps = {
  size?: number;
  glow?: boolean;
  className?: string;
};

/** The ShopSifu sage + shopping bag logo mark. Use everywhere the brand appears. */
export function LogoMark({ size = 40, glow = true, className }: LogoMarkProps) {
  return (
    <Image
      src="/shopsifu-logo.png"
      alt="ShopSifu"
      width={size}
      height={size}
      priority
      className={cn('object-contain shrink-0', className)}
      style={{
        width: size,
        height: size,
        filter: glow ? 'drop-shadow(0 2px 14px rgba(99,102,241,0.55))' : undefined,
      }}
    />
  );
}

type LogoLockupProps = {
  size?: number;
  tagline?: boolean;
  chrome?: boolean;
  className?: string;
};

/** Logo + wordmark — "SHOP SIFU" in Space-Grotesk-style weights. */
export function LogoLockup({ size = 36, tagline = false, chrome = false, className }: LogoLockupProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark size={size} />
      <div className="flex flex-col leading-none">
        <span
          className="font-bold uppercase tracking-tight inline-flex gap-[2px]"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontSize: size * 0.5,
            letterSpacing: '-0.02em',
          }}
        >
          <span className="font-medium text-white/90">SHOP</span>
          {chrome ? (
            <span className="sifu-chrome font-extrabold">SIFU</span>
          ) : (
            <span
              className="font-extrabold"
              style={{ color: '#a78bfa', textShadow: '0 0 14px rgba(139,92,246,0.5)' }}
            >
              SIFU
            </span>
          )}
        </span>
        {tagline && (
          <span
            className="font-mono text-muted-foreground"
            style={{
              fontSize: size * 0.26,
              marginTop: size * 0.14,
              letterSpacing: '0.16em',
            }}
          >
            AI · 師 · SHOPIFY
          </span>
        )}
      </div>
    </div>
  );
}
