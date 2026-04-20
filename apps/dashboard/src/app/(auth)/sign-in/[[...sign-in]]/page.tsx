'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
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

export default function SignInPage() {
  const { signIn, fetchStatus } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const res = await signIn.password({ identifier: email, password })
      if (res?.error) {
        setError(extractError(res.error))
        return
      }
      const finalizeRes = await signIn.finalize({
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

  const handleGoogle = async () => {
    if (oauthLoading) return
    setError(null)
    setOauthLoading(true)
    try {
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

  const busy = submitting || fetchStatus === 'fetching'

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
