import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      data-testid="empty-state"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className={`text-sm text-muted-foreground max-w-sm ${action ? "mb-6" : ""}`}>
          {description}
        </p>
      )}
      {!description && action && <div className="mb-6" />}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
