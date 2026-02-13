'use client';

// ============================================================================
// EstimatorPanel — Impact Simulation of Adding Packages
// Replaces legacy updateEstimatorImpact() logic (app.js:416-550)
// ============================================================================

import { useState, useMemo } from 'react';
import { MAX_LOAD_PT } from '@/types/timber';
import { calculatePT, calculateLoadBalance } from '@/lib/calculations';
import { formatPT, formatPct } from '@/lib/formatters';
import type { LoadBalance } from '@/types/timber';

interface EstimatorPanelProps {
    currentBalance: LoadBalance;
}

export function EstimatorPanel({ currentBalance }: EstimatorPanelProps) {
    // Input State
    const [largo, setLargo] = useState<string>('');
    const [piezas, setPiezas] = useState<string>('');
    const [count, setCount] = useState<string>('1');

    // Computed Simulation
    const simulatedBalance = useMemo(() => {
        const l = parseInt(largo) || 0;
        const p = parseInt(piezas) || 0;
        const c = parseInt(count) || 1;

        if (l === 0 || p === 0) return null;

        // Create virtual packages for simulation
        const pkgPT = calculatePT(l, p);
        const newPT = pkgPT * c;

        // Simulate new totals
        const totalPT = currentBalance.totalPT + newPT;

        // Determine category of new packages
        let sPT = currentBalance.shortPT;
        let mPT = currentBalance.mediumPT;
        let lPT = currentBalance.longPT;

        if (l <= 9) sPT += newPT;
        else if (l <= 12) mPT += newPT;
        else lPT += newPT;

        return {
            totalPT,
            totalM3: totalPT / 424, // Approximation for display
            shortPT: sPT,
            mediumPT: mPT,
            longPT: lPT,
            shortPct: (sPT / totalPT) * 100,
            mediumPct: (mPT / totalPT) * 100,
            longPct: (lPT / totalPT) * 100,
        };
    }, [currentBalance, largo, piezas, count]);

    // View Helpers
    const renderImpact = (
        label: string,
        currentVal: number,
        simVal: number,
        isPct = true,
    ) => {
        const diff = simVal - currentVal;
        const color = diff > 0 ? 'text-brand' : diff < 0 ? 'text-danger' : 'text-gray-400';
        const sign = diff > 0 ? '+' : '';
        const fmt = isPct ? formatPct : formatPT;

        return (
            <div className="flex justify-between items-center text-sm py-1">
                <span className="text-gray-500">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{fmt(currentVal)}{isPct ? '%' : ''}</span>
                    <span className="text-gray-300">→</span>
                    <span className={`font-bold ${color}`}>
                        {fmt(simVal)}{isPct ? '%' : ''}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-surface-card rounded-card p-5 shadow-card border border-black/[0.02]">
            <div className="flex items-center gap-2 mb-4 text-timber-dark">
                <span className="text-xl">🧮</span>
                <span className="font-extrabold text-base">Simulador de Impacto</span>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">
                        LARGO
                    </label>
                    <input
                        type="number"
                        value={largo}
                        onChange={(e) => setLargo(e.target.value)}
                        className="w-full p-2.5 rounded-input border border-gray-200 font-bold text-center outline-none focus:border-brand"
                        placeholder="Pies"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">
                        PIEZAS
                    </label>
                    <input
                        type="number"
                        value={piezas}
                        onChange={(e) => setPiezas(e.target.value)}
                        className="w-full p-2.5 rounded-input border border-gray-200 font-bold text-center outline-none focus:border-brand"
                        placeholder="Cant"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">
                        PACKS
                    </label>
                    <input
                        type="number"
                        value={count}
                        onChange={(e) => setCount(e.target.value)}
                        className="w-full p-2.5 rounded-input border border-gray-200 font-bold text-center outline-none focus:border-brand"
                        placeholder="x1"
                    />
                </div>
            </div>

            {/* Results */}
            {simulatedBalance ? (
                <div className="bg-surface-app rounded-lg p-3 space-y-1 animate-fade-in border border-gray-100">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <span className="font-bold text-xs uppercase text-timber-grey">
                            Proyección Total
                        </span>
                        <span
                            className={`font-extrabold text-lg ${simulatedBalance.totalPT > MAX_LOAD_PT
                                    ? 'text-danger'
                                    : 'text-brand'
                                }`}
                        >
                            {formatPT(simulatedBalance.totalPT)} PT
                        </span>
                    </div>

                    {renderImpact('Cortos', currentBalance.shortPct, simulatedBalance.shortPct)}
                    {renderImpact('Medios', currentBalance.mediumPct, simulatedBalance.mediumPct)}
                    {renderImpact('Largos', currentBalance.longPct, simulatedBalance.longPct)}

                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-right text-gray-400">
                        {simulatedBalance.totalPT > MAX_LOAD_PT && (
                            <span className="text-danger font-bold">⚠️ Excede capacidad máxima</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400 text-sm py-4 italic">
                    Ingresa dimensiones para simular
                </div>
            )}
        </div>
    );
}
