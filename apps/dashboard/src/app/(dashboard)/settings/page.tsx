import { getMerchant } from '@/lib/merchant';
import { currentUser } from '@clerk/nextjs/server';
import {
  Store,
  User,
  CreditCard,
  ShieldAlert,
  ExternalLink,
  Check,
  Sparkles,
  Crown,
  Bell,
  Key,
  Globe,
} from 'lucide-react';

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[]; tier: number }> = {
  starter: {
    name: 'Starter',
    price: '$29/mo',
    tier: 1,
    features: ['10,000 tokens/conversation', 'Unlimited conversations', 'Product search', 'Order tracking'],
  },
  growth: {
    name: 'Growth',
    price: '$79/mo',
    tier: 2,
    features: ['50,000 tokens/conversation', 'Priority support', 'Analytics dashboard', 'Custom instructions'],
  },
  pro: {
    name: 'Pro',
    price: '$175/mo',
    tier: 3,
    features: ['Unlimited tokens', 'White-label widget', 'API access', 'SLA guarantee'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    tier: 4,
    features: ['Everything in Pro', 'Dedicated infrastructure', 'Custom integrations', 'Account manager'],
  },
};

export default async function SettingsPage() {
  const [merchant, user] = await Promise.all([getMerchant(), currentUser()]);
  if (!merchant) return null;

  const plan = PLAN_DETAILS[merchant.planId] ?? PLAN_DETAILS.starter;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your store, account, and billing</p>
      </div>

      {/* Store Info */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Store</h3>
            <p className="text-xs text-muted-foreground">Your connected Shopify store</p>
          </div>
        </div>
        <div className="space-y-0 divide-y divide-[var(--glass-border)]">
          <SettingRow label="Shop domain" value={merchant.shopDomain} icon={<Globe className="w-3.5 h-3.5" />} />
          <SettingRow label="Merchant ID" value={merchant.id} mono />
          <SettingRow label="Status" value={merchant.status} badge={merchant.status === 'active'} />
          <SettingRow label="Connected since" value={new Date(merchant.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
        </div>
      </div>

      {/* Account */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-chart-2" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Account</h3>
            <p className="text-xs text-muted-foreground">Your personal details</p>
          </div>
        </div>
        <div className="space-y-0 divide-y divide-[var(--glass-border)]">
          <SettingRow label="Email" value={user?.primaryEmailAddress?.emailAddress ?? '\u2014'} />
          <SettingRow label="Name" value={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '\u2014'} />
        </div>
      </div>

      {/* Plan */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-chart-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Plan & Billing</h3>
              <p className="text-xs text-muted-foreground">Your current subscription</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Crown className="w-3 h-3" />
            {plan.name}
          </span>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-chart-2/5 border border-[var(--glass-border)] p-5 mb-5">
          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="text-3xl font-bold text-foreground">{plan.price}</span>
            {plan.price !== 'Custom' && <span className="text-sm text-muted-foreground">per month</span>}
          </div>
          <ul className="space-y-2.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {merchant.planId !== 'enterprise' && (
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Upgrade Plan
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-chart-3/10 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-chart-3" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">Configure alert preferences</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Escalation alerts', desc: 'Get notified when a conversation is escalated', enabled: true },
            { label: 'Weekly analytics digest', desc: 'Receive a weekly summary of chatbot performance', enabled: true },
            { label: 'System health alerts', desc: 'Alerts for downtime or performance degradation', enabled: false },
          ].map((notif) => (
            <div key={notif.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/20 transition-all">
              <div>
                <p className="text-sm font-medium text-foreground">{notif.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${notif.enabled ? 'bg-primary' : 'bg-accent'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mt-1 transition-transform ${notif.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-chart-5/10 flex items-center justify-center">
            <Key className="w-4.5 h-4.5 text-chart-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
            <p className="text-xs text-muted-foreground">Manage your API access tokens</p>
          </div>
        </div>
        <div className="rounded-xl bg-accent/20 border border-[var(--glass-border)] p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Publishable Key</p>
            <p className="text-sm font-mono text-foreground mt-0.5">pk_live_...{merchant.id?.slice(-8)}</p>
          </div>
          <button className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
            Copy
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-6 border-destructive/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-4.5 h-4.5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">Irreversible actions</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Uninstalling the Shopify app will freeze your account. Data is permanently deleted after 30 days. To uninstall, go to your Shopify Admin.
        </p>
        <a
          href={`https://${merchant.shopDomain}/admin/apps`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-all"
        >
          Open Shopify App Settings
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
  mono,
  badge,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      {badge ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full capitalize">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {value}
        </span>
      ) : (
        <span className={`text-sm text-foreground ${mono ? 'font-mono text-xs' : 'font-medium'} max-w-[60%] truncate text-right`}>
          {value}
        </span>
      )}
    </div>
  );
}
