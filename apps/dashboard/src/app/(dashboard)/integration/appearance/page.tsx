'use client';

import { useState } from 'react';
import { Paintbrush, Check, Monitor, Smartphone, Sun, Moon, Palette, Type, MessageCircle, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function AppearancePage() {
  const [selectedTheme, setSelectedTheme] = useState('emerald');
  const [position, setPosition] = useState('right');
  const [widgetMode, setWidgetMode] = useState<'light' | 'dark'>('light');
  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop');
  const [greeting, setGreeting] = useState('Hi there! How can I help you today?');
  const [botName, setBotName] = useState('ShopChat');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentColor = THEMES.find((t) => t.id === selectedTheme)?.primary ?? '#10b981';

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Widget Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize how the chatbot looks on your store</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Settings panel */}
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
                  {mode === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-400" />}
                  <span className="text-sm font-medium text-foreground capitalize">{mode} Mode</span>
                </button>
              ))}
            </div>
          </div>

          {/* Position and text */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-chart-3/10 flex items-center justify-center">
                <Type className="w-4.5 h-4.5 text-chart-3" />
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Greeting Message</label>
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

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Appearance'}
          </button>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          <div className="glass-card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Preview</h3>
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

            {/* Mock preview */}
            <div className={cn(
              'rounded-2xl border border-[var(--glass-border)] overflow-hidden mx-auto transition-all',
              preview === 'mobile' ? 'w-[200px]' : 'w-full',
              widgetMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-50',
            )}>
              <div className={cn('p-3 h-[360px] relative', preview === 'mobile' ? 'h-[400px]' : '')}>
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
                  {/* Chat bubble */}
                  <div className={cn(
                    'mb-2 rounded-2xl p-3 w-48 shadow-lg',
                    widgetMode === 'dark' ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200',
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: currentColor }}>
                        {botName[0]}
                      </div>
                      <span className={cn('text-[11px] font-semibold', widgetMode === 'dark' ? 'text-white' : 'text-gray-900')}>
                        {botName}
                      </span>
                    </div>
                    <p className={cn('text-[10px] leading-relaxed', widgetMode === 'dark' ? 'text-zinc-300' : 'text-gray-600')}>
                      {greeting.slice(0, 60)}{greeting.length > 60 ? '...' : ''}
                    </p>
                    <div className={cn(
                      'mt-2 rounded-lg px-2 py-1.5 text-[10px] flex items-center gap-1',
                      widgetMode === 'dark' ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-100 text-gray-400',
                    )}>
                      <MessageCircle className="w-2.5 h-2.5" />
                      Type a message...
                    </div>
                  </div>

                  {/* FAB */}
                  <div className={cn('w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white', position === 'right' ? 'ml-auto' : '')} style={{ backgroundColor: currentColor }}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
