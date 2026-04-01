'use client';

import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Zap,
  Target,
  ArrowUpRight,
  ArrowRight,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const INSIGHTS = [
  {
    type: 'opportunity',
    title: 'High-intent customers dropping off at checkout',
    description: 'Analysis of 89 conversations shows customers asking about product sizing before checkout but not completing the purchase. Consider adding a size guide recommendation.',
    impact: 'high',
    metric: '+$2,400/mo estimated revenue',
    icon: Target,
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  {
    type: 'warning',
    title: 'Shipping FAQ response accuracy declining',
    description: 'Bot responses about international shipping have a 23% correction rate this week, up from 8%. This suggests your shipping policy page may have recently changed.',
    impact: 'medium',
    metric: '23% correction rate',
    icon: AlertTriangle,
    color: 'text-amber-500 bg-amber-500/10',
  },
  {
    type: 'success',
    title: 'Product recommendation engine performing well',
    description: 'Bot-suggested products have a 34% add-to-cart rate, significantly above the 12% store average. Customers respond well to personalized suggestions.',
    impact: 'high',
    metric: '34% add-to-cart rate',
    icon: CheckCircle2,
    color: 'text-primary bg-primary/10',
  },
  {
    type: 'opportunity',
    title: 'After-hours support gap identified',
    description: '42% of escalations happen between 10PM-6AM when no human agents are available. Consider expanding bot capabilities for common after-hours queries.',
    impact: 'medium',
    metric: '42% of escalations',
    icon: Lightbulb,
    color: 'text-chart-2 bg-chart-2/10',
  },
];

const SENTIMENT_DATA = {
  positive: 68,
  neutral: 22,
  negative: 10,
};

const TOPIC_CLUSTERS = [
  { topic: 'Product Information', count: 342, sentiment: 'positive', pct: 85 },
  { topic: 'Order Tracking', count: 198, sentiment: 'positive', pct: 72 },
  { topic: 'Shipping Queries', count: 156, sentiment: 'neutral', pct: 58 },
  { topic: 'Returns & Refunds', count: 134, sentiment: 'negative', pct: 45 },
  { topic: 'Account Issues', count: 89, sentiment: 'neutral', pct: 62 },
];

export default function AIInsightsPage() {
  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">AI Insights</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Intelligent analysis of your chatbot&apos;s performance and opportunities</p>
      </div>

      {/* Key AI metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'AI Accuracy', value: '94.2%', trend: 2, icon: Brain, color: 'text-primary bg-primary/10' },
          { label: 'Intent Recognition', value: '91%', trend: 4, icon: Target, color: 'text-chart-2 bg-chart-2/10' },
          { label: 'Satisfaction Score', value: '4.6/5', trend: 0.3, icon: ThumbsUp, color: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Escalation Rate', value: '6.8%', trend: -2, icon: Zap, color: 'text-chart-4 bg-chart-4/10' },
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
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-500">+{metric.trend}%</span>
              <span className="text-xs text-muted-foreground">improvement</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI-generated insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">AI-Generated Insights</h3>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          {INSIGHTS.map((insight, i) => (
            <div key={i} className="glass-card p-5 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', insight.color)}>
                  <insight.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase',
                      insight.impact === 'high' ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground',
                    )}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{insight.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
                <span className="text-xs font-semibold text-primary">{insight.metric}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Sentiment analysis */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Sentiment Analysis</h3>
          <p className="text-xs text-muted-foreground mb-5">Overall customer sentiment in conversations</p>

          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-accent/30" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="4" strokeDasharray={`${SENTIMENT_DATA.positive} ${100 - SENTIMENT_DATA.positive}`} strokeLinecap="round" className="text-emerald-500" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="4" strokeDasharray={`${SENTIMENT_DATA.neutral} ${100 - SENTIMENT_DATA.neutral}`} strokeDashoffset={`-${SENTIMENT_DATA.positive}`} strokeLinecap="round" className="text-chart-4" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="4" strokeDasharray={`${SENTIMENT_DATA.negative} ${100 - SENTIMENT_DATA.negative}`} strokeDashoffset={`-${SENTIMENT_DATA.positive + SENTIMENT_DATA.neutral}`} strokeLinecap="round" className="text-red-400" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-bold text-foreground">{SENTIMENT_DATA.positive}%</p>
                <p className="text-[10px] text-muted-foreground">Positive</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Positive', value: SENTIMENT_DATA.positive, color: 'bg-emerald-500', icon: ThumbsUp },
              { label: 'Neutral', value: SENTIMENT_DATA.neutral, color: 'bg-chart-4', icon: MessageSquare },
              { label: 'Negative', value: SENTIMENT_DATA.negative, color: 'bg-red-400', icon: ThumbsDown },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-2 rounded-lg">
                <div className={cn('w-3 h-3 rounded-full', s.color)} />
                <span className="text-xs text-foreground font-medium flex-1">{s.label}</span>
                <span className="text-xs font-bold text-foreground">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic clusters */}
        <div className="lg:col-span-3 glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Topic Clusters</h3>
          <p className="text-xs text-muted-foreground mb-5">Most discussed topics and their satisfaction rates</p>
          <div className="space-y-4">
            {TOPIC_CLUSTERS.map((topic) => (
              <div key={topic.topic}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{topic.topic}</span>
                    <span className="text-[10px] text-muted-foreground">{topic.count} conversations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'text-xs font-semibold',
                      topic.pct >= 70 ? 'text-emerald-500' : topic.pct >= 50 ? 'text-chart-4' : 'text-red-400',
                    )}>
                      {topic.pct}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">satisfaction</span>
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full bg-accent/30 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      topic.pct >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                      topic.pct >= 50 ? 'bg-gradient-to-r from-chart-4 to-chart-4/60' :
                      'bg-gradient-to-r from-red-400 to-red-400/60',
                    )}
                    style={{ width: `${topic.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
