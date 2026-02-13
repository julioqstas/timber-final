'use client';

// ============================================================================
// EstimatorSheet — Bottom Sheet for Impact Simulation
// Replaces EstimatorPanel (embedded) and legacy sheet-estimator (app.js)
// ============================================================================

import { useState, useMemo } from 'react';
import { MAX_LOAD_PT } from '@/types/timber';
import { calculatePT } from '@/lib/calculations';
import { formatPT, formatPct } from '@/lib/formatters';
import type { LoadBalance, PackageLine } from '@/types/timber';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface EstimatorSheetProps {
    currentBalance: LoadBalance;
    onClose: () => void;
    onConvertToPackage: (lines: PackageLine[]) => void;
}

interface EstimatorLine {
    id: number;
    largo: string;
    piezas: string;
    pt: number;
}

export function EstimatorSheet({ currentBalance, onClose, onConvertToPackage }: EstimatorSheetProps) {
    // State for multiple lines (Legacy "Game Lines")
    const [lines, setLines] = useState<EstimatorLine[]>([
        { id: 1, largo: '', piezas: '', pt: 0 },
        { id: 2, largo: '', piezas: '', pt: 0 },
        { id: 3, largo: '', piezas: '', pt: 0 }
    ]);

    const updateLine = (id: number, field: 'largo' | 'piezas', val: string) => {
        setLines(prev => prev.map(line => {
            if (line.id !== id) return line;

            const newLine = { ...line, [field]: val };
            const l = parseInt(newLine.largo) || 0;
            const p = parseInt(newLine.piezas) || 0;
            newLine.pt = (l > 0 && p > 0) ? calculatePT(l, p) : 0;
            return newLine;
        }));
    };

    const removeLine = (id: number) => {
        setLines(prev => prev.filter(l => l.id !== id));
    };

    const addLine = () => {
        setLines(prev => [...prev, { id: Date.now(), largo: '', piezas: '', pt: 0 }]);
    };

    // Handler for conversion
    const handleConvert = () => {
        const validLines: PackageLine[] = lines
            .filter(l => l.pt > 0)
            .map(l => ({
                largo: parseInt(l.largo) || 0,
                piezas: parseInt(l.piezas) || 0,
                pt: l.pt
            }));

        if (validLines.length === 0) {
            alert("Añade líneas válidas primero.");
            return;
        }

        onConvertToPackage(validLines);
    };

    // Computed Simulation
    const simulation = useMemo(() => {
        let draftPT = 0;
        // Start from current balance
        const current = { ...currentBalance };
        let sPT = current.shortPT;
        let mPT = current.mediumPT;
        let lPT = current.longPT;

        lines.forEach(line => {
            draftPT += line.pt;
            const l = parseInt(line.largo) || 0;
            if (l > 0 && line.pt > 0) {
                if (l <= 9) sPT += line.pt;
                else if (l <= 12) mPT += line.pt;
                else lPT += line.pt;
            }
        });

        const totalPT = current.totalPT + draftPT;

        return {
            draftPT,
            totalPT,
            shortPct: totalPT > 0 ? (sPT / totalPT) * 100 : 0,
            mediumPct: totalPT > 0 ? (mPT / totalPT) * 100 : 0,
            longPct: totalPT > 0 ? (lPT / totalPT) * 100 : 0,
        };
    }, [currentBalance, lines]);

    // Visuals
    const gap = MAX_LOAD_PT - simulation.totalPT;
    const isOver = gap < 0;
    const progress = Math.min((simulation.totalPT / MAX_LOAD_PT) * 100, 100);

    const footer = (
        <div className="flex flex-col gap-3">
            <div className="flex justify-end text-sm text-gray-500">
                Borrador: <strong className="ml-2 text-brand font-extrabold text-lg">{formatPT(simulation.draftPT)} pt</strong>
            </div>
            <button
                onClick={handleConvert}
                className={`w-full py-4 font-extrabold rounded-2xl shadow-lg active:scale-[0.98] transition-all border-none cursor-pointer ${simulation.draftPT > 0
                    ? 'bg-brand text-white opacity-100'
                    : 'bg-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                    }`}
                disabled={simulation.draftPT <= 0}
            >
                ✅ CONVERTIR EN PAQUETE
            </button>
        </div>
    );

    return (
        <BottomSheet
            isOpen={true}
            onClose={onClose}
            title="Estimador de Carga"
            footer={footer}
        >
            <div className="space-y-5 pb-4">
                {/* Impact Panel (Sticky-ish) */}
                <div className="bg-surface-card rounded-card p-4 shadow-sm border border-black/[0.02]">
                    {/* Progress Bar */}
                    <div className="bg-gray-200 rounded-full h-3 w-full mb-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ${isOver ? 'bg-danger' : 'bg-brand'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Text Stats */}
                    <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold text-sm ${isOver ? 'text-danger' : 'text-timber-dark'}`}>
                            {isOver ? `Exceso: ${formatPT(Math.abs(gap))} PT` : `Faltan: ${formatPT(gap)} PT`}
                        </span>
                        <span className="text-xs text-gray-500">
                            Total: <span className="font-bold text-timber-dark">{formatPT(simulation.totalPT)}</span>
                        </span>
                    </div>

                    {/* Percentages */}
                    <div className="flex justify-between text-xs font-bold pt-2 border-t border-gray-100">
                        <span className="text-v-corto">Cortos: {formatPct(simulation.shortPct)}%</span>
                        <span className="text-v-medio">Medios: {formatPct(simulation.mediumPct)}%</span>
                        <span className="text-v-largo">Largos: {formatPct(simulation.longPct)}%</span>
                    </div>
                </div>

                {/* Input Table */}
                <div>
                    <div className="flex text-xs font-bold text-gray-400 mb-2 px-1">
                        <div className="w-[28%] pl-2">LARGO</div>
                        <div className="w-[42%]">PIEZAS</div>
                        <div className="flex-1 text-right">IMPACTO</div>
                        <div className="w-8"></div>
                    </div>

                    <div className="space-y-2">
                        {lines.map((line) => (
                            <div key={line.id} className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    placeholder="L"
                                    className="w-[28%] p-3 rounded-xl border border-gray-200 font-bold text-center outline-none focus:border-brand bg-white"
                                    value={line.largo}
                                    onChange={(e) => updateLine(line.id, 'largo', e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Pz"
                                    className="w-[42%] p-3 rounded-xl border border-gray-200 font-bold text-center outline-none focus:border-brand bg-white"
                                    value={line.piezas}
                                    onChange={(e) => updateLine(line.id, 'piezas', e.target.value)}
                                />
                                <div className={`flex-1 text-right font-bold text-sm ${line.pt > 0 ? 'text-brand' : 'text-gray-300'}`}>
                                    +{formatPT(line.pt)}
                                </div>
                                <button
                                    onClick={() => removeLine(line.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-danger rounded-full active:bg-gray-100"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addLine}
                        className="mt-4 w-full py-3 text-sm font-bold text-brand bg-brand-light rounded-xl hover:bg-green-100 transition-colors border-none cursor-pointer"
                    >
                        + Añadir Línea de Juego
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
}
