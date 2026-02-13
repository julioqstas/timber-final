// ============================================================================
// FQ System V32 → Next.js Migration
// Formatting Utilities — Pure Functions
// ============================================================================

/**
 * Format a number as PT (board-feet) with 2 decimal places.
 * Replaces legacy: `const fmt = (n) => n.toLocaleString('en-US', {...})`
 *
 * @example formatPT(1234.5) → "1,234.50"
 */
export function formatPT(n: number): string {
    return n.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Format a number as cubic meters with 3 decimal places.
 * Replaces legacy: `const fmtM3 = (n) => n.toLocaleString('en-US', {...})`
 *
 * @example formatM3(2.5) → "2.500"
 */
export function formatM3(n: number): string {
    return n.toLocaleString('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
    });
}

/**
 * Format a percentage with 1 decimal place.
 *
 * @example formatPct(45.678) → "45.7"
 */
export function formatPct(n: number): string {
    return n.toFixed(1);
}
