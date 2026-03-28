import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, User, Bot } from 'lucide-react';
import { getMerchant, safeName } from '@/lib/merchant';
import { pgPool } from '@/lib/db';

async function getConversation(merchantId: string, id: string) {
  const sn = safeName(merchantId);
  try {
    const [convRows, msgRows] = await Promise.all([
      pgPool.unsafe(
        `SELECT * FROM "tenant_${sn}"."conversations" WHERE id = $1`, [id],
      ),
      pgPool.unsafe(
        `SELECT id, role, content, created_at FROM "tenant_${sn}"."messages"
          WHERE conversation_id = $1 ORDER BY created_at ASC`, [id],
      ),
    ]);
    if (!convRows[0]) return null;
    return { conversation: convRows[0] as any, messages: msgRows as any[] };
  } catch {
    return null;
  }
}

function parseContent(raw: string): string {
  try {
    const p = JSON.parse(raw);
    return p.type === 'text' ? p.text : JSON.stringify(p);
  } catch {
    return raw;
  }
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const merchant = await getMerchant();
  if (!merchant) return null;

  const { id } = await params;
  const data    = await getConversation(merchant.id, id);
  if (!data) notFound();

  const { conversation: conv, messages } = data;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/conversations"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Conversations
        </Link>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Status',  value: conv.status },
          { label: 'Turns',   value: conv.total_turns },
          { label: 'Tokens',  value: Number(conv.total_tokens_used).toLocaleString() },
          { label: 'Started', value: new Date(conv.created_at).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-zinc-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Message History</h2>
        </div>
        <div className="p-5 space-y-4">
          {messages.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No messages in this conversation.</p>
          ) : (
            messages.map((msg: any) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-emerald-100' : 'bg-zinc-100'}`}>
                    {isUser
                      ? <User className="w-3.5 h-3.5 text-emerald-600" />
                      : <Bot  className="w-3.5 h-3.5 text-zinc-500" />
                    }
                  </div>
                  <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-zinc-100 text-zinc-800 rounded-tl-sm'}`}>
                      {parseContent(msg.content)}
                    </div>
                    <span className="text-[10px] text-zinc-400 px-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}