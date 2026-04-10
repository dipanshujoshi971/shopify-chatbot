'use client';

import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Repeat,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const REVENUE_DATA = [
  { month: 'Sep', revenue: 1240, assisted: 680 },
  { month: 'Oct', revenue: 1890, assisted: 1020 },
  { month: 'Nov', revenue: 2450, assisted: 1560 },
  { month: 'Dec', revenue: 3200, assisted: 2100 },
  { month: 'Jan', revenue: 2780, assisted: 1890 },
  { month: 'Feb', revenue: 3100, assisted: 2240 },
];

const maxRevenue = Math.max(...REVENUE_DATA.map((d) => d.revenue));

const TOP_PRODUCTS = [
  { name: 'Premium Wireless Headphones', revenue: '$4,230', units: 47, change: 12 },
  { name: 'Organic Cotton T-Shirt', revenue: '$2,890', units: 123, change: 8 },
  { name: 'Leather Crossbody Bag', revenue: '$2,340', units: 26, change: -3 },
  { name: 'Vitamin C Serum', revenue: '$1,890', units: 189, change: 22 },
  { name: 'Yoga Mat Pro', revenue: '$1,560', units: 52, change: 5 },
];

export default function SalesAnalyticsPage() {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Sales Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Revenue and conversion metrics powered by your chatbot</p>
      </div>

      {/* Revenue metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bot-Assisted Revenue', value: '$12,450', trend: 18, icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Conversion Rate', value: '14.2%', trend: 3, icon: Target, color: 'text-primary bg-primary/10' },
          { label: 'Avg Order Value', value: '$67.30', trend: 5, icon: CreditCard, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'Repeat Purchases', value: '23%', trend: 7, icon: Repeat, color: 'text-chart-3 bg-chart-3/10' },
        ].map((metric) => (
          <div key={metric.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{metric.label}</span>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', metric.color)}>
                <metric.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <div className="flex items-center gap-1 mt-1.5">
              {metric.trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-400" />
              )}
              <span className={cn('text-xs font-semibold', metric.trend >= 0 ? 'text-emerald-500' : 'text-red-400')}>
                {Math.abs(metric.trend)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total vs bot-assisted revenue</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Bot-Assisted</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-4 h-52">
            {REVENUE_DATA.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-foreground font-semibold">${(d.revenue / 1000).toFixed(1)}k</span>
                <div className="w-full flex gap-1 flex-1 items-end">
                  <div
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-primary/60"
                    style={{ height: `${(d.revenue / maxRevenue) * 160}px` }}
                  />
                  <div
                    className="flex-1 rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-500/60"
                    style={{ height: `${(d.assisted / maxRevenue) * 160}px` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales funnel */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Sales Funnel</h3>
          <p className="text-xs text-muted-foreground mb-5">Bot-assisted conversion path</p>
          <div className="space-y-3">
            {[
              { label: 'Product Views', value: 2450, pct: 100, color: 'from-primary to-primary/60' },
              { label: 'Added to Cart', value: 890, pct: 36, color: 'from-chart-2 to-chart-2/60' },
              { label: 'Checkout Started', value: 420, pct: 17, color: 'from-chart-4 to-chart-4/60' },
              { label: 'Completed Purchase', value: 185, pct: 7.5, color: 'from-emerald-500 to-emerald-500/60' },
            ].map((step, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{step.value.toLocaleString()}</span>
                    <span className="text-[10px] font-semibold text-primary">{step.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-accent/30 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', step.color)}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Top Products (Bot-Assisted)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Products most recommended by your chatbot</p>
          </div>
        </div>
        <div className="space-y-3">
          {TOP_PRODUCTS.map((product, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-chart-2/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.units} units sold</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">{product.revenue}</p>
                <div className="flex items-center gap-0.5 justify-end">
                  {product.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <span className={cn('text-[11px] font-semibold', product.change >= 0 ? 'text-emerald-500' : 'text-red-400')}>
                    {Math.abs(product.change)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
