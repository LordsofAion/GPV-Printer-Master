
import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Phone, User, X, Check, ChevronRight } from 'lucide-react';

interface Customer {
    id: number;
    nome: string;
    telefone: string;
    email?: string;
}

interface CustomerSelectorProps {
    onSelect: (customer: Customer | null) => void;
    selectedId?: number;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ onSelect, selectedId }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selected, setSelected] = useState<Customer | null>(null);

    // New Customer Form
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const loadCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/clientes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
                if (selectedId) {
                    const found = data.find((c: Customer) => c.id === selectedId);
                    if (found) setSelected(found);
                }
            }
        } catch (err) {
            console.error("Erro ao carregar clientes", err);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, [selectedId]);

    const filtered = customers.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.telefone.includes(search)
    );

    const handleCreate = async () => {
        if (!newName || !newPhone) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000,api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome: newName, telefone: newPhone })
            });
            if (response.ok) {
                const newCustomer = await response.json();
                setCustomers([...customers, newCustomer]);
                handleSelect(newCustomer);
                setShowNewModal(false);
                setNewName('');
                setNewPhone('');
            }
        } catch (err) {
            console.error("Erro ao criar cliente", err);
        }
    };

    const handleSelect = (c: Customer | null) => {
        setSelected(c);
        onSelect(c);
        setShowDropdown(false);
        setSearch('');
    };

    return (
        <div className="relative w-full">
            <div className="flex items-center gap-2 mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente / Contato</label>
                {selected && (
                    <button onClick={() => handleSelect(null)} className="text-rose-500 hover:text-rose-700">
                        <X size={12} />
                    </button>
                )}
            </div>

            {!selected ? (
                <div className="relative">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar cliente ou telefone..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-900 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="px-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600"
                            title="Novo Cliente"
                        >
                            <UserPlus size={20} />
                        </button>
                    </div>

                    {showDropdown && (search || filtered.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                            {filtered.length > 0 ? (
                                filtered.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelect(c)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                                {c.nome.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-slate-900">{c.nome}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{c.telefone}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300" />
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <User size={32} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-xs text-slate-400">Nenhum cliente encontrado</p>
                                    <button
                                        onClick={() => setShowNewModal(true)}
                                        className="mt-3 text-indigo-600 text-xs font-bold hover:underline"
                                    >
                                        + Adicionar "{search}"
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <User size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-indigo-900">{selected.nome}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Phone size={10} className="text-indigo-400" />
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selected.telefone}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                            <Check size={16} />
                        </div>
                    </div>
                </div>
            )}

            {/* New Customer Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Novo Cliente</h3>
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Cadastro Rápido CRM</p>
                            </div>
                            <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Ex: João da Silva"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-900 outline-none font-bold transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp / Telefone</label>
                                <input
                                    type="text"
                                    value={newPhone}
                                    onChange={e => setNewPhone(e.target.value)}
                                    placeholder="55XXXXXXXXXXXX"
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-slate-900 outline-none font-bold transition-all"
                                />
                                <p className="text-[9px] text-slate-400 font-bold ml-1 italic">Use o formato: código país + DDD + número (ex: 5511999999999)</p>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={!newName || !newPhone}
                                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-20"
                            >
                                Cadastrar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerSelector;
