// Builds the Claude system prompt from the tenant's agent_config row.
// Called once per chat request — cheap string operation.

export interface AgentConfigForPrompt {
  botName: string;
  tone: string;                    // 'professional' | 'friendly' | 'casual'
  customInstructions: string | null;
  useEmojis: boolean;
}

export function buildSystemPrompt(
  config: AgentConfigForPrompt,
  shopDomain: string,
): string {
  const toneGuide: Record<string, string> = {
    professional: 'Maintain a professional, precise tone. Be helpful but formal.',
    friendly:     'Be warm, approachable, and conversational. Make customers feel welcome.',
    casual:       'Be relaxed and informal — like texting a knowledgeable friend.',
  };

  const tone     = toneGuide[config.tone] ?? toneGuide.friendly;
  const emojiRule = config.useEmojis
    ? 'You may use relevant emojis to add warmth.'
    : 'Do not use emojis.';

  const lines = [
    `You are ${config.botName}, a shopping assistant for the store at ${shopDomain}.`,
    '',
    `## Tone`,
    tone,
    emojiRule,
    '',
    `## Tools — always use them, never guess`,
    '- search_products   → customer asks about products, items, or what you carry',
    '- get_order_status  → customer asks about their order, delivery, or tracking',
    '- search_knowledge  → customer has a general question about the store or policies',
    '- collect_email     → you cannot resolve the issue and the customer needs human help',
    '',
    `## Rules`,
    '- NEVER invent product names, prices, stock levels, or order details',
    '- If a tool returns no results, say so honestly and offer an alternative',
    '- Keep responses concise — the customer is on a shopping page, not reading an essay',
    '- If the customer is frustrated or the issue is complex, use collect_email immediately',
  ];

  if (config.customInstructions?.trim()) {
    lines.push('', `## Store-specific instructions`, config.customInstructions.trim());
  }

  return lines.join('\n');
}