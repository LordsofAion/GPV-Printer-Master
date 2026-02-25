
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

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Carregando Relatórios Estratégicos...</div>;

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-20">
            <header>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Estratégico BI</h1>
                <p className="text-slate-500 font-medium">Performance real e indicadores de negócio.</p>
            </header>

            {/* 1. LUCRO POR MODELO DE NEGÓCIO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Gráfica / OS', value: getProfitByModel('PRODUCAO'), icon: <Target className="text-indigo-600" /> },
                    { label: 'Varejo / PDV', value: getProfitByModel('VAREJO'), icon: <DollarSign className="text-emerald-600" /> },
                    { label: 'Acessórios', value: getProfitByModel('ACESSORIOS'), icon: <Package className="text-blue-600" /> },
                    { label: 'Papelaria', value: getProfitByModel('PAPELARIA'), icon: <PieChart className="text-amber-600" /> },
                ].map((m, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">{m.icon}</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className="text-2xl font-black text-slate-800">R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Margem Real</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 2. RANKING DE LUCRO REAL */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Percent size={20} className="text-indigo-600" /> Top 10 Produtos Mais Lucrativos
                    </h3>
                    <div className="space-y-4">
                        {abcLucro.map((p, i) => (
                            <div key={i} className="group relative flex justify-between items-center p-5 bg-white border border-slate-100 rounded-[24px] hover:shadow-md transition-all hover:-translate-y-1">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' :
                                            i === 1 ? 'bg-slate-100 text-slate-600 ring-4 ring-slate-50' :
                                                i === 2 ? 'bg-orange-100 text-orange-600 ring-4 ring-orange-50' :
                                                    'bg-slate-50 text-slate-400'
                                        }`}>
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">{p.nome}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${p.margemPercentual > 50 ? 'bg-emerald-100 text-emerald-700' :
                                                    p.margemPercentual > 30 ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {p.margemPercentual.toFixed(1)}% Margem
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-indigo-600">R$ {p.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Lucro Net</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. PRODUTOS ENCALHADOS */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <AlertCircle size={20} className="text-rose-500" /> Produtos Sem Giro (60+ dias)
                    </h3>
                    <div className="space-y-3">
                        {encalhados.length > 0 ? encalhados.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl border-l-4 border-l-rose-500">
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{p.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase">Estoque: {p.estoque} un</p>
                                </div>
                                <div className="text-right">
                                    <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Criar Promoção</button>
                                </div>
                            </div>
                        )) : <div className="p-10 text-center text-slate-400 text-sm font-bold italic">Todo o seu estoque está girando bem!</div>}
                    </div>
                </div>
            </div>

            {/* 4. METAS MENSAL */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2 mb-8">
                    <Target size={20} className="text-indigo-600" /> Acompanhamento de Metas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {['PRODUCAO', 'VAREJO'].map(cat => {
                        const metaValue = parseFloat(metas.find(m => m.categoria === cat)?.valorMeta) || 10000;
                        const currentProfit = getProfitByModel(cat);
                        const progress = metaValue > 0 ? Math.min((currentProfit / metaValue) * 100, 100) : 0;
                        const safeProgress = isNaN(progress) ? 0 : progress;
                        return (
                            <div key={cat} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat === 'PRODUCAO' ? 'Metas Produção' : 'Metas Loja'}</p>
                                    <p className="text-sm font-black text-indigo-600">{safeProgress.toFixed(0)}%</p>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${safeProgress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>R$ {currentProfit.toLocaleString('pt-BR')}</span>
                                    <span>Meta: R$ {metaValue.toLocaleString('pt-BR')}</span>
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
