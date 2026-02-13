'use client';

// ============================================================================
// CargaMultiSelect — Hybrid Mobile/Desktop Multi-select
// Mobile: Full-screen modal overlay
// Desktop (md+): Floating popover dropdown
// ============================================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { Filter, X, Search, Check, ChevronDown } from 'lucide-react';

interface CargaMultiSelectProps {
    todasLasCargas: string[];
    cargasSeleccionadas: string[];
    setCargasSeleccionadas: (cargas: string[]) => void;
}

export function CargaMultiSelect({
    todasLasCargas,
    cargasSeleccionadas,
    setCargasSeleccionadas,
}: CargaMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [tempSelection, setTempSelection] = useState<string[]>([]);
    const searchRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync temp selection when opening
    const handleOpen = () => {
        setTempSelection([...cargasSeleccionadas]);
        setSearch('');
        setIsOpen(true);
    };

    // Autofocus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 150);
        }
    }, [isOpen]);

    // Prevent body scroll on mobile when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Close on click outside (desktop only)
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        // Small delay to avoid closing immediately
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClick);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClick);
        };
    }, [isOpen]);

    // Sort descending (2026 first)
    const sortedCargas = [...todasLasCargas].sort((a, b) => b.localeCompare(a));

    // Filter by search
    const filteredCargas = sortedCargas.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    const toggleCarga = useCallback((name: string) => {
        setTempSelection(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
        );
    }, []);

    const handleApply = () => {
        setCargasSeleccionadas(tempSelection);
        setIsOpen(false);
    };

    const handleClear = () => {
        setTempSelection([]);
    };

    // ===== Trigger =====
    const hasSelection = cargasSeleccionadas.length > 0;
    const triggerLabel = hasSelection
        ? `Cargas: ${cargasSeleccionadas.length} seleccionada${cargasSeleccionadas.length > 1 ? 's' : ''}`
        : 'Filtrar Cargas (Todas)';

    // ===== Shared list content =====
    const renderList = () => (
        <>
            {filteredCargas.length > 0 ? (
                filteredCargas.map((carga) => {
                    const isSelected = tempSelection.includes(carga);
                    return (
                        <button
                            key={carga}
                            onClick={() => toggleCarga(carga)}
                            className={`w-full flex items-center justify-between px-4 min-h-[52px] border-b border-gray-50 transition-colors active:bg-gray-100 ${isSelected ? 'bg-brand/5' : 'bg-white hover:bg-gray-50'
                                }`}
                        >
                            <span className={`text-sm ${isSelected ? 'font-semibold text-brand' : 'text-gray-700'
                                }`}>
                                {carga}
                            </span>
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                                ? 'bg-brand border-brand'
                                : 'border-gray-300 bg-white'
                                }`}>
                                {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="flex items-center justify-center h-24 text-gray-300 text-sm">
                    No se encontraron cargas
                </div>
            )}
        </>
    );

    // ===== Shared footer =====
    const renderFooter = () => (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white">
            <button
                onClick={handleClear}
                disabled={tempSelection.length === 0}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 whitespace-nowrap"
            >
                Limpiar Todo
            </button>
            <button
                onClick={handleApply}
                className="flex-1 h-11 rounded-xl bg-green-600 text-white text-sm font-bold shadow-sm hover:bg-green-700 active:bg-green-800 transition-colors active:scale-[0.98]"
            >
                Aplicar ({tempSelection.length})
            </button>
        </div>
    );

    return (
        <div className="relative" ref={containerRef}>
            {/* ======================== TRIGGER ======================== */}
            <button
                onClick={handleOpen}
                className={`w-full h-12 flex items-center justify-between px-4 rounded-xl border text-sm font-medium transition-all active:scale-[0.98] ${hasSelection
                    ? 'bg-brand/5 border-brand/20 text-brand'
                    : 'bg-white border-gray-200 text-gray-600'
                    }`}
            >
                <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {triggerLabel}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* ============================================================
                        MOBILE: Full-screen overlay (hidden on md+)
                    ============================================================ */}
                    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:hidden animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                            <h2 className="text-base font-bold text-gray-800">Seleccionar Cargas</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar carga..."
                                    className="w-full h-11 pl-10 pr-4 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                                {tempSelection.length} de {todasLasCargas.length} seleccionadas
                            </p>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">{renderList()}</div>

                        {/* Footer */}
                        <div className="shrink-0 pb-20">{renderFooter()}</div>
                    </div>

                    {/* ============================================================
                        DESKTOP: Floating popover (hidden below md)
                    ============================================================ */}
                    <div className="hidden md:block absolute top-full left-0 right-0 mt-2 z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in"
                        style={{ maxWidth: '24rem' }}
                    >
                        {/* Search */}
                        <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar carga..."
                                    className="w-full h-9 pl-8 pr-3 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                                    autoFocus
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {tempSelection.length} de {todasLasCargas.length} seleccionadas
                            </p>
                        </div>

                        {/* List */}
                        <div className="max-h-[300px] overflow-y-auto">{renderList()}</div>

                        {/* Footer */}
                        {renderFooter()}
                    </div>
                </>
            )}
        </div>
    );
}
