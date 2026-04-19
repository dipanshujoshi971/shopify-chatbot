import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, ShoppingCart, Package, Brain, ArrowRight } from "lucide-react"

const features = [
  { icon: Zap, title: "Live product data", desc: "Always synced with your Shopify catalog", color: "text-emerald-400 bg-emerald-400/10" },
  { icon: ShoppingCart, title: "Cart in chat", desc: "Customers add to cart without leaving the widget", color: "text-blue-400 bg-blue-400/10" },
  { icon: Package, title: "Order tracking", desc: "Real-time status from Shopify Admin API", color: "text-violet-400 bg-violet-400/10" },
  { icon: Brain, title: "RAG-powered answers", desc: "Trained on your FAQs, policies, and guides", color: "text-amber-400 bg-amber-400/10" },
]

const stats = [
  { value: "< 30KB", label: "Widget size" },
  { value: "< 1s", label: "Response time" },
  { value: "10K+", label: "Stores ready" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel — dark glassmorphism showcase ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden min-h-screen bg-[oklch(0.08_0.015_162)]">

        {/* Mesh background */}
        <div className="absolute inset-0">
          <div className="absolute -top-[200px] -left-[100px] w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[120px]" />
          <div className="absolute bottom-[100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
          <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(oklch(0.9 0 0) 1px, transparent 1px),
              linear-gradient(90deg, oklch(0.9 0 0) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Animated floating orbs */}
        <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-emerald-400/40 animate-pulse" />
        <div className="absolute top-40 right-40 w-1.5 h-1.5 rounded-full bg-blue-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-20 w-2 h-2 rounded-full bg-violet-400/30 animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ShopSifu</span>
          <Badge variant="outline" className="ml-1 text-emerald-400 border-emerald-400/20 bg-emerald-400/5 text-[10px] font-semibold tracking-wider uppercase">
            Beta
          </Badge>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <p className="text-emerald-400 text-[11px] font-semibold tracking-[0.25em] uppercase">
            AI Chatbot for Shopify
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white">
            Your store,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
              always open.
            </span>
          </h1>
          <p className="text-[oklch(0.55_0_0)] text-base leading-relaxed max-w-sm">
            Install once. Your AI handles product discovery,
            order tracking, and support — around the clock.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 pt-2">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div>
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[11px] text-[oklch(0.45_0_0)] mt-0.5">{stat.label}</div>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-8 bg-[oklch(1_0_0/8%)]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features — glass cards */}
        <div className="relative z-10 space-y-2.5">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-4 p-4 rounded-2xl border border-[oklch(1_0_0/6%)] bg-[oklch(0.12_0.01_162/50%)] backdrop-blur-sm hover:border-[oklch(1_0_0/10%)] hover:bg-[oklch(0.14_0.01_162/50%)] transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center flex-shrink-0`}>
                <f.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{f.title}</div>
                <div className="text-xs text-[oklch(0.50_0_0)] mt-0.5">{f.desc}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[oklch(0.35_0_0)] group-hover:text-emerald-400 transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — auth form ── */}
      <div className="flex flex-col items-center justify-center min-h-screen p-8 relative overflow-hidden mesh-gradient">
        {/* Subtle background orb */}
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] rounded-full bg-chart-2/5 blur-[60px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-base font-bold text-foreground">ShopSifu</span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
