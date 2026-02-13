'use client';

// ============================================================================
// LoadCard — Dashboard load card (dash-card)
// Replaces inline HTML from renderLoadSection() (app.js:96-121)
// ============================================================================

import type { Package } from '@/types/timber';
import { formatPT } from '@/lib/formatters';
import { calculateLoadProgress, getLoadStatusColor } from '@/lib/calculations';
import { MAX_LOAD_PT } from '@/types/timber';

interface LoadCardProps {
    name: string;
    packages: Package[];
    isHistory?: boolean;
    onClick: (name: string) => void;
}

export function LoadCard({
    name,
    packages,
    isHistory = false,
    onClick,
}: LoadCardProps) {
    const totalPT = packages.reduce((sum, p) => sum + p.ptTotal, 0);
    const pct = calculateLoadProgress(totalPT);
    const pctRounded = Math.round(pct);

    // Status styling
    const statusColor = isHistory ? 'gray' : getLoadStatusColor(pct);
    const statusText = isHistory ? 'Despachado' : 'En Proceso';
    const badgeText = isHistory ? 'Despachado' : `${pctRounded}%`;
    const icon = isHistory ? '🔒' : '🚚';

    const colorMap = {
        brand: { text: 'text-brand', bg: 'bg-brand', bgLight: 'bg-brand-light' },
        warning: { text: 'text-warning', bg: 'bg-warning', bgLight: 'bg-amber-50' },
        accent: { text: 'text-accent', bg: 'bg-accent', bgLight: 'bg-blue-50' },
        gray: { text: 'text-gray-400', bg: 'bg-gray-400', bgLight: 'bg-gray-100' },
    };

    const colors = colorMap[statusColor];

    return (
        <div
            className={`
        bg-surface-card rounded-card p-5 mb-4 shadow-card border border-black/[0.02]
        cursor-pointer relative overflow-hidden transition-transform active:scale-[0.98]
        ${isHistory ? 'opacity-70 !bg-gray-50 !border-dashed !border-gray-300' : ''}
      `}
            onClick={() => onClick(name)}
        >
            {/* Header Row */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className={`w-9 h-9 rounded-icon flex items-center justify-center text-xl shrink-0 ${isHistory ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-800'
                        }`}
                >
                    {icon}
                </div>
                <div className="flex-1 flex flex-col">
                    <span className="font-bold text-timber-dark text-[1.05rem]">
                        {name}
                    </span>
                    <span className={`text-xs font-medium mt-0.5 ${colors.text}`}>
                        {statusText}
                    </span>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-[0.8rem] font-extrabold tracking-tight ${colors.bgLight} ${colors.text}`}
                >
                    {badgeText}
                </span>
            </div>

            {/* Subtitle: Count + Total PT */}
            <div className="flex justify-between text-[0.9rem] text-timber-grey font-medium mb-4">
                <span>{packages.length} Paquetes</span>
                <span>{formatPT(totalPT)} pt</span>
            </div>

            {/* Progress Bar (only for active loads) */}
            {!isHistory && (
                <div className="h-2 bg-gray-100 rounded overflow-hidden w-full">
                    <div
                        className={`h-full rounded transition-all duration-500 ease-out ${colors.bg}`}
                        style={{ width: `${pctRounded}%` }}
                    />
                </div>
            )}
        </div>
    );
}
