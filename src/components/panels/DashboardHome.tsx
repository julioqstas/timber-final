'use client';

// ============================================================================
// DashboardHome — Inicio/Dashboard KPI View
// Premium SaaS-style dashboard with hero, stats grid, and quick actions
// ============================================================================

import { formatPT } from '@/lib/formatters';
import Image from 'next/image';
import {
    Truck,
    Package,
    BarChart3,
    FolderOpen,
    Plus,
    Settings,
    ChevronRight,
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
    activeCount,
    stockCount,
    stockPT,
    totalPT,
    totalPackages,
    onNewLoad,
    onNewPackage,
    onNavigate,
    onSettings,
}: DashboardHomeProps) {
    return (
        <div className="overflow-y-auto h-full pb-28 bg-white">
            {/* ==================== HEADER ==================== */}
            <div className="px-5 pt-6 pb-4 flex items-start justify-between">
                <div>
                    <h1 className="text-[1.55rem] font-extrabold text-timber-dark leading-tight tracking-tight m-0">
                        Generador de
                        <br />
                        Packing List
                    </h1>
                    <p className="text-sm text-timber-grey mt-1 m-0">Decking S4S-E4E</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={onSettings}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer border-none hover:bg-gray-200 transition-colors"
                        aria-label="Configuración"
                    >
                        <Settings size={20} />
                    </button>
                    <div className="h-10 flex items-center justify-center">
                        <Image
                            src="/images/logo-fq.png.png"
                            alt="FQ System"
                            width={120}
                            height={40}
                            priority
                            className="h-9 w-auto object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* ==================== HERO CARD ==================== */}
            <div className="px-5 mb-5">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand via-brand to-brand-dark p-5 min-h-[130px]">
                    {/* Decorative circles */}
                    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                    <div className="absolute -bottom-4 -right-10 w-24 h-24 rounded-full bg-white/5" />
                    <div className="absolute top-3 right-4 w-14 h-14 rounded-full bg-white/8" />

                    {/* Hero illustration */}
                    <div className="absolute right-2 bottom-0 w-[120px] h-[100px] opacity-30">
                        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            {/* Forklift silhouette */}
                            <rect x="15" y="55" width="50" height="25" rx="4" fill="white" fillOpacity="0.6" />
                            <rect x="20" y="35" width="15" height="20" rx="2" fill="white" fillOpacity="0.4" />
                            <circle cx="25" cy="85" r="6" fill="white" fillOpacity="0.5" />
                            <circle cx="55" cy="85" r="6" fill="white" fillOpacity="0.5" />
                            {/* Pallet */}
                            <rect x="70" y="45" width="35" height="8" rx="2" fill="white" fillOpacity="0.3" />
                            <rect x="75" y="30" width="10" height="15" rx="1" fill="white" fillOpacity="0.4" />
                            <rect x="88" y="35" width="10" height="10" rx="1" fill="white" fillOpacity="0.35" />
                            <rect x="70" y="53" width="4" height="12" fill="white" fillOpacity="0.2" />
                            <rect x="100" y="53" width="4" height="12" fill="white" fillOpacity="0.2" />
                        </svg>
                    </div>

                    {/* Text content */}
                    <div className="relative z-10">
                        <h2 className="text-white text-xl font-bold m-0 mb-1.5">
                            ¡Hola Bienvenido! 👋
                        </h2>
                        <p className="text-white/80 text-sm m-0 leading-relaxed max-w-[220px]">
                            ¿Listo para empezar a gestionar tus cargas?
                        </p>
                    </div>

                    {/* Carousel dots (decorative) */}
                    <div className="flex gap-1.5 mt-4 relative z-10">
                        <div className="w-6 h-1.5 rounded-full bg-white" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>
                </div>
            </div>

            {/* ==================== STATS GRID ==================== */}
            <div className="px-5 mb-5">
                <div className="grid grid-cols-2 gap-3">
                    {/* Cargas en Proceso */}
                    <button
                        onClick={() => onNavigate('cargas')}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left cursor-pointer hover:shadow-md transition-all active:scale-[0.97] group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-3 group-hover:scale-110 transition-transform">
                            <Truck size={20} />
                        </div>
                        <div className="text-3xl font-extrabold text-timber-dark leading-none">
                            {activeCount}
                        </div>
                        <div className="text-xs text-timber-grey mt-1 font-medium">
                            Cargas en Proceso
                        </div>
                    </button>

                    {/* Paquetes Libres */}
                    <button
                        onClick={() => onNavigate('stock')}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left cursor-pointer hover:shadow-md transition-all active:scale-[0.97] group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-3 group-hover:scale-110 transition-transform">
                            <Package size={20} />
                        </div>
                        <div className="text-3xl font-extrabold text-timber-dark leading-none">
                            {stockCount}
                        </div>
                        <div className="text-xs text-timber-grey mt-1 font-medium">
                            Paquetes Libres ({formatPT(stockPT)} PT)
                        </div>
                    </button>

                    {/* Total PT */}
                    <button
                        onClick={() => onNavigate('reportes')}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left cursor-pointer hover:shadow-md transition-all active:scale-[0.97] group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-3 group-hover:scale-110 transition-transform">
                            <BarChart3 size={20} />
                        </div>
                        <div className="text-3xl font-extrabold text-timber-dark leading-none">
                            {formatPT(totalPT)}
                        </div>
                        <div className="text-xs text-timber-grey mt-1 font-medium">
                            Total PT operados
                        </div>
                    </button>

                    {/* Paquetes Enzunchados */}
                    <button
                        onClick={() => onNavigate('reportes')}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left cursor-pointer hover:shadow-md transition-all active:scale-[0.97] group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-3 group-hover:scale-110 transition-transform">
                            <FolderOpen size={20} />
                        </div>
                        <div className="text-3xl font-extrabold text-timber-dark leading-none">
                            {totalPackages}
                        </div>
                        <div className="text-xs text-timber-grey mt-1 font-medium">
                            Paquetes Enzunchados
                        </div>
                    </button>
                </div>
            </div>

            {/* ==================== QUICK ACTIONS ==================== */}
            <div className="px-5">
                <div className="text-[11px] font-bold text-timber-grey uppercase tracking-[0.12em] mb-3 ml-1">
                    Acciones Rápidas
                </div>

                {/* Nueva Carga — Primary */}
                <button
                    onClick={onNewLoad}
                    className="w-full bg-brand text-white rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer hover:bg-brand-dark transition-colors border-none active:scale-[0.98] mb-3 shadow-sm"
                >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Truck size={22} />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="font-bold text-[15px] leading-tight">Nueva Carga</div>
                        <div className="text-xs text-white/70 mt-0.5">Crear una carga nueva</div>
                    </div>
                    <ChevronRight size={20} className="text-white/50 shrink-0" />
                </button>

                {/* Nuevo Paquete — Secondary */}
                <button
                    onClick={onNewPackage}
                    className="w-full bg-white text-timber-dark rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 active:scale-[0.98] shadow-sm"
                >
                    <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center text-brand shrink-0">
                        <Package size={22} />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="font-bold text-[15px] leading-tight">Nuevo Paquete</div>
                        <div className="text-xs text-timber-grey mt-0.5">Agregar a Stock Libres</div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 shrink-0" />
                </button>
            </div>
        </div>
    );
}
