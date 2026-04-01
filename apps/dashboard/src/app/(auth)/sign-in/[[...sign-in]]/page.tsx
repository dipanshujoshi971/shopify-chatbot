import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] rounded-2xl p-2",
          cardBox: "shadow-none",
          headerTitle: "text-xl font-bold text-foreground",
          headerSubtitle: "text-muted-foreground text-sm",
          socialButtonsBlockButton:
            "border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm rounded-xl text-sm font-medium text-foreground hover:bg-accent/40 transition-all",
          socialButtonsBlockButtonText: "text-foreground font-medium",
          dividerLine: "bg-[var(--glass-border)]",
          dividerText: "text-muted-foreground text-xs",
          formFieldLabel: "text-sm font-medium text-foreground",
          formFieldInput:
            "rounded-xl border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
          formButtonPrimary:
            "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all",
          footerActionLink: "text-primary font-semibold hover:text-primary/80",
          footerActionText: "text-muted-foreground",
          identityPreviewText: "text-foreground",
          identityPreviewEditButton: "text-primary hover:text-primary/80",
          formFieldAction: "text-primary font-medium hover:text-primary/80",
          formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
          otpCodeFieldInput: "border-[var(--glass-border)] bg-[var(--glass-bg)] text-foreground",
          alert: "rounded-xl border-destructive/30 bg-destructive/5",
          alertText: "text-destructive text-sm",
        },
      }}
    />
  )
}
