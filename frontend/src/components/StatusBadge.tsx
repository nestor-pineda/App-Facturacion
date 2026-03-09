import { cn } from "@/lib/utils";

type Status = "draft" | "sent" | "accepted" | "rejected" | "paid" | "overdue" | "pending" | "issued";

const statusStyles: Record<Status, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  pending: "bg-warning/15 text-warning-foreground",
  accepted: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  paid: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  issued: "bg-primary/10 text-primary",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
