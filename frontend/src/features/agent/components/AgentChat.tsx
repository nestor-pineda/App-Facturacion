import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, SendHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AgentChatMessage } from '@/features/agent/hooks/useAgentChat';

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2"
      aria-live="polite"
      aria-label="El asistente está escribiendo"
    >
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground/80 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground/80 animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground/80 animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

export type AgentChatPanelProps = {
  onClose: () => void;
  messages: AgentChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isPending: boolean;
  error: string | null;
};

export function AgentChat({
  onClose,
  messages,
  sendMessage,
  isPending,
  error,
}: AgentChatPanelProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isPending, error]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isPending) {
      return;
    }
    const text = draft;
    setDraft('');
    await sendMessage(text);
  };

  return (
    <div
      id="agent-chat-panel"
      className={cn(
        'flex h-[500px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg',
      )}
      role="dialog"
      aria-label="Asistente IA"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          <h2 className="truncate text-sm font-semibold">Asistente IA</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onClose}
          aria-label="Cerrar chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scroll-smooth"
      >
        {messages.length === 0 && !isPending && (
          <p className="text-sm text-muted-foreground text-center px-2 pt-4">
            Pregunta sobre clientes, facturas o presupuestos. Los datos son los de tu cuenta.
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}-${m.content.slice(0, 24)}`}
            className={cn('flex w-full', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              <span className="whitespace-pre-wrap break-words">{m.content}</span>
            </div>
          </div>
        ))}

        {isPending && <TypingIndicator />}

        {error ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border p-2 flex gap-2 bg-card"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje…"
          disabled={isPending}
          className="flex-1"
          autoComplete="off"
          maxLength={2000}
          aria-label="Mensaje para el asistente"
        />
        <Button type="submit" size="icon" disabled={isPending || !draft.trim()} aria-label="Enviar">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
