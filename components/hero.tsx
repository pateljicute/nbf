import Image from 'next/image';
import dynamic from 'next/dynamic';

const HeroSearch = dynamic(() => import('./hero-search').then(m => m.HeroSearch), {
    ssr: false,
    loading: () => <div className="h-14 w-full max-w-xl bg-white/10 rounded-full animate-pulse" />
});

export function Hero() {
    return (
        <div className="relative h-screen w-full overflow-hidden group">
            <div className="size-full block">
                <Image
                    priority
                    src="/hero-background.jpg"
                    alt="Hero Background"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="100vw"
                />
                {/* Darker overlay for better text contrast matching the reference */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
            </div>

            {/* Centered Content Container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100 max-w-4xl">
                    {/* Glassmorphic Badge */}
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-medium uppercase tracking-widest rounded-full">
                            #1 Real Estate Platform
                        </span>
                    </div>

                    {/* Hero Title - Large & Elegant */}
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white tracking-tight leading-[1.1] drop-shadow-lg">
                        Find Your Dream Home
                    </h1>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-white/90 max-w-2xl font-light leading-relaxed drop-shadow-md">
                        Discover verified PGs, shared flats, and premium rooms. Connect directly with owners, zero brokerage, completely free.
                    </p>

                    {/* Functional Search Bar */}
                    <HeroSearch />
                </div>
            </div>

            {/* Bottom Stats Row */}
            <div className="absolute bottom-0 left-0 w-full py-12 z-20 border-t border-white/10 bg-gradient-to-t from-black/80 to-transparent">
                <div className="container mx-auto grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col gap-1">
                        <span className="text-2xl md:text-3xl font-bold text-white">10k+</span>
                        <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">Active Listings</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-white/20">
                        <span className="text-2xl md:text-3xl font-bold text-white">50+</span>
                        <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">Cities Covered</span>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-white/20">
                        <span className="text-2xl md:text-3xl font-bold text-white">0%</span>
                        <span className="text-xs md:text-sm text-white/70 uppercase tracking-wider">Brokerage Fee</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
