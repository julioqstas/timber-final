import { useState } from 'react';

interface ConfigSectionProps {
    title: string;
    items: string[];
    onAdd: (value: string) => void;
    onDelete: (index: number) => void;
    placeholder?: string;
}

export function ConfigSection({ title, items, onAdd, onDelete, placeholder = 'Nuevo...' }: ConfigSectionProps) {
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (!newValue.trim()) return;
        onAdd(newValue.trim());
        setNewValue('');
    };

    return (
        <div className="bg-surface-card rounded-card p-5 shadow-card border border-black/[0.02] mb-4">
            <div className="font-bold text-timber-dark text-lg mb-3 flex justify-between items-center">
                {title}
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {items.length}
                </span>
            </div>

            {/* List */}
            {items.length === 0 ? (
                <p className="text-sm text-gray-400 mb-4 italic">Sin elementos configurados</p>
            ) : (
                <ul className="list-none p-0 m-0 mb-4 space-y-1">
                    {items.map((item, i) => (
                        <li
                            key={i}
                            className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm group"
                        >
                            <span className="font-medium text-timber-dark">{item}</span>
                            <button
                                onClick={() => onDelete(i)}
                                className="text-gray-300 hover:text-danger transition-colors p-1 opacity-0 group-hover:opacity-100"
                                title="Eliminar"
                            >
                                🗑️
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Add Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 p-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-brand"
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                    onClick={handleAdd}
                    className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-dark transition-colors border-none cursor-pointer"
                    disabled={!newValue.trim()}
                >
                    +
                </button>
            </div>
        </div>
    );
}
