'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import cloudinaryLoader from '@/lib/cloudinary-loader';

const HERO_SRC = 'https://res.cloudinary.com/dla8a0y7n/image/upload/v1764658021/hero-background_jdgiur.jpg';

const HeroSearch = dynamic(() => import('./hero-search').then(m => m.HeroSearch), {
    ssr: false,
    loading: () => <div className="h-14 w-full max-w-xl bg-white/10 rounded-full animate-pulse" />
});

import { useState, useEffect } from 'react';

// Define Prop Type to include onSearch
interface HeroProps {
    onSearch?: (query: string) => void;
}

export function Hero({ onSearch }: HeroProps) {
    return (
        <div suppressHydrationWarning className="relative min-h-[50vh] h-auto pb-10 md:min-h-[80vh] w-full overflow-hidden group">
            <div className="absolute inset-0 size-full block">
                <Image
                    loader={cloudinaryLoader}
                    src={HERO_SRC}
                    alt="Hero Background"
                    fill
                    priority
                    sizes="100vw"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                    suppressHydrationWarning
                />
                {/* Darker overlay */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" suppressHydrationWarning />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" suppressHydrationWarning />
            </div>

            {/* Centered Content Container */}
            <div className="relative min-h-[50vh] flex flex-col items-center justify-center p-6 text-center z-20 pt-24 md:pt-0">
                <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100 max-w-4xl">
                    {/* Glassmorphic Badge */}
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-medium uppercase tracking-widest rounded-full">
                            #1 Real Estate Platform
                        </span>
                    </div>

                    {/* Hero Title */}
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight leading-tight drop-shadow-lg px-2">
                        Find Your Perfect Home – Zero Brokerage, Zero Stress.
                    </h1>

                    {/* Description */}
                    <p className="text-sm md:text-lg text-white/80 max-w-2xl font-light leading-relaxed drop-shadow-md px-4 mb-6">
                        Discover verified rooms, PGs, and shared flats in Mandsaur. Connect directly with owners.
                    </p>

                    {/* Functional Search Bar */}
                    <div className="w-[92%] md:w-full flex justify-center mt-8 md:mt-10">
                        <HeroSearch onSearch={onSearch} />
                    </div>
                </div>
            </div>
        </div>
    );
}
