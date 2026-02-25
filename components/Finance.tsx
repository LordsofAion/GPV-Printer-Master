
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Download,
  Calendar,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FileText,
  Filter,
  X,
  Printer,
  BarChart3,
  PieChart,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface FinanceProps {
  sales?: any[];
}

const Finance: React.FC<FinanceProps> = ({ sales }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ receitaMes: 0, despesaMes: 0, lucro: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  // Filtros
  const [dateRange, setDateRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  // DRE Modal
  const [showDRE, setShowDRE] = useState(false);
  const [dreData, setDreData] = useState<any>(null);
  const [dreLoading, setDreLoading] = useState(false);

  // BI Export
  const [exporting, setExporting] = useState(false);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (dateRange === '7d') start.setDate(end.getDate() - 7);
    if (dateRange === '30d') start.setDate(end.getDate() - 30);
    if (dateRange === '90d') start.setDate(end.getDate() - 90);
    if (dateRange === 'custom' && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    return { start, end };
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchData = async () => {
      try {
        const { start, end } = getDateRange();
        const queryString = `?inicio=${start.toISOString()}&fim=${end.toISOString()}`;

        setLoading(true);

        const [statsRes, transRes, chartRes] = await Promise.all([
          fetch('http://localhost:3000/api/financeiro/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`http://localhost:3000/api/transacoes${queryString}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:3000/api/financeiro/grafico', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const statsData = await statsRes.json();
        setStats(statsData);

        const transData = await transRes.json();
        setTransactions(transData);

        const chartD = await chartRes.json();
        setChartData(chartD.map((d: any) => ({ month: d.name, in: d.v, out: 0 })));
      } catch (error) {
        console.error("Erro ao carregar financeiro:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange, customStart, customEnd, sales]);

  // ─── DRE ────────────────────────────────────────────────────────────
  const openDRE = async () => {
    setShowDRE(true);
    setDreLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { start, end } = getDateRange();
      const res = await fetch(
        `http://localhost:3000/api/financeiro/dre?inicio=${start.toISOString()}&fim=${end.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setDreData(data);
    } catch (error) {
      console.error('Erro ao carregar DRE:', error);
    } finally {
      setDreLoading(false);
    }
  };

  const printDRE = () => {
    const el = document.getElementById('dre-print-area');
    if (!el) return;
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    w.document.write(`
      <html><head><title>DRE - GPV Manager</title>
      <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        th { font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; color: #94a3b8; }
        .header { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #6366f1; padding: 14px 16px; background: #f8fafc; }
        .total { font-weight: 900; font-size: 14px; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .subtotal { background: #fafafa; font-weight: 700; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p { color: #64748b; font-size: 12px; margin-bottom: 24px; }
      </style></head><body>
      <h1>Demonstrativo do Resultado do Exercício (DRE)</h1>
      <p>Período: ${getDateRange().start.toLocaleDateString('pt-BR')} a ${getDateRange().end.toLocaleDateString('pt-BR')}</p>
      ${el.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  // ─── EXPORT BI ──────────────────────────────────────────────────────
  const exportBI = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const { start, end } = getDateRange();
      const queryString = `?inicio=${start.toISOString()}&fim=${end.toISOString()}`;

      const res = await fetch(`http://localhost:3000/api/transacoes${queryString}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      // Build CSV
      const BOM = '\uFEFF';
      const headers = ['Data', 'Tipo', 'Descrião', 'Categoria', 'Valor (R$)'];
      const rows = data.map((t: any) => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.tipo,
        `"${(t.descricao || '').replace(/"/g, '""')}"`,
        t.categoria || 'Geral',
        t.valor.toFixed(2).replace('.', ',')
      ]);

      const csvContent = BOM + [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `GPV_BI_Export_${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar BI:', error);
      alert('Erro ao exportar dados. Verifique a conexão.');
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v: number) => v.toFixed(1) + '%';

  const getPaymentIcon = (forma: string) => {
    if (forma?.toLowerCase().includes('pix')) return <Smartphone size={14} />;
    if (forma?.toLowerCase().includes('credit') || forma?.toLowerCase().includes('créd')) return <CreditCard size={14} />;
    if (forma?.toLowerCase().includes('débit') || forma?.toLowerCase().includes('debit')) return <CreditCard size={14} />;
    return <Banknote size={14} />;
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center gap-4">
          <div className="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-10 w-10 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-xl h-32 animate-pulse shadow-sm border border-slate-200"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl h-96 animate-pulse shadow-sm border border-slate-200"></div>
          <div className="bg-white rounded-xl h-96 animate-pulse shadow-sm border border-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Controladoria & Fluxo de Caixa</h1>
          <p className="text-slate-500 text-sm font-medium">Demonstrativo de resultados e gestão de liquidez em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={openDRE}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-slate-50 transition-all active:scale-95"
          >
            <FileText size={16} />
            <span>DRE Completo</span>
          </button>
          <button
            onClick={exportBI}
            disabled={exporting}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95 ${exporting ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {exporting ? <CheckCircle2 size={16} className="animate-bounce" /> : <Download size={16} />}
            <span>{exporting ? 'Exportado!' : 'Exportar BI'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all"><Wallet size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Líquido (Mês)</span>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">R$ {fmt(stats.lucro)}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Conciliaão 100%</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all"><ArrowUpCircle size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receitas (Mês)</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">R$ {fmt(stats.receitaMes)}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-1 text-emerald-600">
            <TrendingUp size={12} />
            <span className="text-[10px] font-black">+12.4% vs prev.</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all"><ArrowDownCircle size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Despesas (Mês)</span>
          </div>
          <p className="text-2xl font-black text-rose-600 tracking-tight">R$ {fmt(stats.despesaMes)}</p>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Operacional: 82%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"><DollarSign size={18} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EBITDA Estimado</span>
          </div>
          <p className="text-2xl font-black text-indigo-600 tracking-tight">R$ {fmt(stats.lucro * 0.85)}</p>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Margem Líquida: {stats.receitaMes > 0 ? pct((stats.lucro / stats.receitaMes) * 100) : '0.0%'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-slate-800 tracking-tight">Análise Mensal de Liquidez</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Comparativo Entradas vs Saídas</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-slate-800 rounded-full"></div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Receita</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Custo</span>
              </div>
            </div>
          </div>
          <div className="flex-1 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '16px' }}
                />
                <Bar dataKey="in" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="out" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 tracking-tight">Agenda Financeira</h3>
            <div className="flex gap-2">
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded-lg p-2 outline-none">
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 3 meses</option>
              </select>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><Filter size={16} /></button>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-indigo-100 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${t.tipo === 'RECEITA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {t.tipo === 'RECEITA' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{t.descricao}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{new Date(t.data).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${t.tipo === 'RECEITA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.tipo === 'RECEITA' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">{t.categoria || 'Geral'}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="py-16 text-center">
                  <DollarSign size={32} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400 font-bold">Nenhuma transaão no período</p>
                </div>
              )}
            </div>
            <button className="w-full py-4 mt-8 bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
              Ver Extrato Detalhado
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL DRE ─────────────────────────────────────────────────── */}
      {showDRE && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 size={22} className="text-indigo-600" />
                  Demonstrativo do Resultado do Exercício
                </h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                  Período: {getDateRange().start.toLocaleDateString('pt-BR')} a {getDateRange().end.toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={printDRE} className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-all" title="Imprimir DRE">
                  <Printer size={18} />
                </button>
                <button onClick={() => setShowDRE(false)} className="p-2.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8" id="dre-print-area">
              {dreLoading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-bold">Calculando DRE...</p>
                </div>
              ) : dreData ? (
                <div className="space-y-6">
                  {/* DRE Table */}
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta</th>
                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor (R$)</th>
                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">% Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Receita Bruta */}
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-[11px] font-black text-indigo-600 uppercase tracking-widest" colSpan={3}>Receita Operacional</td>
                      </tr>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-bold text-slate-700 pl-8">Receita Bruta de Vendas</td>
                        <td className="py-3 px-4 text-sm font-black text-emerald-600 text-right">+ {fmt(dreData.receitaBruta)}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">100%</td>
                      </tr>

                      {/* Deduões */}
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-[11px] font-black text-rose-500 uppercase tracking-widest" colSpan={3}>(–) Deduões da Receita</td>
                      </tr>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-600 pl-8">Devoluões / Cancelamentos</td>
                        <td className="py-3 px-4 text-sm font-bold text-rose-500 text-right">– {fmt(dreData.devolucoes)}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">{dreData.receitaBruta > 0 ? pct((dreData.devolucoes / dreData.receitaBruta) * 100) : '0.0%'}</td>
                      </tr>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-600 pl-8">Impostos (Simples Nacional ~6%)</td>
                        <td className="py-3 px-4 text-sm font-bold text-rose-500 text-right">– {fmt(dreData.impostos)}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">6.0%</td>
                      </tr>

                      {/* Receita Líquida */}
                      <tr className="border-b-2 border-slate-200 bg-indigo-50/30">
                        <td className="py-4 px-4 text-sm font-black text-slate-800">= Receita Líquida</td>
                        <td className="py-4 px-4 text-base font-black text-slate-900 text-right">R$ {fmt(dreData.receitaLiquida)}</td>
                        <td className="py-4 px-4 text-xs font-black text-slate-500 text-right">{dreData.receitaBruta > 0 ? pct((dreData.receitaLiquida / dreData.receitaBruta) * 100) : '0.0%'}</td>
                      </tr>

                      {/* CMV */}
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-[11px] font-black text-amber-600 uppercase tracking-widest" colSpan={3}>(–) Custo das Mercadorias Vendidas</td>
                      </tr>
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-600 pl-8">CMV (custo base dos produtos)</td>
                        <td className="py-3 px-4 text-sm font-bold text-rose-500 text-right">– {fmt(dreData.cmv)}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">{dreData.receitaBruta > 0 ? pct((dreData.cmv / dreData.receitaBruta) * 100) : '0.0%'}</td>
                      </tr>

                      {/* Lucro Bruto */}
                      <tr className="border-b-2 border-slate-200 bg-emerald-50/30">
                        <td className="py-4 px-4 text-sm font-black text-slate-800">= Lucro Bruto</td>
                        <td className={`py-4 px-4 text-base font-black text-right ${dreData.lucroBruto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {fmt(dreData.lucroBruto)}</td>
                        <td className="py-4 px-4 text-xs font-black text-slate-500 text-right">{dreData.receitaBruta > 0 ? pct((dreData.lucroBruto / dreData.receitaBruta) * 100) : '0.0%'}</td>
                      </tr>

                      {/* Despesas Operacionais */}
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-4 text-[11px] font-black text-rose-500 uppercase tracking-widest" colSpan={3}>(–) Despesas Operacionais</td>
                      </tr>
                      {dreData.despesasPorCategoria && dreData.despesasPorCategoria.length > 0 ? (
                        dreData.despesasPorCategoria.map((d: any, i: number) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-slate-600 pl-8">{d.categoria}</td>
                            <td className="py-3 px-4 text-sm font-bold text-rose-500 text-right">– {fmt(d.valor)}</td>
                            <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">{dreData.receitaBruta > 0 ? pct((d.valor / dreData.receitaBruta) * 100) : '0.0%'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-400 pl-8 italic">Nenhuma despesa registrada</td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-400 text-right">R$ 0,00</td>
                          <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">0.0%</td>
                        </tr>
                      )}
                      <tr className="border-b border-slate-100 bg-rose-50/20">
                        <td className="py-3 px-4 text-sm font-bold text-slate-700 pl-4">Total Despesas Operacionais</td>
                        <td className="py-3 px-4 text-sm font-black text-rose-600 text-right">– {fmt(dreData.despesasOperacionais)}</td>
                        <td className="py-3 px-4 text-xs font-black text-slate-500 text-right">{dreData.receitaBruta > 0 ? pct((dreData.despesasOperacionais / dreData.receitaBruta) * 100) : '0.0%'}</td>
                      </tr>

                      {/* EBITDA */}
                      <tr className="border-b-2 border-slate-200 bg-indigo-50/30">
                        <td className="py-4 px-4 text-sm font-black text-slate-800">= EBITDA</td>
                        <td className={`py-4 px-4 text-base font-black text-right ${dreData.ebitda >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>R$ {fmt(dreData.ebitda)}</td>
                        <td className="py-4 px-4 text-xs font-black text-slate-500 text-right">{dreData.receitaBruta > 0 ? pct((dreData.ebitda / dreData.receitaBruta) * 100) : '0.0%'}</td>
                      </tr>

                      {/* Depreciaão */}
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-600 pl-8">(–) Depreciaão e Amortizaão (~2%)</td>
                        <td className="py-3 px-4 text-sm font-bold text-rose-500 text-right">– {fmt(dreData.depreciacao)}</td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-400 text-right">2.0%</td>
                      </tr>

                      {/* Resultado Líquido */}
                      <tr className="bg-slate-900 text-white">
                        <td className="py-5 px-4 text-sm font-black uppercase tracking-widest">Resultado Líquido do Exercício</td>
                        <td className={`py-5 px-4 text-lg font-black text-right ${dreData.resultadoLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>R$ {fmt(dreData.resultadoLiquido)}</td>
                        <td className="py-5 px-4 text-xs font-black text-right text-slate-300">{pct(dreData.margemLiquida)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Extra Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Vendas</p>
                      <p className="text-2xl font-black text-slate-800">{dreData.totalVendas}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{dreData.totalTransacoes} transaões</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Médio</p>
                      <p className="text-2xl font-black text-indigo-600">R$ {dreData.totalVendas > 0 ? fmt(dreData.receitaBruta / dreData.totalVendas) : '0,00'}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">por venda</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Margem Líquida</p>
                      <p className={`text-2xl font-black ${dreData.margemLiquida >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct(dreData.margemLiquida)}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">do faturamento</p>
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  {dreData.vendasPorPagamento && dreData.vendasPorPagamento.length > 0 && (
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Receita por Forma de Pagamento</p>
                      <div className="space-y-3">
                        {dreData.vendasPorPagamento.map((v: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-500">{getPaymentIcon(v.forma)}</div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">{v.forma || 'Dinheiro'}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{v.count} vendas</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-800">R$ {fmt(v.total)}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{dreData.receitaBruta > 0 ? pct((v.total / dreData.receitaBruta) * 100) : '0%'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-sm text-rose-500 font-bold">Erro ao carregar DRE. Tente novamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
