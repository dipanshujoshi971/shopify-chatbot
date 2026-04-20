'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'

function extractError(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const first = err.errors?.[0]
    return first?.longMessage ?? first?.message ?? 'Authentication failed.'
  }
  if (err instanceof Error) return err.message
  return 'Authentication failed.'
}

export default function SSOCallbackPage() {
  const clerk = useClerk()
  const router = useRouter()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const ran = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ran.current) return
    if (!clerk.loaded) return
    ran.current = true

    const go = (to: string) => {
      router.push(to)
    }

    ;(async () => {
      try {
        // Let Clerk process the OAuth redirect params. This populates
        // client.signIn / client.signUp with the server-side result.
        await clerk.handleRedirectCallback({
          signInFallbackRedirectUrl: '/dashboard',
          signUpFallbackRedirectUrl: '/dashboard',
          signInForceRedirectUrl: '/dashboard',
          signUpForceRedirectUrl: '/dashboard',
        })
      } catch {
        // handleRedirectCallback throws on some transfer cases; we
        // recover below by inspecting signIn / signUp state.
      }

      // Already have an active session? Just go.
      if (clerk.session) {
        go('/dashboard')
        return
      }

      try {
        const liveSignIn = clerk.client?.signIn
        const liveSignUp = clerk.client?.signUp

        // New OAuth user — Clerk transferred us to a sign-up. Complete it first.
        if (liveSignIn?.__internal_future?.isTransferable && !liveSignUp?.createdSessionId) {
          const { error: createErr } = await signUp.create({ transfer: true })
          if (createErr) {
            setError(extractError(createErr))
            return
          }
        }

        // Prefer activating whichever flow actually produced a session.
        const sessionId =
          clerk.client?.signUp?.createdSessionId ||
          clerk.client?.signIn?.createdSessionId

        if (sessionId) {
          await clerk.setActive({ session: sessionId })
          go('/dashboard')
          return
        }

        // handleRedirectCallback may have already activated the session.
        if (clerk.session) {
          go('/dashboard')
          return
        }

        setError('We could not complete sign-in. Please try again.')
      } catch (err) {
        setError(extractError(err))
      }
    })()
  }, [clerk, clerk.loaded, signIn, signUp, router])

  return (
    <div className="flex flex-col items-center justify-center text-center">
      {!error ? (
        <>
          <div
            className="mb-5 inline-block h-10 w-10 animate-spin rounded-full border-2"
            style={{ borderColor: 'rgba(125,249,255,0.2)', borderTopColor: '#7df9ff' }}
            aria-hidden
          />
          <p
            className="sifu-display text-[14px]"
            style={{ color: '#e2e8f0', letterSpacing: '0.08em' }}
          >
            Completing sign-in…
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: '#6b7796' }}>
            Hold tight, we&apos;re setting things up.
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <p className="sifu-display text-[14px]" style={{ color: '#ffb385' }}>
            Sign-in failed
          </p>
          <p className="text-[12.5px]" style={{ color: '#b5bfd9' }}>
            {error}
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="sifu-mono text-[11px] uppercase underline"
            style={{ color: '#7df9ff', letterSpacing: '0.16em' }}
          >
            Back to sign in
          </button>
        </div>
      )}
    </div>
  )
}
