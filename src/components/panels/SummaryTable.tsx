'use client';

// ============================================================================
// SummaryTable — Load Distribution Table
// Replaces legacy renderSummaryTable (app.js)
// ============================================================================

import { useMemo } from 'react';
import { Package } from '@/types/timber';
import { formatPT, formatPct } from '@/lib/formatters';

interface SummaryTableProps {
    packages: Package[];
}

type StandardRow = { type: 'row'; length: number; pieces: number; pt: number; label?: never };
type SubtotalRow = { type: 'subtotal'; length: number; label: string; pieces: number; pt: number };
type RowData = StandardRow | SubtotalRow;

export function SummaryTable({ packages }: SummaryTableProps) {
    const stats = useMemo(() => {
        // 1. Initialize Map for lengths 7-20
        const data: Record<number, { pieces: number; pt: number }> = {};
        for (let i = 7; i <= 20; i++) {
            data[i] = { pieces: 0, pt: 0 };
        }

        // 2. Aggregate Data
        let totalLoadPT = 0;
        packages.forEach(p => {
            totalLoadPT += p.ptTotal;
            p.contenido.forEach(c => {
                if (data[c.largo]) {
                    data[c.largo].pieces += c.piezas;
                    data[c.largo].pt += c.pt;
                }
            });
        });

        // 3. Helpers for Subtotals
        const sShort = { pieces: 0, pt: 0 };
        const sMed = { pieces: 0, pt: 0 };
        const sLong = { pieces: 0, pt: 0 };

        // 4. Build Rows
        const rows: RowData[] = [];
        for (let i = 7; i <= 20; i++) {
            const d = data[i];
            if (i >= 7 && i <= 9) { sShort.pieces += d.pieces; sShort.pt += d.pt; }
            if (i >= 10 && i <= 12) { sMed.pieces += d.pieces; sMed.pt += d.pt; }
            if (i >= 13 && i <= 20) { sLong.pieces += d.pieces; sLong.pt += d.pt; }

            // Only show row if it has data? Legacy shows all? 
            // Legacy: "for (let i = 7; i <= 20; i++)" -> iterates all.
            // But maybe we can hide empty ones for cleaner UI? 
            // Legacy shows all rows in the loop. Let's stick to legacy or make it cleaner.
            // Let's filter out empty rows to be modern, but keep subtotals accurate.
            if (d.pt > 0) {
                rows.push({ length: i, ...d, type: 'row' });
            }

            // Insert Subtotals
            if (i === 9) rows.push({ length: 0, label: 'CORTOS (7-9)', ...sShort, type: 'subtotal' });
            if (i === 12) rows.push({ length: 0, label: 'MEDIOS (10-12)', ...sMed, type: 'subtotal' });
        }
        rows.push({ length: 0, label: 'LARGOS (13+)', ...sLong, type: 'subtotal' });

        return { rows, totalLoadPT };
    }, [packages]);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm animate-fade-in">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-timber-grey font-bold uppercase text-xs">
                    <tr>
                        <th className="p-3">Medida</th>
                        <th className="p-3 text-right">Pz</th>
                        <th className="p-3 text-right">PT Neto</th>
                        <th className="p-3 text-right">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {stats.rows.map((row, idx) => {
                        const pct = stats.totalLoadPT > 0 ? (row.pt / stats.totalLoadPT) * 100 : 0;

                        if (row.type === 'subtotal') {
                            return (
                                <tr key={`sub-${idx}`} className="bg-brand-light font-bold text-brand-dark">
                                    <td className="p-3">{row.label}</td>
                                    <td className="p-3 text-right">{row.pieces}</td>
                                    <td className="p-3 text-right">{formatPT(row.pt)}</td>
                                    <td className="p-3 text-right">{formatPct(pct)}%</td>
                                </tr>
                            );
                        }

                        return (
                            <tr key={`row-${row.length}`} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-timber-dark">
                                    <span className="text-gray-400 text-xs">21x145x</span> <span className="font-bold">{row.length}'</span>
                                </td>
                                <td className="p-3 text-right font-medium">{row.pieces}</td>
                                <td className="p-3 text-right font-medium">{formatPT(row.pt)}</td>
                                <td className="p-3 text-right text-gray-500">{formatPct(pct)}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
