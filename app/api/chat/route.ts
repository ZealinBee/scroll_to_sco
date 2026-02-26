import { NextRequest } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    const apiKey = process.env.AI_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt with context about the app and user's analysis
    let systemPrompt = `You are a helpful assistant for ScrollToSco, a scoliosis detection and management app. You help users understand their scoliosis analysis results, Schroth exercises, and provide general guidance about scoliosis management.

Key guidelines:
- Be empathetic and supportive - scoliosis can be a sensitive topic
- Explain medical terms in simple language
- Always recommend consulting a healthcare professional for medical decisions
- Be knowledgeable about Schroth method exercises and breathing techniques
- Keep responses concise and helpful
- Use markdown formatting when appropriate (lists, bold, headers)`;

    // Add analysis context if provided
    if (context) {
      systemPrompt += `\n\nUser's current analysis context:\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to get AI response' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a TransformStream to process the SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
    });

    const stream = response.body?.pipeThrough(transformStream);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
