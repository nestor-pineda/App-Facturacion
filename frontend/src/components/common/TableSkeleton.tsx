import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_ROWS = 5;

interface TableSkeletonProps {
  rows?: number;
  columns: number;
}

export function TableSkeleton({ rows = DEFAULT_ROWS, columns }: TableSkeletonProps) {
  return (
    <div className="data-table-wrapper" data-testid="table-skeleton">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }, (_, i) => (
              <th
                key={i}
                className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3"
              >
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border last:border-0">
              {Array.from({ length: columns }, (_, colIndex) => (
                <td key={colIndex} className="px-5 py-4">
                  <Skeleton className="h-4 w-full max-w-[8rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
