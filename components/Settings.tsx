import React, { useState, useEffect, useRef } from 'react';
import {
    Building2, Palette, Settings2, Upload, Save,
    CheckCircle2, AlertTriangle, Image, Type, Phone,
    Mail, MapPin, Globe, RefreshCw, Eye, Sliders,
    Sun, Moon, Zap, User, Shield
} from 'lucide-react';

interface CompanySettings {
    nomeEmpresa: string;
    slogan: string;
    telefone: string;
    email: string;
    endereco: string;
    site: string;
    logo: string | null; // base64
}

interface ThemeSettings {
    primaryColor: string;
    sidebarColor: string;
    accentColor: string;
    fontFamily: string;
    borderRadius: string;
    darkSidebar: boolean;
}

const THEME_PRESETS = [
    { name: 'Slate Pro', primary: '#0f172a', sidebar: '#0f172a', accent: '#6366f1' },
    { name: 'Indigo', primary: '#4338ca', sidebar: '#1e1b4b', accent: '#818cf8' },
    { name: 'Emerald', primary: '#065f46', sidebar: '#064e3b', accent: '#10b981' },
    { name: 'Rose', primary: '#9f1239', sidebar: '#4c0519', accent: '#f43f5e' },
    { name: 'Amber', primary: '#92400e', sidebar: '#1c1917', accent: '#f59e0b' },
    { name: 'Cyan', primary: '#164e63', sidebar: '#0c4a6e', accent: '#06b6d4' },
];

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'empresa' | 'aparencia' | 'sistema' | 'usuarios'>('empresa');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const [company, setCompany] = useState<CompanySettings>({
        nomeEmpresa: 'GPV Studio',
        slogan: 'Soluões Gráficas & Estamparia',
        telefone: '',
        email: '',
        endereco: '',
        site: '',
        logo: null,
    });

    const [theme, setTheme] = useState<ThemeSettings>({
        primaryColor: '#0f172a',
        sidebarColor: '#0f172a',
        accentColor: '#6366f1',
        fontFamily: 'Inter',
        borderRadius: '12',
        darkSidebar: true,
    });

    // Load saved settings from localStorage on mount
    useEffect(() => {
        const savedCompany = localStorage.getItem('gpv_company');
        const savedTheme = localStorage.getItem('gpv_theme');
        if (savedCompany) setCompany(JSON.parse(savedCompany));
        if (savedTheme) setTheme(JSON.parse(savedTheme));
    }, []);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveCompany = async () => {
        setSaving(true);
        try {
            localStorage.setItem('gpv_company', JSON.stringify(company));
            // Persist to backend
            const token = localStorage.getItem('token');
            await fetch('http://localhost:3000/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ company, theme })
            }).catch(() => { }); // non-critical
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            showToast('Configuraões da empresa salvas!');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTheme = () => {
        localStorage.setItem('gpv_theme', JSON.stringify(theme));
        // Apply CSS variables immediately
        applyTheme(theme);
        showToast('Tema aplicado e salvo!');
    };

    const applyTheme = (t: ThemeSettings) => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', t.primaryColor);
        root.style.setProperty('--color-sidebar', t.sidebarColor);
        root.style.setProperty('--color-accent', t.accentColor);
    };

    const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
        const newTheme = { ...theme, primaryColor: preset.primary, sidebarColor: preset.sidebar, accentColor: preset.accent };
        setTheme(newTheme);
        applyTheme(newTheme);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Logo deve ter no máximo 2MB', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => setCompany(c => ({ ...c, logo: ev.target?.result as string }));
        reader.readAsDataURL(file);
    };

    const handleResetTheme = () => {
        const def: ThemeSettings = { primaryColor: '#0f172a', sidebarColor: '#0f172a', accentColor: '#6366f1', fontFamily: 'Inter', borderRadius: '12', darkSidebar: true };
        setTheme(def);
        applyTheme(def);
        localStorage.removeItem('gpv_theme');
        showToast('Tema restaurado ao padrão');
    };

    const tabs = [
        { id: 'empresa', label: 'Empresa', icon: <Building2 size={16} /> },
        { id: 'aparencia', label: 'Aparência', icon: <Palette size={16} /> },
        { id: 'sistema', label: 'Sistema', icon: <Settings2 size={16} /> },
    ] as const;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configuraões</h1>
                <p className="text-slate-500 text-sm font-medium">Personalize o sistema, empresa e aparência.</p>
            </header>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <aside className="w-52 flex-shrink-0">
                    <nav className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold transition-all border-b border-slate-100 last:border-0 ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Live Preview Card */}
                    <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preview</p>
                        <div className="rounded-lg overflow-hidden border border-slate-200">
                            <div className="p-2 text-white text-[10px] font-bold flex items-center gap-1.5" style={{ backgroundColor: theme.sidebarColor }}>
                                <Zap size={10} />
                                {company.nomeEmpresa.substring(0, 12)}
                            </div>
                            <div className="bg-slate-50 p-2 space-y-1">
                                {['Dashboard', 'PDV', 'Gráfica'].map(item => (
                                    <div key={item} className="text-[9px] font-bold text-slate-400 px-1">{item}</div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-3 flex gap-1.5">
                            <div className="h-4 flex-1 rounded" style={{ backgroundColor: theme.primaryColor }} />
                            <div className="h-4 flex-1 rounded" style={{ backgroundColor: theme.accentColor }} />
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {/* âââ EMPRESA âââââââââââââââââââââââââââââââââââââââ */}
                    {activeTab === 'empresa' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-black text-slate-800 flex items-center gap-2"><Building2 size={16} className="text-indigo-500" /> Identidade da Empresa</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Essas informaões aparecem em recibos, OS e relatórios.</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Logo Upload */}
                                    <div className="flex items-start gap-6">
                                        <div
                                            className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group flex-shrink-0 overflow-hidden"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            {company.logo ? (
                                                <img src={company.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                            ) : (
                                                <>
                                                    <Image size={24} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                    <span className="text-[9px] text-slate-300 font-bold uppercase mt-1">Logo</span>
                                                </>
                                            )}
                                        </div>
                                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-700">Logo da Empresa</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, SVG ou JPG, máx 2MB. Recomendado: 200×200px ou maior.</p>
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all">
                                                    <Upload size={12} /> Enviar Logo
                                                </button>
                                                {company.logo && (
                                                    <button onClick={() => setCompany(c => ({ ...c, logo: null }))} className="px-3 py-1.5 border border-slate-200 text-slate-400 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all">
                                                        Remover
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Type size={11} /> Nome da Empresa *</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all" value={company.nomeEmpresa} onChange={e => setCompany(c => ({ ...c, nomeEmpresa: e.target.value }))} placeholder="Ex: GPV Studio Gráfico" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slogan / Subtítulo</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all" value={company.slogan} onChange={e => setCompany(c => ({ ...c, slogan: e.target.value }))} placeholder="Ex: Soluões Gráficas & Estamparia" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Phone size={11} /> Telefone</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all" value={company.telefone} onChange={e => setCompany(c => ({ ...c, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Mail size={11} /> E-mail</label>
                                            <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} placeholder="contato@empresa.com" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={11} /> Endereo</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all" value={company.endereco} onChange={e => setCompany(c => ({ ...c, endereco: e.target.value }))} placeholder="Rua, nÂº, Bairro, Cidade - UF, CEP" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Globe size={11} /> Site</label>
                                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-slate-200 focus:bg-white transition-all" value={company.site} onChange={e => setCompany(c => ({ ...c, site: e.target.value }))} placeholder="https://www.suaempresa.com.br" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleSaveCompany}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-sm disabled:opacity-50 active:scale-95"
                                        >
                                            {saved ? <CheckCircle2 size={16} className="text-emerald-400" /> : saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                                            {saved ? 'Salvo!' : 'Salvar Empresa'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* âââ APARÃNCIA âââââââââââââââââââââââââââââââââââââââ */}
                    {activeTab === 'aparencia' && (
                        <div className="space-y-6">
                            {/* Theme Presets */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-black text-slate-800 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> Temas Prontos</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Aplique um tema em 1 clique.</p>
                                </div>
                                <div className="p-6 grid grid-cols-3 gap-3">
                                    {THEME_PRESETS.map(preset => (
                                        <button
                                            key={preset.name}
                                            onClick={() => applyPreset(preset)}
                                            className="flex flex-col gap-2 p-3 rounded-xl border-2 border-transparent hover:border-slate-200 transition-all hover:shadow-md group"
                                        >
                                            <div className="flex gap-1.5 h-8">
                                                <div className="w-6 rounded flex-shrink-0" style={{ backgroundColor: preset.sidebar }} />
                                                <div className="flex-1 rounded" style={{ backgroundColor: preset.primary }} />
                                                <div className="w-4 rounded flex-shrink-0" style={{ backgroundColor: preset.accent }} />
                                            </div>
                                            <p className="text-xs font-black text-slate-600 text-left">{preset.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Colors */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-black text-slate-800 flex items-center gap-2"><Sliders size={16} className="text-indigo-500" /> Cores Personalizadas</h2>
                                </div>
                                <div className="p-6 grid grid-cols-3 gap-6">
                                    {[
                                        { key: 'primaryColor', label: 'Cor Principal', desc: 'Botões e destaques' },
                                        { key: 'sidebarColor', label: 'Cor do Menu', desc: 'Sidebar lateral' },
                                        { key: 'accentColor', label: 'Cor de Acento', desc: 'Links e indicadores' },
                                    ].map(({ key, label, desc }) => (
                                        <div key={key} className="space-y-3">
                                            <div>
                                                <p className="text-xs font-black text-slate-700">{label}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
                                            </div>
                                            <div className="relative flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-xl border-2 border-slate-200 shadow-inner cursor-pointer flex-shrink-0"
                                                    style={{ backgroundColor: theme[key as keyof ThemeSettings] as string }}
                                                    onClick={() => document.getElementById(`picker-${key}`)?.click()}
                                                />
                                                <input
                                                    id={`picker-${key}`}
                                                    type="color"
                                                    value={theme[key as keyof ThemeSettings] as string}
                                                    onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                                                    className="absolute opacity-0 w-0 h-0"
                                                />
                                                <input
                                                    type="text"
                                                    value={theme[key as keyof ThemeSettings] as string}
                                                    onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
                                                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-slate-200"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Font */}
                                <div className="px-6 pb-6 grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipografia</label>
                                        <select
                                            value={theme.fontFamily}
                                            onChange={e => setTheme(t => ({ ...t, fontFamily: e.target.value }))}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                                        >
                                            <option value="Inter">Inter (Padrão)</option>
                                            <option value="Roboto">Roboto</option>
                                            <option value="Poppins">Poppins</option>
                                            <option value="DM Sans">DM Sans</option>
                                            <option value="Outfit">Outfit</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arredondamento dos Cantos</label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="4"
                                                max="24"
                                                value={theme.borderRadius}
                                                onChange={e => setTheme(t => ({ ...t, borderRadius: e.target.value }))}
                                                className="flex-1"
                                            />
                                            <span className="text-sm font-black text-slate-700 w-10 text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">{theme.borderRadius}px</span>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {[4, 8, 12, 16, 24].map(r => (
                                                <button
                                                    key={r}
                                                    onClick={() => setTheme(t => ({ ...t, borderRadius: String(r) }))}
                                                    className={`flex-1 py-1.5 text-[10px] font-black uppercase border transition-all ${theme.borderRadius === String(r) ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-400 hover:border-slate-400'}`}
                                                    style={{ borderRadius: `${r}px` }}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 flex justify-between items-center">
                                    <button onClick={handleResetTheme} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-700 font-bold transition-colors">
                                        <RefreshCw size={14} /> Restaurar Padrão
                                    </button>
                                    <button
                                        onClick={handleSaveTheme}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
                                    >
                                        <Eye size={16} />
                                        Aplicar Tema
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* âââ SISTEMA âââââââââââââââââââââââââââââââââââââââ */}
                    {activeTab === 'sistema' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-black text-slate-800 flex items-center gap-2"><Shield size={16} className="text-emerald-500" /> Informaões do Sistema</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {[
                                        { label: 'Versão do Sistema', value: '1.0.5-stable' },
                                        { label: 'Licena', value: 'GPV Studio - Master (Válida até 2036)' },
                                        { label: 'Banco de Dados', value: 'SQLite 3 (Local)' },
                                        { label: 'Runtime', value: 'Electron + Node.js' },
                                        { label: 'Usuário Ativo', value: JSON.parse(localStorage.getItem('user') || '{}')?.email || 'â' },
                                        { label: 'Funão', value: JSON.parse(localStorage.getItem('user') || '{}')?.role || 'â' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                                            <span className="text-sm font-bold text-slate-500">{label}</span>
                                            <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
                                <h3 className="font-black text-rose-700 flex items-center gap-2 mb-2"><AlertTriangle size={16} /> Zona de Perigo</h3>
                                <p className="text-xs text-rose-500 font-medium mb-4">Estas aões são irreversíveis. Proceda com cuidado.</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Limpar TODAS as configuraões salvas? O tema e dados da empresa serão apagados.')) {
                                                localStorage.removeItem('gpv_company');
                                                localStorage.removeItem('gpv_theme');
                                                window.location.reload();
                                            }
                                        }}
                                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-all"
                                    >
                                        Limpar Configuraões
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white font-bold text-sm flex items-center gap-2 animate-in slide-in-from-right-8 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
