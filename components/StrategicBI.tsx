
import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Percent, Target, AlertCircle, ArrowRight, DollarSign, PieChart, CheckCircle2 } from 'lucide-react';

const StrategicBI: React.FC<{ token: string | null }> = ({ token }) => {
    const [lucroModelo, setLucroModelo] = useState<any[]>([]);
    const [abcLucro, setAbcLucro] = useState<any[]>([]);
    const [encalhados, setEncalhados] = useState<any[]>([]);
    const [metas, setMetas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [resLucro, resABC, resEncalhado, resMetas] = await Promise.all([
                fetch('http://localhost:3000/api/relatorios/estrategico/lucro-modelo', { headers }),
                fetch('http://localhost:3000/api/relatorios/estrategico/abc-lucro', { headers }),
                fetch('http://localhost:3000/api/relatorios/estrategico/encalhado', { headers }),
                fetch('http://localhost:3000/api/metas', { headers })
            ]);

            if (resLucro.ok) {
                const data = await resLucro.json();
                setLucroModelo(Array.isArray(data) ? data : []);
            }
            if (resABC.ok) {
                const data = await resABC.json();
                setAbcLucro(Array.isArray(data) ? data : []);
            }
            if (resEncalhado.ok) {
                const data = await resEncalhado.json();
                setEncalhados(Array.isArray(data) ? data : []);
            }
            if (resMetas.ok) {
                const data = await resMetas.json();
                setMetas(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Erro ao carregar dados do BI:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [token]);

    const getProfitByModel = (model: string) => {
        if (!Array.isArray(lucroModelo)) return 0;
        const entries = lucroModelo.filter(l => l.modeloNegocio === model);
        const receita = entries.find(e => e.tipo === 'RECEITA')?._sum?.valor || 0;
        const despesa = entries.find(e => e.tipo === 'DESPESA')?._sum?.valor || 0;
        return (parseFloat(receita) || 0) - (parseFloat(despesa) || 0);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 animate-pulse uppercase tracking-widest text-xs">Processando Inteligência de Negócio...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
            <header className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-sm">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent italic">PAINEL EXECUTIVO</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">BI & Analytics Strategic Command Center</p>
                </div>
                <div className="flex items-center gap-3 bg-indigo-600 px-6 py-3 rounded-2xl text-white shadow-xl shadow-indigo-200 border border-indigo-500 animate-pulse">
                    <TrendingUp size={20} />
                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">Live Market Insight</span>
                </div>
            </header>

            {/* 1. LUCRO POR MODELO DE NEGÓCIO - LUXURY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { label: 'Gráfica / OS', value: getProfitByModel('PRODUCAO'), icon: <Target size={32} />, gradient: 'from-indigo-600 to-violet-600', shadow: 'shadow-indigo-200' },
                    { label: 'Varejo / PDV', value: getProfitByModel('VAREJO'), icon: <DollarSign size={32} />, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
                    { label: 'Acessórios', value: getProfitByModel('ACESSORIOS'), icon: <Package size={32} />, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-200' },
                    { label: 'Papelaria', value: getProfitByModel('PAPELARIA'), icon: <PieChart size={32} />, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-200' },
                ].map((m, i) => (
                    <div key={i} className={`p-8 rounded-[40px] text-white shadow-2xl bg-gradient-to-br ${m.gradient} ${m.shadow} relative overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]`}>
                        <div className="absolute -top-4 -right-4 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700">{m.icon}</div>
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

                        <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.15em] mb-2">{m.label}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold opacity-80">R$</span>
                            <p className="text-4xl font-black tracking-tighter">{m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <TrendingUp size={12} />
                                <span>MC Real</span>
                            </div>
                            <ArrowRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                        </div>

                        {/* Decoration lines */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/10"></div>
                        <div className="absolute top-0 left-0 w-1 h-full bg-white/10"></div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* 2. RANKING DE LUCRO REAL - PREMIUM GLASS */}
                <div className="lg:col-span-7 bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-indigo-100/50 overflow-hidden p-10 space-y-10 relative">
                    <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-50 rounded-bl-[200px] z-0 opacity-50"></div>

                    <div className="relative z-10 flex justify-between items-center">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                                <Percent size={24} />
                            </div>
                            TOP 10 LUCRATIVIDADE <span className="text-[10px] text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full ml-2">REAL-TIME</span>
                        </h3>
                    </div>

                    <div className="relative z-10 space-y-4">
                        {abcLucro.map((p, i) => (
                            <div key={i} className="group flex justify-between items-center p-6 bg-slate-50 border border-slate-100/50 rounded-[32px] hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${i === 0 ? 'bg-amber-100 text-amber-600' :
                                        i === 1 ? 'bg-slate-200 text-slate-500' :
                                            i === 2 ? 'bg-orange-100 text-orange-600' :
                                                'bg-white text-slate-400'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-800 tracking-tight">{p.nome}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-200/50 px-2 py-0.5 rounded-md inline-block mt-1">PRODUTO ESTRATÉGICO</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-600 tracking-tighter">+ R$ {p.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em]">Performance Líquida</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. PRODUTOS ENCALHADOS - DARK MODE SECTION */}
                <div className="lg:col-span-5 bg-slate-900 rounded-[48px] shadow-2xl shadow-slate-900/40 overflow-hidden p-10 space-y-10 relative border-t border-white/10">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>

                    <div className="relative z-10 flex justify-between items-center">
                        <h3 className="text-2xl font-black tracking-tighter flex items-center gap-4 text-white uppercase italic">
                            <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-900">
                                <AlertCircle size={24} />
                            </div>
                            Giro Crítico
                        </h3>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black bg-rose-500/10 px-4 py-1.5 rounded-full text-rose-400 border border-rose-500/20 uppercase tracking-widest">60+ DIAS PARADO</span>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4 max-h-[580px] overflow-y-auto pr-3 custom-scrollbar">
                        {encalhados.length > 0 ? encalhados.map((p, i) => (
                            <div key={i} className="group flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-[32px] hover:bg-white/10 hover:border-white/10 transition-all border-l-4 border-l-rose-600">
                                <div>
                                    <p className="text-base font-black text-slate-100 tracking-tight">{p.nome}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic">Estoque Físico: {p.estoque} un</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-2 font-mono italic">Ação Imediata</p>
                                    <button className="px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 transition-all border border-white/10 tracking-widest flex items-center gap-2">
                                        LIQUIDAR <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                </div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest leading-loose">Estoque Saudável<br /><span className="text-emerald-500">Fluxo de Caixa Otimizado</span></p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. METAS MENSAL - DASHBOARD STYLE */}
            <div className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-indigo-100/50 p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600"></div>

                <div className="flex justify-between items-center mb-12">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-5">
                        <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl">
                            <Target size={32} />
                        </div>
                        ESTADO DAS METAS <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full ml-4 uppercase tracking-[0.2em]">Escopo Mensal</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                    {['PRODUCAO', 'VAREJO'].map(cat => {
                        const metaValue = parseFloat(metas.find(m => m.categoria === cat)?.valorMeta) || 10000;
                        const currentProfit = getProfitByModel(cat);
                        const progress = metaValue > 0 ? Math.min((currentProfit / metaValue) * 100, 100) : 0;
                        const safeProgress = isNaN(progress) ? 0 : progress;

                        return (
                            <div key={cat} className="space-y-8 p-1 rounded-[40px] relative">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-2">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-1">{cat === 'PRODUCAO' ? 'UNIDADE FABRIL' : 'UNIDADE DE VAREJO'}</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-black text-slate-900">R$ {currentProfit.toLocaleString('pt-BR')}</span>
                                            <span className="text-slate-300 font-black text-lg italic">/ {metaValue.toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-6xl font-black bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent italic tracking-tighter">{safeProgress.toFixed(0)}%</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="w-full h-8 bg-slate-100 rounded-2xl overflow-hidden p-1.5 border border-slate-100 shadow-inner flex">
                                        <div
                                            className={`h-full rounded-xl transition-all duration-[2000ms] ease-out shadow-lg relative ${safeProgress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                                                }`}
                                            style={{ width: `${safeProgress}%` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                    {/* Tick marks */}
                                    <div className="absolute top-full left-0 w-full flex justify-between px-2 mt-4">
                                        {[0, 25, 50, 75, 100].map(t => (
                                            <span key={t} className="text-[10px] font-black text-slate-300">{t}%</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mt-8 flex justify-between items-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Remanescente</p>
                                    <p className="text-sm font-black text-slate-700 italic">R$ {(metaValue - currentProfit).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default StrategicBI;
