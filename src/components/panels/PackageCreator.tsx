'use client';

// ============================================================================
// PackageCreator — Bottom Sheet Form
// Replaces legacy sheet-creator (index.html:236-273)
// ============================================================================

import { useState, useEffect } from 'react';
import { useTimberStore } from '@/store/timber-store';
import { calculatePT, generateNextPackageId } from '@/lib/calculations';
import { formatPT } from '@/lib/formatters';

import type { PackageLine } from '@/types/timber';
import { BottomSheet } from '@/components/ui/BottomSheet';

interface PackageCreatorProps {
    onClose: () => void;
    targetLoad: string | null;
    editModeId?: string | null;
    initialLines?: PackageLine[];
}

// Internal editable line (strings for controlled inputs)
interface EditableLine {
    id: number;
    largo: string;
    piezas: string;
    pt: number;
}

// Convert PackageLine[] to EditableLine[]
function toEditableLines(lines: PackageLine[]): EditableLine[] {
    return lines.map((l, i) => ({
        id: Date.now() + i,
        largo: String(l.largo),
        piezas: String(l.piezas),
        pt: l.pt,
    }));
}

export function PackageCreator({
    onClose,
    targetLoad,
    editModeId,
    initialLines,
}: PackageCreatorProps) {
    // Store
    const packages = useTimberStore((s) => s.packages);
    const config = useTimberStore((s) => s.config);
    const addPackage = useTimberStore((s) => s.addPackage);
    const updatePackage = useTimberStore((s) => s.updatePackage);
    const deletePackage = useTimberStore((s) => s.deletePackage);

    // Form State
    const [id, setId] = useState('');
    const [destino, setDestino] = useState(targetLoad || 'Stock Libres');
    const [species, setSpecies] = useState(config.species[0] || '');
    const [finish, setFinish] = useState(config.finishes[0] || '');
    const [cert, setCert] = useState(config.certs[0] || '');

    // Inline editable lines (same pattern as EstimatorSheet)
    const [lines, setLines] = useState<EditableLine[]>([
        { id: 1, largo: '', piezas: '', pt: 0 },
        { id: 2, largo: '', piezas: '', pt: 0 },
        { id: 3, largo: '', piezas: '', pt: 0 },
    ]);

    // Initialize
    useEffect(() => {
        if (editModeId) {
            const pkg = packages.find((p) => p.id === editModeId);
            if (pkg) {
                setId(pkg.id);
                setDestino(pkg.destino);
                setSpecies(pkg.species);
                setFinish(pkg.finish);
                setCert(pkg.cert);
                setLines(toEditableLines(pkg.contenido));
            }
        } else {
            setId(generateNextPackageId(packages));
            if (initialLines && initialLines.length > 0) {
                setLines(toEditableLines(initialLines));
            }
        }
    }, [editModeId, packages, initialLines]);

    // Line handlers (identical to Estimator)
    const updateLine = (lineId: number, field: 'largo' | 'piezas', val: string) => {
        setLines(prev => prev.map(line => {
            if (line.id !== lineId) return line;
            const newLine = { ...line, [field]: val };
            const l = parseInt(newLine.largo) || 0;
            const p = parseInt(newLine.piezas) || 0;
            newLine.pt = (l > 0 && p > 0) ? calculatePT(l, p) : 0;
            return newLine;
        }));
    };

    const removeLine = (lineId: number) => {
        setLines(prev => prev.filter(l => l.id !== lineId));
    };

    const addLine = () => {
        setLines(prev => [...prev, { id: Date.now(), largo: '', piezas: '', pt: 0 }]);
    };

    // Save
    const handleSave = () => {
        // Convert editable lines to PackageLine[], filtering empties
        const validLines: PackageLine[] = lines
            .filter(l => l.pt > 0)
            .map(l => ({
                largo: parseInt(l.largo) || 0,
                piezas: parseInt(l.piezas) || 0,
                pt: l.pt,
            }));

        if (!id || validLines.length === 0) {
            alert('Faltan datos (ID o contenido)');
            return;
        }

        const pkgData = {
            id,
            destino,
            species,
            finish,
            cert,
            contenido: validLines,
            ptTotal: validLines.reduce((sum, l) => sum + l.pt, 0),
        };

        if (editModeId) {
            updatePackage(editModeId, pkgData);
        } else {
            if (packages.some((p) => p.id === id)) {
                alert(`El ID ${id} ya existe`);
                return;
            }
            addPackage(pkgData);
        }
        onClose();
    };

    const handleDelete = () => {
        if (confirm('¿Eliminar paquete?')) {
            if (editModeId) deletePackage(editModeId);
            onClose();
        }
    };

    const totalPT = lines.reduce((sum, l) => sum + l.pt, 0);

    // Footer
    const footer = (
        <div className="flex flex-col gap-2.5">
            <div className="text-right text-sm text-gray-500 mb-2">
                Total: <strong className="text-brand text-lg">{formatPT(totalPT)}</strong>
            </div>
            <button
                onClick={handleSave}
                className="w-full py-3.5 bg-brand text-white font-bold text-sm rounded-input border-none cursor-pointer hover:bg-brand-dark transition-colors"
            >
                {editModeId ? 'GUARDAR CAMBIOS' : 'GUARDAR PAQUETE'}
            </button>
            {editModeId && (
                <button
                    onClick={handleDelete}
                    className="w-full py-3.5 bg-transparent border border-danger text-danger font-bold text-sm rounded-input cursor-pointer hover:bg-red-50 transition-colors"
                >
                    🗑️ ELIMINAR
                </button>
            )}
        </div>
    );

    return (
        <BottomSheet
            isOpen={true}
            onClose={onClose}
            title={editModeId ? 'Editar Paquete' : 'Nuevo Paquete'}
            footer={footer}
            fullHeight={true}
        >
            <div className="space-y-4 pb-4">
                {/* Row 1: ID + Destino */}
                <div className="flex gap-2.5">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-timber-grey block mb-1.5">
                            CÓDIGO (ID)
                        </label>
                        <input
                            type="text"
                            value={id}
                            readOnly={!!editModeId}
                            onChange={(e) => setId(e.target.value.toUpperCase())}
                            className="w-full p-3.5 text-base font-semibold border border-gray-200 rounded-input bg-white text-timber-dark outline-none uppercase read-only:bg-gray-100 read-only:text-gray-400"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-timber-grey block mb-1.5">
                            DESTINO
                        </label>
                        <select
                            value={destino}
                            onChange={(e) => setDestino(e.target.value)}
                            className="w-full p-3.5 text-base border border-gray-200 rounded-input bg-white outline-none appearance-none h-[54px]"
                        >
                            <option value="Stock Libres">Stock Libres</option>
                            {config.activeLoads.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 2: Species + Finish */}
                <div className="flex gap-2.5">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-timber-grey block mb-1.5">
                            ESPECIE
                        </label>
                        <select
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            className="w-full p-3.5 text-base border border-gray-200 rounded-input bg-white outline-none appearance-none"
                        >
                            {config.species.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-timber-grey block mb-1.5">
                            ACABADO
                        </label>
                        <select
                            value={finish}
                            onChange={(e) => setFinish(e.target.value)}
                            className="w-full p-3.5 text-base border border-gray-200 rounded-input bg-white outline-none appearance-none"
                        >
                            {config.finishes.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Row 3: Cert */}
                <div>
                    <label className="text-xs font-bold text-timber-grey block mb-1.5">
                        CERTIFICACIÓN
                    </label>
                    <select
                        value={cert}
                        onChange={(e) => setCert(e.target.value)}
                        className="w-full p-3.5 text-base border border-gray-200 rounded-input bg-white outline-none appearance-none"
                    >
                        {config.certs.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                {/* ==================== CONTENIDO (Inline rows like Estimator) ==================== */}
                <div>
                    <div className="flex text-xs font-bold text-gray-400 mb-2 px-1">
                        <div className="w-[28%] pl-2">LARGO</div>
                        <div className="w-[42%]">PIEZAS</div>
                        <div className="flex-1 text-right">PT</div>
                        <div className="w-8"></div>
                    </div>

                    <div className="space-y-2">
                        {lines.map((line) => (
                            <div key={line.id} className="flex gap-2 items-center">
                                <input
                                    type="number"
                                    placeholder="L"
                                    className="w-[28%] p-3 rounded-xl border border-gray-200 font-bold text-center outline-none focus:border-brand bg-white"
                                    value={line.largo}
                                    onChange={(e) => updateLine(line.id, 'largo', e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Pz"
                                    className="w-[42%] p-3 rounded-xl border border-gray-200 font-bold text-center outline-none focus:border-brand bg-white"
                                    value={line.piezas}
                                    onChange={(e) => updateLine(line.id, 'piezas', e.target.value)}
                                />
                                <div className={`flex-1 text-right font-bold text-sm ${line.pt > 0 ? 'text-brand' : 'text-gray-300'}`}>
                                    {formatPT(line.pt)}
                                </div>
                                <button
                                    onClick={() => removeLine(line.id)}
                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-danger rounded-full active:bg-gray-100 bg-transparent border-none cursor-pointer"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addLine}
                        className="mt-4 w-full py-3 text-sm font-bold text-brand bg-brand-light rounded-xl hover:bg-green-100 transition-colors border-none cursor-pointer"
                    >
                        + Añadir Línea
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
}
