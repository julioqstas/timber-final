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
import { StockTable } from '@/components/tables/StockTable';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { calculateLoadBalance } from '@/lib/calculations';
import { smartExportLoad } from '@/lib/export-excel';
import { formatPT } from '@/lib/formatters';
import { Trash2, X } from 'lucide-react';
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
    const [selectedStockIds, setSelectedStockIds] = useState<Set<string>>(new Set()); // For Stock Picker
    const [isExporting, setIsExporting] = useState(false);
    const [exportToast, setExportToast] = useState<string | null>(null);

    // Bulk Delete State (Load Packages)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Store
    const packages = useLoadPackages(loadName);
    const stockPackages = useStockPackages();
    const config = useTimberStore((s) => s.config);
    const updatePackage = useTimberStore((s) => s.updatePackage);
    const moveLoadToHistory = useTimberStore((s) => s.moveLoadToHistory);
    const deleteLoad = useTimberStore((s) => s.deleteLoad);
    const deletePackages = useTimberStore((s) => s.deletePackages);
    const balance = calculateLoadBalance(packages);
    const isHistory =
        config.historyLoads.includes(loadName) || loadName === 'Despachado';
    const isStock = loadName === 'Stock Libres';

    // Handlers
    const handleEdit = (id: string) => {
        if (isSelectionMode) {
            handleToggleSelection(id);
            return;
        }
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

    // Bulk Selection Handlers (Current Load)
    const handleLongPress = (id: string) => {
        if (isHistory || isStock) return; // Stock view handles its own selection in page.tsx, but here we reuse this page for stock?
        // Wait, isStock here renders InventoryList using handleLongPress?
        // Line 293 in original logic for isStock handled specific view.
        // But wait, the user instructions earlier said Stock View is in `src/app/page.tsx`, and Load Detail is in `src/app/load/[name]/page.tsx`.
        // However, `isStock` check existing in this file suggests `Stock Libres` CAN be viewed via this route too?
        // If so, I should handle it. But standard Stock view is dashboard.
        // Assuming this is for standard loads.
        if (isHistory) return;
        setIsSelectionMode(true);
        const newSet = new Set(selectedItems);
        newSet.add(id);
        setSelectedItems(newSet);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    };

    const handleToggleSelection = (id: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItems(newSet);
        if (newSet.size === 0) setIsSelectionMode(false);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === packages.length) {
            setSelectedItems(new Set());
            setIsSelectionMode(false);
        } else {
            setSelectedItems(new Set(packages.map(p => p.id)));
            setIsSelectionMode(true);
        }
    };

    const exitSelectionMode = () => {
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Estás seguro de eliminar ${selectedItems.size} paquetes de esta carga?`)) return;
        await deletePackages(Array.from(selectedItems));
        exitSelectionMode();
    };


    // Computed selection info (Picker)
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

    // Smart Export handler
    const handleExport = async () => {
        if (isExporting || packages.length === 0) return;
        setIsExporting(true);
        setExportToast('Generando Excel...');
        try {
            await smartExportLoad(loadName, packages, isHistory);
            setExportToast('¡Exportado! ✅');
        } catch (err: any) {
            console.error('Export failed:', err);
            setExportToast('Error al exportar ❌');
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportToast(null), 2500);
        }
    };

    // Export button — shared across all load states
    const exportButton = (
        <button
            onClick={handleExport}
            disabled={isExporting || packages.length === 0}
            className={`bg-transparent border-none text-white p-1.5 cursor-pointer flex items-center justify-center rounded-full transition-colors ${isExporting ? 'opacity-50' : 'active:bg-white/10 hover:bg-white/10'}`}
            aria-label="Exportar Excel"
            title="Exportar Excel"
        >
            {isExporting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M8 13h2" />
                    <path d="M8 17h2" />
                    <path d="M14 13h2" />
                    <path d="M14 17h2" />
                </svg>
            )}
        </button>
    );

    // Header action icons — Export appears ALWAYS, close/delete only for active loads
    const headerActions = !isHistory && !isStock ? (
        <>
            {exportButton}
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
    ) : (
        // History or Stock → only export button
        exportButton
    );

    return (
        <AppShell
            title={loadName}
            subtitle={isHistory ? 'Carga Cerrada' : 'En Proceso'}
            headerActions={headerActions}
        >
            <div className="flex flex-col md:flex-row h-full bg-surface-app">

                {/* ===== MOBILE LAYOUT (single column with tabs) ===== */}
                <div className="flex flex-col h-full md:hidden">
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
                    <div className="flex-1 overflow-y-auto p-5 pt-0 pb-28 animate-fade-in relative">
                        {/* Stock View */}
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

                        {/* Standard View: Summary Tab */}
                        {!isStock && tab === 'resumen' && (
                            <div className="animate-fade-in space-y-4 pb-24">
                                <div className="text-xs font-bold text-timber-grey uppercase tracking-widest ml-1">
                                    Distribución por Largos
                                </div>
                                <SummaryTable packages={packages} />
                            </div>
                        )}

                        {/* Standard View: Inventory Tab */}
                        {!isStock && tab === 'inventario' && (
                            <div className="animate-fade-in">
                                <div className="text-xs font-bold text-timber-grey uppercase tracking-widest mb-3 ml-1">
                                    Lista de Paquetes ({packages.length})
                                </div>
                                <InventoryList
                                    packages={[...packages].reverse()}
                                    isLocked={isHistory}
                                    onEdit={handleEdit}
                                    selectionMode={isSelectionMode}
                                    selectedIds={selectedItems}
                                    onToggleSelection={handleToggleSelection}
                                    onLongPress={handleLongPress}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== DESKTOP LAYOUT (two columns, no tabs) ===== */}
                <div className="hidden md:flex flex-row flex-1 min-h-0 overflow-hidden relative">
                    {/* Left Column — Balance + Summary (sticky) */}
                    <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6">
                        {!isStock && (
                            <>
                                <BalancePanel balance={balance} />
                                <div className="mt-5">
                                    <div className="text-xs font-bold text-timber-grey uppercase tracking-widest mb-3 ml-1">
                                        Distribución por Largos
                                    </div>
                                    <SummaryTable packages={packages} />
                                </div>
                            </>
                        )}
                        {isStock && (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                Vista Stock — sin balance
                            </div>
                        )}
                    </div>

                    {/* Right Column — Package List (scrollable) */}
                    <div className="flex-1 overflow-y-auto p-6 pb-6">
                        <div className="text-xs font-bold text-timber-grey uppercase tracking-widest mb-3 ml-1">
                            {isStock
                                ? `Stock Disponible (${packages.length})`
                                : `Lista de Paquetes (${packages.length})`
                            }
                        </div>
                        <StockTable
                            packages={[...packages].reverse()}
                            isLocked={isHistory}
                            onEdit={handleEdit}
                            selectedIds={selectedItems}
                            onToggleSelection={handleToggleSelection}
                            onSelectAll={handleSelectAll}
                        />
                    </div>
                </div>
            </div>

            {/* Floating Action Bar for Bulk Delete */}
            {selectedItems.size > 0 && (
                <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-[55%] md:translate-x-0 md:max-w-xl z-[100] animate-in slide-in-from-bottom-4 fade-in duration-200">
                    <div className="bg-gray-900 text-white rounded-full shadow-2xl px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={exitSelectionMode}
                                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <span className="font-bold text-base">
                                {selectedItems.size} seleccionados
                            </span>
                        </div>
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-bold text-sm transition-colors"
                        >
                            <Trash2 size={16} />
                            Eliminar
                        </button>
                    </div>
                </div>
            )}

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

            {/* Export Toast */}
            {exportToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                    <div className="bg-gray-900/90 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2">
                        {isExporting && (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {exportToast}
                    </div>
                </div>
            )}
        </AppShell>
    );
}
