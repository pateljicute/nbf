import { Footer } from './footer';
import { cn } from '@/lib/utils';

export const PageLayout = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("pb-20 md:pb-0", className)}>
      <main>{children}</main>
      <Footer />
    </div>
  );
};
