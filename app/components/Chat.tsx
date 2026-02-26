'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  context?: Record<string, unknown>;
}

export default function Chat({ context: propContext }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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

  const chatWindow = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-dark/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Chat Window */}
      <div className="glass relative z-10 w-full max-w-md flex flex-col animate-scale-in" style={{ height: 'min(600px, 80vh)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
              <Bot size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-dark">AI Assistant</h3>
              <p className="text-xs text-muted">Ask about your results</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost p-2 rounded-[12px]"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-[16px] bg-primary/10 flex items-center justify-center">
                <MessageCircle size={28} className="text-primary" />
              </div>
              <p className="text-muted text-sm">
                Hi! I can help you understand your scoliosis analysis, explain Schroth exercises, or answer questions about your results.
              </p>
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
        <div className="p-4 border-t border-white/20">
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
      </div>
    </div>
  );

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 btn btn-primary p-4 rounded-[20px] shadow-glow"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(chatWindow, document.body)}
    </>
  );
}
