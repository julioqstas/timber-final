// ============================================================================
// Smart Excel Export — Generates & Shares/Downloads a load report
// Uses SheetJS (xlsx) for workbook creation
// ============================================================================

import * as XLSX from 'xlsx';
import type { Package } from '@/types/timber';
import { calculateLoadBalance } from './calculations';

const PT_TO_M3 = 0.002359737;

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate and export an Excel report for a load.
 *
 * Mobile → navigator.share (WhatsApp, Telegram, etc.)
 * Desktop → Direct download
 *
 * @param loadName   — Name of the load (e.g. "Carga 001-2026")
 * @param packages   — All packages belonging to that load
 * @param isHistory  — Whether the load is dispatched/closed
 */
export async function smartExportLoad(
    loadName: string,
    packages: Package[],
    isHistory: boolean
): Promise<void> {
    // 1. Build workbook
    const wb = XLSX.utils.book_new();

    // --- Sheet 1: Resumen (Distribution by Length) ---
    buildSummarySheet(wb, loadName, packages, isHistory);

    // --- Sheet 2: Lista de Paquetes ---
    buildPackageListSheet(wb, packages);

    // 2. Generate file buffer
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbOut], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileName = `${loadName.replace(/\s+/g, '_')}_Reporte.xlsx`;

    // 3. Smart action: Share or Download
    const file = new File([blob], fileName, { type: blob.type });

    if (canNativeShare(file)) {
        try {
            await navigator.share({
                files: [file],
                title: `Reporte ${loadName}`,
                text: `Reporte de carga: ${loadName}`,
            });
            return; // Shared successfully
        } catch (err: any) {
            // User cancelled or share failed → fall through to download
            if (err.name === 'AbortError') return; // User cancelled, do nothing
        }
    }

    // Fallback: Direct download
    downloadBlob(blob, fileName);
}

// ============================================================================
// Sheet Builders
// ============================================================================

function buildSummarySheet(
    wb: XLSX.WorkBook,
    loadName: string,
    packages: Package[],
    isHistory: boolean
) {
    const balance = calculateLoadBalance(packages);
    const estado = isHistory ? 'Despachado' : 'En Proceso';

    // Aggregate by length (7–20)
    const lengthData: Record<number, { piezas: number; pt: number }> = {};
    for (let i = 7; i <= 20; i++) lengthData[i] = { piezas: 0, pt: 0 };

    packages.forEach(p => {
        p.contenido.forEach(c => {
            if (lengthData[c.largo]) {
                lengthData[c.largo].piezas += c.piezas;
                lengthData[c.largo].pt += c.pt;
            }
        });
    });

    // Subtotals
    const short = { pz: 0, pt: 0 };
    const medium = { pz: 0, pt: 0 };
    const long = { pz: 0, pt: 0 };
    for (let i = 7; i <= 9; i++) { short.pz += lengthData[i].piezas; short.pt += lengthData[i].pt; }
    for (let i = 10; i <= 12; i++) { medium.pz += lengthData[i].piezas; medium.pt += lengthData[i].pt; }
    for (let i = 13; i <= 20; i++) { long.pz += lengthData[i].piezas; long.pt += lengthData[i].pt; }

    const totalPT = balance.totalPT;
    const pct = (pt: number) => totalPT > 0 ? Math.round((pt / totalPT) * 1000) / 10 : 0;

    // Build rows
    const rows: (string | number)[][] = [
        ['REPORTE DE CARGA'],
        [],
        ['Carga:', loadName],
        ['Estado:', estado],
        ['Total PT:', round2(totalPT)],
        ['Total M³:', round3(totalPT * PT_TO_M3)],
        ['Paquetes:', packages.length],
        [],
        ['DISTRIBUCIÓN POR LARGOS'],
        ['Medida', 'Piezas', 'PT Neto', '%'],
    ];

    // Individual lengths with subtotals
    for (let i = 7; i <= 20; i++) {
        const d = lengthData[i];
        if (d.pt > 0) {
            rows.push([`21x145x ${i}'`, d.piezas, round2(d.pt), `${pct(d.pt)}%`]);
        }
        if (i === 9) rows.push(['CORTOS (7-9)', short.pz, round2(short.pt), `${pct(short.pt)}%`]);
        if (i === 12) rows.push(['MEDIOS (10-12)', medium.pz, round2(medium.pt), `${pct(medium.pt)}%`]);
    }
    rows.push(['LARGOS (13+)', long.pz, round2(long.pt), `${pct(long.pt)}%`]);
    rows.push([]);
    rows.push(['TOTAL', short.pz + medium.pz + long.pz, round2(totalPT), '100%']);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 14 },
        { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
}

function buildPackageListSheet(wb: XLSX.WorkBook, packages: Package[]) {
    const rows: (string | number)[][] = [
        ['DETALLE DE PAQUETES'],
        [],
        ['Código', 'Largo', 'Especie', 'Acabado', 'Cert.', 'Piezas', 'PT', 'M³'],
    ];

    let totalPiezas = 0;
    let totalPT = 0;

    packages.forEach(pkg => {
        const pkgPiezas = pkg.contenido.reduce((s, c) => s + c.piezas, 0);
        totalPiezas += pkgPiezas;
        totalPT += pkg.ptTotal;

        // Sort content lines by largo
        const sorted = [...pkg.contenido].sort((a, b) => a.largo - b.largo);

        sorted.forEach((line, idx) => {
            const m3Line = line.pt * PT_TO_M3;
            rows.push([
                idx === 0 ? pkg.id : '',               // Code only on first line
                `21x145x ${line.largo}'`,               // Largo
                idx === 0 ? pkg.species : '',           // Species only on first line
                idx === 0 ? pkg.finish : '',            // Finish only on first line
                idx === 0 ? pkg.cert : '',              // Cert only on first line
                line.piezas,                            // Piezas for this largo
                round2(line.pt),                        // PT for this largo
                round3(m3Line),                         // M³ for this largo
            ]);
        });

        // Package subtotal row
        rows.push([
            `  ▸ ${pkg.id} Total`,
            '',
            '',
            '',
            '',
            pkgPiezas,
            round2(pkg.ptTotal),
            round3(pkg.ptTotal * PT_TO_M3),
        ]);

        // Separator
        rows.push([]);
    });

    // Grand total
    rows.push(['TOTAL CARGA', '', '', '', '', totalPiezas, round2(totalPT), round3(totalPT * PT_TO_M3)]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws['!cols'] = [
        { wch: 18 },  // Código / Subtotal label
        { wch: 16 },  // Largo
        { wch: 14 },  // Especie
        { wch: 12 },  // Acabado
        { wch: 12 },  // Cert
        { wch: 10 },  // Piezas
        { wch: 14 },  // PT
        { wch: 12 },  // M³
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Paquetes');
}

// ============================================================================
// Helpers
// ============================================================================

function canNativeShare(file: File): boolean {
    try {
        return (
            typeof navigator !== 'undefined' &&
            typeof navigator.canShare === 'function' &&
            navigator.canShare({ files: [file] })
        );
    } catch {
        return false;
    }
}

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}
