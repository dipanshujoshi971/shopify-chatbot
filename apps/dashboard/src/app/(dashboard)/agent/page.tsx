import { getMerchant, getAgentConfig } from '@/lib/merchant';
import { AgentConfigForm } from '@/components/dashboard/agent-config-form';
import { Bot } from 'lucide-react';

export default async function AgentPage() {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const config = await getAgentConfig(merchant.id);

  return (
    <div className="max-w-2xl space-y-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Bot className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Bot Configuration</h2>
          <p className="text-sm text-zinc-400">Customize how your AI assistant behaves</p>
        </div>
      </div>
      <AgentConfigForm initialConfig={config} />
    </div>
  );
}