import { SkeletonGrid } from '@/components/ui/skeleton-card';

export default function Loading() {
  return (
    <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-12">
      <div className="mb-8">
        <div className="h-8 bg-neutral-200 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-neutral-200 rounded w-64 animate-pulse" />
      </div>
      <SkeletonGrid count={12} />
    </div>
  );
}
