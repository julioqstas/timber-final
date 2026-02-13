'use client';

// ============================================================================
// PackageCard — Molecule Component
// Replaces legacy innerHTML generation in renderLoadDetail() (app.js:399)
// ============================================================================

import { useState, useRef, useCallback } from 'react';
import type { Package } from '@/types/timber';
import { formatPT } from '@/lib/formatters';
import { Check, Circle } from 'lucide-react';

interface PackageCardProps {
    /** The package data to display */
    pkg: Package;
    /** Whether the package is in a dispatched/history load (read-only) */
    locked?: boolean;
    /** Callback when the edit button or card is clicked (normal mode) */
    onEdit?: (id: string) => void;
    /** Whether selection mode is active */
    selectable?: boolean;
    /** Whether this card is currently selected */
    isSelected?: boolean;
    /** Callback to toggle selection */
    onToggle?: (id: string) => void;
    /** Callback to trigger selection mode (long press) */
    onLongPress?: (id: string) => void;
}

export function PackageCard({
    pkg,
    locked = false,
    onEdit,
    selectable = false,
    isSelected = false,
    onToggle,
    onLongPress
}: PackageCardProps) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startPress = useCallback(() => {
        if (locked) return;
        timerRef.current = setTimeout(() => {
            onLongPress?.(pkg.id);
        }, 600); // 600ms threshold for long press
    }, [locked, onLongPress, pkg.id]);

    const endPress = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleClick = () => {
        if (locked) return;
        if (selectable && onToggle) {
            onToggle(pkg.id);
        } else if (!selectable && onEdit) {
            onEdit(pkg.id);
        }
    };

    return (
        <div
            className={`
        relative rounded-[14px] p-4 mb-3 border shadow-sm transition-all select-none
        ${locked
                    ? 'opacity-70 bg-[#fcfcfc] pointer-events-none'
                    : 'cursor-pointer active:scale-[0.99]'
                }
        ${isSelected
                    ? 'bg-brand-light/30 border-brand ring-1 ring-brand'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }
      `}
            onClick={handleClick}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
            onTouchStart={startPress}
            onTouchEnd={endPress}
        >
            {/* Selection Indicator (only in selection mode) */}
            {selectable && (
                <div className="absolute top-4 right-4 z-10">
                    {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                            <Check size={14} strokeWidth={3} />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
                    )}
                </div>
            )}

            {/* Header: ID + Edit Button (Edit hidden in selection mode) */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-extrabold text-gray-800 tracking-tight">
                    {pkg.id}
                </span>
                {!locked && !selectable && (
                    <button
                        className="w-8 h-8 rounded-full bg-blue-50 text-accent flex items-center justify-center text-base border-none cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(pkg.id);
                        }}
                        aria-label={`Editar ${pkg.id}`}
                    >
                        ✏️
                    </button>
                )}
            </div>

            {/* Tags: Species, Finish, Cert */}
            <div className="flex flex-wrap gap-1.5 mb-3 pr-8">
                {pkg.species && (
                    <span className="text-[0.7rem] font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                        {pkg.species}
                    </span>
                )}
                {pkg.finish && (
                    <span className="text-[0.7rem] font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200">
                        {pkg.finish}
                    </span>
                )}
                {pkg.cert && (
                    <span className="text-[0.7rem] font-semibold px-2 py-1 rounded-md bg-brand-light text-brand border border-green-200">
                        {pkg.cert}
                    </span>
                )}
            </div>

            {/* Content Lines */}
            <div className="border-t border-dashed border-gray-200 pt-2 mb-2">
                {pkg.contenido.map((line, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between text-[0.8rem] text-gray-600 py-0.5 font-sans"
                    >
                        <span className="flex-1">
                            21mm × 145mm × <strong>{line.largo}&apos;</strong>
                        </span>
                        <span className="w-[70px] text-right text-gray-500">
                            = <strong>{line.piezas}</strong> Pz
                        </span>
                        <span className="w-[80px] text-right font-semibold text-black">
                            = <strong>{formatPT(line.pt)}</strong> PT
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer: Total */}
            <div className="flex items-center justify-end border-t border-gray-100 pt-2">
                <span className="text-[0.75rem] text-gray-400 font-semibold uppercase mr-2">
                    Total Paquete
                </span>
                <span className="text-xl font-extrabold text-brand tracking-tight">
                    {formatPT(pkg.ptTotal)} pt
                </span>
            </div>
        </div>
    );
}
