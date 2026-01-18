'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Store, Building2, ChevronRight, ArrowLeft, Palette, LayoutTemplate, Type, ScanLine, Loader2, Lock } from 'lucide-react';
import { Product } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";

interface QRPosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Product | null;
    user: any;
}

type PosterTheme = 'clean-white' | 'modern-gradient';
type PosterMode = 'single' | 'catalog';
type Step = 'selection' | 'preview';
type PosterSize = '8x12' | '12x18' | 'a4';

export function QRPosterModal({ isOpen, onClose, property, user }: QRPosterModalProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<Step>('selection');
    const [mode, setMode] = useState<PosterMode>('single');
    const [size, setSize] = useState<PosterSize>('a4');

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
        }
    }, [isOpen, property]);

    if (!isOpen || !property) return null;

    const siteUrl = 'https://www.nbfhomes.in';
    const finalQrUrl = mode === 'single'
        ? `${siteUrl}/product/${property.handle}`
        : `${siteUrl}/catalog/${property.userId}`;

    // Dimensions based on Size Selection (Base width fixed, height adjusted for ratio)
    const getDimensions = () => {
        const baseWidth = 600;
        switch (size) {
            case 'a4':
                return { width: baseWidth, height: Math.round(baseWidth * 1.414) }; // 1:1.414
            case '8x12':
                return { width: baseWidth, height: Math.round(baseWidth * 1.5) };   // 2:3
            case '12x18':
                return { width: baseWidth, height: Math.round(baseWidth * 1.5) };   // 2:3
            default:
                return { width: baseWidth, height: Math.round(baseWidth * 1.414) };
        }
    };

    const { width, height } = getDimensions();

    const handleDownloadImage = async () => {
        if (!posterRef.current) return;
        setIsGenerating(true);
        try {
            const { toPng } = await import('html-to-image');

            // Higher pixel ratio for larger sizes to ensure print quality
            // 8x12 (Small) -> Ratio 3 (approx 1800px width)
            // 12x18 (Medium) -> Ratio 4.5 (approx 2700px width)
            // A4 -> Ratio 4 (approx 2400px width)
            let pixelRatio = 3;
            if (size === '12x18') pixelRatio = 4.5;
            if (size === 'a4') pixelRatio = 4;

            const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `nbf-poster-${size}-${mode}.png`;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to download poster." });
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper for Watermark SVG Data URI
    // Rotated text "nbfhomes.in"
    const watermarkSvg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
            <text x='50%' y='50%' font-family='sans-serif' font-weight='bold' font-size='20' fill='rgba(0,0,0,0.03)' text-anchor='middle' transform='rotate(-45 100 100)'>nbfhomes.in</text>
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
                        <button
                            onClick={() => { setMode('single'); setStep('preview'); }}
                            className="w-full group relative flex items-center p-4 border-2 border-neutral-100 rounded-xl hover:border-black hover:bg-neutral-50 transition-all text-left"
                        >
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                                <Building2 className="w-5 h-5 text-neutral-600 group-hover:text-black" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-neutral-900">Single Property Poster</h3>
                                <p className="text-xs text-neutral-500 mt-1">Promote this specific specific listing</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-black" />
                        </button>

                        <button
                            onClick={() => { setMode('catalog'); setStep('preview'); }}
                            className="w-full group relative flex items-center p-4 border-2 border-neutral-100 rounded-xl hover:border-black hover:bg-neutral-50 transition-all text-left"
                        >
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                                <Store className="w-5 h-5 text-neutral-600 group-hover:text-black" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-neutral-900">All My Properties (Catalog)</h3>
                                <p className="text-xs text-neutral-500 mt-1">QR Code for your entire portfolio</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-black" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto md:overflow-hidden">
            <div className="bg-white md:rounded-xl shadow-2xl max-w-7xl w-full min-h-full md:min-h-0 md:h-[95vh] flex flex-col md:flex-row overflow-x-hidden">

                {/* SETTINGS PANEL */}
                <div className="w-full md:w-[350px] p-6 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50 flex flex-col shrink-0 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-6">
                        <button onClick={() => setStep('selection')} className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <h2 className="text-lg font-bold text-neutral-900">Customize</h2>
                        <div className="flex-1" />
                        <button onClick={onClose} className="p-1.5 hover:bg-neutral-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>

                    <div className="space-y-8 flex-1">

                        {/* Size Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                <LayoutTemplate className="w-3 h-3" /> Poster Size
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: '8x12', label: 'Small (8 x 12 inches)', desc: 'Compact & Handy' },
                                    { id: '12x18', label: 'Medium (12 x 18 inches)', desc: 'Standard Poster' },
                                    { id: 'a4', label: 'Standard A4', desc: 'Easy Home Printing' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSize(opt.id as PosterSize)}
                                        className={`p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between ${size === opt.id ? 'border-black bg-white ring-1 ring-black/5' : 'border-neutral-200 hover:border-neutral-300 bg-white/50'
                                            }`}
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-neutral-900">{opt.label}</div>
                                            <div className="text-xs text-neutral-500">{opt.desc}</div>
                                        </div>
                                        {size === opt.id && <div className="w-2 h-2 rounded-full bg-black" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content Editing */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                <Type className="w-3 h-3" /> Content
                            </label>

                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-neutral-400">Headline (Hindi/English)</span>
                                <textarea
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black outline-none font-bold text-sm resize-none h-20"
                                    placeholder="Enter main headline..."
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-neutral-400">Instructions</span>
                                <textarea
                                    value={subtext}
                                    onChange={(e) => setSubtext(e.target.value)}
                                    className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black outline-none text-sm resize-none h-24"
                                    placeholder="Enter instructions..."
                                />
                            </div>
                        </div>

                    </div>

                    <div className="pt-6 border-t border-neutral-200 mt-6">
                        <button
                            onClick={handleDownloadImage}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white rounded-xl font-bold hover:bg-neutral-800 transition-all disabled:opacity-50 shadow-xl shadow-black/10 active:scale-95"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download Poster
                        </button>
                    </div>
                </div>

                {/* VISUAL PREVIEW AREA */}
                <div className="flex-1 bg-neutral-100 p-8 flex items-center justify-center overflow-auto relative">
                    {/* Background Pattern for Tool Area */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    {/* Scale Logic for Preview - Purely Visual */}
                    <div className="relative shadow-2xl transition-all duration-300 origin-top md:origin-center scale-[0.4] sm:scale-[0.5] md:scale-[0.6] lg:scale-[0.7] xl:scale-[0.8]">

                        {/* ACTUAL POSTER DOM */}
                        <div
                            ref={posterRef}
                            style={{ width, height, backgroundImage: watermarkUrl }}
                            className="bg-white relative flex flex-col overflow-hidden shadow-sm"
                        >
                            {/* Watermark Overlay (Already in bg image, but adding gradient for clean/modern look) */}
                            {/* <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/90 pointer-events-none" /> */}
                            {/* Doing it via style above to ensure it captures in screenshot */}

                            {/* 1. Header Section */}
                            <div className="relative z-10 px-8 py-6 flex items-start justify-between">
                                <div className="font-bold text-lg tracking-wide text-neutral-900">
                                    https://www.nbfhomes.in
                                </div>
                                <div className="bg-black text-white px-4 py-2 font-black tracking-widest text-lg uppercase rounded-sm">
                                    NBF HOMES
                                </div>
                            </div>

                            {/* 2. Main Content */}
                            <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-12 pb-12 text-center space-y-8">

                                {/* Headline */}
                                <h1 className="text-5xl font-black text-black leading-tight tracking-tight whitespace-pre-wrap" style={{ fontFamily: 'sans-serif' }}>
                                    {headline}
                                </h1>

                                {/* Subtext / Instructions */}
                                <p className="text-xl font-medium text-neutral-800 leading-relaxed max-w-2xl whitespace-pre-wrap">
                                    {subtext}
                                </p>

                                {/* Scan Icon Graphic */}
                                <div className="flex items-center gap-4 text-blue-900 opacity-90 my-2">
                                    <ScanLine className="w-12 h-12" />
                                </div>

                                {/* QR Code Frame */}
                                <div className="p-4 bg-white rounded-2xl shadow-xl border border-neutral-100">
                                    <QRCodeCanvas
                                        value={finalQrUrl}
                                        size={240}
                                        level={"Q"}
                                        includeMargin={false}
                                        imageSettings={{
                                            src: "/icon.png",
                                            height: 50,
                                            width: 50,
                                            excavate: true,
                                        }}
                                    />
                                </div>

                                <p className="text-sm font-bold uppercase tracking-widest text-neutral-400 mt-2">
                                    Scan for Details
                                </p>
                            </div>

                            {/* 3. Footer */}
                            <div className="h-16 bg-neutral-900 flex items-center justify-between px-8 relative z-10 shrink-0">
                                <div className="text-neutral-400 font-bold text-xs tracking-wider">
                                    POWERED BY NBF
                                </div>
                                <div className="text-white font-bold text-sm tracking-widest uppercase">
                                    WWW.NBFHOMES.IN
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
