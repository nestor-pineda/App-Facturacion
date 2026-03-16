import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "./TableSkeleton";

const DASHBOARD_TABLE_COLUMNS = 6;
const DASHBOARD_TABLE_ROWS = 5;

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" data-testid="dashboard-skeleton">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="stat-card">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12 mb-1" />
            <Skeleton className="h-3 w-full max-w-[10rem]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="action-card">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full max-w-[8rem]" />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-40" />
        </div>
        <TableSkeleton columns={DASHBOARD_TABLE_COLUMNS} rows={DASHBOARD_TABLE_ROWS} />
      </div>
    </div>
  );
}
