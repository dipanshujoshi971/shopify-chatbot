'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

const titles: Record<string, string> = {
  '/overview':      'Overview',
  '/conversations': 'Conversations',
  '/agent':         'Agent Configuration',
  '/widget':        'Widget Setup',
  '/settings':      'Settings',
};

export function Header() {
  const pathname = usePathname();
  const base     = '/' + (pathname.split('/')[1] ?? '');
  const title    = titles[base] ?? 'Dashboard';

  return (
    <header className="h-14 border-b border-zinc-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors">
        <Bell className="w-4 h-4" />
      </button>
    </header>
  );
}