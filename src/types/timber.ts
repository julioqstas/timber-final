// ============================================================================
// FQ System V32 → Next.js Migration
// Type Definitions — Single Source of Truth
// ============================================================================

/**
 * A single content line within a package.
 * Represents boards of fixed cross-section (21mm × 145mm) at a given length.
 */
export interface PackageLine {
    /** Length in feet (typically 7–20) */
    largo: number;
    /** Number of pieces at this length */
    piezas: number;
    /** Calculated board-feet (PT) for this line */
    pt: number;
}


/**
 * A lumber package — the core data entity.
 * Each package belongs to a load (destino) or to free stock.
 */
export interface Load {
    id: number; // Supabase ID
    name: string; // nombre_carga
    number: string; // nro_interno
    status: 'active' | 'history'; // estado
    date: string; // created_at
}

export interface Package {
    /** Supabase Database ID (internal) */
    dbId?: number;
    /** Unique identifier, format "PT-XXXX" */
    id: string;
    /** Target load name or "Stock Libres" */
    destino: string;
    /** Wood species (e.g., "Pino", "Ciprés") */
    species: string;
    /** Surface finish (e.g., "S4S", "Rough") */
    finish: string;
    /** Certification (e.g., "FSC", "PEFC") */
    cert: string;
    /** Array of content lines (different lengths within the package) */
    contenido: PackageLine[];
    /** Total board-feet — sum of all contenido[].pt */
    ptTotal: number;
}

/**
 * Application configuration — persisted to localStorage.
 * Manages dropdown options and load lifecycle.
 */
export interface AppConfig {
    /** Available wood species for dropdown */
    species: string[];
    /** Available finishes for dropdown */
    finishes: string[];
    /** Available certifications for dropdown */
    certs: string[];
    /** Available product types */
    productTypes: string[];
    /** Available drying/moisture options */
    drying: string[];
    /** Names of loads currently being packed */
    activeLoads: string[];
    /** Names of loads already dispatched */
    historyLoads: string[];
}

// ============================================================================
// Derived/Computed Types
// ============================================================================

/** Length classification categories (business rule) */
export type LengthCategory = 'short' | 'medium' | 'long';

/**
 * Balance breakdown for a load.
 * Used in BalancePanel and Estimator to show PT distribution.
 */
export interface LoadBalance {
    totalPT: number;
    totalM3: number;
    shortPT: number;    // largo ≤ 9
    mediumPT: number;   // largo 10–12
    longPT: number;     // largo ≥ 13
    shortPct: number;
    mediumPct: number;
    longPct: number;
}

/**
 * Summary row for the distribution table (Resumen tab).
 * One entry per length value (7–20).
 */
export interface LengthSummaryRow {
    largo: number;
    piezas: number;
    pt: number;
    pct: number;
}

/**
 * Subtotal group for the summary table.
 */
export interface LengthSubtotal {
    label: string;
    category: LengthCategory;
    piezas: number;
    pt: number;
    pct: number;
}

/**
 * Reports KPI data — computed from the full dataset.
 */
export interface ReportsData {
    totalPT: number;
    activePT: number;
    stockPT: number;
    shippedPT: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum load capacity in PT */
export const MAX_LOAD_PT = 10_600;

/** Conversion factor: PT to m³ */
export const PT_TO_M3_FACTOR = 424;

/** Cross-section dimensions (fixed for this product line) */
export const CROSS_SECTION = {
    width: 21,    // mm
    height: 145,  // mm
} as const;

/** Length classification thresholds */
export const LENGTH_THRESHOLDS = {
    shortMax: 9,   // ≤ 9' = Cortos
    mediumMax: 12,  // 10'–12' = Medios
    // ≥ 13' = Largos
} as const;

/** Default config when no stored data exists */
export const DEFAULT_CONFIG: AppConfig = {
    species: [],
    finishes: [],
    certs: [],
    productTypes: [],
    drying: [],
    activeLoads: [],
    historyLoads: [],
};

/** localStorage keys */
export const STORAGE_KEYS = {
    data: 'FQ_V32_DATA',
    config: 'FQ_V32_CONFIG',
} as const;
