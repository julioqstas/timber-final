'use client';

// ============================================================================
// PackageCard — Molecule Component
// Replaces legacy innerHTML generation in renderLoadDetail() (app.js:399)
// ============================================================================

import type { Package } from '@/types/timber';
import { formatPT } from '@/lib/formatters';

interface PackageCardProps {
    /** The package data to display */
    pkg: Package;
    /** Whether the package is in a dispatched/history load (read-only) */
    locked?: boolean;
    /** Callback when the edit button or card is clicked */
    onEdit?: (id: string) => void;
}

export function PackageCard({ pkg, locked = false, onEdit }: PackageCardProps) {
    const handleClick = () => {
        if (!locked && onEdit) onEdit(pkg.id);
    };

    return (
        <div
            className={`
        relative rounded-[14px] p-4 mb-3 border shadow-sm transition-colors
        ${locked
                    ? 'opacity-70 bg-[#fcfcfc] pointer-events-none'
                    : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer active:scale-[0.99]'
                }
      `}
            onClick={handleClick}
        >
            {/* Header: ID + Edit Button */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-extrabold text-gray-800 tracking-tight">
                    {pkg.id}
                </span>
                {!locked && (
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
            <div className="flex flex-wrap gap-1.5 mb-3">
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
