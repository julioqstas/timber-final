// ============================================================================
// FQ System V32 → Next.js Migration
// Zustand Store — Supabase Backend Integration
// ============================================================================
// Usage: `'use client'` components only
// ============================================================================

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Package, PackageLine, AppConfig, Load } from '@/types/timber';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '@/types/timber';
import { calculatePT } from '@/lib/calculations';
import { supabase } from '@/lib/supabase';

// ============================================================================
// State Shape
// ============================================================================

interface TimberState {
    // --- Data (Synced with DB) ---
    packages: Package[];
    loads: Load[]; // Cache of loads from DB
    isLoading: boolean;
    error: string | null;

    // --- Config (Persisted Local + DB Sync for lists) ---
    config: AppConfig;

    // --- Session-only ---
    currentLoad: string | null; // Name of selected load
    draftLines: PackageLine[];
    editingId: string | null;

    // --- Actions ---
    fetchInitialData: () => Promise<void>;

    // Package Actions
    addPackage: (pkg: Package) => Promise<void>;
    updatePackage: (id: string, pkg: Package) => Promise<void>;
    deletePackage: (id: string) => Promise<void>;
    deletePackages: (ids: string[]) => Promise<void>;

    // Draft Actions
    addDraftLine: (largo: number, piezas: number) => void;
    removeDraftLine: (index: number) => void;
    setDraftLines: (lines: PackageLine[]) => void;
    clearDraft: () => void;
    setEditingId: (id: string | null) => void;

    // Load Actions
    createLoad: (name: string, number?: string) => Promise<void>;
    deleteLoad: (name: string) => Promise<void>;
    setCurrentLoad: (name: string | null) => void;
    moveLoadToHistory: (name: string) => Promise<void>;
    reopenLoad: (name: string) => Promise<void>;

