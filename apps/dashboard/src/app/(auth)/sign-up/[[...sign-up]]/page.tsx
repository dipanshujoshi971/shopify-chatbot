import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          rootBox: "w-full max-w-sm",
          card: "shadow-none border border-zinc-200 rounded-2xl",
          headerTitle: "text-xl font-bold text-zinc-900",
          headerSubtitle: "text-zinc-500 text-sm",
          socialButtonsBlockButton: "border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50",
          dividerLine: "bg-zinc-100",
          dividerText: "text-zinc-400 text-xs",
          formFieldLabel: "text-sm font-medium text-zinc-700",
          formFieldInput: "rounded-xl border-zinc-200 text-sm",
          formButtonPrimary: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl text-sm font-semibold shadow-sm",
          footerActionLink: "text-emerald-600 font-semibold hover:text-emerald-700",
        },
      }}
    />
  )
}