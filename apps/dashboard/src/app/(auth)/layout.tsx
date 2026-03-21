import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const features = [
  { icon: "⚡", title: "Live product data", desc: "Always synced with your Shopify catalog" },
  { icon: "🛒", title: "Cart in chat", desc: "Customers add to cart without leaving the widget" },
  { icon: "📦", title: "Order tracking", desc: "Real-time status from Shopify Admin API" },
  { icon: "🧠", title: "RAG-powered answers", desc: "Trained on your FAQs, policies, and guides" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 text-white relative overflow-hidden min-h-screen">

        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(#fff 1px, transparent 1px),
              linear-gradient(90deg, #fff 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg shadow-lg">
            💬
          </div>
          <span className="text-lg font-bold tracking-tight">ShopChat</span>
          <Badge variant="outline" className="ml-1 text-emerald-400 border-emerald-400/30 bg-emerald-400/5 text-xs">
            Beta
          </Badge>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase">
            AI Chatbot for Shopify
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight">
            Your store,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              always open.
            </span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Install once. Your AI handles product discovery,
            order tracking, and support — around the clock.
          </p>

          <Separator className="bg-zinc-800 w-16" />

          {/* Stats */}
          <div className="flex items-center gap-8">
            {[
              { value: "< 30KB", label: "Widget size" },
              { value: "< 1s", label: "Response time" },
              { value: "10K+", label: "Stores supported" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-3">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div>
                <div className="text-sm font-medium text-zinc-200">{f.title}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            💬
          </div>
          <span className="text-base font-bold">ShopChat</span>
        </div>
        {children}
      </div>

    </div>
  )
}