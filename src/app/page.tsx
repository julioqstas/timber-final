'use client';

// ============================================================================
// Dashboard Page — 5-Tab Navigation Architecture
// Views: Inicio | Cargas | (FAB) | Stock | Reportes | Settings (⚙️)
// ============================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, X, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadCard } from '@/components/cards/LoadCard';
import { LoadsTable } from '@/components/tables/LoadsTable';
import { StockTable } from '@/components/tables/StockTable';
import { ReportsDashboard } from '@/components/panels/ReportsDashboard';
import { DashboardHome } from '@/components/panels/DashboardHome';
import { useTimberStore } from '@/store/timber-store';

import { formatPT } from '@/lib/formatters';
import { InventoryList } from '@/components/panels/InventoryList';
import { PackageCreator } from '@/components/panels/PackageCreator';
import { ConfigSection } from '@/components/panels/ConfigSection';
import { BottomSheet } from '@/components/ui/BottomSheet';

type DockTab = 'inicio' | 'cargas' | 'stock' | 'reportes';
type AppView = DockTab | 'settings';
type CargasSubTab = 'activas' | 'historial';

export default function DashboardPage() {
  const router = useRouter();

  // View state — always start with defaults for SSR, restore on client via useEffect
  const [appView, setAppView] = useState<AppView>('inicio');
  const [cargasTab, setCargasTab] = useState<CargasSubTab>('activas');

  // Restore + persist view state via sessionStorage (client-side only)
  useEffect(() => {
    const saved = sessionStorage.getItem('fq_appView') as AppView | null;
    if (saved) setAppView(saved);
    const savedTab = sessionStorage.getItem('fq_cargasTab') as CargasSubTab | null;
    if (savedTab) setCargasTab(savedTab);
  }, []);
  useEffect(() => { sessionStorage.setItem('fq_appView', appView); }, [appView]);
  useEffect(() => { sessionStorage.setItem('fq_cargasTab', cargasTab); }, [cargasTab]);
  const [showNewLoad, setShowNewLoad] = useState(false);
  const [newLoadName, setNewLoadName] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Stock Bulk Selection State
  const [selectedStockIds, setSelectedStockIds] = useState<Set<string>>(new Set());
  const [isStockSelectionMode, setIsStockSelectionMode] = useState(false);

  // Unlock modal state
  const [unlockTarget, setUnlockTarget] = useState<string | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlockSuccess, setUnlockSuccess] = useState(false);

  // Zustand selectors
  const packages = useTimberStore((s) => s.packages);
  const config = useTimberStore((s) => s.config);
  const createLoad = useTimberStore((s) => s.createLoad);
  const deletePackages = useTimberStore((s) => s.deletePackages); // Add this
  const addConfigItem = useTimberStore((s) => s.addConfigItem);
  const removeConfigItem = useTimberStore((s) => s.removeConfigItem);
  const reopenLoad = useTimberStore((s) => s.reopenLoad);

  // Computed values
  const activeCount = config.activeLoads.length;
  const stockPackages = packages.filter((p) => p.destino === 'Stock Libres');
  const stockPT = stockPackages.reduce((sum, p) => sum + p.ptTotal, 0);
  const totalPT = packages.reduce((sum, p) => sum + p.ptTotal, 0);

  // --- Bulk Selection Handlers (Stock) ---
  const handleStockLongPress = (id: string) => {
    setIsStockSelectionMode(true);
    const newSet = new Set(selectedStockIds);
    newSet.add(id);
    setSelectedStockIds(newSet);
    // Vibrate? navigator.vibrate(50) if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const handleStockToggle = (id: string) => {
    const newSet = new Set(selectedStockIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedStockIds(newSet);
    // Auto-exit if empty? Optional. WhatsApp stays in mode.
    // If we want to stay in mode, do nothing. 
    // If we want to exit when empty:
    if (newSet.size === 0) setIsStockSelectionMode(false);
  };

  const handleStockSelectAll = () => {
    if (selectedStockIds.size === stockPackages.length) {
      // Deselect all
      setSelectedStockIds(new Set());
      setIsStockSelectionMode(false);
    } else {
      // Select all
      const allIds = new Set(stockPackages.map(p => p.id));
      setSelectedStockIds(allIds);
      setIsStockSelectionMode(true);
    }
  };

  const exitStockSelectionMode = () => {
    setSelectedStockIds(new Set());
    setIsStockSelectionMode(false);
  };

  const handleDeleteSelectedStock = async () => {
    if (!confirm(`¿Estás seguro de eliminar ${selectedStockIds.size} paquetes? Esta acción no se puede deshacer.`)) return;

    await deletePackages(Array.from(selectedStockIds));
    exitStockSelectionMode();
  };

  // Handlers
  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowCreator(true);
  };

  const handleCloseCreator = () => {
    setShowCreator(false);
    setEditingId(null);
  };

  const handleCreateLoad = () => {
    const name = newLoadName.trim();
    if (!name) return;
    if (
      config.activeLoads.includes(name) ||
      config.historyLoads.includes(name)
    ) {
      alert('Ya existe una carga con ese nombre');
      return;
    }
    createLoad(name);
    setNewLoadName('');
    setShowNewLoad(false);
    router.push(`/load/${encodeURIComponent(name)}`);
  };

  const handleTabChange = (tab: DockTab) => {
    setAppView(tab);
  };

  // Dynamic header
  const headerConfig: Record<AppView, { title: string; subtitle: string }> = {
    inicio: {
      title: '¡Hola! 👋',
      subtitle: activeCount > 0
        ? `Tienes ${activeCount} carga${activeCount !== 1 ? 's' : ''} activa${activeCount !== 1 ? 's' : ''}`
        : '¿Listo para empezar?',
    },
    cargas: { title: 'Cargas', subtitle: `${activeCount} en proceso · ${config.historyLoads.length} despachados` },
    stock: { title: 'Paquetes Libres', subtitle: `${stockPackages.length} paquete${stockPackages.length !== 1 ? 's' : ''} · ${formatPT(stockPT)} PT` },
    reportes: { title: 'Reportes', subtitle: 'Insights de operación' },
    settings: { title: 'Configuración', subtitle: 'Gestión de parámetros' },
  };

  const { title, subtitle } = headerConfig[appView];

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      hideHeader={appView === 'inicio'}
      onSettings={appView === 'inicio' ? () => setAppView('settings') : undefined}
      onSettingsSidebar={() => setAppView('settings')}
      onBack={appView !== 'inicio' ? () => setAppView('inicio') : undefined}
      activeTab={appView !== 'settings' ? (appView as DockTab) : 'inicio'}
      onTabChange={handleTabChange}
      onFab={() => setShowFabMenu(true)}
    >
      {/* ==================== INICIO VIEW ==================== */}
      {appView === 'inicio' && (
        <DashboardHome
          activeCount={activeCount}
          stockCount={stockPackages.length}
          stockPT={stockPT}
          totalPT={totalPT}
          totalPackages={packages.length}
          onNewLoad={() => setShowNewLoad(true)}
          onNewPackage={() => {
            setEditingId(null);
            setShowCreator(true);
          }}
          onNavigate={(tab) => setAppView(tab)}
          onSettings={() => setAppView('settings')}
        />
      )}

      {/* ==================== CARGAS VIEW ==================== */}
      {appView === 'cargas' && (
        <div className="overflow-y-auto p-5 pb-28 md:pb-6 h-full animate-fade-in">
          {/* Sub-tabs: Activas / Historial */}
          <div className="flex bg-gray-200/50 rounded-xl p-1 mb-4">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all ${cargasTab === 'activas'
                ? 'bg-white text-timber-dark shadow-sm'
                : 'bg-transparent text-timber-grey'
                }`}
              onClick={() => setCargasTab('activas')}
            >
              En Proceso ({activeCount})
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all ${cargasTab === 'historial'
                ? 'bg-white text-timber-dark shadow-sm'
                : 'bg-transparent text-timber-grey'
                }`}
              onClick={() => setCargasTab('historial')}
            >
              Despachados ({config.historyLoads.length})
            </button>
          </div>

          {/* Tab: Activas */}
          {cargasTab === 'activas' && (
            <div className="animate-fade-in">
              {config.activeLoads.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">🚛</span>
                  <p className="text-gray-400 text-sm m-0">No hay cargas en proceso</p>
                  <p className="text-gray-300 text-xs mt-1">Crea una nueva carga para empezar</p>
                </div>
              ) : (
                <>
                  {/* Mobile: Cards */}
                  <div className="md:hidden">
                    {config.activeLoads.map((loadName) => (
                      <LoadCard
                        key={loadName}
                        name={loadName}
                        packages={packages.filter((p) => p.destino === loadName)}
                        onClick={() => router.push(`/load/${encodeURIComponent(loadName)}`)}
                      />
                    ))}
                  </div>
                  {/* Desktop: Table */}
                  <div className="hidden md:block">
                    <LoadsTable
                      loads={config.activeLoads}
                      packages={packages}
                      onClickLoad={(name) => router.push(`/load/${encodeURIComponent(name)}`)}
                    />
                  </div>
                </>
              )}
              <button
                className="w-full py-3 rounded-input bg-brand-light text-brand font-bold text-sm border-none cursor-pointer hover:bg-green-100 transition-colors mt-6"
                onClick={() => setShowNewLoad(true)}
              >
                + Nueva Carga
              </button>
            </div>
          )}

          {/* Tab: Despachados */}
          {cargasTab === 'historial' && (
            <div className="animate-fade-in">
              {config.historyLoads.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📜</span>
                  <p className="text-gray-400 text-sm m-0">Sin despachos</p>
                  <p className="text-gray-300 text-xs mt-1">Las cargas despachadas aparecerán aquí</p>
                </div>
              ) : (
                <>
                  {/* Mobile: Cards */}
                  <div className="md:hidden">
                    {config.historyLoads.map((loadName) => (
                      <div key={loadName} className="relative">
                        <LoadCard
                          name={loadName}
                          packages={packages.filter((p) => p.destino === loadName)}
                          isHistory
                          onClick={() => router.push(`/load/${encodeURIComponent(loadName)}`)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUnlockTarget(loadName);
                            setUnlockPassword('');
                            setUnlockError('');
                            setUnlockSuccess(false);
                          }}
                          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-95 transition-all z-10"
                          title="Reabrir carga"
                        >
                          <Unlock size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: Table */}
                  <div className="hidden md:block">
                    <LoadsTable
                      loads={config.historyLoads}
                      packages={packages}
                      isHistory
                      onClickLoad={(name) => router.push(`/load/${encodeURIComponent(name)}`)}
                      onUnlock={(name) => {
                        setUnlockTarget(name);
                        setUnlockPassword('');
                        setUnlockError('');
                        setUnlockSuccess(false);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== STOCK VIEW ==================== */}
      {appView === 'stock' && (
        <div className="overflow-y-auto p-5 pb-28 md:pb-6 h-full animate-fade-in relative">
          {/* Stock summary card */}
          <div className="bg-surface-card rounded-card p-4 shadow-card border border-black/[0.02] mb-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-timber-grey uppercase tracking-widest">Total en Stock</div>
              <div className="text-2xl font-extrabold text-brand mt-1">{formatPT(stockPT)} <span className="text-sm font-normal text-gray-400">PT</span></div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-timber-dark">{stockPackages.length}</div>
              <div className="text-xs text-gray-400">paquetes</div>
            </div>
          </div>

          {stockPackages.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">📦</span>
              <p className="text-gray-400 text-sm m-0">Sin paquetes en stock</p>
              <p className="text-gray-300 text-xs mt-1">Crea paquetes con el botón +</p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="md:hidden">
                <InventoryList
                  packages={[...stockPackages].reverse()}
                  isLocked={false}
                  onEdit={(id) => {
                    if (isStockSelectionMode) handleStockToggle(id);
                    else handleEdit(id);
                  }}
                  selectionMode={isStockSelectionMode}
                  selectedIds={selectedStockIds}
                  onToggleSelection={handleStockToggle}
                  onLongPress={handleStockLongPress}
                />
              </div>
              {/* Desktop: Table */}
              <div className="hidden md:block">
                <StockTable
                  packages={[...stockPackages].reverse()}
                  isLocked={false}
                  onEdit={handleEdit}
                  selectedIds={selectedStockIds}
                  onToggleSelection={handleStockToggle}
                  onSelectAll={handleStockSelectAll}
                />
              </div>
            </>
          )}

          {/* Floating Action Bar for Bulk Delete */}
          {selectedStockIds.size > 0 && (
            <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-[300px] md:max-w-2xl md:mx-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
              <div className="bg-gray-900 text-white rounded-full shadow-2xl px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={exitStockSelectionMode}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <span className="font-bold text-base">
                    {selectedStockIds.size} seleccionados
                  </span>
                </div>
                <button
                  onClick={handleDeleteSelectedStock}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-bold text-sm transition-colors"
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== REPORTES VIEW ==================== */}
      {appView === 'reportes' && (
        <div className="overflow-y-auto p-5 pb-28 md:pb-6 h-full animate-fade-in">
          <ReportsDashboard />
        </div>
      )}

      {/* ==================== SETTINGS VIEW ==================== */}
      {appView === 'settings' && (
        <div className="overflow-y-auto p-5 pb-28 md:pb-6 h-full animate-fade-in">
          <ConfigSection
            title="Especies"
            items={config.species}
            onAdd={(v) => addConfigItem('species', v)}
            onDelete={(i) => removeConfigItem('species', i)}
            placeholder="Ej: Pino, Ciprés..."
          />
          <ConfigSection
            title="Acabados"
            items={config.finishes}
            onAdd={(v) => addConfigItem('finishes', v)}
            onDelete={(i) => removeConfigItem('finishes', i)}
            placeholder="Ej: S4S, Cepillado..."
          />
          <ConfigSection
            title="Tipos de Producto"
            items={config.productTypes || []}
            onAdd={(v) => addConfigItem('productTypes', v)}
            onDelete={(i) => removeConfigItem('productTypes', i)}
            placeholder="Ej: Decking, Flooring..."
          />
          <ConfigSection
            title="Certificaciones"
            items={config.certs || []}
            onAdd={(v) => addConfigItem('certs', v)}
            onDelete={(i) => removeConfigItem('certs', i)}
            placeholder="Ej: FSC, PEFC..."
          />
          <ConfigSection
            title="Humedad / Secado"
            items={config.drying || []}
            onAdd={(v) => addConfigItem('drying', v)}
            onDelete={(i) => removeConfigItem('drying', i)}
            placeholder="Ej: KD, AD..."
          />
        </div>
      )}

      {/* ==================== FAB SELECTION MENU ==================== */}
      <BottomSheet
        isOpen={showFabMenu}
        onClose={() => setShowFabMenu(false)}
        title="Crear Nuevo"
      >
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setShowFabMenu(false);
              setShowNewLoad(true);
            }}
            className="aspect-square rounded-2xl bg-brand-light text-brand flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-2 border-transparent hover:border-brand-light"
          >
            <span className="text-4xl">🚛</span>
            <span className="font-bold text-sm">Nueva Carga</span>
          </button>

          <button
            onClick={() => {
              setShowFabMenu(false);
              setEditingId(null);
              setShowCreator(true);
            }}
            className="aspect-square rounded-2xl bg-orange-50 text-orange-600 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-2 border-transparent hover:border-orange-100"
          >
            <span className="text-4xl">📦</span>
            <span className="font-bold text-sm">Nuevo Paquete</span>
          </button>
        </div>
      </BottomSheet>

      {/* ==================== NEW LOAD MODAL ==================== */}
      {showNewLoad && (
        <BottomSheet
          isOpen={showNewLoad}
          onClose={() => setShowNewLoad(false)}
          title="Nueva Carga"
        >
          <div className="pb-4">
            <label className="text-xs font-bold text-timber-grey block mb-2 uppercase">
              Nombre
            </label>
            <input
              type="text"
              value={newLoadName}
              onChange={(e) => setNewLoadName(e.target.value)}
              placeholder="Ej: Carga 009-2026"
              className="w-full p-4 text-base font-semibold border border-gray-200 rounded-input bg-white text-timber-dark outline-none mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateLoad()}
            />
            <button
              className="w-full py-4 bg-brand text-white font-bold text-base rounded-input border-none cursor-pointer hover:bg-brand-dark transition-colors"
              onClick={handleCreateLoad}
            >
              CREAR CARGA
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ==================== PACKAGE CREATOR ==================== */}
      {showCreator && (
        <PackageCreator
          targetLoad="Stock Libres"
          onClose={handleCloseCreator}
          editModeId={editingId}
        />
      )}

      {/* ==================== UNLOCK MODAL ==================== */}
      {unlockTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 px-6 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-amber-600" />
                <h3 className="text-base font-bold text-gray-800 m-0">Seguridad</h3>
              </div>
              <button
                onClick={() => setUnlockTarget(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-5 pt-2">
              <p className="text-sm text-gray-500 mb-1">
                Reabrir: <strong className="text-gray-700">{unlockTarget}</strong>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                🔐 Ingrese clave de Gerencia para reabrir esta carga.
              </p>

              {!unlockSuccess ? (
                <>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => {
                      setUnlockPassword(e.target.value);
                      setUnlockError('');
                    }}
                    placeholder="Clave de acceso"
                    className="w-full h-12 px-4 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 mb-3"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
                        if (unlockPassword === adminKey) {
                          reopenLoad(unlockTarget!);
                          setUnlockSuccess(true);
                          setTimeout(() => setUnlockTarget(null), 1500);
                        } else {
                          setUnlockError('Clave incorrecta');
                        }
                      }
                    }}
                  />

                  {unlockError && (
                    <p className="text-xs text-red-500 font-medium mb-3 flex items-center gap-1">
                      ❌ {unlockError}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;
                      if (unlockPassword === adminKey) {
                        reopenLoad(unlockTarget!);
                        setUnlockSuccess(true);
                        setTimeout(() => setUnlockTarget(null), 1500);
                      } else {
                        setUnlockError('Clave incorrecta');
                      }
                    }}
                    className="w-full h-12 bg-amber-500 text-white font-bold text-sm rounded-xl border-none cursor-pointer hover:bg-amber-600 active:scale-[0.98] transition-all"
                  >
                    <Unlock size={16} className="inline mr-1.5 -mt-0.5" />
                    Reabrir Carga
                  </button>
                </>
              ) : (
                <div className="text-center py-4">
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="text-sm font-semibold text-green-600 m-0">Carga reabierta exitosamente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
