'use client';

// ============================================================================
// BentoGrid — Reports KPI Panel
// Replaces legacy view-reports bento-grid (index.html:119-137)
// ============================================================================

import type { ReportsData } from '@/types/timber';
import { formatPT } from '@/lib/formatters';

interface BentoGridProps {
    data: ReportsData;
}

export function BentoGrid({ data }: BentoGridProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {/* Large Card: Total */}
            <div className="col-span-2 bg-surface-card rounded-card p-6 shadow-card border border-black/[0.02] text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-extrabold text-timber-dark tracking-tight">
                    {formatPT(data.totalPT)} pt
                </div>
                <div className="text-xs text-timber-grey font-medium mt-1 uppercase tracking-wider">
                    Total Procesado (PT)
                </div>
            </div>

            {/* Active */}
            <div className="bg-blue-50 rounded-card p-5 shadow-card border border-blue-100">
                <div className="text-lg font-extrabold text-blue-700 tracking-tight">
                    {formatPT(data.activePT)} pt
                </div>
                <div className="text-xs text-blue-500 font-medium mt-1 uppercase tracking-wider">
                    En Proceso
                </div>
            </div>

            {/* Stock */}
            <div className="bg-brand-light rounded-card p-5 shadow-card border border-green-200">
                <div className="text-lg font-extrabold text-brand tracking-tight">
                    {formatPT(data.stockPT)} pt
                </div>
                <div className="text-xs text-brand font-medium mt-1 uppercase tracking-wider">
                    Stock Libre
                </div>
            </div>

            {/* Shipped */}
            <div className="col-span-2 bg-gray-50 rounded-card p-5 shadow-card border border-gray-200">
                <div className="text-lg font-extrabold text-gray-600 tracking-tight">
                    {formatPT(data.shippedPT)} pt
                </div>
                <div className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">
                    Total Despachado
                </div>
            </div>
        </div>
    );
}
