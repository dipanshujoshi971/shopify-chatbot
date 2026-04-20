'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Loader2,
  Lightbulb,
  Zap,
  Upload,
  FileText,
  Trash2,
  Check,
  X,
  BookOpen,
  AlertTriangle,
  Clock,
  Layers,
  Save,
  Database,
  Pencil,
  RefreshCw,
  MessageSquare,
  Globe,
  Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════ */

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  timestamp: Date;
}

interface KnowledgeSource {
  id: string;
  title: string;
  file_name: string;
  r2_key: string;
  status: 'processing' | 'ready' | 'failed';
  chunk_count: number;
  created_at: string;
}

interface AgentConfig {
  botName: string;
  tone: string;
  language: string;
  customInstructions: string;
  useEmojis: boolean;
  fallbackMessage: string;
}

/* ═══════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════ */

const DEFAULT_CONFIG: AgentConfig = {
  botName: 'Assistant',
  tone: 'friendly',
  language: 'English',
  customInstructions: '',
  useEmojis: false,
  fallbackMessage: 'Sorry, I could not understand. Please contact our support.',
};

const TONE_OPTIONS = [
  { id: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { id: 'professional', label: 'Professional', desc: 'Formal and concise' },
  { id: 'casual', label: 'Casual', desc: 'Relaxed and fun' },
  { id: 'formal', label: 'Formal', desc: 'Structured and polished' },
];

const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic'];

const TEMPLATES = [
  {
    label: 'General Store',
    emoji: '🛍️',
    value:
      'You are a helpful shopping assistant for {store_name}. Help customers find products, answer questions about orders, shipping, and returns. Always be polite and concise. If you cannot answer, say "Let me connect you with our support team."',
  },
  {
    label: 'Fashion Store',
    emoji: '👗',
    value:
      'You are a friendly fashion assistant for {store_name}. Help customers find the right clothing, suggest outfit combinations, and answer questions about sizing, shipping, and returns. Be enthusiastic and style-forward.',
  },
  {
    label: 'Electronics Store',
    emoji: '💻',
    value:
      'You are a knowledgeable tech assistant for {store_name}. Help customers with product specs, compatibility questions, and troubleshooting. Always recommend the best product for their specific needs.',
  },
  {
    label: 'Beauty & Skincare',
    emoji: '💄',
    value:
      'You are a beauty advisor for {store_name}. Help customers find the right skincare and beauty products. Ask about skin type, concerns, and preferences to give personalized recommendations.',
  },
];

const SAMPLE_PROMPTS = [
  'What products do you have?',
  'Track my order',
  'Free shipping?',
  'Return policy?',
];

const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* ═══════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════ */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fileExtension(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

/* ═══════════════════════════════════════════════════
   Status Badge
   ═══════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: KnowledgeSource['status'] }) {
  const config = {
    processing: {
      label: 'Processing',
      classes: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    ready: {
      label: 'Ready',
      classes: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
      icon: <Check className="w-3 h-3" />,
    },
    failed: {
      label: 'Failed',
      classes: 'bg-red-500/15 text-red-500 border-red-500/20',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  }[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border', config.classes)}>
      {config.icon}
      {config.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   Delete Dialog
   ═══════════════════════════════════════════════════ */

function DeleteDialog({
  source,
  onConfirm,
  onCancel,
  deleting,
}: {
  source: KnowledgeSource;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Delete Knowledge Source</h3>
            <p className="text-xs text-muted-foreground">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete <span className="font-medium text-foreground">{source.file_name}</span>?
          This will remove the file and all {source.chunk_count} generated chunks.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl border border-[var(--glass-border)] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Knowledge Base Section
   ═══════════════════════════════════════════════════ */

function KnowledgeSection({ notify }: { notify: (type: 'success' | 'error', msg: string) => void }) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeSource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      setSources(data.sources ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchSources().finally(() => setLoading(false));
  }, [fetchSources]);

  useEffect(() => {
    const hasProcessing = sources.some((s) => s.status === 'processing');
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(fetchSources, 3000);
    } else if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [sources, fetchSources]);

  function validateFile(file: File): string | null {
    const ext = fileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `Unsupported type (.${ext}). Use .pdf, .txt, .md, .docx`;
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.endsWith('.md')) return 'Unsupported file type.';
    if (file.size > MAX_FILE_SIZE) return `File too large (${formatBytes(file.size)}). Max 10 MB.`;
    return null;
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) { setFileError(error); setSelectedFile(null); return; }
    setFileError(null);
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setFileError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('/api/knowledge', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(data.message ?? data.error ?? 'Upload failed');
      }
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      notify('success', `"${selectedFile.name}" uploaded. Processing will begin shortly.`);
      await fetchSources();
    } catch (err) {
      notify('error', (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/knowledge/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete');
      notify('success', `"${deleteTarget.file_name}" deleted.`);
      setDeleteTarget(null);
      await fetchSources();
    } catch {
      notify('error', 'Failed to delete knowledge source.');
    } finally {
      setDeleting(false);
    }
  }

  const readyCount = sources.filter((s) => s.status === 'ready').length;
  const busyCount = sources.filter((s) => s.status === 'processing').length;

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-primary" />
          Knowledge Base
        </h3>
        {sources.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-bold text-emerald-500">{readyCount}</span> ready
            {busyCount > 0 && (
              <>
                <span className="text-muted-foreground/30 mx-0.5">·</span>
                <span className="font-bold text-amber-500">{busyCount}</span> processing
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground -mt-2">
        Upload docs the bot can reference — for info not in your Shopify store
      </p>

      {/* Hint */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2.5 items-start">
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          <span className="font-semibold">Use this for size guides, warranty docs, brand guidelines, or anything your Shopify store pages don&apos;t cover.</span>
          {' '}Products, policies and orders are handled automatically.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all py-7 px-4 flex flex-col items-center justify-center gap-2',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : selectedFile
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-[var(--glass-border)] hover:border-primary/40 hover:bg-accent/20',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
              dragOver ? 'bg-primary/10' : 'bg-accent/40 border border-[var(--glass-border)]',
            )}>
              <Upload className={cn('w-5 h-5 transition-colors', dragOver ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {dragOver ? 'Drop to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">PDF, TXT, Markdown, DOCX — up to 10 MB</p>
            </div>
            <div className="flex gap-1.5 mt-0.5">
              {['PDF', 'DOCX', 'TXT', 'MD'].map((t) => (
                <span key={t} className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[var(--glass-border)] text-muted-foreground bg-accent/30">{t}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {fileError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5 -mt-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          {fileError}
        </p>
      )}

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 -mt-2"
        >
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload &amp; Process</>}
        </button>
      )}

      {/* Document list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : sources.length > 0 ? (
        <div className="space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all group',
                source.status === 'failed'
                  ? 'bg-red-500/5 border-red-500/20'
                  : source.status === 'ready'
                    ? 'glass border-[var(--glass-border)] hover:border-primary/20'
                    : 'glass border-[var(--glass-border)] opacity-80',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                source.status === 'ready' ? 'bg-emerald-500/10' :
                source.status === 'processing' ? 'bg-amber-500/10' : 'bg-red-500/10',
              )}>
                <FileText className={cn(
                  'w-4.5 h-4.5',
                  source.status === 'ready' ? 'text-emerald-500' :
                  source.status === 'processing' ? 'text-amber-500' : 'text-red-500',
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{source.file_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(source.created_at)}
                  </span>
                  {source.chunk_count > 0 && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {source.chunk_count} chunks
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={source.status} />
                <button
                  onClick={() => setDeleteTarget(source)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-xs">No documents uploaded yet</p>
        </div>
      )}

      {deleteTarget && (
        <DeleteDialog
          source={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Chat Message
   ═══════════════════════════════════════════════════ */

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="rounded-2xl rounded-tr-md px-4 py-2.5 text-sm text-primary-foreground max-w-[80%] leading-relaxed bg-primary shadow-sm">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.role === 'error') {
    return (
      <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-xs flex-shrink-0 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-red-500 max-w-[80%] leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }

  // Assistant
  let reply = msg.content;
  let products: { title: string; price: string }[] = [];
  try {
    const parsed = JSON.parse(msg.content);
    if (parsed?.reply) reply = parsed.reply;
    if (parsed?.products) products = parsed.products;
  } catch { /* not JSON, use raw */ }

  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className="glass rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {reply}
        </div>
        {products.length > 0 && products.slice(0, 2).map((p, i) => (
          <div key={i} className="glass rounded-xl px-3 py-2.5">
            <p className="text-xs font-semibold text-foreground">{p.title}</p>
            <p className="text-xs font-bold text-primary mt-0.5">{p.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════ */

export default function AIPlaygroundPage() {
  /* ── Agent config state ── */
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Chat state ── */
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  /* ── UI ── */
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Notification helper ── */
  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  /* ── Load agent config ── */
  useEffect(() => {
    fetch('/api/agent')
      .then((r) => r.json())
      .then((data) => {
        const c = data.config;
        if (c) {
          setConfig({
            botName: c.botName ?? DEFAULT_CONFIG.botName,
            tone: c.tone ?? DEFAULT_CONFIG.tone,
            language: c.language ?? DEFAULT_CONFIG.language,
            customInstructions: c.customInstructions ?? '',
            useEmojis: c.useEmojis ?? false,
            fallbackMessage: c.fallbackMessage ?? DEFAULT_CONFIG.fallbackMessage,
          });
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  /* ── Auto-scroll chat ── */
  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages, isTyping]);

  /* ── Config update helper ── */
  const updateConfig = (key: keyof AgentConfig, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Template apply ── */
  const applyTemplate = (tmpl: typeof TEMPLATES[number]) => {
    updateConfig('customInstructions', tmpl.value);
  };

  /* ── Reset to defaults ── */
  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    notify('success', 'Settings reset to defaults');
  };

  /* ── Save agent config ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName: config.botName,
          tone: config.tone,
          customInstructions: config.customInstructions || null,
          useEmojis: config.useEmojis,
        }),
      });
      if (res.ok) notify('success', 'Agent settings saved!');
      else notify('error', 'Failed to save settings.');
    } catch {
      notify('error', 'Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Send test message ── */
  const handleSend = async (content?: string) => {
    const text = content ?? input.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-20)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: 'playground-preview',
          previewConfig: config,
          history,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok && !data?.output) throw new Error(data?.error ?? 'Chat request failed');

      const reply = data?.output ?? data?.reply ?? '';
      const products = data?.products ?? [];

      const assistantContent = products.length > 0
        ? JSON.stringify({ reply, products: products.map((p: any) => ({ title: p.title, price: p.priceRange?.minVariantPrice?.amount ? `${p.priceRange.minVariantPrice.amount} ${p.priceRange.minVariantPrice.currencyCode ?? ''}` : '' })) })
        : reply;

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'error',
        content: (err as Error).message || 'Could not reach the bot.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const welcomeMsg = `Hi! 👋 I'm ${config.botName || 'your assistant'}. How can I help you today?`;

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Toast */}
      {notification && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white',
          notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500',
        )}>
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">AI Agent Playground</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your AI agent and test responses in real time</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">

        {/* ─────────── LEFT: Agent Settings ─────────── */}
        <div className="glass-card p-6 space-y-6">

          {/* Section header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)]">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
              Agent Settings
            </h3>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary border border-[var(--glass-border)] hover:border-primary/30 px-3 py-1.5 rounded-lg transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Reset defaults
            </button>
          </div>

          {/* Bot Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bot Identity</h3>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground">Bot Name</label>
              <input
                type="text"
                value={config.botName}
                onChange={(e) => updateConfig('botName', e.target.value)}
                placeholder="e.g. Aria, Max, Support Bot"
                className="w-full p-3 glass-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">Tone</label>
                <select
                  value={config.tone}
                  onChange={(e) => updateConfig('tone', e.target.value)}
                  className="w-full p-3 glass-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition bg-transparent"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-foreground">Language</label>
                <select
                  value={config.language}
                  onChange={(e) => updateConfig('language', e.target.value)}
                  className="w-full p-3 glass-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition bg-transparent"
                >
                  {LANGUAGE_OPTIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => updateConfig('useEmojis', !config.useEmojis)}
                className={cn(
                  'relative w-10 h-6 rounded-full transition-colors cursor-pointer',
                  config.useEmojis ? 'bg-primary' : 'bg-accent',
                )}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  config.useEmojis ? 'translate-x-5' : 'translate-x-1',
                )} />
              </div>
              <div>
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                  Use Emojis
                </span>
                <p className="text-xs text-muted-foreground">Allow the bot to use emojis in responses</p>
              </div>
            </label>
          </div>

          <div className="border-t border-[var(--glass-border)]" />

          {/* System Prompt / Custom Instructions */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">System Prompt</h3>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => applyTemplate(t)}
                    className="p-2.5 rounded-xl border border-[var(--glass-border)] hover:border-primary/30 hover:bg-accent/30 text-left transition-all group"
                  >
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                      {t.emoji} {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground">Custom Instructions</label>
              <p className="text-xs text-muted-foreground">Defines how your bot behaves. Use {'{store_name}'} as a placeholder.</p>
              <textarea
                rows={6}
                value={config.customInstructions}
                onChange={(e) => updateConfig('customInstructions', e.target.value)}
                placeholder="You are a helpful assistant for our store..."
                className="w-full p-3 glass-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none leading-relaxed"
              />
              <p className="text-xs text-muted-foreground text-right">{config.customInstructions.length} characters</p>
            </div>
          </div>

          <div className="border-t border-[var(--glass-border)]" />

          {/* Fallback */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fallback</h3>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-foreground">Fallback Message</label>
              <p className="text-xs text-muted-foreground">Shown when the bot cannot answer a question.</p>
              <input
                type="text"
                value={config.fallbackMessage}
                onChange={(e) => updateConfig('fallbackMessage', e.target.value)}
                placeholder="Sorry, I could not understand..."
                className="w-full p-3 glass-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>

          <div className="border-t border-[var(--glass-border)]" />

          {/* Knowledge Base */}
          <KnowledgeSection notify={notify} />

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <><Save className="w-4 h-4" /> Save Agent Settings</>}
          </button>
        </div>

        {/* ─────────── RIGHT: Live Preview ─────────── */}
        <div className="glass-card p-6 lg:sticky lg:top-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--glass-border)]">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
              Live Preview
            </h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-500">Real-time</span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="bg-gradient-to-br from-accent/50 via-accent/30 to-accent/50 rounded-xl p-4 flex items-center justify-center border-2 border-dashed border-[var(--glass-border)]">
            <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden glass flex flex-col border border-[var(--glass-border)]" style={{ height: '540px' }}>

              {/* Chat header */}
              <div className="px-4 py-3.5 flex items-center justify-between bg-primary text-primary-foreground shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{config.botName || 'Assistant'}</p>
                    <p className="text-xs text-primary-foreground/70 leading-tight capitalize">{config.tone} · {config.language}</p>
                  </div>
                </div>
                <X className="w-4 h-4 text-primary-foreground/70" />
              </div>

              {/* Messages */}
              <div ref={chatBodyRef} className="flex-1 px-3 py-4 overflow-y-auto">
                {/* Welcome message */}
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="glass rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-foreground max-w-[80%] leading-relaxed">
                    {welcomeMsg}
                  </div>
                </div>

                {messages.length === 0 && (
                  <div className="mt-4 space-y-2">
                    {SAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="w-full p-2.5 rounded-xl border border-[var(--glass-border)] hover:border-primary/30 hover:bg-accent/30 text-left transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{prompt}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((msg) => (
                  <ChatMessage key={msg.id} msg={msg} />
                ))}

                {isTyping && (
                  <div className="flex items-start gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="glass rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-[var(--glass-border)] flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={isTyping}
                  placeholder="Type a test message..."
                  className="flex-1 py-2 px-3.5 glass-input rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition disabled:opacity-50"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={isTyping || !input.trim()}
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Clear chat */}
          <button
            onClick={() => setMessages([])}
            className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition py-1.5 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Clear chat history
          </button>
        </div>
      </div>
    </div>
  );
}
