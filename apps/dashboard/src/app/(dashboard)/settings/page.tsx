import { getMerchant } from '@/lib/merchant';
import { currentUser } from '@clerk/nextjs/server';
import { Store, User, CreditCard, ShieldAlert } from 'lucide-react';

const PLAN_DETAILS: Record<string, { name: string; price: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: '$29/mo',
    features: ['10,000 tokens/conversation', 'Unlimited conversations', 'Product search', 'Order tracking'],
  },
  growth: {
    name: 'Growth',
    price: '$79/mo',
    features: ['50,000 tokens/conversation', 'Priority support', 'Analytics dashboard', 'Custom instructions'],
  },
  pro: {
    name: 'Pro',
    price: '$175/mo',
    features: ['Unlimited tokens', 'White-label widget', 'API access', 'SLA guarantee'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Everything in Pro', 'Dedicated infrastructure', 'Custom integrations', 'Account manager'],
  },
};

export default async function SettingsPage() {
  const [merchant, user] = await Promise.all([getMerchant(), currentUser()]);
  if (!merchant) return null;

  const plan = PLAN_DETAILS[merchant.planId] ?? PLAN_DETAILS.starter;

  return (
    <div className="max-w-2xl space-y-5">
      {/* Store Info */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900">Store</h2>
        </div>
        <div className="space-y-3">
          <Row label="Shop domain"    value={merchant.shopDomain} />
          <Row label="Merchant ID"    value={merchant.id} mono />
          <Row label="Status"         value={merchant.status} badge={merchant.status === 'active'} />
          <Row label="Connected since" value={new Date(merchant.createdAt).toLocaleDateString()} />
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
        </div>
        <div className="space-y-3">
          <Row label="Email" value={user?.primaryEmailAddress?.emailAddress ?? '—'} />
          <Row label="Name"  value={[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'} />
        </div>
      </div>

      {/* Plan */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900">Plan</h2>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            {plan.name}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold text-zinc-900">{plan.price}</span>
        </div>
        <ul className="space-y-1.5 mb-4">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        {merchant.planId !== 'enterprise' && (
          <button className="w-full py-2 border border-emerald-500 text-emerald-600 text-sm font-semibold rounded-lg hover:bg-emerald-50 transition-colors">
            Upgrade Plan
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-semibold text-red-700">Danger Zone</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Uninstalling the Shopify app will freeze your account and data will be permanently deleted after 30 days.
          To uninstall, go to your Shopify Admin → Apps.
        </p>
        <a
          href={`https://${merchant.shopDomain}/admin/apps`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-red-600 font-medium hover:text-red-700 underline"
        >
          Open Shopify App Settings →
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      {badge ? (
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full capitalize">
          {value}
        </span>
      ) : (
        <span className={`text-sm text-zinc-900 ${mono ? 'font-mono text-xs' : 'font-medium'} max-w-[60%] truncate text-right`}>
          {value}
        </span>
      )}
    </div>
  );
}