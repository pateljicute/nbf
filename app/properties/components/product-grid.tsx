import { cn } from '@/lib/utils';

export const ProductGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  // Mobile: grid-cols-1, Tablet: grid-cols-2, Desktop: grid-cols-3
  return <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)}>{children}</div>;
};
