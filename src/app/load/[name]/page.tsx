'use client';

// ============================================================================
// Load Detail View — Dynamic Route for Load
// Replaces legacy view-detail logic (app.js:380-410)
// ============================================================================

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PackageCard } from '@/components/cards/PackageCard';
import { BalancePanel } from '@/components/panels/BalancePanel';
import { PackageCreator } from '@/components/panels/PackageCreator';
import { useLoadPackages, useStockPackages, useTimberStore } from '@/store/timber-store';
import { SummaryTable } from '@/components/panels/SummaryTable';
import { EstimatorSheet } from '@/components/panels/EstimatorSheet';
import { InventoryList } from '@/components/panels/InventoryList';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { calculateLoadBalance } from '@/lib/calculations';
import { formatPT } from '@/lib/formatters';
import type { PackageLine, Package } from '@/types/timber';

export default function LoadDetailPage() {
    const router = useRouter();
    const params = useParams();
    const rawName = params.name as string;
    const loadName = decodeURIComponent(rawName);

    // State
    const [tab, setTab] = useState<'resumen' | 'inventario'>('resumen');
    const [showCreator, setShowCreator] = useState(false);
    const [showEstimator, setShowEstimator] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [transferLines, setTransferLines] = useState<PackageLine[]>([]);
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [showStockPicker, setShowStockPicker] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedStockIds, setSelectedStockIds] = useState<Set<string>>(new Set());

    // Store
    const packages = useLoadPackages(loadName);
    const stockPackages = useStockPackages();
    const config = useTimberStore((s) => s.config);
    const updatePackage = useTimberStore((s) => s.updatePackage);
    const moveLoadToHistory = useTimberStore((s) => s.moveLoadToHistory);
    const deleteLoad = useTimberStore((s) => s.deleteLoad);
    const balance = calculateLoadBalance(packages);
    const isHistory =
        config.historyLoads.includes(loadName) || loadName === 'Despachado';
    const isStock = loadName === 'Stock Libres';

    // Handlers
    const handleEdit = (id: string) => {
        if (isHistory) return;
        setEditingId(id);
        setShowCreator(true);
    };

    const handleCloseCreator = () => {
        setShowCreator(false);
        setEditingId(null);
        setTransferLines([]);
    };

    const handleTransfer = (lines: PackageLine[]) => {
        setTransferLines(lines);
        setShowEstimator(false);
        setShowCreator(true);
    };

    const toggleStockSelection = (pkgId: string) => {
        setSelectedStockIds(prev => {
            const next = new Set(prev);
            if (next.has(pkgId)) next.delete(pkgId);
            else next.add(pkgId);
            return next;
        });
    };

    const handleAssignSelectedStock = () => {
        stockPackages.forEach(pkg => {
            if (selectedStockIds.has(pkg.id)) {
                updatePackage(pkg.id, { ...pkg, destino: loadName });
            }
        });
        setSelectedStockIds(new Set());
        setShowStockPicker(false);
    };

    // Computed selection info
    const selectedCount = selectedStockIds.size;
    const selectedPT = stockPackages
        .filter(p => selectedStockIds.has(p.id))
        .reduce((sum, p) => sum + p.ptTotal, 0);

    const handleCloseLoad = async () => {
        await moveLoadToHistory(loadName);
        setShowCloseConfirm(false);
        router.push('/');
    };

    const handleDeleteLoad = async () => {
        await deleteLoad(loadName);
        setShowDeleteConfirm(false);
        router.push('/');
    };

    // Header action icons (WhatsApp-style) — only for active (non-history, non-stock) loads
    const headerActions = !isHistory && !isStock ? (
        <>
            {/* Close/Approve Load */}
            <button
                onClick={() => setShowCloseConfirm(true)}
                className="bg-transparent border-none text-white p-1.5 cursor-pointer flex items-center justify-center active:bg-white/10 rounded-full transition-colors"
                aria-label="Cerrar Carga"
                title="Cerrar Carga"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                </svg>
            </button>
            {/* Delete Load */}
            <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-transparent border-none text-white/70 p-1.5 cursor-pointer flex items-center justify-center active:bg-white/10 rounded-full transition-colors hover:text-white"
                aria-label="Eliminar Carga"
                title="Eliminar Carga"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
            </button>
        </>
    ) : null;

    return (
        <AppShell
            title={loadName}
            subtitle={isHistory ? 'Carga Cerrada' : 'En Proceso'}
            headerActions={headerActions}
        >
            <div className="flex flex-col h-full bg-surface-app">

                {/* Fixed Header with Balance (Hidden for Stock) */}
                {!isStock && (
                    <div className="bg-surface-app p-5 pb-0 shrink-0 z-30">
                        <BalancePanel balance={balance} />

                        {/* Tabs */}
                        <div className="flex bg-gray-200/50 rounded-xl p-1 mb-4">
                            <button
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all ${tab === 'resumen'
                                    ? 'bg-white text-timber-dark shadow-sm'
                                    : 'bg-transparent text-timber-grey'
                                    }`}
                                onClick={() => setTab('resumen')}
                            >
                                Resumen
                            </button>
                            <button
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all ${tab === 'inventario'
                                    ? 'bg-white text-timber-dark shadow-sm'
                                    : 'bg-transparent text-timber-grey'
                                    }`}
                                onClick={() => setTab('inventario')}
                            >
                                Lista de Paquetes
                            </button>
                        </div>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 pt-0 pb-28 animate-fade-in">

                    {/* Stock View: Direct List */}
                    {isStock && (
                        <div className="pt-5 animate-fade-in">
                            <div className="text-xs font-bold text-timber-grey uppercase tracking-widest mb-3 ml-1">
                                Stock Disponible ({packages.length})
                            </div>
                            <InventoryList
                                packages={[...packages].reverse()}
                                isLocked={false}
                                onEdit={handleEdit}
                            />
                        </div>
                    )}

                    {/* Standard View: Tabs */}
                    {!isStock && tab === 'resumen' && (
                        <div className="animate-fade-in space-y-4 pb-24">
                            <div className="text-xs font-bold text-timber-grey uppercase tracking-widest ml-1">
                                Distribución por Largos
                            </div>

                            <SummaryTable packages={packages} />

                        </div>
                    )}

                    {/* Tab Content: Inventario */}
                    {!isStock && tab === 'inventario' && (
                        <div className="animate-fade-in">
                            <div className="text-xs font-bold text-timber-grey uppercase tracking-widest mb-3 ml-1">
                                Lista de Paquetes ({packages.length})
                            </div>
                            <InventoryList
                                packages={[...packages].reverse()}
                                isLocked={isHistory}
                                onEdit={handleEdit}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== FLOATING FAB (Detail Page) ==================== */}
            {!isHistory && !isStock && (
                <div className="absolute bottom-5 right-5 flex flex-col gap-3 z-50">
                    {/* Estimator mini button */}
                    <button
                        onClick={() => setShowEstimator(true)}
                        className="w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:shadow-xl transition-all active:scale-95 text-lg"
                        aria-label="Estimador"
                        title="Estimador"
                    >
                        🧮
                    </button>
                    {/* Main FAB */}
                    <button
                        onClick={() => setShowFabMenu(true)}
                        className="w-14 h-14 rounded-full bg-brand text-white shadow-fab flex items-center justify-center cursor-pointer hover:bg-brand-dark transition-all active:scale-95 border-none"
                        aria-label="Agregar paquete"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ==================== FAB SELECTION MENU ==================== */}
            <BottomSheet
                isOpen={showFabMenu}
                onClose={() => setShowFabMenu(false)}
                title="Agregar a Carga"
            >
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => {
                            setShowFabMenu(false);
                            setEditingId(null);
                            setTransferLines([]);
                            setShowCreator(true);
                        }}
                        className="aspect-square rounded-2xl bg-brand-light text-brand flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-2 border-transparent hover:border-brand-light"
                    >
                        <span className="text-4xl">📦</span>
                        <span className="font-bold text-sm">Paquete Nuevo</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowFabMenu(false);
                            setShowStockPicker(true);
                        }}
                        className="aspect-square rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-2 border-transparent hover:border-blue-100 relative"
                    >
                        <span className="text-4xl">📋</span>
                        <span className="font-bold text-sm">Paquete En Stock</span>
                        {stockPackages.length > 0 && (
                            <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                {stockPackages.length}
                            </span>
                        )}
                    </button>
                </div>
            </BottomSheet>

            {/* ==================== STOCK PICKER SHEET (Multi-Select) ==================== */}
            <BottomSheet
                isOpen={showStockPicker}
                onClose={() => { setShowStockPicker(false); setSelectedStockIds(new Set()); }}
                title={`Asignar Stock a ${loadName}`}
                footer={selectedCount > 0 ? (
                    <button
                        onClick={handleAssignSelectedStock}
                        className="w-full py-4 bg-brand text-white font-bold text-sm rounded-input border-none cursor-pointer hover:bg-brand-dark transition-colors active:scale-[0.98]"
                    >
                        Agregar {String(selectedCount).padStart(2, '0')} paquete{selectedCount !== 1 ? 's' : ''} ({formatPT(selectedPT)} PT)
                    </button>
                ) : undefined}
            >
                <div className="space-y-2 max-h-[55vh] overflow-y-auto">
                    {stockPackages.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="text-4xl block mb-3">📭</span>
                            <p className="text-gray-400 text-sm m-0">No hay paquetes en stock</p>
                            <p className="text-gray-300 text-xs mt-1">Crea paquetes desde Inicio → Stock</p>
                        </div>
                    ) : (
                        <>
                            {/* Select all toggle */}
                            <button
                                onClick={() => {
                                    if (selectedCount === stockPackages.length) {
                                        setSelectedStockIds(new Set());
                                    } else {
                                        setSelectedStockIds(new Set(stockPackages.map(p => p.id)));
                                    }
                                }}
                                className="w-full text-xs font-bold text-brand bg-transparent border-none cursor-pointer text-right py-1 px-2 hover:underline"
                            >
                                {selectedCount === stockPackages.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                            </button>

                            {stockPackages.map((pkg) => {
                                const isSelected = selectedStockIds.has(pkg.id);
                                return (
                                    <button
                                        key={pkg.id}
                                        onClick={() => toggleStockSelection(pkg.id)}
                                        className={`w-full rounded-card p-4 transition-all cursor-pointer text-left active:scale-[0.98] flex items-center gap-3 border-2 ${isSelected
                                            ? 'bg-brand-light/40 border-brand/40 shadow-sm'
                                            : 'bg-white border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                            ? 'bg-brand border-brand'
                                            : 'bg-white border-gray-300'
                                            }`}>
                                            {isSelected && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 6L9 17l-5-5" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Package info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-timber-dark text-sm">{pkg.id}</span>
                                                {pkg.species && (
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{pkg.species}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {pkg.contenido.length} línea{pkg.contenido.length !== 1 ? 's' : ''} · {formatPT(pkg.ptTotal)} PT
                                            </div>
                                        </div>

                                        {/* PT badge */}
                                        <div className={`text-sm font-bold shrink-0 ${isSelected ? 'text-brand' : 'text-gray-300'}`}>
                                            {formatPT(pkg.ptTotal)}
                                        </div>
                                    </button>
                                );
                            })}
                        </>
                    )}
                </div>
            </BottomSheet>

            {/* ==================== CLOSE LOAD CONFIRMATION ==================== */}
            <BottomSheet
                isOpen={showCloseConfirm}
                onClose={() => setShowCloseConfirm(false)}
                title="Cerrar Carga"
            >
                <div className="text-center py-4">
                    <span className="text-5xl block mb-4">✅</span>
                    <p className="text-timber-dark font-semibold text-base m-0 mb-2">
                        ¿Cerrar la carga &ldquo;{loadName}&rdquo;?
                    </p>
                    <p className="text-gray-400 text-sm m-0 mb-6">
                        La carga pasará al historial como despachada. Los paquetes quedarán registrados.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCloseConfirm(false)}
                            className="flex-1 py-3.5 rounded-input bg-gray-100 text-timber-grey font-semibold text-sm border-none cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCloseLoad}
                            className="flex-1 py-3.5 rounded-input bg-brand text-white font-bold text-sm border-none cursor-pointer hover:bg-brand-dark transition-colors"
                        >
                            Sí, Cerrar Carga
                        </button>
                    </div>
                </div>
            </BottomSheet>

            {/* ==================== DELETE LOAD CONFIRMATION ==================== */}
            <BottomSheet
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Eliminar Carga"
            >
                <div className="text-center py-4">
                    <span className="text-5xl block mb-4">⚠️</span>
                    <p className="text-timber-dark font-semibold text-base m-0 mb-2">
                        ¿Eliminar la carga &ldquo;{loadName}&rdquo;?
                    </p>
                    <p className="text-gray-400 text-sm m-0 mb-1">
                        Esta acción no se puede deshacer.
                    </p>
                    <p className="text-amber-600 text-sm font-medium m-0 mb-6">
                        Los {packages.length} paquete{packages.length !== 1 ? 's' : ''} de esta carga volverán a <strong>Stock Libres</strong>.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-3.5 rounded-input bg-gray-100 text-timber-grey font-semibold text-sm border-none cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDeleteLoad}
                            className="flex-1 py-3.5 rounded-input bg-red-500 text-white font-bold text-sm border-none cursor-pointer hover:bg-red-600 transition-colors"
                        >
                            Sí, Eliminar
                        </button>
                    </div>
                </div>
            </BottomSheet>

            {/* Creator Sheet */}
            {showCreator && (
                <PackageCreator
                    targetLoad={loadName}
                    onClose={handleCloseCreator}
                    editModeId={editingId}
                    initialLines={transferLines}
                />
            )}

            {/* Estimator Sheet */}
            {showEstimator && !isHistory && (
                <EstimatorSheet
                    currentBalance={balance}
                    onClose={() => setShowEstimator(false)}
                    onConvertToPackage={handleTransfer}
                />
            )}
        </AppShell>
    );
}
