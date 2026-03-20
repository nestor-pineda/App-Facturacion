import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { AgentChat } from '@/features/agent/components/AgentChat';
import { useAgentChat } from '@/features/agent/hooks/useAgentChat';

export function AgentWidget() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, isPending, error } = useAgentChat();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open ? (
        <AgentChat
          onClose={() => setOpen(false)}
          messages={messages}
          sendMessage={sendMessage}
          isPending={isPending}
          error={error}
        />
      ) : null}
      <Button
        type="button"
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-md',
          'bg-primary text-primary-foreground hover:bg-primary/90',
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="agent-chat-panel"
        aria-label={open ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
