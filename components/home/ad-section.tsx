'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getOptimizedImageUrl } from '@/lib/cloudinary-utils';

interface AdSettings {
    media_url: string;
    media_type: 'image' | 'video';
    cta_text: string;
    cta_link: string;
    is_active: boolean;
}

interface AdSectionProps {
    ad: AdSettings | null;
    className?: string;
}

export function AdSection({ ad, className }: AdSectionProps) {
    if (!ad || !ad.is_active || !ad.media_url) return null;

    return (
        <section className={cn("w-full max-w-[1920px] mx-auto px-4 md:px-12 py-4 md:py-8", className)}>
            <div className="relative w-full aspect-[1080/600] md:aspect-auto md:h-[400px] min-h-[200px] overflow-hidden rounded-2xl shadow-md border border-neutral-100 bg-neutral-100 group">
                {/* Media */}
                {ad.media_type === 'video' ? (
                    <video
                        src={ad.media_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={getOptimizedImageUrl(ad.media_url, 1200, 300, 'fill')}
                        alt="Special Offer"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent pointer-events-none" />

                {/* CTA Button */}
                {ad.cta_text && ad.cta_link && (
                    <div className="absolute bottom-4 left-4 md:bottom-12 md:left-12 z-10">
                        <Button
                            asChild
                            className="bg-white/90 backdrop-blur-md text-black hover:bg-white/100 text-xs md:text-base h-8 px-4 md:h-11 md:px-8 font-bold uppercase tracking-widest shadow-lg transition-transform hover:scale-105 border-0"
                        >
                            <Link href={ad.cta_link}>
                                {ad.cta_text}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
