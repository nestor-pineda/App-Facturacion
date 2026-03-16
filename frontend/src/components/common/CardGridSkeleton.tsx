import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_COUNT = 6;

interface CardGridSkeletonProps {
  count?: number;
}

export function CardGridSkeleton({ count = DEFAULT_COUNT }: CardGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="card-grid-skeleton">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="stat-card flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Skeleton className="h-5 w-3/4 max-w-[12rem] mb-2" />
            <Skeleton className="h-4 w-full max-w-[14rem] mt-2" />
            <Skeleton className="h-4 w-2/3 max-w-[10rem] mt-1" />
            <Skeleton className="h-4 w-1/2 max-w-[8rem] mt-1" />
            <Skeleton className="h-4 w-4/5 max-w-[11rem] mt-1" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md shrink-0 ml-2" />
        </div>
      ))}
    </div>
  );
}
