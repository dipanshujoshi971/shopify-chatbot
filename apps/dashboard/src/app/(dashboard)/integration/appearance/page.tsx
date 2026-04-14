'use client';

import { useState, useEffect } from 'react';
import {
  Paintbrush,
  Check,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Palette,
  Type,
  MessageCircle,
  Loader2,
  Save,
  Sparkles,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Config ─── */
const THEMES = [
  { id: 'emerald', label: 'Emerald', primary: '#10b981', bg: 'bg-emerald-500' },
  { id: 'blue', label: 'Ocean', primary: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'violet', label: 'Violet', primary: '#8b5cf6', bg: 'bg-violet-500' },
  { id: 'rose', label: 'Rose', primary: '#f43f5e', bg: 'bg-rose-500' },
  { id: 'amber', label: 'Amber', primary: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'teal', label: 'Teal', primary: '#14b8a6', bg: 'bg-teal-500' },
];

const POSITIONS = [
  { id: 'right', label: 'Bottom Right' },
  { id: 'left', label: 'Bottom Left' },
];

const TONES = [
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', desc: 'Formal and concise' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed and fun' },
];

export default function AppearancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('emerald');
  const [position, setPosition] = useState('right');
  const [widgetMode, setWidgetMode] = useState<'light' | 'dark'>('light');
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');
  const [greeting, setGreeting] = useState('Hi there! How can I help you today?');
  const [botName, setBotName] = useState(process.env.NEXT_PUBLIC_APP_NAME || 'ShopChat');
  const [tone, setTone] = useState('friendly');
  const [useEmojis, setUseEmojis] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [starterButtons, setStarterButtons] = useState<string[]>([]);
  const [newStarter, setNewStarter] = useState('');

  // Load existing config
  useEffect(() => {
    fetch('/api/appearance')
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          setBotName(data.config.botName ?? process.env.NEXT_PUBLIC_APP_NAME ?? 'ShopChat');
          setTone(data.config.tone ?? 'friendly');
          setUseEmojis(data.config.useEmojis ?? false);
          setCustomInstructions(data.config.customInstructions ?? '');
          const wc = data.config.widgetConfig ?? {};
          setSelectedTheme(wc.theme ?? 'emerald');
          setWidgetMode(wc.mode ?? 'light');
          setPosition(wc.position ?? 'right');
          setGreeting(wc.greeting ?? 'Hi there! How can I help you today?');
          setStarterButtons(wc.starterButtons ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName,
          tone,
          useEmojis,
          customInstructions: customInstructions || null,
          widgetConfig: {
            theme: selectedTheme,
            themeColor: THEMES.find((t) => t.id === selectedTheme)?.primary ?? '#10b981',
            mode: widgetMode,
            position,
            greeting,
            starterButtons: starterButtons.filter(Boolean),
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  const currentColor = THEMES.find((t) => t.id === selectedTheme)?.primary ?? '#10b981';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">AI Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how the chatbot looks and behaves on your store
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ─ Settings panel ─ */}
        <div className="lg:col-span-3 space-y-5">
          {/* Color theme */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Palette className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Color Theme</h3>
                <p className="text-xs text-muted-foreground">Choose your brand accent color</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                    selectedTheme === theme.id
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-[var(--glass-border)] hover:border-primary/30 hover:bg-accent/30',
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full', theme.bg)} />
                  <span className="text-[11px] font-medium text-foreground">{theme.label}</span>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Widget mode */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <Sun className="w-4.5 h-4.5 text-chart-2" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Widget Mode</h3>
                <p className="text-xs text-muted-foreground">Light or dark appearance for the chat window</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setWidgetMode(mode)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border transition-all',
                    widgetMode === mode
                      ? 'border-primary bg-primary/5'
                      : 'border-[var(--glass-border)] hover:border-primary/30',
                  )}
                >
                  {mode === 'light' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-sm font-medium text-foreground capitalize">{mode} Mode</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bot personality */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-chart-3" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Bot Personality</h3>
                <p className="text-xs text-muted-foreground">Configure how the AI responds to customers</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Conversation Tone
              </label>
              <div className="grid grid-cols-3 gap-3">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      tone === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-[var(--glass-border)] hover:border-primary/30',
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/20 border border-[var(--glass-border)]">
              <div>
                <p className="text-sm font-medium text-foreground">Use Emojis</p>
                <p className="text-xs text-muted-foreground">Allow the bot to use emojis in responses</p>
              </div>
              <button
                onClick={() => setUseEmojis(!useEmojis)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  useEmojis ? 'bg-primary' : 'bg-accent',
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform',
                    useEmojis ? 'translate-x-6' : 'translate-x-1',
                  )}
                />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Custom Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={3}
                placeholder="E.g., Always mention our loyalty program. Never discuss competitor products."
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
            </div>
          </div>

          {/* Content & Position */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <Type className="w-4.5 h-4.5 text-chart-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Content & Position</h3>
                <p className="text-xs text-muted-foreground">Customize the widget text and placement</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bot Name</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                maxLength={30}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Greeting Message
              </label>
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={2}
                maxLength={120}
                className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">{greeting.length}/120 characters</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Widget Position</label>
              <div className="grid grid-cols-2 gap-3">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id)}
                    className={cn(
                      'p-3 rounded-xl border text-sm font-medium transition-all text-center',
                      position === pos.id
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-[var(--glass-border)] text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Starter buttons */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-chart-5/10 flex items-center justify-center">
                <MessageCircle className="w-4.5 h-4.5 text-chart-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Starter Buttons</h3>
                <p className="text-xs text-muted-foreground">
                  Quick-start questions shown when the chat opens (max 4). Leave empty for auto-generated contextual questions.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {starterButtons.map((btn, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={btn}
                    onChange={(e) => {
                      const updated = [...starterButtons];
                      updated[i] = e.target.value;
                      setStarterButtons(updated);
                    }}
                    className="flex-1 glass-input rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder={`Starter question ${i + 1}`}
                  />
                  <button
                    onClick={() => setStarterButtons(starterButtons.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                    aria-label="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>

            {starterButtons.length < 4 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newStarter}
                  onChange={(e) => setNewStarter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newStarter.trim()) {
                      setStarterButtons([...starterButtons, newStarter.trim()]);
                      setNewStarter('');
                    }
                  }}
                  className="flex-1 glass-input rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder="Add a starter question..."
                />
                <button
                  onClick={() => {
                    if (newStarter.trim()) {
                      setStarterButtons([...starterButtons, newStarter.trim()]);
                      setNewStarter('');
                    }
                  }}
                  disabled={!newStarter.trim()}
                  className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Appearance
              </>
            )}
          </button>
        </div>

        {/* ─ Preview panel ─ */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-accent/50">
                <button
                  onClick={() => setPreview('desktop')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    preview === 'desktop' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreview('mobile')}
                  className={cn(
                    'p-1.5 rounded-md transition-all',
                    preview === 'mobile' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div
              className={cn(
                'rounded-2xl border border-[var(--glass-border)] overflow-hidden mx-auto transition-all',
                preview === 'mobile' ? 'w-[200px]' : 'w-full',
                widgetMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-50',
              )}
            >
              <div className={cn('p-3 relative', preview === 'mobile' ? 'h-[420px]' : 'h-[380px]')}>
                {/* Fake store content */}
                <div className={cn('rounded-lg p-3 mb-2', widgetMode === 'dark' ? 'bg-zinc-800' : 'bg-white')}>
                  <div className={cn('h-2 w-20 rounded', widgetMode === 'dark' ? 'bg-zinc-700' : 'bg-gray-200')} />
                  <div className={cn('h-2 w-32 rounded mt-2', widgetMode === 'dark' ? 'bg-zinc-700' : 'bg-gray-200')} />
                </div>
                <div className={cn('rounded-lg p-3', widgetMode === 'dark' ? 'bg-zinc-800' : 'bg-white')}>
                  <div className={cn('h-16 rounded', widgetMode === 'dark' ? 'bg-zinc-700' : 'bg-gray-100')} />
                </div>

                {/* Chat widget preview */}
                <div className={cn('absolute bottom-3', position === 'right' ? 'right-3' : 'left-3')}>
                  <div
                    className={cn(
                      'mb-2 rounded-2xl p-3 w-48 shadow-lg',
                      widgetMode === 'dark'
                        ? 'bg-zinc-800 border border-zinc-700'
                        : 'bg-white border border-gray-200',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: currentColor }}
                      >
                        {botName[0]}
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-semibold',
                          widgetMode === 'dark' ? 'text-white' : 'text-gray-900',
                        )}
                      >
                        {botName}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-[10px] leading-relaxed',
                        widgetMode === 'dark' ? 'text-zinc-300' : 'text-gray-600',
                      )}
                    >
                      {greeting.slice(0, 60)}
                      {greeting.length > 60 ? '...' : ''}
                    </p>
                    <div
                      className={cn(
                        'mt-2 rounded-lg px-2 py-1.5 text-[10px] flex items-center gap-1',
                        widgetMode === 'dark' ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      <MessageCircle className="w-2.5 h-2.5" />
                      Type a message...
                    </div>
                  </div>

                  <div
                    className={cn(
                      'w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white',
                      position === 'right' ? 'ml-auto' : '',
                    )}
                    style={{ backgroundColor: currentColor }}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Config summary */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Theme</span>
                <span className="font-medium text-foreground capitalize">{selectedTheme}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-medium text-foreground capitalize">{widgetMode}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tone</span>
                <span className="font-medium text-foreground capitalize">{tone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium text-foreground capitalize">{position}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Emojis</span>
                <span className="font-medium text-foreground">{useEmojis ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
