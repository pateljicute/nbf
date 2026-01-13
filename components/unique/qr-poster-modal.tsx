'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
// html-to-image and jspdf are dynamically imported to ensure client-side safety
import { X, Download, Type, Lock, Palette, LayoutTemplate, Store, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Product } from '@/lib/types';
import { useToast } from "@/components/ui/use-toast";

interface QRPosterModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: Product | null;
    user: any;
}

type PosterTheme = 'night-sight' | 'ultra-bright';
type PosterMode = 'single' | 'catalog';
type Step = 'selection' | 'preview';

export function QRPosterModal({ isOpen, onClose, property, user }: QRPosterModalProps) {
    // defaults
    const { toast } = useToast();
    const [step, setStep] = useState<Step>('selection');
    const [mode, setMode] = useState<PosterMode>('single');

    // Text State
    const [headline, setHeadline] = useState('Great room available here');
    // Subtext removed as per request

    const [theme, setTheme] = useState<PosterTheme>('ultra-bright');
    const [isGenerating, setIsGenerating] = useState(false);
    const posterRef = useRef<HTMLDivElement>(null);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen && property) {
            setStep('selection');
            setHeadline('Great room available here');
            // setSubtext removed
            setTheme('ultra-bright');
        }
    }, [isOpen, property]);

    if (!isOpen || !property) return null;

    // Determine QR URL based on mode
    const siteUrl = 'https://www.nbfhomes.in';
    const finalQrUrl = mode === 'single'
        ? `${siteUrl}/product/${property.handle}`
        : `${siteUrl}/catalog/${property.userId}`;

    const handleDownloadImage = async () => {
        if (!posterRef.current) return;
        setIsGenerating(true);
        try {
            // Dynamic import for safety (Client-side only)
            const { toPng } = await import('html-to-image');

            // pixelRatio: 3 for Ultra HD (Printing quality)
            const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 3 });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `poster-${property.handle}-${mode}.png`;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
            console.error('Error generating image:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate image. Please try again.",
            });
            // alert('Failed to generate image. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!posterRef.current) return;
        setIsGenerating(true);
        try {
            // Dynamic imports for safety
            const { toPng } = await import('html-to-image');
            const { default: jsPDF } = await import('jspdf');

            const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 3 });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgProps = (pdf as any).getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`poster-${property.handle}-${mode}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            console.error('Error generating PDF:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate PDF. Please try again.",
            });
            // alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Theme Configurations
    const themeStyles = {
        'ultra-bright': {
            containerBg: 'bg-white',
            headlineColor: 'text-black',
            subtextColor: 'text-black',
            accentColor: 'text-neutral-900',
            qrBg: '#ffffff',
            qrFg: '#000000',
            brandingBg: 'bg-black',
            brandingText: 'text-white'
        },
        'night-sight': {
            containerBg: 'bg-neutral-950',
            headlineColor: 'text-yellow-400', // Safety Yellow
            subtextColor: 'text-white',
            accentColor: 'text-yellow-400',
            qrBg: '#ffffff', // High contrast for scanning
            qrFg: '#000000',
            brandingBg: 'bg-yellow-400',
            brandingText: 'text-black'
        }
    };

    const currentStyle = themeStyles[theme];

    // RENDER: Selection Step
    if (step === 'selection') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                            <Store className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Create Your Poster</h2>
                        <p className="text-neutral-600">Choose where the QR code should take people.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => { setMode('single'); setStep('preview'); }}
                            className="w-full group relative flex items-center p-4 border-2 border-neutral-100 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition-all text-left"
                        >
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center group-hover:border-purple-200 transition-colors">
                                <Building2 className="w-5 h-5 text-neutral-600 group-hover:text-purple-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-neutral-900 group-hover:text-purple-900">Single Property Poster</h3>
                                <p className="text-xs text-neutral-500 mt-1">Directs to this specific property page</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-purple-600" />
                        </button>

                        <button
                            onClick={() => { setMode('catalog'); setStep('preview'); }}
                            className="w-full group relative flex items-center p-4 border-2 border-neutral-100 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
                        >
                            <div className="w-10 h-10 bg-white border border-neutral-200 rounded-lg flex items-center justify-center group-hover:border-blue-200 transition-colors">
                                <Store className="w-5 h-5 text-neutral-600 group-hover:text-blue-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-neutral-900 group-hover:text-blue-900">All My Properties (Catalog)</h3>
                                <p className="text-xs text-neutral-500 mt-1">Shows all your listings in a filterable list</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-blue-600" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getHeadlineFontSize = (text: string) => {
        if (text.length < 20) return 'text-6xl';
        if (text.length < 40) return 'text-5xl';
        if (text.length < 60) return 'text-4xl';
        return 'text-3xl';
    };

    // getSubtextFontSize removed as per request

    // RENDER: Preview/Edit Step
    return (
        <div className="fixed inset-0 z-[100] flex md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto md:overflow-hidden">
            <div className="bg-white md:rounded-xl shadow-2xl max-w-7xl w-full min-h-full md:min-h-0 md:h-[95vh] flex flex-col md:flex-row overflow-x-hidden">

                {/* Left Side: Controls */}
                <div className="w-full md:w-[350px] p-6 border-b md:border-b-0 md:border-r border-neutral-200 bg-neutral-50 flex flex-col shrink-0">
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            onClick={() => setStep('selection')}
                            className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                            title="Back to Selection"
                        >
                            <ArrowLeft className="w-5 h-5 text-neutral-600" />
                        </button>
                        <h2 className="text-lg font-bold text-neutral-900">Customize Poster</h2>
                        <div className="flex-1" />
                        <button onClick={onClose} className="p-1.5 hover:bg-neutral-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-neutral-500" />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Theme Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                <Palette className="w-3 h-3" /> High-Visibility Themes
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setTheme('ultra-bright')}
                                    className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${theme === 'ultra-bright' ? 'border-black ring-1 ring-black/10' : 'border-neutral-200 hover:border-neutral-300'}`}
                                >
                                    <div className="w-10 h-10 rounded border border-neutral-200 bg-white shadow-sm" />
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-neutral-900">Ultra-Bright White</span>
                                        <span className="block text-xs text-neutral-500">Daytime Visibility</span>
                                    </div>
                                    {theme === 'ultra-bright' && <div className="absolute right-3 w-2 h-2 rounded-full bg-blue-600" />}
                                </button>
                                <button
                                    onClick={() => setTheme('night-sight')}
                                    className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${theme === 'night-sight' ? 'border-yellow-400 bg-neutral-900 ring-1 ring-yellow-400/20' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'}`}
                                >
                                    <div className="w-10 h-10 rounded border border-neutral-700 bg-black shadow-sm flex items-center justify-center">
                                        <div className="w-4 h-4 bg-yellow-400 rounded-sm" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-white">Night-Sight Dark</span>
                                        <span className="block text-xs text-neutral-400">Low-Light Visibility</span>
                                    </div>
                                    {theme === 'night-sight' && <div className="absolute right-3 w-2 h-2 rounded-full bg-yellow-400" />}
                                </button>
                            </div>
                        </div>

                        {/* Text Editing */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
                                    <LayoutTemplate className="w-3 h-3" /> Headline
                                </label>
                                <textarea
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all font-bold text-lg resize-none h-32"
                                    placeholder="Enter headline..."
                                    maxLength={80}
                                />
                                <div className="flex justify-between text-xs text-neutral-400">
                                    <span>Max 80 chars</span>
                                    <span className={`${headline.length >= 80 ? 'text-red-500 font-bold' : ''}`}>{headline.length}/80</span>
                                </div>
                            </div>
                        </div>

                        {/* Branding Info */}
                        <div className="mt-auto p-4 bg-neutral-100/50 rounded-lg border border-neutral-200">
                            <div className="flex items-center gap-2 mb-1 text-neutral-400">
                                <Lock className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Locked Features</span>
                            </div>
                            <p className="text-xs text-neutral-500">A4 Ratio, Logo placement, Footer, and QR Code position are standardized.</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-neutral-200 flex flex-col gap-4 mt-6">
                        <button
                            onClick={handleDownloadImage}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-black text-white rounded-lg font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 shadow-lg shadow-black/10"
                        >
                            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                            Download HD Image
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black border-2 border-neutral-200 rounded-lg font-bold hover:bg-neutral-50 transition-colors disabled:opacity-50"
                        >
                            {isGenerating ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                            Download PDF
                        </button>
                    </div>
                </div>

                {/* Right Side: Visual Preview */}
                <div className="flex-1 bg-neutral-100 p-8 flex items-center justify-center overflow-hidden relative min-h-[600px] md:min-h-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    {/* Scale container to fit screen, but keep A4 aspect ratio */}
                    <div className="relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] scale-[0.45] md:scale-[0.65] lg:scale-[0.75] xl:scale-[0.8] transition-transform origin-center my-8 md:my-0">
                        {/* POSTER CANVAS */}
                        <div
                            ref={posterRef}
                            className={`w-[600px] h-[848px] ${currentStyle.containerBg} relative flex flex-col transition-colors duration-300 overflow-hidden`}
                        >
                            {/* 1. Top Bar: Branding */}
                            <div className="absolute top-0 right-0 w-full p-8 z-10 flex justify-end">
                                <div className={`${currentStyle.brandingBg} px-6 py-3 inline-block rounded-sm shadow-sm`}>
                                    <h1 className={`text-2xl font-black tracking-widest ${currentStyle.brandingText} uppercase`} style={{ fontFamily: 'sans-serif' }}>
                                        NBF HOMES
                                    </h1>
                                </div>
                            </div>

                            {/* 2. Main Content Area */}
                            <div className="flex-1 px-12 pt-36 pb-0 flex flex-col justify-center"> {/* Added justify-center for vertical centering since subtext is gone */}

                                {/* Dramatic Typography with Dynamic Sizing */}
                                <div className="flex-1 flex flex-col justify-center items-center space-y-6"> {/* Centered alignment */}
                                    <h2
                                        className={`${getHeadlineFontSize(headline)} font-black leading-[1.1] tracking-tight ${currentStyle.headlineColor} text-center`}
                                        style={{ wordBreak: 'break-word', fontFamily: 'sans-serif' }}
                                    >
                                        {headline}
                                    </h2>
                                </div>
                            </div>


                            {/* 3. QR Code Section - Bottom 30% Fixed Area */}
                            <div className="h-[30%] flex flex-col items-center justify-center pb-8">
                                <div className="p-4 bg-white rounded-xl shadow-2xl">
                                    <QRCodeCanvas
                                        value={finalQrUrl}
                                        size={220}
                                        level={"Q"}
                                        includeMargin={false}
                                        bgColor={currentStyle.qrBg}
                                        fgColor={currentStyle.qrFg}
                                        imageSettings={{
                                            src: "/icon.png",
                                            height: 48,
                                            width: 48,
                                            excavate: true,
                                        }}
                                    />
                                </div>
                                <div className="mt-4 flex flex-col items-center">
                                    <p className={`text-sm font-black uppercase tracking-[0.2em] ${currentStyle.accentColor} mb-1`}>
                                        Scan for details
                                    </p>
                                    {mode === 'catalog' && (
                                        <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800`}>
                                            Full Catalog
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 4. Footer Branding (Locked & Professional) */}
                            <div className="h-20 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-10 shrink-0">
                                <div className="text-neutral-400 text-xs font-medium tracking-wider">
                                    POWERED BY <span className="text-white font-bold ml-1">NBF</span>
                                </div>
                                <div className="text-white text-sm font-bold tracking-widest uppercase">
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
