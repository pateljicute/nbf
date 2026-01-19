import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Store, Building2, ChevronRight, ArrowLeft, Palette, LayoutTemplate, Type, ScanLine, Loader2, Lock, Sun, Moon } from 'lucide-react';
import { Product } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";

interface QRPosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Product | null;
    user: any;
}

type PosterTheme = 'clean-white' | 'modern-dark';
type PosterMode = 'single' | 'catalog';
type Step = 'selection' | 'preview';
type PosterSize = '8x12' | '12x18' | 'a4';

export function QRPosterModal({ isOpen, onClose, property, user }: QRPosterModalProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<Step>('selection');
    const [mode, setMode] = useState<PosterMode>('single');
    const [size, setSize] = useState<PosterSize>('a4');
    const [posterTheme, setPosterTheme] = useState<PosterTheme>('clean-white');

    // Default Hindi Text
    const [headline, setHeadline] = useState('"हमारे यहाँ कमरे, फ्लैट और रूम किराये पर उपलब्ध हैं।"');
    const [subtext, setSubtext] = useState('सम्पर्क करने, फोटो(room) देखने और पूरी जानकारी \n(Details) के लिए नीचे दिए गए QR Code को स्कैन करें।');

    const [isGenerating, setIsGenerating] = useState(false);
    const posterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && property) {
            setStep('selection');
            setHeadline('"हमारे यहाँ कमरे, फ्लैट और रूम किराये पर उपलब्ध हैं।"');
            setSubtext('सम्पर्क करने, फोटो(room) देखने और पूरी जानकारी \n(Details) के लिए नीचे दिए गए QR Code को स्कैन करें।');
            setSize('a4');
            setPosterTheme('clean-white'); // Reset theme
        }
    }, [isOpen, property]);

    if (!isOpen || !property) return null;

    const siteUrl = 'https://www.nbfhomes.in';
    const finalQrUrl = mode === 'single'
        ? `${siteUrl}/product/${property.handle}`
        : `${siteUrl}/catalog/${property.userId}`;

    // Dimensions based on Size Selection
    const getDimensions = () => {
        const baseWidth = 600;
        switch (size) {
            case 'a4': return { width: baseWidth, height: Math.round(baseWidth * 1.414) };
            case '8x12': return { width: baseWidth, height: Math.round(baseWidth * 1.5) };
            case '12x18': return { width: baseWidth, height: Math.round(baseWidth * 1.5) };
            default: return { width: baseWidth, height: Math.round(baseWidth * 1.414) };
        }
    };

    const { width, height } = getDimensions();

    // Theme Variables
    const isDark = posterTheme === 'modern-dark';
    const bgClass = isDark ? 'bg-slate-950' : 'bg-white';
    const textClass = isDark ? 'text-white' : 'text-neutral-900';
    const subTextClass = isDark ? 'text-slate-300' : 'text-neutral-600';
    const accentClass = isDark ? 'text-amber-400' : 'text-neutral-500';

    const handleDownloadImage = async () => {
        if (!posterRef.current) return;
        setIsGenerating(true);
        try {
            const { toPng } = await import('html-to-image');
            let pixelRatio = 3;
            if (size === '12x18') pixelRatio = 4.5;
            if (size === 'a4') pixelRatio = 4;

            const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `nbf-poster-${size}-${mode}-${posterTheme}.png`;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to download poster." });
        } finally {
            setIsGenerating(false);
        }
    };

    // Watermark
    const watermarkSvg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
            <text x='50%' y='50%' font-family='sans-serif' font-weight='bold' font-size='20' fill='${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}' text-anchor='middle' transform='rotate(-45 100 100)'>nbfhomes.in</text>
        </svg>
    `.trim().replace(/\s+/g, ' ');
    const watermarkUrl = `url("data:image/svg+xml,${encodeURIComponent(watermarkSvg)}")`;


    if (step === 'selection') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                    <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-neutral-200">
                            <Store className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Create Your Poster</h2>
                        <p className="text-neutral-600">Choose a poster type to get started.</p>
                    </div>

                    <div className="space-y-4">
                        <button onClick={() => { setMode('single'); setStep('preview'); }} className="w-full group relative flex items-center p-4 border-2 border-neutral-100 rounded-xl hover:border-black hover:bg-neutral-50 transition-all text-left">
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                                <Building2 className="w-5 h-5 text-neutral-600 group-hover:text-black" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-neutral-900">Single Property Poster</h3>
                                <p className="text-xs text-neutral-500 mt-1">Promote this specific property</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-black" />
                        </button>

                        <button onClick={() => { setMode('catalog'); setStep('preview'); }} className="w-full group relative flex items-center p-4 border-2 border-neutral-100 rounded-xl hover:border-black hover:bg-neutral-50 transition-all text-left">
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                                <Store className="w-5 h-5 text-neutral-600 group-hover:text-black" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-neutral-900">All My Properties</h3>
                                <p className="text-xs text-neutral-500 mt-1">QR Code for your portfolio</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-black" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm overflow-hidden">
            <div className="bg-white md:rounded-xl shadow-2xl max-w-7xl w-full h-[100dvh] md:h-[95vh] flex flex-col md:flex-row overflow-hidden relative">

                {/* 1. PREVIEW AREA (Mobile: Top 50%, Desktop: Right) */}
                <div className="order-1 md:order-2 h-[50%] md:h-full flex-1 bg-neutral-100 p-4 md:p-8 flex items-center justify-center overflow-hidden relative border-b md:border-l border-neutral-200 z-10">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    {/* Scale Wrapper */}
                    <div className="relative shadow-2xl transition-all duration-300 origin-center scale-[0.45] sm:scale-[0.55] md:scale-[0.6] lg:scale-[0.75]">
                        <div
                            ref={posterRef}
                            style={{ width, height, backgroundImage: watermarkUrl }}
                            className={`${bgClass} relative flex flex-col overflow-hidden shadow-sm transition-colors duration-300`}
                        >
                            {/* Header */}
                            <div className="relative z-10 px-8 py-6 flex items-start justify-between shrink-0">
                                <div className={`font-bold text-xl tracking-wide ${textClass}`}>https://www.nbfhomes.in</div>
                                <div className={`${isDark ? 'bg-amber-400 text-black' : 'bg-black text-white'} px-6 py-2 font-black tracking-widest text-lg uppercase rounded-sm shadow-sm`}>NBF HOMES</div>
                            </div>

                            {/* 2. Property Image (Reduced to allow bigger QR/Text) */}
                            {property.images?.[0] && (
                                <div className="px-8 w-full h-[28%] shrink-0 relative z-10 flex justify-center">
                                    <div className={`h-full aspect-video p-1.5 rounded-md border-2 ${isDark ? 'border-amber-400/30 bg-white/5' : 'border-neutral-100 bg-white'} shadow-md`}>
                                        <div className="w-full h-full relative overflow-hidden rounded-sm">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={property.images[0].url} alt="Property" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Split Container (Text 50% | QR 50%) */}
                            <div className="flex-1 w-full flex flex-col min-h-0">

                                {/* Top Half: Text (50%) */}
                                <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-2 min-h-0 border-b border-dashed border-neutral-200/50 relative">
                                    {/* Headline - Larger */}
                                    <div className="w-[95%] mx-auto max-h-[60%] flex items-center justify-center overflow-hidden shrink-0">
                                        <h1
                                            className={`font-black ${textClass} leading-none tracking-tight whitespace-pre-wrap break-all text-center`}
                                            style={{
                                                fontFamily: 'sans-serif',
                                                // Increased Sizes
                                                fontSize: headline.length > 120 ? '22px' : headline.length > 80 ? '28px' : headline.length > 40 ? '36px' : '48px',
                                            }}
                                        >
                                            {headline}
                                        </h1>
                                    </div>
                                    {/* Subtext */}
                                    <div className="w-[90%] mx-auto max-h-[30%] overflow-hidden flex items-start justify-center">
                                        <p
                                            className={`font-bold ${subTextClass} leading-tight whitespace-pre-wrap break-words text-center`}
                                            style={{ fontSize: subtext.length > 100 ? '14px' : '18px' }}
                                        >
                                            {subtext}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Half: QR Code (50%) - MAXIMIZED FOR DISTANCE */}
                                <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'bg-slate-900/50' : 'bg-neutral-50/50'} relative p-2`}>

                                    <div className="flex flex-col items-center justify-center">
                                        {/* Massive QR Code Container */}
                                        <div className={`p-4 bg-white rounded-3xl shadow-2xl border-[6px] ${isDark ? 'border-amber-400' : 'border-black'} relative z-30`}>
                                            <QRCodeCanvas
                                                value={finalQrUrl}
                                                size={280} // Increased from 220 -> 280 for HD
                                                level={"H"} // High error correction helps if any part is obscured
                                                includeMargin={false}
                                                imageSettings={{ src: "/icon.png", height: 60, width: 60, excavate: true }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 mt-4 opacity-100">
                                            <ScanLine className={`w-6 h-6 ${textClass}`} />
                                            <span className={`text-sm font-black uppercase tracking-[0.25em] ${textClass}`}>Scan for Details</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Branding Footer (Overlay or distinct) */}
                                <div className={`shrink-0 h-10 ${isDark ? 'bg-black' : 'bg-neutral-900'} flex items-center justify-between px-6 z-40`}>
                                    <div className="text-neutral-500 font-bold text-[10px] tracking-wider">POWERED BY NBF</div>
                                    <div className="text-white font-bold text-xs tracking-widest uppercase">WWW.NBFHOMES.IN</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CONTROLS AREA (Mobile: Bottom 50%, Desktop: Left) */}
                <div className="order-2 md:order-1 h-[50%] md:h-full w-full md:w-[350px] bg-white flex flex-col relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.1)] md:shadow-none">

                    {/* Header Controls */}
                    <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-white sticky top-0 z-30">
                        <button onClick={() => setStep('selection')} className="p-2 hover:bg-neutral-100 rounded-full md:hidden">
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPosterTheme('clean-white')}
                                className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${posterTheme === 'clean-white' ? 'bg-neutral-100 text-black ring-1 ring-black/10' : 'text-neutral-400 hover:text-black'}`}
                            >
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button
                                onClick={() => setPosterTheme('modern-dark')}
                                className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${posterTheme === 'modern-dark' ? 'bg-slate-900 text-white ring-1 ring-slate-800' : 'text-neutral-400 hover:text-black'}`}
                            >
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                <Type className="w-3 h-3" /> Content
                            </label>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-neutral-400">Headline</span>
                                <textarea
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-black outline-none font-bold text-sm resize-none h-20 bg-neutral-50"
                                    placeholder="Enter headline..."
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-neutral-400">Instructions</span>
                                <textarea
                                    value={subtext}
                                    onChange={(e) => setSubtext(e.target.value)}
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-black outline-none text-sm resize-none h-20 bg-neutral-50"
                                    placeholder="Enter instructions..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-neutral-100 z-40">
                        <button
                            onClick={handleDownloadImage}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl font-bold hover:bg-neutral-900 transition-all disabled:opacity-50 shadow-lg active:scale-[0.98]"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download Poster
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
