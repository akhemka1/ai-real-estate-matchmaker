import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden
    />
  );
}

export function PropertyCardSkeleton({
  layout = "grid",
  className,
}: {
  layout?: "grid" | "list";
  className?: string;
}) {
  if (layout === "list") {
    return (
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border sm:flex-row",
          className
        )}
      >
        <Skeleton className="aspect-[16/10] w-full sm:w-64 sm:rounded-none" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-auto h-6 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({
  count = 6,
  layout = "grid",
  className,
}: {
  count?: number;
  layout?: "grid" | "list";
  className?: string;
}) {
  return (
    <div
      className={cn(
        layout === "grid"
          ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          : "flex flex-col gap-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} layout={layout} />
      ))}
    </div>
  );
}

export { Skeleton };
