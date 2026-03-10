'use client';

// ============================================================================
// Sidebar — Desktop/Tablet vertical navigation
// Unified TID pattern: logo + title, SECCIONES label, nav items
// ============================================================================

import Image from 'next/image';
import {
    Home,
    Truck,
    Package,
    BarChart3,
    Plus,
    Settings,
} from 'lucide-react';

type DockTab = 'inicio' | 'cargas' | 'stock' | 'reportes';

interface SidebarProps {
    activeTab?: DockTab;
    onTabChange?: (tab: DockTab) => void;
    onFab?: () => void;
    onSettings?: () => void;
}

const navItems: { id: DockTab; label: string; icon: typeof Home }[] = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'cargas', label: 'Cargas', icon: Truck },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
];

export function Sidebar({ activeTab, onTabChange, onFab, onSettings }: SidebarProps) {
    return (
        <aside className="hidden md:flex flex-col w-[220px] shrink-0 bg-white border-r border-gray-100"
            style={{ boxShadow: 'var(--shadow-sidebar)' }}>

            {/* ===== Logo + Title ===== */}
            <div className="px-5 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <Image
                        src="/images/fq-big.png"
                        alt="FQ System"
                        width={40}
                        height={40}
                        priority
                        className="w-10 h-10 rounded-full object-contain"
                    />
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-none"
                            style={{ color: 'var(--color-brand)' }}>
                            TID - Generador Packing List
                        </p>
                    </div>
                </div>
            </div>

            {/* ===== Navigation Items ===== */}
            <nav className="flex-1 py-3 px-2 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2"
                    style={{ color: 'var(--color-timber-grey)' }}>
                    Secciones
                </p>
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange?.(id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 cursor-pointer border-none"
                            style={{
                                background: isActive ? 'var(--color-brand-light)' : 'transparent',
                                color: isActive ? 'var(--color-brand)' : 'var(--color-timber-dark)',
                                fontWeight: isActive ? 700 : 500,
                            }}
                        >
                            <span style={{ color: isActive ? 'var(--color-brand)' : 'var(--color-timber-grey)' }}>
                                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                            </span>
                            <span className="text-[13px]">{label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full"
                                    style={{ background: 'var(--color-brand)' }} />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ===== FAB Button (Desktop Bottom Right) ===== */}
            <button
                onClick={onFab}
                className="fixed bottom-8 right-8 bg-brand text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-brand-dark transition-all active:scale-95 z-50 cursor-pointer border-none"
                style={{ boxShadow: 'var(--shadow-fab)' }}
                title="Nuevo"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>

            {/* ===== Settings (bottom) ===== */}
            <div className="p-4 border-t border-gray-100 mt-auto">
                <button
                    onClick={onSettings}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-none cursor-pointer text-[13px] font-medium bg-transparent hover:bg-gray-50 transition-all"
                    style={{ color: 'var(--color-timber-grey)' }}
                >
                    <Settings size={20} strokeWidth={1.8} />
                    <span>Configuración</span>
                </button>
            </div>
        </aside>
    );
}
