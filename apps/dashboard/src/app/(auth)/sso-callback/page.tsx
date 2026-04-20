'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center">
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
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </div>
  )
}
