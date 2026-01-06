'use client';

import { useEffect } from 'react';

export function AutoScroll() {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo({
                top: window.innerHeight * 0.8,
                behavior: 'smooth'
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return null;
}
