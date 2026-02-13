'use client';

// ============================================================================
// Sidebar — Desktop/Tablet vertical navigation
// Visible on md+ (≥ 768px), hidden on mobile
// Replaces BottomBar dock on larger screens
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
        <aside className="hidden md:flex flex-col w-64 h-full bg-white border-r border-gray-200 shrink-0 z-40">
            {/* ===== Logo ===== */}
            <div className="px-5 pt-6 pb-5 flex items-center gap-3 border-b border-gray-100">
                <Image
                    src="/images/logo-fq.png.png"
                    alt="FQ System"
                    width={140}
                    height={48}
                    priority
                    className="h-10 w-auto object-contain"
                />
            </div>

            {/* ===== FAB Button ===== */}
            <div className="px-4 py-4">
                <button
                    onClick={onFab}
                    className="w-full bg-brand text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2.5 font-bold text-sm border-none cursor-pointer hover:bg-brand-dark transition-all active:scale-[0.97] shadow-fab"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Nuevo
                </button>
            </div>

            {/* ===== Navigation Items ===== */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange?.(id)}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                border-none cursor-pointer transition-all text-sm font-semibold
                                ${isActive
                                    ? 'bg-brand-light text-brand border-l-[3px] border-l-brand'
                                    : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }
                            `}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                            <span>{label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ===== Settings (bottom) ===== */}
            <div className="px-3 pb-5 pt-2 border-t border-gray-100 mt-auto">
                <button
                    onClick={onSettings}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-none cursor-pointer text-sm font-medium text-gray-500 bg-transparent hover:bg-gray-50 hover:text-gray-700 transition-all"
                >
                    <Settings size={20} strokeWidth={1.8} />
                    <span>Configuración</span>
                </button>
            </div>
        </aside>
    );
}
