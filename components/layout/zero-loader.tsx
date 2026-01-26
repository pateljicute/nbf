'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function ZeroLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Stop loading when path changes (navigation complete)
        setIsLoading(false);
    }, [pathname, searchParams]);

    useEffect(() => {
        // Add global click listener to detect navigation start
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');

            if (anchor && anchor.href && anchor.target !== '_blank' && !anchor.download) {
                // Check if it's an internal link
                const url = new URL(anchor.href);
                if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
                    // Only start loading if it's strictly a different path
                    setIsLoading(true);
                }
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-neutral-100">
            <div
                className="h-full bg-blue-600 animate-[progress_2s_ease-in-out_infinite]"
                style={{
                    width: '100%',
                    transformOrigin: '0% 50%',
                }}
            />
            <style jsx global>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.5); }
          100% { transform: scaleX(1); }
        }
      `}</style>
        </div>
    );
}
