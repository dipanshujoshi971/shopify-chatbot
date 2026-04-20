'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSignUp } from '@clerk/nextjs'
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

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'form' | 'verify'>('form')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [resent, setResent] = useState(false)

  const busy = submitting || fetchStatus === 'fetching'

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const createRes = await signUp.password({ emailAddress: email, password })
      if (createRes?.error) {
        setError(extractError(createRes.error))
        return
      }

      const sendRes = await signUp.verifications.sendEmailCode()
      if (sendRes?.error) {
        setError(extractError(sendRes.error))
        return
      }

      setStep('verify')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const verifyRes = await signUp.verifications.verifyEmailCode({ code })
      if (verifyRes?.error) {
        setError(extractError(verifyRes.error))
        return
      }

      const finalizeRes = await signUp.finalize({
        navigate: async (to) => {
          router.push(typeof to === 'string' ? to : '/dashboard')
        },
      })
      if (finalizeRes?.error) {
        setError(extractError(finalizeRes.error))
        return
      }
      router.push('/dashboard')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setResent(false)
    try {
      const res = await signUp.verifications.sendEmailCode()
      if (res?.error) {
        setError(extractError(res.error))
        return
      }
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
      await signUp.sso({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectCallbackUrl: '/sso-callback',
      })
    } catch (err) {
      setError(extractError(err))
      setOauthLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <AuthShell
        eyebrow="Verify Email"
        title={
          <>
            Check your <span className="sifu-chrome">inbox.</span>
          </>
        }
        subtitle={
          <>
            We sent a 6-digit code to <span style={{ color: '#7df9ff' }}>{email}</span>
          </>
        }
        footer={
          <>
            Didn&apos;t get it?{' '}
            <button
              type="button"
              onClick={handleResend}
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
                onClick={() => {
                  setStep('form')
                  setCode('')
                  setError(null)
                }}
                className="sifu-mono text-[10.5px] uppercase transition-colors"
                style={{ color: '#6b7796', letterSpacing: '0.16em' }}
              >
                ← Use a different email
              </button>
            </div>
          </>
        }
      >
        <AuthError message={error} />
        <form onSubmit={handleVerify} className="space-y-4">
          <AuthField
            id="code"
            label="Verification code"
            type="text"
            value={code}
            onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            autoComplete="one-time-code"
            disabled={busy}
            required
          />
          <AuthSubmit loading={busy} disabled={code.length < 6}>
            {busy ? 'Verifying…' : 'Verify & continue'}
          </AuthSubmit>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Begin The Path"
      title={
        <>
          Meet your store&apos;s <span className="sifu-chrome">Sifu.</span>
        </>
      }
      subtitle="Create your free ShopSifu account"
      footer={
        <>
          Already have one?{' '}
          <Link href="/sign-in" className="font-semibold transition-colors" style={{ color: '#7df9ff' }}>
            Sign in →
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

      <form onSubmit={handleStart} className="space-y-4">
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
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

        {/* Required for Clerk bot protection */}
        <div id="clerk-captcha" />

        <AuthSubmit loading={busy}>
          {busy ? 'Creating account…' : 'Create account'}
          {!busy && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </AuthSubmit>
      </form>

      <p
        className="mt-5 text-center text-[11px]"
        style={{ color: '#6b7796' }}
      >
        By creating an account you agree to our{' '}
        <Link href="/terms" style={{ color: '#7df9ff' }}>
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" style={{ color: '#7df9ff' }}>
          Privacy
        </Link>
        .
      </p>
    </AuthShell>
  )
}
