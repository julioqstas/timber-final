'use client';

// ============================================================================
// ReportsDashboard — Productivity Reports for Management
// Fetches from: vista_paquetes_completa + vista_distribucion_grupos
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Package, BarChart3, Layers, CalendarDays,
    Filter, Loader2, TrendingUp, Target
} from 'lucide-react';
import { CargaMultiSelect } from '@/components/ui/CargaMultiSelect';

// ============================================================================
// Types
// ============================================================================

interface VistaPaquete {
    paquete_id: number;
    codigo_paquete: string;
    nombre_carga: string;
    estado_carga: string;
    fecha_empaquetado: string;
    especie: string;
    total_piezas: number;
    volumen_pt_total: number;
}

interface VistaGrupo {
    nombre_carga: string;
    fecha_empaquetado: string;
    grupo: string;
    orden_visual: number;
    volumen_pt: number;
}

interface DailyData {
    fecha: string;
    volumen: number;
}

interface GrupoBalance {
    grupo: string;
    orden: number;
    volumen: number;
    porcentaje: number;
    meta: number;
    metaLabel: string;
    status: 'ok' | 'alert' | 'warning' | 'info';
    barColor: string;
    textColor: string;
    bgColor: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatNumber(n: number): string {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCompact(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString('en-US');
}

// Traffic-light logic per group
function getGrupoStatus(grupo: string, porcentaje: number): Pick<GrupoBalance, 'status' | 'meta' | 'metaLabel' | 'barColor' | 'textColor' | 'bgColor'> {
    if (grupo.includes('Cortos') || grupo.includes('7')) {
        const ok = porcentaje <= 25;
        return {
            meta: 25,
            metaLabel: 'Meta máx: 25%',
            status: ok ? 'ok' : 'alert',
            barColor: ok ? '#16a34a' : '#dc2626',
            textColor: ok ? 'text-green-600' : 'text-red-600',
            bgColor: ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100',
        };
    }
    if (grupo.includes('Medios') || grupo.includes('10')) {
        return {
            meta: 35,
            metaLabel: 'Ref: 35%',
            status: 'info',
            barColor: '#3b82f6',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50 border-blue-100',
        };
    }
    // Largos
    const ok = porcentaje >= 40;
    return {
        meta: 40,
        metaLabel: 'Meta mín: 40%',
        status: ok ? 'ok' : 'warning',
        barColor: ok ? '#16a34a' : '#f59e0b',
        textColor: ok ? 'text-green-600' : 'text-amber-600',
        bgColor: ok ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100',
    };
}

// ============================================================================
// Component
// ============================================================================

export function ReportsDashboard() {
    // --- State ---
    const [paqData, setPaqData] = useState<VistaPaquete[]>([]);
    const [grupoData, setGrupoData] = useState<VistaGrupo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedLoads, setSelectedLoads] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // --- Fetch Data (both views in parallel) ---
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            setError(null);
            try {
                const [paqRes, grupoRes] = await Promise.all([
                    supabase
                        .from('vista_paquetes_completa')
                        .select('*')
                        .order('fecha_empaquetado', { ascending: true }),
                    supabase
                        .from('vista_distribucion_grupos')
                        .select('*')
                        .order('orden_visual', { ascending: true })
                ]);

                if (paqRes.error) throw paqRes.error;
                if (grupoRes.error) throw grupoRes.error;

                setPaqData(paqRes.data || []);
                setGrupoData(grupoRes.data || []);

                // Default date range
                const rows = paqRes.data || [];
                if (rows.length > 0) {
                    const dates = rows.map(r => r.fecha_empaquetado).filter(Boolean).sort();
                    setDateFrom(dates[0]);
                    setDateTo(dates[dates.length - 1]);
                }
            } catch (e: any) {
                console.error('Reports fetch error:', e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // --- Unique load names ---
    const loadNames = useMemo(() => {
        const names = [...new Set(paqData.map(r => r.nombre_carga).filter(Boolean))];
        return names.sort();
    }, [paqData]);

    // --- Filtered Paquetes ---
    const filtered = useMemo(() => {
        return paqData.filter(row => {
            if (dateFrom && row.fecha_empaquetado < dateFrom) return false;
            if (dateTo && row.fecha_empaquetado > dateTo) return false;
            if (selectedLoads.length > 0 && !selectedLoads.includes(row.nombre_carga)) return false;
            return true;
        });
    }, [paqData, dateFrom, dateTo, selectedLoads]);

    // --- Filtered Grupos ---
    const filteredGrupos = useMemo(() => {
        return grupoData.filter(row => {
            if (dateFrom && row.fecha_empaquetado < dateFrom) return false;
            if (dateTo && row.fecha_empaquetado > dateTo) return false;
            if (selectedLoads.length > 0 && !selectedLoads.includes(row.nombre_carga)) return false;
            return true;
        });
    }, [grupoData, dateFrom, dateTo, selectedLoads]);

    // --- KPIs ---
    const kpis = useMemo(() => {
        const totalPT = filtered.reduce((sum, r) => sum + (r.volumen_pt_total || 0), 0);
        const totalPaquetes = filtered.length;
        const totalPiezas = filtered.reduce((sum, r) => sum + (r.total_piezas || 0), 0);
        return { totalPT, totalPaquetes, totalPiezas };
    }, [filtered]);

    // --- Chart Data: Daily Production ---
    const dailyData: DailyData[] = useMemo(() => {
        const map = new Map<string, number>();
        filtered.forEach(r => {
            const key = r.fecha_empaquetado;
            if (!key) return;
            map.set(key, (map.get(key) || 0) + (r.volumen_pt_total || 0));
        });
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([fecha, volumen]) => ({ fecha, volumen: Math.round(volumen * 100) / 100 }));
    }, [filtered]);

    // --- Balance de Producción por Grupos ---
    const grupoBalance: GrupoBalance[] = useMemo(() => {
        // Aggregate by grupo
        const map = new Map<string, { volumen: number; orden: number }>();
        filteredGrupos.forEach(r => {
            const existing = map.get(r.grupo);
            if (existing) {
                existing.volumen += (r.volumen_pt || 0);
            } else {
                map.set(r.grupo, { volumen: r.volumen_pt || 0, orden: r.orden_visual });
            }
        });

        const totalVol = Array.from(map.values()).reduce((s, v) => s + v.volumen, 0);

        return Array.from(map.entries())
            .sort((a, b) => a[1].orden - b[1].orden)
            .map(([grupo, { volumen, orden }]) => {
                const porcentaje = totalVol > 0 ? (volumen / totalVol) * 100 : 0;
                const statusInfo = getGrupoStatus(grupo, porcentaje);
                return {
                    grupo,
                    orden,
                    volumen: Math.round(volumen * 100) / 100,
                    porcentaje: Math.round(porcentaje * 10) / 10,
                    ...statusInfo
                };
            });
    }, [filteredGrupos]);



    // --- Custom Tooltip ---
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="text-sm font-bold text-brand">
                    {formatNumber(payload[0].value)} PT
                </p>
            </div>
        );
    };

