
import { useEffect } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    fullHeight?: boolean;
}

export function BottomSheet({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className = "",
    fullHeight = false
}: BottomSheetProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-auto animate-fade-in"
                onClick={onClose}
            />

            {/* Sheet Container */}
            <div
                className={`w-full max-w-[480px] mx-auto bg-surface-app rounded-t-sheet shadow-2xl z-[201] pointer-events-auto transform transition-transform animate-slide-up flex flex-col overflow-hidden max-h-[90vh] ${fullHeight ? 'h-[92vh]' : ''
                    } ${className}`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0 bg-surface-app sticky top-0 z-10">
                    <span className="font-bold text-xl text-timber-dark">
                        {title}
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-danger transition-colors cursor-pointer border-none"
                    >
                        <span className="text-xl leading-none">&times;</span>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {children}
                </div>

                {/* Footer - Fixed at bottom if provided */}
                {footer && (
                    <div className="p-5 pt-3 bg-surface-app border-t border-gray-100 shrink-0 safe-area-bottom pb-8">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
