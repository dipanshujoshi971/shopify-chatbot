'use client';

import { useState } from 'react';
import { Loader2, Save, CheckCircle } from 'lucide-react';

interface AgentConfig {
  bot_name: string;
  tone: string;
  custom_instructions: string | null;
  use_emojis: boolean;
}

interface AgentConfigFormProps {
  initialConfig: AgentConfig;
}

const TONES = [
  { value: 'friendly',     label: 'Friendly',     desc: 'Warm and approachable' },
  { value: 'professional', label: 'Professional',  desc: 'Formal and precise' },
  { value: 'casual',       label: 'Casual',        desc: 'Relaxed, like texting a friend' },
];

export function AgentConfigForm({ initialConfig }: AgentConfigFormProps) {
  const [config,  setConfig]  = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  async function handleSave() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/agent', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName:            config.bot_name,
          tone:               config.tone,
          customInstructions: config.custom_instructions,
          useEmojis:          config.use_emojis,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Bot Name */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Bot Identity</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Bot Name
            </label>
            <input
              type="text"
              value={config.bot_name}
              onChange={(e) => setConfig((c) => ({ ...c, bot_name: e.target.value }))}
              placeholder="Assistant"
              maxLength={40}
              className="w-full max-w-xs px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="text-xs text-zinc-400 mt-1">Shown in the chat widget header</p>
          </div>
        </div>
      </div>

      {/* Tone */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">Conversation Tone</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TONES.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setConfig((c) => ({ ...c, tone: value }))}
              className={[
                'flex flex-col items-start p-3 rounded-lg border text-left transition-all',
                config.tone === value
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 hover:border-zinc-300',
              ].join(' ')}
            >
              <span className="text-sm font-medium text-zinc-900">{label}</span>
              <span className="text-xs text-zinc-500 mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-1">Custom Instructions</h2>
        <p className="text-xs text-zinc-400 mb-3">
          Add store-specific rules, products to highlight, or topics to avoid.
          Appended to the system prompt.
        </p>
        <textarea
          value={config.custom_instructions ?? ''}
          onChange={(e) => setConfig((c) => ({ ...c, custom_instructions: e.target.value || null }))}
          placeholder="e.g. Always recommend our loyalty programme. Never discuss competitor brands."
          rows={4}
          className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm resize-none focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Emoji toggle */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Use Emojis</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Allow the bot to use emojis in responses</p>
        </div>
        <button
          onClick={() => setConfig((c) => ({ ...c, use_emojis: !c.use_emojis }))}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            config.use_emojis ? 'bg-emerald-500' : 'bg-zinc-200',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              config.use_emojis ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <CheckCircle className="w-4 h-4" />
            Saved!
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}