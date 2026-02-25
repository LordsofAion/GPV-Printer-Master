
import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Filter,
    Download,
    ArrowUpRight,
    Info,
    DollarSign,
    ShoppingCart,
    Percent,
    CheckCircle2,
    Package,
    ArrowRight,
    AlertTriangle,
    History,
    Activity
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart as RePie, Pie } from 'recharts';

const Reports: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [abcData, setAbcData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profit' | 'abc' | 'stock'>('profit');
    const [filter, setFilter] = useState('total'); // total, margem, roi
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('Relatórios: Token não encontrado');
                setLoading(false);
                return;
            }

            const [resProfit, resAbc] = await Promise.all([
                fetch('http://localhost:3000/api/relatorios/lucratividade', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('http://localhost:3000/api/relatorios/abc', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!resProfit.ok || !resAbc.ok) {
                console.error('Relatórios: Erro na resposta do servidor', { profit: resProfit.status, abc: resAbc.status });
                setLoading(false);
                return;
            }

            const jsonProfit = await resProfit.json();
            const jsonAbc = await resAbc.json();

            setData(Array.isArray(jsonProfit) ? jsonProfit : []);
            setAbcData(jsonAbc || { totalVendasGeral: 0, ABC: [] });
        } catch (e) {
            console.error('Relatórios: Falha crítica ao carregar:', e);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: any) => {
        const value = parseFloat(v);
        return isNaN(value) ? '0,00' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const pct = (v: any) => {
        const value = parseFloat(v);
        return isNaN(value) ? '0,0%' : value.toFixed(1) + '%';
    };

    const stats = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return { totalLucro: 0, margemMedia: 0, topProduto: 'Nenhum' };
        try {
            const totalLucro = data.reduce((acc, p) => acc + (parseFloat(p?.lucroTotal) || 0), 0);
            const margemSum = data.reduce((acc, p) => acc + (parseFloat(p?.margem) || 0), 0);
            const margemMedia = (margemSum / data.length) || 0;
            const sorted = [...data].sort((a, b) => (parseFloat(b?.lucroTotal) || 0) - (parseFloat(a?.lucroTotal) || 0));
            return { totalLucro, margemMedia, topProduto: sorted[0]?.nome || 'Nenhum' };
        } catch (err) {
            return { totalLucro: 0, margemMedia: 0, topProduto: 'Erro' };
        }
    }, [data]);

    const exportCSV = () => {
        if (!Array.isArray(data) || data.length === 0) return;
        setExporting(true);
        try {
            const headers = ['Produto', 'Qtd Vendida', 'Venda Unit.', 'Custo Unit.', 'Lucro Unit.', 'Lucro Total', 'Margem (%)', 'ROI (%)'];
            const rows = data.map(p => [
                `"${p?.nome || ''}"`,
                p?.qtdVendida || 0,
                (parseFloat(p?.precoVenda) || 0).toFixed(2),
                (parseFloat(p?.precoCusto) || 0).toFixed(2),
                (parseFloat(p?.lucroUnitario) || 0).toFixed(2),
                (parseFloat(p?.lucroTotal) || 0).toFixed(2),
                (parseFloat(p?.margem) || 0).toFixed(1),
                (parseFloat(p?.ROI) || 0).toFixed(1)
            ]);
            const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Relatorio_Lucratividade_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setTimeout(() => setExporting(false), 2000);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando Inteligência...</p>
        </div>
    );

    // Se não há dados e não carregando, mostrar aviso amigável ao invés de tela branca
    if (!data || (data.length === 0 && !abcData)) {
        return (
            <div className="p-20 text-center space-y-4">
                <BarChart3 size={48} className="mx-auto text-slate-200" />
                <h2 className="text-xl font-black text-slate-800">Nenhum dado encontrado</h2>
                <p className="text-slate-500 max-w-xs mx-auto">Realize uma venda para começar a acompanhar o desempenho da sua empresa.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inteligência Comercial</h1>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mt-4">
                        <button onClick={() => setActiveTab('profit')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            Lucratividade
                        </button>
                        <button onClick={() => setActiveTab('abc')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'abc' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            Curva ABC
                        </button>
                        <button onClick={() => setActiveTab('stock')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            Estoque
                        </button>
                    </div>
                </div>
                <button onClick={exportCSV} disabled={exporting || data.length === 0}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${exporting ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    {exporting ? <CheckCircle2 size={16} /> : <Download size={16} />}
                    {exporting ? 'Exportado' : 'Exportar CSV'}
                </button>
            </div>

            {activeTab === 'profit' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lucro Líquido</p>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">R$ {fmt(stats.totalLucro)}</h2>
                        </div>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Margem Média</p>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{pct(stats.margemMedia)}</h2>
                        </div>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Top Produto</p>
                            <h2 className="text-xl font-black text-slate-900 truncate uppercase mt-2">{stats.topProduto}</h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-10 py-7 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="font-black text-slate-800 tracking-tight">Ranking de Lucratividade</h3>
                            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                {['total', 'margem', 'roi'].map(f => (
                                    <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
                                        Por {f === 'total' ? 'Lucro' : f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vendas</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Preço</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Margem</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-indigo-500 uppercase tracking-widest text-right">ROI</th>
                                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Lucro Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.sort((a, b) => {
                                        if (filter === 'margem') return (parseFloat(b?.margem) || 0) - (parseFloat(a?.margem) || 0);
                                        if (filter === 'roi') return (parseFloat(b?.ROI) || 0) - (parseFloat(a?.ROI) || 0);
                                        return (parseFloat(b?.lucroTotal) || 0) - (parseFloat(a?.lucroTotal) || 0);
                                    }).map((p, i) => (
                                        <tr key={p?.id || i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-5">
                                                <p className="text-sm font-black text-slate-900 uppercase">{p?.nome || 'Sem Nome'}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">{p?.categoria || 'Geral'}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">{p?.qtdVendida || 0}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right font-bold text-slate-600 text-sm">{fmt(p?.precoVenda)}</td>
                                            <td className="px-6 py-5 text-right font-black text-emerald-600 text-sm">{pct(p?.margem)}</td>
                                            <td className="px-6 py-5 text-right font-black text-indigo-600 text-sm">{pct(p?.ROI)}</td>
                                            <td className="px-10 py-5 text-right font-black text-slate-900 text-base">R$ {fmt(p?.lucroTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'abc' && abcData && abcData.ABC && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                            <h3 className="font-black text-slate-800 tracking-tight mb-8">Análise Por Faturamento</h3>
                            <div className="space-y-4">
                                {['A', 'B', 'C'].map(classe => {
                                    const itens = (abcData?.ABC || []).filter((p: any) => p?.classe === classe);
                                    const totalClasse = itens.reduce((acc: number, p: any) => acc + (parseFloat(p?.faturamento) || 0), 0);
                                    const perc = abcData?.totalVendasGeral > 0 ? (totalClasse / abcData.totalVendasGeral) * 100 : 0;
                                    const colors: any = { A: 'bg-indigo-600', B: 'bg-emerald-500', C: 'bg-slate-300' };

                                    return (
                                        <div key={classe} className="p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl ${colors[classe]} text-white flex items-center justify-center font-black`}>{classe}</div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-widest">Classe {classe}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{itens.length} Produtos</p>
                                                    </div>
                                                </div>
                                                <p className="text-lg font-black text-slate-900">{pct(perc)}</p>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${colors[classe]}`} style={{ width: `${perc}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                            <h3 className="font-black tracking-tight mb-8">Ranking de Curva</h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {(abcData?.ABC || []).slice(0, 10).map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center p-3 border-b border-white/5">
                                        <span className="text-xs font-bold text-white/60 truncate max-w-[150px]">{p?.nome}</span>
                                        <span className="text-xs font-black text-indigo-400">{pct(p?.percentual)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Curva</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Faturamento</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Part. (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(abcData?.ABC || []).map((p: any, i: number) => (
                                    <tr key={p?.id || i} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-10 py-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${p?.classe === 'A' ? 'bg-indigo-600 text-white' : p?.classe === 'B' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {p?.classe}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-black text-slate-800 text-sm uppercase">{p?.nome || 'Sem Nome'}</td>
                                        <td className="px-6 py-5 text-right font-bold text-slate-600">R$ {fmt(p?.faturamento)}</td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900">{pct(p?.percentual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'stock' && abcData && abcData.ABC && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Status de Estoque</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumo de itens críticos</p>
                            </div>
                            <div className="space-y-6">
                                {(abcData?.ABC || []).filter((p: any) => p?.statusEstoque !== 'OK').sort((a: any, b: any) => (a?.estoque || 0) - (b?.estoque || 0)).slice(0, 5).map((p: any, i: number) => (
                                    <div key={p?.id || i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border-2 border-transparent">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${p?.statusEstoque === 'CRÍTICO' ? 'bg-rose-500' : 'bg-orange-500'}`} />
                                            <div>
                                                <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{p?.nome}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Classe {p?.classe} • {p?.estoque || 0} UN</p>
                                            </div>
                                        </div>
                                        <p className={`text-xs font-black uppercase ${p?.statusEstoque === 'CRÍTICO' ? 'text-rose-600' : 'text-orange-600'}`}>{p?.statusEstoque}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-indigo-600 p-10 rounded-[40px] text-white">
                            <h3 className="text-2xl font-black tracking-tight mb-4">Ação Necessária</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-10 opacity-80">Recomendamos priorizar a reposição dos itens Classe A com status Crítico para garantir a continuidade do seu faturamento.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Itens em Alerta</p>
                                    <p className="text-3xl font-black">{(abcData?.ABC || []).filter((p: any) => p?.statusEstoque !== 'OK').length}</p>
                                </div>
                                <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Classe A Crítica</p>
                                    <p className="text-3xl font-black">{(abcData?.ABC || []).filter((p: any) => p?.classe === 'A' && p?.statusEstoque === 'CRÍTICO').length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
