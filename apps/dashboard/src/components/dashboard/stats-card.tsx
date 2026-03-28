import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: boolean;
}

export function StatsCard({ label, value, icon: Icon, trend, accent }: StatsCardProps) {
  const isPositive = (trend?.value ?? 0) >= 0;
  return (
    <div className={cn(
      'rounded-xl border p-5 flex flex-col gap-3',
      accent
        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white'
        : 'bg-white border-zinc-200',
    )}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-medium', accent ? 'text-emerald-100' : 'text-zinc-500')}>
          {label}
        </span>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          accent ? 'bg-white/20' : 'bg-zinc-100',
        )}>
          <Icon className={cn('w-4 h-4', accent ? 'text-white' : 'text-zinc-600')} />
        </div>
      </div>
      <p className={cn('text-2xl font-bold', accent ? 'text-white' : 'text-zinc-900')}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {trend && (
        <p className={cn(
          'text-xs',
          accent ? 'text-emerald-100' : isPositive ? 'text-emerald-600' : 'text-red-500',
        )}>
          {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}