'use client';

// ============================================================================
// LoadsTable — Desktop table view for Cargas
// Shows loads as table rows instead of cards on md+ screens
// ============================================================================

import type { Package } from '@/types/timber';
import { formatPT } from '@/lib/formatters';
import { calculateLoadProgress, getLoadStatusColor } from '@/lib/calculations';

interface LoadsTableProps {
    loads: string[];
    packages: Package[];
    isHistory?: boolean;
    onClickLoad: (name: string) => void;
    onUnlock?: (name: string) => void;
}

export function LoadsTable({
    loads,
    packages,
    isHistory = false,
    onClickLoad,
    onUnlock,
}: LoadsTableProps) {
    if (loads.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Carga</th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Estado</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Paquetes</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Total PT</th>
                        {!isHistory && (
                            <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider w-[140px]">Progreso</th>
                        )}
                        {isHistory && onUnlock && (
                            <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider w-[80px]"></th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {loads.map((loadName, i) => {
                        const loadPkgs = packages.filter((p) => p.destino === loadName);
                        const totalPT = loadPkgs.reduce((sum, p) => sum + p.ptTotal, 0);
                        const pct = calculateLoadProgress(totalPT);
                        const pctRounded = Math.round(pct);
                        const statusColor = isHistory ? 'gray' : getLoadStatusColor(pct);

                        const colorMap: Record<string, { text: string; bg: string; bgLight: string }> = {
                            brand: { text: 'text-brand', bg: 'bg-brand', bgLight: 'bg-brand-light' },
                            warning: { text: 'text-warning', bg: 'bg-warning', bgLight: 'bg-amber-50' },
                            accent: { text: 'text-accent', bg: 'bg-accent', bgLight: 'bg-blue-50' },
                            gray: { text: 'text-gray-400', bg: 'bg-gray-400', bgLight: 'bg-gray-100' },
                        };
                        const colors = colorMap[statusColor];
                        const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

                        return (
                            <tr
                                key={loadName}
                                className={`border-b border-gray-100 hover:bg-brand-light/40 transition-colors cursor-pointer ${rowBg}`}
                                onClick={() => onClickLoad(loadName)}
                            >
                                <td className="px-5 py-4 font-bold text-gray-800">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-lg">{isHistory ? '🔒' : '🚚'}</span>
                                        <span>{loadName}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${colors.bgLight} ${colors.text}`}>
                                        {isHistory ? 'Despachado' : 'En Proceso'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right font-semibold text-gray-700">
                                    {loadPkgs.length}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-gray-800">
                                    {formatPT(totalPT)}
                                </td>
                                {!isHistory && (
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${colors.bg}`}
                                                    style={{ width: `${pctRounded}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-bold min-w-[36px] text-right ${colors.text}`}>
                                                {pctRounded}%
                                            </span>
                                        </div>
                                    </td>
                                )}
                                {isHistory && onUnlock && (
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onUnlock(loadName);
                                            }}
                                            className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-95 transition-all mx-auto"
                                            title="Reabrir carga"
                                        >
                                            🔓
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
