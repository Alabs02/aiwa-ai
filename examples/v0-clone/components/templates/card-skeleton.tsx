import { Skeleton } from "@/components/ui/skeleton";

export function TemplateCardSkeleton() {
  return (
    <div className="block overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
      {/* Preview Skeleton */}
      <Skeleton className="aspect-video w-full bg-neutral-800" />

      {/* Content Skeleton */}
      <div className="space-y-3 p-4">
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4 bg-neutral-800" />

        {/* Metadata Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 bg-neutral-800" />
        </div>

        {/* Creator Info Skeleton */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-6 w-6 rounded-full bg-neutral-800" />
          <Skeleton className="h-4 w-32 bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}

export function FeaturedTemplatesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TemplateCardSkeleton key={i} />
      ))}
    </div>
  );
}
