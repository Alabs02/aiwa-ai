import { Skeleton } from '@/components/ui/skeleton'

export function ProjectCardSkeleton() {
  return (
    <div className="block bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800">
      {/* Preview Skeleton */}
      <Skeleton className="aspect-video w-full bg-neutral-800" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
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
  )
}

export function FeaturedProjectsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}
