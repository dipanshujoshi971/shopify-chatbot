'use client'

import type { ReactNode } from 'react'

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] border p-7 sm:p-9"
      style={{
        background: 'linear-gradient(180deg, rgba(14,21,48,0.92), rgba(7,11,26,0.92))',
        borderColor: 'rgba(125,249,255,0.18)',
        boxShadow:
          '0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(125,249,255,0.06), 0 0 60px rgba(99,102,241,0.18)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* corner brackets */}
      {[
        { top: -1, left: -1, transform: 'none' },
        { top: -1, right: -1, transform: 'scaleX(-1)' },
        { bottom: -1, left: -1, transform: 'scaleY(-1)' },
        { bottom: -1, right: -1, transform: 'scale(-1)' },
      ].map((pos, i) => (
        <svg
          key={i}
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className="pointer-events-none absolute"
          style={pos as React.CSSProperties}
        >
          <path d="M1 10 V1 H10" stroke="#7df9ff" strokeWidth="1.6" fill="none" />
        </svg>
      ))}

      <div
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(125,249,255,0.45), transparent)' }}
      />

      <div className="mb-7 text-center">
        <div
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-semibold uppercase backdrop-blur"
          style={{
            background: 'rgba(34,230,255,0.08)',
            borderColor: 'rgba(125,249,255,0.28)',
            color: '#7df9ff',
            letterSpacing: '0.2em',
          }}
        >
          {eyebrow}
        </div>
        <h1
          className="sifu-display mt-4"
          style={{ fontSize: 'clamp(26px, 3.2vw, 34px)', letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-[13.5px]" style={{ color: '#b5bfd9' }}>
            {subtitle}
          </p>
        )}
      </div>

      {children}

      {footer && (
        <div className="mt-6 text-center text-[13px]" style={{ color: '#b5bfd9' }}>
          {footer}
        </div>
      )}
    </div>
  )
}

export function AuthField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  autoComplete,
  placeholder,
  disabled,
  required,
  rightSlot,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rightSlot?: ReactNode
}) {
  return (
    <label htmlFor={id} className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="sifu-mono text-[10.5px] uppercase"
          style={{ color: '#7df9ff', letterSpacing: '0.16em' }}
        >
          {label}
        </span>
        {rightSlot}
      </div>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className="w-full rounded-[12px] border bg-transparent px-3.5 py-3 text-[14px] text-white outline-none transition-all placeholder:text-[#475569] focus:border-[rgba(125,249,255,0.5)] focus:shadow-[0_0_0_3px_rgba(125,249,255,0.12)] disabled:opacity-60"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(125,249,255,0.15)',
        }}
      />
    </label>
  )
}

export function AuthSubmit({
  loading,
  children,
  disabled,
}: {
  loading?: boolean
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="sifu-pill group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full px-5 py-3.5 text-[13.5px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: '#0a0f1e',
        border: '1px solid rgba(125,249,255,0.35)',
        boxShadow:
          '0 10px 30px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -8px rgba(99,102,241,0.5)',
      }}
    >
      <span
        aria-hidden
        className="sifu-pill-sheen pointer-events-none absolute inset-y-0 -left-full w-1/2 opacity-0 group-hover:opacity-100"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(125,249,255,0.35), transparent)' }}
      />
      <span className="relative inline-flex items-center gap-2.5">
        {loading && (
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
        )}
        {children}
      </span>
    </button>
  )
}

export function GoogleButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex w-full items-center justify-center gap-3 rounded-[12px] border px-4 py-3 text-[13.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-[rgba(125,249,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(125,249,255,0.15)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.5 16.2 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C40.4 36.3 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"
        />
      </svg>
      {label}
    </button>
  )
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1" style={{ background: 'rgba(125,249,255,0.12)' }} />
      <span
        className="sifu-mono text-[10px] uppercase"
        style={{ color: '#475569', letterSpacing: '0.2em' }}
      >
        or continue with email
      </span>
      <div className="h-px flex-1" style={{ background: 'rgba(125,249,255,0.12)' }} />
    </div>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-[12px] border px-3.5 py-2.5 text-[12.5px]"
      style={{
        background: 'rgba(255,120,73,0.08)',
        borderColor: 'rgba(255,120,73,0.35)',
        color: '#ffb385',
      }}
      role="alert"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
      <span>{message}</span>
    </div>
  )
}
