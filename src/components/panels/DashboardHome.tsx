'use client';

// ============================================================================
// DashboardHome — Unified TID UX Pattern
// Centered question → Pulsing icon → Action cards → Mini module previews
// Matches the Inicio flow of tid-balance-sniffs and tid-gantt-hornos
// ============================================================================

import {
    Truck,
    Package,
    BarChart3,
    Settings,
} from 'lucide-react';

interface DashboardHomeProps {
    activeCount: number;
    stockCount: number;
    stockPT: number;
    totalPT: number;
    totalPackages: number;
    onNewLoad: () => void;
    onNewPackage: () => void;
    onNavigate: (tab: 'cargas' | 'stock' | 'reportes') => void;
    onSettings: () => void;
}

export function DashboardHome({
    onNewLoad,
    onNewPackage,
    onNavigate,
    onSettings,
}: DashboardHomeProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12 animate-fade-in"
            style={{ minHeight: 'calc(100dvh - 200px)' }}>

            {/* ==================== CENTERED QUESTION ==================== */}
            <h2 className="text-[22px] md:text-[28px] font-extrabold leading-tight m-0"
                style={{ color: 'var(--color-timber-dark)' }}>
                ¿Qué operación de
            </h2>
            <h2 className="text-[22px] md:text-[28px] font-extrabold leading-tight m-0"
                style={{ color: 'var(--color-brand)' }}>
                Packing List
            </h2>
            <h2 className="text-[22px] md:text-[28px] font-extrabold leading-tight mb-8 m-0"
                style={{ color: 'var(--color-timber-dark)' }}>
                te gustaría realizar hoy?
            </h2>

            {/* ==================== PULSING ANIMATED ICON ==================== */}
            <div className="relative flex items-center justify-center mb-6" style={{ width: 80, height: 80 }}>
                <span className="absolute inset-0 rounded-full" style={{
                    background: '#057b57',
                    animation: 'pulse-ring 1.8s cubic-bezier(0.215,0.61,0.355,1) infinite',
                    opacity: 0.4,
                }} />
                <div className="relative z-10 flex items-center justify-center rounded-full text-white w-full h-full"
                    style={{
                        background: 'var(--color-brand)',
                        boxShadow: 'var(--shadow-fab)',
                        animation: 'pulse-scale 2.4s ease-in-out infinite',
                    }}>
                    <Truck size={30} />
                </div>
            </div>

            {/* ==================== ACTION CARDS ==================== */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-10">
                {/* Nueva Carga */}
                <button
                    onClick={onNewLoad}
                    className="flex-1 flex flex-col items-center gap-2 py-6 px-5 bg-white rounded-2xl border border-gray-100 cursor-pointer transition-all hover:border-brand/30 hover:shadow-lg active:scale-[0.97]"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-brand-light)' }}>
                        <Truck size={22} style={{ color: 'var(--color-brand)' }} />
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: 'var(--color-timber-dark)' }}>
                        Nueva Carga
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-timber-grey)' }}>
                        Crear una carga nueva
                    </span>
                </button>

                {/* Nuevo Paquete */}
                <button
                    onClick={onNewPackage}
                    className="flex-1 flex flex-col items-center gap-2 py-6 px-5 bg-white rounded-2xl border border-gray-100 cursor-pointer transition-all hover:border-brand/30 hover:shadow-lg active:scale-[0.97]"
                    style={{ boxShadow: 'var(--shadow-card)' }}
                >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--color-brand-light)' }}>
                        <Package size={22} style={{ color: 'var(--color-brand)' }} />
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: 'var(--color-timber-dark)' }}>
                        Nuevo Paquete
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--color-timber-grey)' }}>
                        Agregar a Stock Libres
                    </span>
                </button>
            </div>

            {/* ==================== MINI MODULE PREVIEWS ==================== */}
            <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
                {[
                    { icon: <Truck size={16} />, label: 'Cargas', color: '#057b57', onClick: () => onNavigate('cargas') },
                    { icon: <Package size={16} />, label: 'Stock', color: '#7c3aed', onClick: () => onNavigate('stock') },
                    { icon: <BarChart3 size={16} />, label: 'Reportes', color: '#d97706', onClick: () => onNavigate('reportes') },
                    { icon: <Settings size={16} />, label: 'Config', color: '#4f46e5', onClick: onSettings },
                ].map(m => (
                    <button
                        key={m.label}
                        onClick={m.onClick}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white cursor-pointer border-none transition-all hover:opacity-80 active:scale-95"
                        style={{ boxShadow: 'var(--shadow-card)', opacity: 0.5 }}
                    >
                        <span style={{ color: m.color }}>{m.icon}</span>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--color-timber-grey)' }}>{m.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
