'use client';

// ============================================================================
// StockTable — Desktop table view for Stock/Inventory
// Shows packages as table rows instead of cards on md+ screens
// ============================================================================

import { memo } from 'react';
import type { Package } from '@/types/timber';
import { formatPT } from '@/lib/formatters';

interface StockTableProps {
    packages: Package[];
    isLocked?: boolean;
    onEdit: (id: string) => void;
}

export const StockTable = memo(function StockTable({
    packages,
    isLocked = false,
    onEdit,
}: StockTableProps) {
    if (packages.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Especie</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Acabado</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Cert.</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Líneas</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Piezas</th>
                        <th className="text-right px-5 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider">Total PT</th>
                        {!isLocked && (
                            <th className="text-center px-4 py-3 font-semibold text-gray-500 uppercase text-xs tracking-wider w-[60px]"></th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {packages.map((pkg, i) => {
                        const totalPiezas = pkg.contenido.reduce((sum, l) => sum + l.piezas, 0);
                        const rowBg = i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

                        return (
                            <tr
                                key={pkg.id}
                                className={`border-b border-gray-100 hover:bg-brand-light/40 transition-colors ${!isLocked ? 'cursor-pointer' : ''} ${rowBg}`}
                                onClick={() => !isLocked && onEdit(pkg.id)}
                            >
                                <td className="px-5 py-3.5 font-bold text-gray-800">
                                    {pkg.id}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">
                                    {pkg.species && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                            {pkg.species}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-gray-600">
                                    {pkg.finish && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                            {pkg.finish}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5">
                                    {pkg.cert && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-brand-light text-brand border border-green-200">
                                            {pkg.cert}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 text-right text-gray-600 font-medium">
                                    {pkg.contenido.length}
                                </td>
                                <td className="px-4 py-3.5 text-right text-gray-700 font-semibold">
                                    {totalPiezas.toLocaleString()}
                                </td>
                                <td className="px-5 py-3.5 text-right font-bold text-brand">
                                    {formatPT(pkg.ptTotal)}
                                </td>
                                {!isLocked && (
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(pkg.id);
                                            }}
                                            className="w-8 h-8 rounded-full bg-blue-50 text-accent flex items-center justify-center text-sm border-none cursor-pointer hover:bg-blue-100 active:scale-95 transition-all mx-auto"
                                            aria-label={`Editar ${pkg.id}`}
                                        >
                                            ✏️
                                        </button>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
                {/* Totals footer */}
                <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                        <td className="px-5 py-3 font-bold text-gray-800">Total</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-600">
                            {packages.reduce((s, p) => s + p.contenido.length, 0)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-700">
                            {packages.reduce((s, p) => s + p.contenido.reduce((a, l) => a + l.piezas, 0), 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right font-extrabold text-brand">
                            {formatPT(packages.reduce((s, p) => s + p.ptTotal, 0))}
                        </td>
                        {!isLocked && <td className="px-4 py-3"></td>}
                    </tr>
                </tfoot>
            </table>
        </div>
    );
});
