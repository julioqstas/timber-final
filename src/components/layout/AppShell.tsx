'use client';

// ============================================================================
// AppShell — Main application frame with 5-tab bottom dock
// Replaces legacy #app-frame + .header + .dock structure
// ============================================================================

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useTimberStore } from '@/store/timber-store';

type DockTab = 'inicio' | 'cargas' | 'stock' | 'reportes';

interface AppShellProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
    onSettings?: () => void;
    onBack?: () => void;
    headerActions?: ReactNode;
    hideHeader?: boolean;
    // New 5-tab dock
    activeTab?: DockTab;
    onTabChange?: (tab: DockTab) => void;
    onFab?: () => void;
}

export function AppShell({
    children,
    title = '¡Hola! 👋',
    subtitle = '¿Listo para operar?',
    onSettings,
    onBack,
    headerActions,
    hideHeader = false,
    activeTab,
    onTabChange,
    onFab,
}: AppShellProps) {
    const router = useRouter();
    const pathname = usePathname();
    const fetchInitialData = useTimberStore(state => state.fetchInitialData);
    const isLoading = useTimberStore(state => state.isLoading);

    useEffect(() => {
        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isHome = pathname === '/';
    const showBack = !isHome || !!onBack;
    const showDock = !!onTabChange; // Only show dock if tab handler exists

    const tabs: { id: DockTab; label: string; icon: ReactNode }[] = [
        {
            id: 'inicio',
            label: 'Inicio',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            id: 'cargas',
            label: 'Cargas',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" rx="2" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
            ),
        },
        {
            id: 'stock',
            label: 'Stock',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            ),
        },
        {
            id: 'reportes',
            label: 'Reportes',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex flex-col h-full max-w-[480px] mx-auto bg-white relative">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-[60] flex items-center justify-center backdrop-blur-sm animate-fade-in">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                        <span className="text-brand font-semibold text-sm">Cargando datos...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            {!hideHeader && (
                <header className="bg-brand text-white px-5 py-3 pt-[max(12px,env(safe-area-inset-top))] flex items-center gap-3 shadow-header shrink-0 z-50">
                    {showBack && (
                        <button
                            onClick={onBack || (() => router.back())}
                            className="bg-transparent border-none text-white p-1 -ml-2 cursor-pointer flex items-center justify-center active:bg-white/10 rounded-full transition-colors"
                            aria-label="Volver"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M19 12H5" />
                                <path d="M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <Image
                            src="/images/logo-fq.png.png"
                            alt="FQ System"
                            width={120}
                            height={42}
                            priority
                            className="h-9 w-auto object-contain"
                        />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-base font-bold tracking-tight leading-tight m-0">
                            {title}
                        </h1>
                        <p className="text-xs opacity-90 font-normal m-0">{subtitle}</p>
                    </div>
                    {/* Right-side actions */}
                    {headerActions && (
                        <div className="flex items-center gap-1">
                            {headerActions}
                        </div>
                    )}
                    {onSettings && (
                        <button
                            className="ml-auto bg-transparent border-none text-white text-2xl cursor-pointer"
                            onClick={onSettings}
                            aria-label="Configuración"
                        >
                            ⚙️
                        </button>
                    )}
                </header>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                {children}
            </div>

            {/* ==================== 5-TAB BOTTOM DOCK ==================== */}
            {showDock && (
                <div className="absolute bottom-0 w-full bg-white/95 backdrop-blur-md px-2 py-1.5 pb-[max(8px,env(safe-area-inset-bottom))] border-t border-gray-200 flex items-end justify-around z-[100]">
                    {/* Left tabs (Inicio, Cargas) */}
                    {tabs.slice(0, 2).map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange!(tab.id)}
                                className={`border-none bg-transparent cursor-pointer flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all min-w-[56px] ${isActive
                                    ? 'text-brand'
                                    : 'text-gray-400 active:text-gray-600'
                                    }`}
                            >
                                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    {tab.icon}
                                </span>
                                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'font-bold' : ''}`}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <div className="w-4 h-0.5 rounded-full bg-brand mt-0.5" />
                                )}
                            </button>
                        );
                    })}

                    {/* Center FAB */}
                    <button
                        className="bg-brand text-white w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-fab border-none -mt-5 cursor-pointer hover:bg-brand-dark transition-all active:scale-95"
                        onClick={onFab}
                        aria-label="Crear nuevo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>

                    {/* Right tabs (Stock, Reportes) */}
                    {tabs.slice(2).map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange!(tab.id)}
                                className={`border-none bg-transparent cursor-pointer flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all min-w-[56px] ${isActive
                                    ? 'text-brand'
                                    : 'text-gray-400 active:text-gray-600'
                                    }`}
                            >
                                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    {tab.icon}
                                </span>
                                <span className={`text-[10px] font-semibold leading-tight ${isActive ? 'font-bold' : ''}`}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <div className="w-4 h-0.5 rounded-full bg-brand mt-0.5" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
