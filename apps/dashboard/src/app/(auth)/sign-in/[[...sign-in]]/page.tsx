'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSignIn, useClerk } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import {
  AuthShell,
  AuthField,
  AuthSubmit,
  GoogleButton,
  AuthDivider,
  AuthError,
} from '../../_components/AuthShell'

function extractError(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const first = err.errors?.[0]
    return first?.longMessage ?? first?.message ?? 'Something went wrong. Please try again.'
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

type MfaStrategy = 'email_code' | 'phone_code'

type SupportedFactor = {
  strategy: string
  safeIdentifier?: string | null
  emailAddressId?: string
  phoneNumberId?: string
}

type MfaContext = {
  strategy: MfaStrategy
  destination: string
  emailAddressId?: string
  phoneNumberId?: string
  // 'client_trust' for new-device challenge, 'mfa' for user-enabled MFA
  reason: 'client_trust' | 'mfa'
}

function pickSecondFactor(
  supported: ReadonlyArray<SupportedFactor> | null | undefined,
): Omit<MfaContext, 'reason'> | null {
  if (!supported?.length) return null
  const email = supported.find((f) => f.strategy === 'email_code')
  if (email) {
    return {
      strategy: 'email_code',
      destination: email.safeIdentifier ?? 'your email',
      emailAddressId: email.emailAddressId,
    }
  }
  const phone = supported.find((f) => f.strategy === 'phone_code')
  if (phone) {
    return {
      strategy: 'phone_code',
      destination: phone.safeIdentifier ?? 'your phone',
      phoneNumberId: phone.phoneNumberId,
    }
  }
  return null
}

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn()
  const clerk = useClerk()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const [step, setStep] = useState<'form' | 'mfa'>('form')
  const [mfa, setMfa] = useState<MfaContext | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [resent, setResent] = useState(false)

  const busy = submitting || fetchStatus === 'fetching'

  const finalizeSession = async (sessionIdOverride?: string | null): Promise<boolean> => {
    const createdSessionId =
      sessionIdOverride ??
      signIn.createdSessionId ??
      clerk.client?.signIn?.createdSessionId ??
      null
    if (!createdSessionId) return false
    await clerk.setActive({ session: createdSessionId })
    // Hard navigate so the session cookie is guaranteed to be attached to the
    // /dashboard request and Next.js doesn't serve a cached (anonymous) RSC.
    window.location.assign('/dashboard')
    return true
  }

  // Use the traditional SignInResource API for second-factor prep/attempt.
  // It takes the explicit emailAddressId/phoneNumberId that Clerk returns in
  // supportedSecondFactors, which is what both client-trust and MFA expect.
  const sendSecondFactor = async (ctx: Pick<MfaContext, 'strategy' | 'emailAddressId' | 'phoneNumberId'>) => {
    const live = clerk.client?.signIn
    if (!live) throw new Error('No sign-in in progress.')
    if (ctx.strategy === 'email_code') {
      await live.prepareSecondFactor({ strategy: 'email_code', emailAddressId: ctx.emailAddressId! })
    } else {
      await live.prepareSecondFactor({ strategy: 'phone_code', phoneNumberId: ctx.phoneNumberId! })
    }
  }

  const verifySecondFactor = async (strategy: MfaStrategy, code: string) => {
    const live = clerk.client?.signIn
    if (!live) throw new Error('No sign-in in progress.')
    const result = await live.attemptSecondFactor({ strategy, code })
    return result.createdSessionId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      if (clerk.session) {
        await clerk.signOut().catch(() => {})
      }
      await signIn.reset().catch(() => {})

      const res = await signIn.password({ identifier: email, password })
      if (res?.error) {
        setError(extractError(res.error))
        return
      }

      const live = clerk.client?.signIn
      const status = live?.status

      if (status === 'complete') {
        if (await finalizeSession()) return
      }

      if (status === 'needs_client_trust' || status === 'needs_second_factor') {
        const picked = pickSecondFactor(live?.supportedSecondFactors)
        if (!picked) {
          setError('Additional verification is required, but no supported method is available.')
          return
        }
        try {
          await sendSecondFactor(picked)
        } catch (sendErr) {
          setError(extractError(sendErr))
          return
        }
        setMfa({
          ...picked,
          reason: status === 'needs_client_trust' ? 'client_trust' : 'mfa',
        })
        setMfaCode('')
        setStep('mfa')
        return
      }

      setError('Sign-in could not be completed. Please try again.')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || !mfa) return
    setError(null)
    setSubmitting(true)
    try {
      const sessionId = await verifySecondFactor(mfa.strategy, mfaCode)
      if (!(await finalizeSession(sessionId))) {
        setError('Verification succeeded but sign-in could not complete. Please try again.')
      }
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleMfaResend = async () => {
    if (!mfa) return
    setError(null)
    setResent(false)
    try {
      await sendSecondFactor(mfa)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch (err) {
      setError(extractError(err))
    }
  }

  const handleGoogle = async () => {
    if (oauthLoading) return
    setError(null)
    setOauthLoading(true)
    try {
      if (clerk.session) {
        await clerk.signOut().catch(() => {})
      }
      await signIn.reset().catch(() => {})
      await signIn.sso({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/sso-callback',
      })
    } catch (err) {
      setError(extractError(err))
      setOauthLoading(false)
    }
  }

  if (step === 'mfa' && mfa) {
    const isClientTrust = mfa.reason === 'client_trust'
    return (
      <AuthShell
        eyebrow={isClientTrust ? 'Verify This Device' : 'Two-Factor Auth'}
        title={
          <>
            One more <span className="sifu-chrome">check.</span>
          </>
        }
        subtitle={
          <>
            {isClientTrust
              ? 'New device detected. We sent a verification code to '
              : 'Enter the verification code we sent to '}
            <span style={{ color: '#7df9ff' }}>{mfa.destination}</span>
          </>
        }
        footer={
          <>
            Didn&apos;t get it?{' '}
            <button
              type="button"
              onClick={handleMfaResend}
              className="font-semibold transition-colors"
              style={{ color: '#7df9ff' }}
            >
              Resend code
            </button>
            {resent && (
              <span className="ml-2" style={{ color: '#3ddc84' }}>
                ✓ Sent
              </span>
            )}
            <div className="mt-2">
              <button
                type="button"
                onClick={async () => {
                  await signIn.reset().catch(() => {})
                  setStep('form')
                  setMfa(null)
                  setMfaCode('')
                  setError(null)
                }}
                className="sifu-mono text-[10.5px] uppercase transition-colors"
                style={{ color: '#6b7796', letterSpacing: '0.16em' }}
              >
                ← Back to sign in
              </button>
            </div>
          </>
        }
      >
        <AuthError message={error} />
        <form onSubmit={handleMfaVerify} className="space-y-4">
          <AuthField
            id="mfa-code"
            label="Verification code"
            type="text"
            value={mfaCode}
            onChange={(v) => setMfaCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            autoComplete="one-time-code"
            disabled={busy}
            required
          />
          <AuthSubmit loading={busy} disabled={mfaCode.length < 6}>
            {busy ? 'Verifying…' : 'Verify & continue'}
          </AuthSubmit>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title={
        <>
          Step back into <span className="sifu-chrome">the dojo.</span>
        </>
      }
      subtitle="Sign in to your ShopSifu dashboard"
      footer={
        <>
          New here?{' '}
          <Link
            href="/sign-up"
            className="font-semibold transition-colors"
            style={{ color: '#7df9ff' }}
          >
            Create an account →
          </Link>
        </>
      }
    >
      <AuthError message={error} />

      <GoogleButton
        onClick={handleGoogle}
        disabled={busy || oauthLoading}
        label={oauthLoading ? 'Redirecting to Google…' : 'Continue with Google'}
      />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@store.com"
          disabled={busy}
          required
        />
        <AuthField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="••••••••"
          disabled={busy}
          required
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="sifu-mono text-[10px] uppercase transition-colors hover:text-white"
              style={{ color: '#6b7796', letterSpacing: '0.14em' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />
        <AuthSubmit loading={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
          {!busy && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </AuthSubmit>
      </form>
    </AuthShell>
  )
}
