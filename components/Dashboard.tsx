
import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Package, ShoppingCart, ArrowUpRight, ArrowDownRight, Printer, Crown, DollarSign, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  token: string | null;
  role: string;
}

const categoryData = [
  { name: 'Gráfica', value: 4500, color: '#334155' },
  { name: 'Papelaria', value: 2100, color: '#475569' },
  { name: 'Estamparia', value: 3400, color: '#64748b' },
];

const StatCard: React.FC<{
  title: string;
  value: string;
  change?: string;
  isUp?: boolean;
  icon: React.ReactNode;
}> = ({ title, value, change, isUp, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all">
        {icon}
      </div>
      {change && (
        <div className={`flex items-center space-x-1 text-[11px] font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span>{change}</span>
          {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        </div>
      )}
    </div>
    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{title}</p>
    <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{value}</h3>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ token, role }) => {
  const [finance, setFinance] = useState({ receitaMes: 0, despesaMes: 0, lucro: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Finance & Chart (Restricted to ADMIN & CAIXA)
        if (role !== 'PRODUCAO') {
          const statsRes = await fetch('http://localhost:3000/api/financeiro/stats', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const statsData = await statsRes.json();
          setFinance(statsData);

          const chartRes = await fetch('http://localhost:3000/api/financeiro/grafico', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const chartDataRes = await chartRes.json();
          setChartData(chartDataRes);
        }

        // 2. Orders (Everyone)
        const ordensRes = await fetch('http://localhost:3000/api/ordens', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ordensData = await ordensRes.json();
        setOrdersCount(ordensData.length);

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, role]);

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-10 w-64 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-32 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                <div className="w-12 h-4 bg-slate-100 rounded"></div>
              </div>
              <div className="h-3 w-24 bg-slate-100 rounded mb-2"></div>
              <div className="h-8 w-32 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-96 animate-pulse"></div>
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm h-96 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2">
              <Crown size={10} />
              Licença Enterprise
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Painel Executivo</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Visão geral da operação {role === 'ADMIN' ? 'Completa' : role === 'CAIXA' ? 'Financeira' : 'de Produção'}.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* All Roles see Orders */}
        <StatCard title="Ordens Ativas" value={ordersCount.toString()} icon={<Printer size={20} />} />

        {/* Only ADMIN and CAIXA see Sales/Clients */}
        {role !== 'PRODUCAO' && (
          <>
            <StatCard
              title="Vendas do Mês"
              value={`R$ ${finance.receitaMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              isUp={true}
              icon={<ShoppingCart size={20} />}
            />
            <StatCard
              title="Ticket Médio"
              value="R$ 150,00"
              icon={<Package size={20} />}
              change="+5%" isUp
            />
          </>
        )}

        {/* Only ADMIN sees Profit */}
        {role === 'ADMIN' && (
          <StatCard
            title="Lucro Líquido"
            value={`R$ ${finance.lucro?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            isUp={finance.lucro >= 0}
            change={finance.lucro >= 0 ? '+OK' : '-Alert'}
            icon={<DollarSign size={20} />}
          />
        )}
      </div>

      {role !== 'PRODUCAO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Faturamento Semanal</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="v" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 mb-8">Segmentação</h3>
            <div className="h-56 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend... */}
            <div className="space-y-3 pt-6 border-t border-slate-50">
              <p className="text-xs text-center text-slate-400">Dados simulados por categoria</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
