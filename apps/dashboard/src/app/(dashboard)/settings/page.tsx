'use client';

import { useState, useEffect } from 'react';
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
  Globe,
  Loader2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SHOW_BILLING } from '@/lib/flags';

/* ─── Types ─── */
interface MerchantData {
  id: string;
  shopDomain: string;
  status: string;
  planId: string;
  createdAt: string;
}

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[]; tier: number }> = {
  starter: {
    name: 'Starter',
    price: '$29/mo',
    tier: 1,
    features: ['Unlimited conversations', 'Product search', 'Order tracking', 'Email support'],
  },
  growth: {
    name: 'Growth',
    price: '$79/mo',
    tier: 2,
    features: ['Priority support', 'Analytics dashboard', 'Custom instructions', 'Advanced AI'],
  },
  pro: {
    name: 'Pro',
    price: '$175/mo',
    tier: 3,
    features: ['White-label widget', 'API access', 'SLA guarantee', 'Dedicated support'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    tier: 4,
    features: ['Everything in Pro', 'Dedicated infrastructure', 'Custom integrations', 'Account manager'],
  },
};

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    escalations: true,
    weeklyDigest: true,
    systemHealth: false,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savedNotifs, setSavedNotifs] = useState(false);

  useEffect(() => {
    fetch('/api/merchant')
      .then((r) => r.json())
      .then((data) => setMerchant(data.merchant))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveNotifications() {
    setSavingNotifs(true);
    // Store in agent_config via appearance endpoint
    try {
      await fetch('/api/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetConfig: { notifications },
        }),
      });
      setSavedNotifs(true);
      setTimeout(() => setSavedNotifs(false), 2000);
    } finally {
      setSavingNotifs(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!merchant) return null;

  const plan = PLAN_DETAILS[merchant.planId] ?? PLAN_DETAILS.starter;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {SHOW_BILLING
            ? 'Manage your store, account, and billing'
            : 'Manage your store and account'}
        </p>
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
          <SettingRow
            label="Shop domain"
            value={merchant.shopDomain}
            icon={<Globe className="w-3.5 h-3.5" />}
          />
          <SettingRow label="Merchant ID" value={merchant.id} mono />
          <SettingRow
            label="Status"
            value={merchant.status}
            badge={merchant.status === 'active'}
          />
          <SettingRow
            label="Connected since"
            value={new Date(merchant.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          />
        </div>
      </div>

      {/* Plan */}
      {SHOW_BILLING && (
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
            {plan.price !== 'Custom' && (
              <span className="text-sm text-muted-foreground">per month</span>
            )}
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
      )}

      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-chart-3" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <p className="text-xs text-muted-foreground">Configure alert preferences</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            {
              key: 'escalations' as const,
              label: 'Escalation alerts',
              desc: 'Get notified when a conversation is escalated',
            },
            {
              key: 'weeklyDigest' as const,
              label: 'Weekly analytics digest',
              desc: 'Receive a weekly summary of chatbot performance',
            },
            {
              key: 'systemHealth' as const,
              label: 'System health alerts',
              desc: 'Alerts for downtime or performance degradation',
            },
          ].map((notif) => (
            <div
              key={notif.key}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/20 transition-all"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{notif.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    [notif.key]: !prev[notif.key],
                  }))
                }
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  notifications[notif.key] ? 'bg-primary' : 'bg-accent',
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform',
                    notifications[notif.key] ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={saveNotifications}
          disabled={savingNotifs}
          className="mt-4 w-full py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {savingNotifs ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedNotifs ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
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
          Uninstalling the Shopify app will freeze your account. Data is permanently deleted after 30
          days. To uninstall, go to your Shopify Admin.
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
        <span
          className={`text-sm text-foreground ${mono ? 'font-mono text-xs' : 'font-medium'} max-w-[60%] truncate text-right`}
        >
          {value}
        </span>
      )}
    </div>
  );
}
