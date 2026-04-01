'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RotateCcw, Settings2, Loader2, Lightbulb, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SAMPLE_PROMPTS = [
  'What products do you have in stock?',
  'Can you help me track my order?',
  'Do you offer free shipping?',
  'What is your return policy?',
];

const TONE_OPTIONS = ['friendly', 'professional', 'casual'] as const;

export default function AIPlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<typeof TONE_OPTIONS[number]>('friendly');
  const [showSettings, setShowSettings] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content?: string) {
    const text = content ?? input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getSimulatedResponse(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 1200);
  }

  function getSimulatedResponse(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('product') || q.includes('stock'))
      return "We have a great selection of products available! I can help you browse our catalog by category. What type of product are you looking for today?";
    if (q.includes('order') || q.includes('track'))
      return "I'd be happy to help you track your order! Could you please provide your order number? It usually starts with #SC followed by digits.";
    if (q.includes('shipping'))
      return "Yes! We offer free shipping on orders over $50. Standard delivery takes 3-5 business days, and express shipping is available for $9.99 with 1-2 day delivery.";
    if (q.includes('return'))
      return "Our return policy allows returns within 30 days of purchase. Items must be unused and in original packaging. We provide free return shipping labels for all orders.";
    return "Thank you for your question! I'm here to help with product information, order tracking, shipping details, and more. What specific information can I assist you with today?";
  }

  function resetChat() {
    setMessages([]);
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Playground</h2>
          <p className="text-sm text-muted-foreground mt-1">Test and fine-tune your chatbot responses in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              showSettings
                ? 'bg-primary/10 text-primary'
                : 'glass-card text-muted-foreground hover:text-foreground',
            )}
          >
            <Settings2 className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Settings panel */}
        {showSettings && (
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Bot Tone</h3>
              <div className="space-y-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      'w-full p-2.5 rounded-xl text-sm font-medium text-left transition-all capitalize',
                      tone === t
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-muted-foreground hover:bg-accent/30 border border-transparent',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Custom Instructions</h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={4}
                placeholder="Add any special instructions for the AI..."
                className="w-full glass-input rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Model Info</h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-medium text-foreground">Anthropic</span>
                </div>
                <div className="flex justify-between">
                  <span>Model</span>
                  <span className="font-medium text-foreground">Claude</span>
                </div>
                <div className="flex justify-between">
                  <span>Tone</span>
                  <span className="font-medium text-foreground capitalize">{tone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div className={cn('glass-card flex flex-col overflow-hidden', showSettings ? 'lg:col-span-3' : 'lg:col-span-4')}>
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-[var(--glass-border)] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <Bot className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">ShopChat AI</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-muted-foreground">Playground Mode</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[500px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-base font-semibold text-foreground mb-2">Test Your Chatbot</h4>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Send a message to see how your AI assistant will respond to customers
                </p>
                <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                  {SAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="p-3 rounded-xl border border-[var(--glass-border)] hover:border-primary/30 hover:bg-accent/30 text-left transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'user' ? 'flex-row-reverse' : '',
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                      msg.role === 'user'
                        ? 'bg-primary/10'
                        : 'bg-gradient-to-br from-primary to-emerald-600',
                    )}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-3',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-md'
                        : 'glass rounded-tl-md',
                    )}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        'text-[10px] mt-1.5',
                        msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground',
                      )}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="glass rounded-2xl rounded-tl-md px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message to test your chatbot..."
                className="flex-1 glass-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
