'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface InlineChatProps {
  context?: Record<string, unknown>;
}

export default function InlineChat({ context: propContext }: InlineChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [diagnosisContext, setDiagnosisContext] = useState<Record<string, unknown> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load diagnosis from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResults');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Extract relevant diagnosis info (exclude large base64 images)
        const context: Record<string, unknown> = {
          type: parsed.type,
        };

        if (parsed.type === 'xray') {
          context.cobbAngles = parsed.cobb_angles;
          context.severity = parsed.severity;
          context.schrothType = parsed.schroth_type;
          context.curveLocation = parsed.curve_location;
          context.curveDirection = parsed.curve_direction;
          context.vertebraeCount = parsed.vertebrae_count;
        } else if (parsed.type === 'photo') {
          context.riskLevel = parsed.risk_level;
          context.asymmetryMetrics = parsed.asymmetry_metrics;
          context.recommendations = parsed.recommendations;
        }

        setDiagnosisContext(context);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: { ...diagnosisContext, ...propContext },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');

    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && !streamingContent && (
          <div className="glass-subtle p-6 text-center space-y-2">
            <p className="text-sm text-muted">
              Ask me anything about scoliosis, Schroth exercises, or your personalized routine.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {[
                "What does my Cobb angle mean?",
                "Tell me about my Schroth type",
                "What exercises are best for my condition?",
                "Is my diagnosis serious?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-[10px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-[10px] flex-shrink-0 flex items-center justify-center ${
                message.role === 'user' ? 'bg-primary' : 'bg-primary/10'
              }`}
            >
              {message.role === 'user' ? (
                <User size={16} className="text-light" />
              ) : (
                <Bot size={16} className="text-primary" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-[16px] ${
                message.role === 'user'
                  ? 'bg-primary text-light'
                  : 'glass-subtle'
              }`}
            >
              {message.role === 'user' ? (
                <p className="text-sm leading-relaxed text-light">
                  {message.content}
                </p>
              ) : (
                <div className="text-sm leading-relaxed text-dark prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-dark prose-strong:text-dark">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="max-w-[80%] p-3 rounded-[16px] glass-subtle">
              <div className="text-sm leading-relaxed text-dark prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-dark prose-strong:text-dark">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="glass-subtle p-3 rounded-[16px]">
              <Loader2 size={18} className="text-primary animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="input flex-1"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="btn btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
