
import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Percent, Target, AlertCircle, ArrowRight, DollarSign, PieChart } from 'lucide-react';

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

    if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse">Processando Inteligência de Negócio...</div>;

    return (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
                    <p className="text-slate-500 font-medium">Insights estratégicos e performance real do seu negócio.</p>
                </div>
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl text-indigo-600 border border-indigo-100">
                    <TrendingUp size={18} />
                    <span className="text-xs font-black uppercase tracking-widest px-2">Análise em Tempo Real</span>
                </div>
            </header>

            {/* 1. LUCRO POR MODELO DE NEGÓCIO */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Gráfica / OS', value: getProfitByModel('PRODUCAO'), icon: <Target className="text-indigo-600" />, color: 'bg-indigo-50' },
                    { label: 'Varejo / PDV', value: getProfitByModel('VAREJO'), icon: <DollarSign className="text-emerald-600" />, color: 'bg-emerald-50' },
                    { label: 'Acessórios', value: getProfitByModel('ACESSORIOS'), icon: <Package className="text-blue-600" />, color: 'bg-blue-50' },
                    { label: 'Papelaria', value: getProfitByModel('PAPELARIA'), icon: <PieChart className="text-amber-600" />, color: 'bg-amber-50' },
                ].map((m, i) => (
                    <div key={i} className={`p-8 rounded-[32px] border border-white shadow-xl ${m.color} relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">{m.icon}</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                        <p className="text-3xl font-black text-slate-800">R$ {m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                            <TrendingUp size={12} />
                            <span>Margem de Contribuição</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 2. RANKING DE LUCRO REAL */}
                <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden p-8 space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Percent size={24} className="text-indigo-600" /> Top 10 Lucratividade (Real)
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {abcLucro.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-[24px] hover:scale-[1.02] transition-all">
                                <div>
                                    <p className="text-sm font-black text-slate-800">{p.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Ranking #{i + 1}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600">+ R$ {p.lucroTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Lucro Bruto Acumulado</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. PRODUTOS ENCALHADOS */}
                <div className="bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden p-8 space-y-8 text-white">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-3 text-white">
                            <AlertCircle size={24} className="text-rose-500" /> Alerta de Giro (60+ dias)
                        </h3>
                        <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-rose-300 border border-white/10 uppercase">Capital Parado</span>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {encalhados.length > 0 ? encalhados.map((p, i) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-[24px] hover:bg-white/10 transition-all border-l-4 border-l-rose-500">
                                <div>
                                    <p className="text-sm font-black text-slate-100">{p.nome}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Estoque: {p.estoque} unidades</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Sugerir Combo</p>
                                    <button className="mt-1 text-xs font-bold text-white hover:underline flex items-center gap-1">Criar Promoção <ArrowRight size={12} /></button>
                                </div>
                            </div>
                        )) : <div className="p-10 text-center text-slate-500 font-bold">Excelente! Todo o estoque está girando.</div>}
                    </div>
                </div>
            </div>

            {/* 4. METAS MENSAL */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl p-10">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Target size={28} className="text-indigo-600" /> Acompanhamento de Metas
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {['PRODUCAO', 'VAREJO'].map(cat => {
                        const metaValue = parseFloat(metas.find(m => m.categoria === cat)?.valorMeta) || 10000;
                        const currentProfit = getProfitByModel(cat);
                        const progress = metaValue > 0 ? Math.min((currentProfit / metaValue) * 100, 100) : 0;
                        const safeProgress = isNaN(progress) ? 0 : progress;
                        return (
                            <div key={cat} className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{cat === 'PRODUCAO' ? 'Metas de Gráfica' : 'Metas de Loja (PDV)'}</p>
                                        <p className="text-2xl font-black text-slate-800">R$ {currentProfit.toLocaleString('pt-BR')} <span className="text-slate-300 font-medium text-lg">/ {metaValue.toLocaleString('pt-BR')}</span></p>
                                    </div>
                                    <p className="text-4xl font-black text-indigo-600">{safeProgress.toFixed(0)}%</p>
                                </div>
                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-100 flex">
                                    <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out shadow-lg" style={{ width: `${safeProgress}%` }}></div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase text-right">Faltam R$ {(metaValue - currentProfit).toLocaleString('pt-BR')} para atingir o objetivo.</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default StrategicBI;