    // Config Actions
    addConfigItem: (type: keyof AppConfig, value: string) => void;
    removeConfigItem: (type: keyof AppConfig, index: number) => void;
    setConfig: (config: AppConfig) => void;
    resetAll: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useTimberStore = create<TimberState>()(
    persist(
        (set, get) => ({
            // --- Initial State ---
            packages: [],
            loads: [],
            isLoading: false,
            error: null,
            config: { ...DEFAULT_CONFIG },
            currentLoad: null,
            draftLines: [],
            editingId: null,

            // ====================================================================
            // Supabase Sync
            // ====================================================================

            fetchInitialData: async () => {
                set({ isLoading: true, error: null });
                try {
                    // 1. Fetch Loads
                    const { data: loadsData, error: loadsError } = await supabase
                        .from('cargas')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (loadsError) throw loadsError;

                    // Map DB loads to local structure
                    const loads: Load[] = loadsData.map(l => ({
                        id: l.id, // Keep numeric ID for internal use
                        name: l.nombre_carga,
                        number: l.nro_interno,
                        status: l.estado === 'Despachado' ? 'history' : 'active',
                        date: l.created_at,
                    }));

                    // 2. Fetch Packages with Details
                    // Note: Supabase nested select for one-to-many
                    const { data: pkgData, error: pkgError } = await supabase
                        .from('paquetes')
                        .select(`
                            *,
                            cargas (nombre_carga),
                            detalles_paquete (*)
                        `);

                    if (pkgError) throw pkgError;

                    // Map DB packages to local structure
                    const packages: Package[] = pkgData.map((p: any) => ({
                        dbId: p.id,
                        id: p.codigo_paquete,
                        destino: p.cargas?.nombre_carga || 'Stock Libres',
                        species: p.especie,
                        finish: p.acabado,
                        cert: p.certificacion,
                        ptTotal: 0, // Recalculated below
                        contenido: p.detalles_paquete.map((d: any) => ({
                            largo: d.largo_pies,
                            piezas: d.cantidad_piezas,
                            pt: calculatePT(d.largo_pies, d.cantidad_piezas)
                        }))
                    })).map(p => ({
                        ...p,
                        ptTotal: p.contenido.reduce((sum: number, line: PackageLine) => sum + line.pt, 0)
                    }));


                    // 3. Update Store
                    set((state) => ({
                        loads,
                        packages,
                        isLoading: false,
                        // Sync config lists with DB loads
                        config: {
                            ...state.config,
                            activeLoads: loads.filter(l => l.status === 'active').map(l => l.name),
                            historyLoads: loads.filter(l => l.status === 'history').map(l => l.name),
                        }
                    }));

                } catch (err: any) {
                    console.error('Supabase Fetch Error:', err);
                    set({ isLoading: false, error: err.message });
                }
            },

            // ====================================================================
            // Package Actions (Async DB)
            // ====================================================================

            addPackage: async (pkg) => {
                // Optimistic Local Update? Or Wait? 
                // Let's Optimistic for UI speed, but requires rollback on error.
                // For now, simpler: Wait -> Fetch or partial insert.

                try {
                    // Find Load ID
                    const load = get().loads.find(l => l.name === pkg.destino);
                    const carga_id = load ? load.id : null; // null for Stock? Or specific Stock Table? 
                    // Assuming 'Stock Libres' means null carga_id or a specific logic.
                    // If table requires carga_id, we might need a dummy load. 
                    // Checking schema: carga_id nullable? If not, we have a problem.
                    // Schema check earlier said "carga_id: 8". 
                    // Assuming nullable for Stock. If not, we'll see error.

                    // 1. Insert Package
                    const { data: insertedPkg, error: pkgError } = await supabase
                        .from('paquetes')
                        .insert({
                            codigo_paquete: pkg.id,
                            carga_id: carga_id,
                            fecha_empaquetado: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
                            especie: pkg.species,
                            tipo_producto: 'Decking', // Hardcoded or config?
                            certificacion: pkg.cert,
                            calidad: '1ra', // Default
                            acabado: pkg.finish,
                            humedad: 'KD',
                            espesor_mm: 21,
                            ancho_mm: 145,
                        })
                        .select()
                        .single();

                    if (pkgError) throw pkgError;

                    // 2. Insert Details
                    const details = pkg.contenido.map(line => ({
                        paquete_id: insertedPkg.id,
                        largo_pies: line.largo,
                        cantidad_piezas: line.piezas,
                        grupo_largos: line.largo <= 9 ? "Cortos (≤9')" : line.largo <= 12 ? "Medios (10'-12')" : "Largos (13'+)"
                    }));

                    const { error: detailsError } = await supabase
                        .from('detalles_paquete')
                        .insert(details);

                    if (detailsError) throw detailsError;

                    // 3. Update Local State (Full reload for safety or manual append)
                    // Manual append is faster
                    const newPkg: Package = {
                        ...pkg,
                        dbId: insertedPkg.id,
                    };

                    set(state => ({
                        packages: [...state.packages, newPkg]
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Add Package Error:', msg);
                    alert(`Error al guardar paquete: ${msg}`);
                    set({ error: msg });
                }
            },

            updatePackage: async (id, pkg) => {
                try {
                    // Find existing package dbId
                    const existing = get().packages.find(p => p.id === id);
                    if (!existing?.dbId) throw new Error('Paquete no encontrado en DB');

                    // Find Load ID for new destino
                    const load = get().loads.find(l => l.name === pkg.destino);
                    const carga_id = load ? load.id : null;

                    // 1. Update paquetes row
                    const { error: pkgError } = await supabase
                        .from('paquetes')
                        .update({
                            codigo_paquete: pkg.id,
                            carga_id,
                            especie: pkg.species,
                            certificacion: pkg.cert,
                            acabado: pkg.finish,
                        })
                        .eq('id', existing.dbId);

                    if (pkgError) throw pkgError;

                    // 2. Delete old details, insert new ones
                    await supabase.from('detalles_paquete').delete().eq('paquete_id', existing.dbId);

                    const details = pkg.contenido.map(line => ({
                        paquete_id: existing.dbId!,
                        largo_pies: line.largo,
                        cantidad_piezas: line.piezas,
                        grupo_largos: line.largo <= 9 ? "Cortos (≤9')" : line.largo <= 12 ? "Medios (10'-12')" : "Largos (13'+)"
                    }));

                    const { error: detailsError } = await supabase
                        .from('detalles_paquete')
                        .insert(details);

                    if (detailsError) throw detailsError;

                    // 3. Update local state
                    set(state => ({
                        packages: state.packages.map(p =>
                            p.id === id ? { ...pkg, dbId: existing.dbId } : p
                        )
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Update Package Error:', msg);
                    alert(`Error al actualizar paquete: ${msg}`);
                    set({ error: msg });
                }
            },

            deletePackage: async (id) => {
                try {
                    const pkg = get().packages.find(p => p.id === id);
                    if (pkg?.dbId) {
                        // Delete details first (FK constraint)
                        await supabase.from('detalles_paquete').delete().eq('paquete_id', pkg.dbId);
                        // Then delete package
                        const { error } = await supabase.from('paquetes').delete().eq('id', pkg.dbId);
                        if (error) throw error;
                    }

                    // Update local state
                    set(state => ({
                        packages: state.packages.filter(p => p.id !== id)
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Delete Package Error:', msg);
                    alert(`Error al eliminar paquete: ${msg}`);
                    set({ error: msg });
                }
            },

            deletePackages: async (ids: string[]) => {
                try {
                    const packagesToDelete = get().packages.filter(p => ids.includes(p.id));
                    const dbIds = packagesToDelete.map(p => p.dbId).filter(Boolean);

                    if (dbIds.length > 0) {
                        // Delete details first
                        await supabase.from('detalles_paquete').delete().in('paquete_id', dbIds);
                        // Then delete packages
                        const { error } = await supabase.from('paquetes').delete().in('id', dbIds);
                        if (error) throw error;
                    }

                    // Update local state
                    set(state => ({
                        packages: state.packages.filter(p => !ids.includes(p.id))
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Bulk Delete Error:', msg);
                    alert(`Error al eliminar paquetes: ${msg}`);
                    set({ error: msg });
                }
            },

            // ====================================================================
            // Draft Actions
            // ====================================================================
            addDraftLine: (largo, piezas) =>
                set((state) => ({
                    draftLines: [...state.draftLines, { largo, piezas, pt: calculatePT(largo, piezas) }],
                })),

            removeDraftLine: (index) =>
                set((state) => ({
                    draftLines: state.draftLines.filter((_, i) => i !== index),
                })),

            setDraftLines: (lines) => set({ draftLines: lines }),
            clearDraft: () => set({ draftLines: [], editingId: null }),
            setEditingId: (id) => set({ editingId: id }),

            // ====================================================================
            // Load Actions
            // ====================================================================

            createLoad: async (name, number) => {
                try {
                    // Auto-generate nro_interno if not provided
                    let nroInterno = number;
                    if (!nroInterno) {
                        const totalLoads = get().loads.length;
                        const ordinal = totalLoads + 1;
                        // Generate ordinals: 1ra, 2da, 3ra, 4ta, 5ta...
                        const suffix = ordinal === 1 ? 'ra' : ordinal === 2 ? 'da' : ordinal === 3 ? 'ra' : 'ta';
                        nroInterno = `${ordinal}${suffix} Carga`;
                    }

                    const { data, error } = await supabase
                        .from('cargas')
                        .insert({
                            nombre_carga: name,
                            nro_interno: nroInterno,
                            estado: 'Activo'
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    const newLoad: Load = {
                        id: data.id,
                        name: data.nombre_carga,
                        number: data.nro_interno,
                        status: 'active',
                        date: data.created_at
                    };

                    set(state => ({
                        loads: [...state.loads, newLoad],
                        config: {
                            ...state.config,
                            activeLoads: [...state.config.activeLoads, name]
                        }
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('createLoad error:', msg);
                    alert(`Error al crear carga: ${msg}`);
                    set({ error: msg });
                }
            },

            setCurrentLoad: (name) => set({ currentLoad: name }),

            deleteLoad: async (name) => {
                try {
                    const load = get().loads.find(l => l.name === name);
                    if (!load) throw new Error('Carga no encontrada');

                    // 1. Move packages in this load to Stock (set carga_id = null)
                    await supabase
                        .from('paquetes')
                        .update({ carga_id: null })
                        .eq('carga_id', load.id);

                    // 2. Delete the load
                    const { error } = await supabase
                        .from('cargas')
                        .delete()
                        .eq('id', load.id);

                    if (error) throw error;

                    // 3. Update local state
                    set(state => ({
                        loads: state.loads.filter(l => l.name !== name),
                        packages: state.packages.map(p =>
                            p.destino === name ? { ...p, destino: 'Stock Libres' } : p
                        ),
                        config: {
                            ...state.config,
                            activeLoads: state.config.activeLoads.filter(l => l !== name),
                            historyLoads: state.config.historyLoads.filter(l => l !== name),
                        }
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Delete Load Error:', msg);
                    alert(`Error al eliminar carga: ${msg}`);
                    set({ error: msg });
                }
            },

            moveLoadToHistory: async (name) => {
                try {
                    const load = get().loads.find(l => l.name === name);
                    if (!load) throw new Error('Carga no encontrada');

                    const { error } = await supabase
                        .from('cargas')
                        .update({ estado: 'Despachado' })
                        .eq('id', load.id);

                    if (error) throw error;

                    set(state => ({
                        loads: state.loads.map(l =>
                            l.name === name ? { ...l, status: 'history' as const } : l
                        ),
                        config: {
                            ...state.config,
                            activeLoads: state.config.activeLoads.filter(l => l !== name),
                            historyLoads: [...state.config.historyLoads, name],
                        }
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Move to History Error:', msg);
                    alert(`Error al despachar carga: ${msg}`);
                    set({ error: msg });
                }
            },

            reopenLoad: async (name) => {
                try {
                    const load = get().loads.find(l => l.name === name);
                    if (!load) throw new Error('Carga no encontrada');

                    const { error } = await supabase
                        .from('cargas')
                        .update({ estado: 'Activo' })
                        .eq('id', load.id);

                    if (error) throw error;

                    set(state => ({
                        loads: state.loads.map(l =>
                            l.name === name ? { ...l, status: 'active' as const } : l
                        ),
                        config: {
                            ...state.config,
                            historyLoads: state.config.historyLoads.filter(l => l !== name),
                            activeLoads: [...state.config.activeLoads, name],
                        }
                    }));

                } catch (e: any) {
                    const msg = e?.message || String(e);
                    console.error('Reopen Load Error:', msg);
                    alert(`Error al reabrir carga: ${msg}`);
                    set({ error: msg });
                }
            },


            // ====================================================================
            // Config Actions
            // ====================================================================
            addConfigItem: (type, value) =>
                set((state) => ({
                    config: { ...state.config, [type]: [...(state.config[type] || []), value] },
                })),

            removeConfigItem: (type, index) =>
                set((state) => ({
                    config: { ...state.config, [type]: (state.config[type] || []).filter((_, i) => i !== index) },
                })),

            setConfig: (config) => set({ config }),

            resetAll: () =>
                set({
                    packages: [],
                    config: { ...DEFAULT_CONFIG },
                    currentLoad: null,
                    draftLines: [],
                    editingId: null,
                }),
        }),
        {
            name: STORAGE_KEYS.data,
            // Only persist config to localStorage
            partialize: (state) => ({
                config: state.config,
            }),
        }
    )
);

// ============================================================================
// Selectors
// ============================================================================

export const useLoadPackages = (loadName: string) => {
    const packages = useTimberStore((state) => state.packages);
    return useMemo(() => packages.filter((p) => p.destino === loadName), [packages, loadName]);
};

export const useStockPackages = () => {
    const packages = useTimberStore((state) => state.packages);
    return useMemo(() => packages.filter((p) => p.destino === 'Stock Libres'), [packages]);
};

export const usePackageExists = (id: string) =>
    useTimberStore((state) => state.packages.some((p) => p.id === id));
