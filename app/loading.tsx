import { SkeletonGrid } from '@/components/ui/skeleton-card';

export default function Loading() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <div className="h-[60vh] bg-neutral-100 animate-pulse" />
      <section className="w-full max-w-[1920px] mx-auto px-6 md:px-12">
        <div className="mb-12">
          <div className="h-8 bg-neutral-200 rounded w-48 mb-2" />
          <div className="h-4 bg-neutral-200 rounded w-64" />
        </div>
        <SkeletonGrid count={8} />
      </section>
    </div>
  );
}
