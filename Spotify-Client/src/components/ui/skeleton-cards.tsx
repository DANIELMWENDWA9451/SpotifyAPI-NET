import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md p-4 bg-surface-2/50", className)}>
      <div className="aspect-square bg-surface-3 rounded-md mb-4" />
      <div className="h-4 bg-surface-3 rounded w-3/4 mb-2" />
      <div className="h-3 bg-surface-3 rounded w-1/2" />
    </div>
  );
}

export function SkeletonQuickPlay({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse flex items-center bg-surface-1/80 rounded-md overflow-hidden", className)}>
      <div className="w-12 h-12 bg-surface-3" />
      <div className="flex-1 px-4">
        <div className="h-4 bg-surface-3 rounded w-24" />
      </div>
    </div>
  );
}

export function SkeletonTrackRow({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse grid grid-cols-[16px_4fr_2fr_1fr] gap-4 px-4 py-2 items-center", className)}>
      <div className="h-4 w-4 bg-surface-3 rounded" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-3 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-3 rounded w-32" />
          <div className="h-3 bg-surface-3 rounded w-20" />
        </div>
      </div>
      <div className="h-3 bg-surface-3 rounded w-24" />
      <div className="h-3 bg-surface-3 rounded w-10 ml-auto" />
    </div>
  );
}

export function SkeletonArtistCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md p-4 bg-surface-2/50", className)}>
      <div className="aspect-square bg-surface-3 rounded-full mb-4" />
      <div className="h-4 bg-surface-3 rounded w-3/4 mb-2 mx-auto" />
      <div className="h-3 bg-surface-3 rounded w-1/2 mx-auto" />
    </div>
  );
}

export function SkeletonCategoryCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse aspect-square rounded-lg bg-surface-3", className)} />
  );
}

export function SkeletonSidebar() {
  return (
    <div className="space-y-2 px-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-12 h-12 bg-surface-3 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-3 rounded w-24" />
            <div className="h-3 bg-surface-3 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
