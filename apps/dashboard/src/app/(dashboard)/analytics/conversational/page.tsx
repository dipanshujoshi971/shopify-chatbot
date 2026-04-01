'use client';

import {
  MessageSquareText,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BarChart3,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAILY_DATA = [
  { day: 'Mon', conversations: 42, messages: 186, resolved: 38 },
  { day: 'Tue', conversations: 58, messages: 243, resolved: 51 },
  { day: 'Wed', conversations: 35, messages: 155, resolved: 32 },
  { day: 'Thu', conversations: 67, messages: 298, resolved: 60 },
  { day: 'Fri', conversations: 51, messages: 220, resolved: 45 },
  { day: 'Sat', conversations: 29, messages: 125, resolved: 26 },
  { day: 'Sun', conversations: 23, messages: 98, resolved: 20 },
];

const maxConv = Math.max(...DAILY_DATA.map((d) => d.conversations));

const TOP_QUESTIONS = [
  { question: 'Where is my order?', count: 156, pct: 28 },
  { question: 'What is your return policy?', count: 98, pct: 17 },
  { question: 'Do you offer free shipping?', count: 87, pct: 15 },
  { question: 'Product availability check', count: 72, pct: 13 },
  { question: 'Price comparison request', count: 64, pct: 11 },
];

export default function ConversationalAnalyticsPage() {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Conversational Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Understand how your chatbot interacts with customers</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Conversations', value: '305', trend: 12, icon: MessageSquare, color: 'text-primary bg-primary/10' },
          { label: 'Avg Messages/Conv', value: '4.2', trend: -3, icon: MessageSquareText, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'Resolution Rate', value: '89%', trend: 5, icon: Bot, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Avg Response Time', value: '1.2s', trend: -8, icon: Clock, color: 'text-chart-4 bg-chart-4/10' },
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
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Daily conversations chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Daily Conversations</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">Conversations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                <span className="text-muted-foreground">Resolved</span>
              </div>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-3 h-48">
            {DAILY_DATA.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1 flex-1 justify-end">
                  <span className="text-[10px] text-foreground font-semibold">{d.conversations}</span>
                  <div className="w-full flex flex-col gap-0.5">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/70 transition-all duration-500"
                      style={{ height: `${(d.conversations / maxConv) * 140}px` }}
                    />
                    <div
                      className="w-full rounded-b-lg bg-primary/20"
                      style={{ height: `${(d.resolved / maxConv) * 140 * 0.3}px` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top questions */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Questions</h3>
          <p className="text-xs text-muted-foreground mb-5">Most frequently asked by customers</p>
          <div className="space-y-4">
            {TOP_QUESTIONS.map((q, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-foreground font-medium truncate max-w-[75%]">{q.question}</span>
                  <span className="text-xs text-muted-foreground">{q.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-accent/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                    style={{ width: `${q.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation flow */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Conversation Flow</h3>
        <p className="text-xs text-muted-foreground mb-5">How conversations progress through your bot</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Initiated', value: 305, pct: 100, color: 'bg-primary' },
            { label: 'Engaged (2+ msgs)', value: 267, pct: 87, color: 'bg-chart-2' },
            { label: 'Product Found', value: 198, pct: 65, color: 'bg-chart-4' },
            { label: 'Added to Cart', value: 89, pct: 29, color: 'bg-chart-5' },
            { label: 'Converted', value: 42, pct: 14, color: 'bg-emerald-500' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="relative w-full aspect-square max-w-[100px] mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent/50" />
                  <circle
                    cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                    strokeDasharray={`${step.pct} ${100 - step.pct}`}
                    strokeLinecap="round"
                    className={step.color}
                    style={{ stroke: 'currentColor' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-foreground">{step.pct}%</span>
                </div>
              </div>
              <p className="text-xs font-medium text-foreground">{step.label}</p>
              <p className="text-[11px] text-muted-foreground">{step.value} users</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
