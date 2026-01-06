import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
    fullScreen?: boolean;
}

export function ErrorMessage({
    title = "Something went wrong",
    message = "We encountered an issue while loading the data. Please try again.",
    onRetry,
    className,
    fullScreen = false
}: ErrorMessageProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300",
            fullScreen ? "min-h-[60vh]" : "h-full min-h-[200px] w-full bg-red-50/50 rounded-lg border border-red-100",
            className
        )}>
            <div className="rounded-full bg-red-100 p-4 mb-4 shadow-sm">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
            <p className="text-neutral-500 max-w-sm mb-6">{message}</p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline" className="gap-2 hover:bg-neutral-100 transition-all active:scale-95">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </Button>
            )}
        </div>
    );
}
