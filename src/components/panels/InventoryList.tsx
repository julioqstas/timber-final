'use client';

// ============================================================================
// InventoryList — Optimized List for Large Datasets
// Replaces standard mapping with potential for virtualization
// ============================================================================

import { memo } from 'react';
import { PackageCard } from '@/components/cards/PackageCard';
import type { Package } from '@/types/timber';

interface InventoryListProps {
    packages: Package[];
    isLocked?: boolean;
    onEdit: (id: string) => void;
    selectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelection?: (id: string) => void;
    onLongPress?: (id: string) => void;
}

// Optimized component using React.memo
export const InventoryList = memo(function InventoryList({
    packages,
    isLocked,
    onEdit,
    selectionMode = false,
    selectedIds = new Set(),
    onToggleSelection,
    onLongPress
}: InventoryListProps) {
    if (packages.length === 0) {
        return (
            <div className="text-center text-gray-300 py-10 animate-fade-in">
                <div className="text-4xl mb-2 opacity-50">📦</div>
                <p>No hay paquetes en esta carga</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col animate-fade-in pb-24">
            {packages.map((pkg) => (
                <div key={pkg.id} className="mb-3">
                    <PackageCard
                        pkg={pkg}
                        locked={isLocked}
                        onEdit={onEdit}
                        selectable={selectionMode}
                        isSelected={selectedIds.has(pkg.id)}
                        onToggle={onToggleSelection}
                        onLongPress={onLongPress}
                    />
                </div>
            ))}
        </div>
    );
});
