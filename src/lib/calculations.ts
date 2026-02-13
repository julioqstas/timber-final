// ============================================================================
// FQ System V32 → Next.js Migration
// Business Logic — Pure Functions (Zero Side Effects)
// ============================================================================

import type {
    Package,
    PackageLine,
    LoadBalance,
    LengthSummaryRow,
    LengthSubtotal,
    LengthCategory,
    ReportsData,
    AppConfig,
} from '@/types/timber';

import {
    CROSS_SECTION,
    LENGTH_THRESHOLDS,
    PT_TO_M3_FACTOR,
    MAX_LOAD_PT,
} from '@/types/timber';

// ============================================================================
// Core Calculations
// ============================================================================

/**
 * Calculate board-feet (PT) for a single content line.
 *
 * Formula: (width × height × (largo_ft × 304.8) × piezas / 1,000,000,000 × 424)
 * Rounded to 3 decimal places.
 *
 * Replaces legacy: `function calcPT(l, p) { return Math.round((21 * 145 * (l * 304.8) * p / 1000000000 * 424) * 1000) / 1000; }`
 *
 * @param largo  — Length in feet
 * @param piezas — Number of pieces
 * @returns Board-feet (PT) rounded to 3 decimals
 */
export function calculatePT(largo: number, piezas: number): number {
    const { width, height } = CROSS_SECTION;
    const largoMM = largo * 304.8; // Convert feet to mm
    const volumeMM3 = width * height * largoMM * piezas;
    const pt = (volumeMM3 / 1_000_000_000) * PT_TO_M3_FACTOR;
    return Math.round(pt * 1000) / 1000;
}

/**
 * Classify a length (in feet) into its category.
 *
 * Business rule:
 *   - Cortos:  7'–9'  (largo ≤ 9)
 *   - Medios: 10'–12' (largo 10–12)
 *   - Largos: 13'+    (largo ≥ 13)
 */
export function classifyLength(largo: number): LengthCategory {
    if (largo <= LENGTH_THRESHOLDS.shortMax) return 'short';
    if (largo <= LENGTH_THRESHOLDS.mediumMax) return 'medium';
    return 'long';
}

// ============================================================================
// Load Analysis
// ============================================================================

/**
 * Calculate the full balance breakdown for a set of packages.
 * Returns total PT, m³, and the Cortos/Medios/Largos split with percentages.
 *
 * Replaces the inline logic in legacy `renderLoadDetail()` (lines 383–410).
 */
export function calculateLoadBalance(packages: Package[]): LoadBalance {
    let totalPT = 0;
    let shortPT = 0;
    let mediumPT = 0;
    let longPT = 0;

    packages.forEach((pkg) => {
        totalPT += pkg.ptTotal;
        pkg.contenido.forEach((line) => {
            const category = classifyLength(line.largo);
            if (category === 'short') shortPT += line.pt;
            else if (category === 'medium') mediumPT += line.pt;
            else longPT += line.pt;
        });
    });

    const safeDivide = (v: number) =>
        totalPT > 0 ? (v / totalPT) * 100 : 0;

    return {
        totalPT,
        totalM3: totalPT / PT_TO_M3_FACTOR,
        shortPT,
        mediumPT,
        longPT,
        shortPct: safeDivide(shortPT),
        mediumPct: safeDivide(mediumPT),
        longPct: safeDivide(longPT),
    };
}

/**
 * Calculate the load fill percentage (0–100%).
 * Capped at 100% for progress bar display.
 */
export function calculateLoadProgress(totalPT: number): number {
    return Math.min((totalPT / MAX_LOAD_PT) * 100, 100);
}

/**
 * Determine the status color for a load based on fill percentage.
 *
 * Replaces legacy inline logic (line 107):
 *   pct >= 95 → brand (green), pct > 20 → warning (orange), else → blue
 */
export function getLoadStatusColor(
    pct: number
): 'brand' | 'warning' | 'accent' {
    if (pct >= 95) return 'brand';
    if (pct > 20) return 'warning';
    return 'accent';
}

// ============================================================================
// Summary Table (Resumen Tab)
// ============================================================================

/**
 * Generate the length distribution summary for a set of packages.
 * Returns one row per length (7–20) plus subtotals for each category.
 *
 * Replaces legacy `renderSummaryTable()` (lines 594–654).
 */