    // =======================================================================
    // RENDER
    // =======================================================================

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 animate-fade-in">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <span className="text-sm text-gray-500 font-medium">Cargando reportes...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-6">
                <p className="text-red-500 text-sm">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ======================== HEADER ======================== */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-brand" />
                        Reportes de Producción
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {filtered.length} registros • {dateFrom} → {dateTo}
                    </p>
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full transition-all ${showFilters || selectedLoads.length > 0
                        ? 'bg-brand text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    <Filter className="w-3.5 h-3.5" />
                    Filtros
                    {selectedLoads.length > 0 && (
                        <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-0.5">
                            {selectedLoads.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ======================== FILTERS ======================== */}
            {showFilters && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100 animate-fade-in">
                    {/* Date Range */}
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none"
                        />
                        <span className="text-gray-300 text-xs">→</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:border-brand focus:ring-1 focus:ring-brand/20 outline-none"
                        />
                    </div>

                    {/* Load Multi-Select */}
                    <CargaMultiSelect
                        todasLasCargas={loadNames}
                        cargasSeleccionadas={selectedLoads}
                        setCargasSeleccionadas={setSelectedLoads}
                    />
                </div>
            )}

            {/* ======================== KPI CARDS ======================== */}
            <div className="grid grid-cols-3 gap-3">
                {/* Total PT */}
                <div className="bg-gradient-to-br from-brand/5 to-brand/10 rounded-2xl p-4 border border-brand/10">
                    <div className="flex items-center gap-1.5 mb-2">
                        <BarChart3 className="w-3.5 h-3.5 text-brand" />
                        <span className="text-[10px] text-brand font-semibold uppercase tracking-wider">Volumen</span>
                    </div>
                    <div className="text-lg font-extrabold text-gray-800 leading-tight">
                        {formatCompact(kpis.totalPT)}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">PT Total</div>
                </div>

                {/* Total Paquetes */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Package className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Paquetes</span>
                    </div>
                    <div className="text-lg font-extrabold text-gray-800 leading-tight">
                        {kpis.totalPaquetes}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Registrados</div>
                </div>

                {/* Total Piezas */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Piezas</span>
                    </div>
                    <div className="text-lg font-extrabold text-gray-800 leading-tight">
                        {formatCompact(kpis.totalPiezas)}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Total</div>
                </div>
            </div>

            {/* ======================== BALANCE DE PRODUCCIÓN ======================== */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand" />
                    Balance de Producción por Grupos
                </h3>
                <p className="text-[10px] text-gray-400 mb-4">
                    Distribución de volumen: Cortos vs Medios vs Largos
                </p>

                {grupoBalance.length > 0 ? (
                    <div className="space-y-3">
                        {grupoBalance.map((g) => {
                            const emoji = g.status === 'ok' ? '✅' : g.status === 'alert' ? '🔴' : g.status === 'warning' ? '⚠️' : '🔵';
                            return (
                                <div
                                    key={g.grupo}
                                    className={`rounded-xl p-3.5 border transition-all ${g.bgColor}`}
                                >
                                    {/* Row 1: Name + Volume */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{emoji}</span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {g.grupo}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-extrabold ${g.textColor}`}>
                                            {formatNumber(g.volumen)} PT
                                        </span>
                                    </div>

                                    {/* Row 2: Progress Bar */}
                                    <div className="relative h-3 bg-gray-200/60 rounded-full overflow-hidden mb-2">
                                        {/* Meta marker line */}
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-gray-400/50 z-10"
                                            style={{ left: `${Math.min(g.meta, 100)}%` }}
                                        />
                                        {/* Actual bar */}
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${Math.min(g.porcentaje, 100)}%`,
                                                backgroundColor: g.barColor
                                            }}
                                        />
                                    </div>

                                    {/* Row 3: Percentage vs Meta */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${g.textColor}`}>
                                            {g.porcentaje}% real
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {g.metaLabel}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400 font-medium">Total Filtrado</span>
                            <span className="text-sm font-extrabold text-gray-700">
                                {formatNumber(grupoBalance.reduce((s, g) => s + g.volumen, 0))} PT
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
                        Sin datos de grupos para el rango seleccionado
                    </div>
                )}
            </div>

            {/* ======================== CHART: DAILY LINE ======================== */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand" />
                    Evolución de Producción Diaria
                </h3>
                <p className="text-[10px] text-gray-400 mb-4">Volumen (PT) agrupado por fecha de empaquetado</p>

                {dailyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={dailyData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="fecha"
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                tickFormatter={(v: string) => {
                                    const parts = v.split('-');
                                    return `${parts[2]}/${parts[1]}`;
                                }}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: '#9ca3af' }}
                                tickFormatter={(v: number) => formatCompact(v)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="volumen"
                                stroke="#16a34a"
                                strokeWidth={2.5}
                                dot={{ fill: '#16a34a', r: 3 }}
                                activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">
                        Sin datos para el rango seleccionado
                    </div>
                )}
            </div>

            {/* Spacer for dock */}
            <div className="h-4" />
        </div>
    );
}
