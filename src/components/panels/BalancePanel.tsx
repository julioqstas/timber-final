'use client';

// ============================================================================
// BalancePanel — Load Detail Header
// Replaces legacy balance-card-white (app.js:380-410)
// ============================================================================

import type { LoadBalance } from '@/types/timber';
import { formatPT, formatM3, formatPct } from '@/lib/formatters';

interface BalancePanelProps {
    balance: LoadBalance;
}

export function BalancePanel({ balance }: BalancePanelProps) {
    return (
        <div className="bg-white rounded-card p-5 shadow-balance border border-black/[0.02] mb-6">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="w-[30px] h-[30px] bg-surface-app text-brand rounded-icon flex items-center justify-center text-sm">
                    🚚
                </div>
                <span className="font-extrabold text-timber-dark text-base tracking-tight">
                    Balance de Carga
                </span>
            </div>

            <div className="flex items-baseline gap-2 mb-5">
                <span className="text-[1.8rem] font-extrabold text-timber-dark tracking-tight leading-none">
                    {formatPT(balance.totalPT)}
                </span>
                <span className="text-base font-semibold text-gray-400">PT</span>
                <span className="ml-auto text-base font-medium text-gray-400 font-mono">
                    {formatM3(balance.totalM3)} m³
                </span>
            </div>

            <div className="space-y-2">
                {/* Cortos */}
                <div className="flex justify-between items-center text-[0.85rem]">
                    <div className="flex items-center">
                        <span className="status-dot bg-v-corto" />
                        <span className="font-semibold text-gray-600">Cortos (7&apos;-9&apos;)</span>
                    </div>
                    <span className="font-bold font-mono text-v-corto">
                        {formatPT(balance.shortPT)} PT ({formatPct(balance.shortPct)}%)
                    </span>
                </div>

                {/* Medios */}
                <div className="flex justify-between items-center text-[0.85rem]">
                    <div className="flex items-center">
                        <span className="status-dot bg-v-medio" />
                        <span className="font-semibold text-gray-600">
                            Medios (10&apos;-12&apos;)
                        </span>
                    </div>
                    <span className="font-bold font-mono text-v-medio">
                        {formatPT(balance.mediumPT)} PT ({formatPct(balance.mediumPct)}%)
                    </span>
                </div>

                {/* Largos */}
                <div className="flex justify-between items-center text-[0.85rem]">
                    <div className="flex items-center">
                        <span className="status-dot bg-v-largo" />
                        <span className="font-semibold text-gray-600">Largos (13&apos;+)</span>
                    </div>
                    <span className="font-bold font-mono text-v-largo">
                        {formatPT(balance.longPT)} PT ({formatPct(balance.longPct)}%)
                    </span>
                </div>
            </div>
        </div>
    );
}