export function calculateLengthDistribution(packages: Package[]): {
    rows: LengthSummaryRow[];
    subtotals: LengthSubtotal[];
} {
    const totalPT = packages.reduce((sum, p) => sum + p.ptTotal, 0);

    // Initialize map for lengths 7–20
    const data: Record<number, { piezas: number; pt: number }> = {};
    for (let i = 7; i <= 20; i++) {
        data[i] = { piezas: 0, pt: 0 };
    }

    // Accumulate
    packages.forEach((pkg) => {
        pkg.contenido.forEach((line) => {
            if (data[line.largo]) {
                data[line.largo].piezas += line.piezas;
                data[line.largo].pt += line.pt;
            }
        });
    });

    // Build rows
    const rows: LengthSummaryRow[] = [];
    const subs = {
        short: { piezas: 0, pt: 0 },
        medium: { piezas: 0, pt: 0 },
        long: { piezas: 0, pt: 0 },
    };

    for (let i = 7; i <= 20; i++) {
        const row = data[i];
        const pct = totalPT > 0 ? (row.pt / totalPT) * 100 : 0;
        rows.push({ largo: i, piezas: row.piezas, pt: row.pt, pct });

        const cat = classifyLength(i);
        subs[cat].piezas += row.piezas;
        subs[cat].pt += row.pt;
    }

    const subtotals: LengthSubtotal[] = [
        {
            label: 'CORTOS (7-9)',
            category: 'short',
            piezas: subs.short.piezas,
            pt: subs.short.pt,
            pct: totalPT > 0 ? (subs.short.pt / totalPT) * 100 : 0,
        },
        {
            label: 'MEDIOS (10-12)',
            category: 'medium',
            piezas: subs.medium.piezas,
            pt: subs.medium.pt,
            pct: totalPT > 0 ? (subs.medium.pt / totalPT) * 100 : 0,
        },
        {
            label: 'LARGOS (13+)',
            category: 'long',
            piezas: subs.long.piezas,
            pt: subs.long.pt,
            pct: totalPT > 0 ? (subs.long.pt / totalPT) * 100 : 0,
        },
    ];

    return { rows, subtotals };
}

// ============================================================================
// Reports
// ============================================================================

/**
 * Calculate aggregated report KPIs from the full dataset.
 *
 * Replaces legacy `renderReports()` (lines 307–317).
 */
export function calculateReports(
    packages: Package[],
    config: AppConfig
): ReportsData {
    const stock = packages.filter((p) => p.destino === 'Stock Libres');
    const active = packages.filter((p) =>
        config.activeLoads.includes(p.destino)
    );
    const shipped = packages.filter(
        (p) =>
            config.historyLoads.includes(p.destino) || p.destino === 'Despachado'
    );

    const sumPT = (arr: Package[]) => arr.reduce((s, p) => s + p.ptTotal, 0);

    return {
        totalPT: sumPT(packages),
        activePT: sumPT(active),
        stockPT: sumPT(stock),
        shippedPT: sumPT(shipped),
    };
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate the next sequential package ID.
 * Format: "PT-XXXX" where XXXX is the next available number.
 *
 * Replaces legacy `generateNextID()` (lines 123–131).
 *
 * @param packages — Current dataset
 * @returns Next available ID string
 */
export function generateNextPackageId(packages: Package[]): string {
    if (packages.length === 0) return 'PT-1270';

    const ids = packages.map((p) => {
        const num = parseInt(p.id.replace('PT-', ''), 10);
        return isNaN(num) ? 0 : num;
    });

    const maxId = Math.max(...ids, 1269);
    return `PT-${maxId + 1}`;
}

// ============================================================================
// Package Builder (Helper for Creator)
// ============================================================================

/**
 * Build a Package object from creator form data.
 * Pure factory function — no DOM access.
 */
export function buildPackage(params: {
    id: string;
    destino: string;
    species: string;
    finish: string;
    cert: string;
    lines: PackageLine[];
}): Package {
    return {
        id: params.id,
        destino: params.destino,
        species: params.species,
        finish: params.finish,
        cert: params.cert,
        contenido: [...params.lines],
        ptTotal: params.lines.reduce((sum, line) => sum + line.pt, 0),
    };
}
