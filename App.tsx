import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import GraphicModule from './components/GraphicModule';
import ApparelModule from './components/ApparelModule';
import Inventory from './components/Inventory';
import Finance from './components/Finance';
import Login from './components/Login';
import SettingsPage from './components/Settings';
import Reports from './components/Reports';
import StrategicBI from './components/StrategicBI';
import {
  BarChart3, LayoutDashboard, ShoppingCart, Printer, Shirt, Package,
  DollarSign, Settings, Menu, Bell, User, LogOut,
  Search, MessageCircle, ChevronRight, ShieldCheck,
  Lock, Zap, Building2, FileText, Wallet, TrendingUp
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'pos' | 'graphic' | 'apparel' | 'inventory' | 'finance' | 'settings' | 'reports' | 'bi';
type Role = 'ADMIN' | 'CAIXA' | 'PRODUCAO';

const INITIAL_PRODUCTS: any[] = [];

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [role, setRole] = useState<Role>(user?.role || 'ADMIN');
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<any[]>([]);

  // Cashier Modal State
  const [cashierModal, setCashierModal] = useState<'open' | 'close' | null>(null);
  const [cashierBalance, setCashierBalance] = useState('0,00');
  const [cashierLoading, setCashierLoading] = useState(false);

  // License State
  const [license, setLicense] = useState({ loading: true, active: false, message: '' });
  const [activationKey, setActivationKey] = useState('');

  const companyName = (() => {
    try {
      return JSON.parse(localStorage.getItem('gpv_company') || '{}').nomeEmpresa || 'GPV STUDIO';
    } catch {
      return 'GPV STUDIO';
    }
  })();

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/system/license/status');
      const data = await res.json();
      if (data.status === 'ACTIVE') {
        setLicense({ loading: false, active: true, message: '' });
      } else {
        setLicense({ loading: false, active: false, message: data.message || 'Licena Inativa' });
      }
    } catch (e) {
      setLicense({ loading: false, active: false, message: 'Falha na conexo com o sistema.' });
    }
  };

  const handleActivate = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/system/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: activationKey })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        checkLicense();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Erro ao ativar licena.');
    }
  };
  const loadProducts = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/api/produtos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedProducts = data.map((p: any) => ({
          id: p.id,
          name: p.nome,
          price: p.preco,
          stock: p.estoque,
          minStock: p.estoque_minimo || 10,
          sku: p.sku || '',
          category: p.categoria || 'Geral'
        }));
        setProducts(mappedProducts);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  // 2. Load Cashier Status
  const loadCashierStatus = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/api/caixa/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsCashierOpen(data.aberto);
      }
    } catch (error) {
      console.error("Erro ao verificar caixa:", error);
    }
  };

  useEffect(() => {
    if (token) {
      loadProducts();
      loadCashierStatus();
    }
  }, [token]);

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    setRole(newUser.role);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 3. Handle Cashier Actions
  const handleOpenCashier = () => {
    setCashierBalance('0,00');
    setCashierModal('open');
  };

  const confirmOpenCashier = async () => {
    setCashierLoading(true);
    const saldoInicial = parseFloat(cashierBalance.replace(',', '.')) || 0;
    try {
      const response = await fetch('http://localhost:3000/api/caixa/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ saldoInicial })
      });
      if (response.ok) {
        setCashierModal(null);
        await loadCashierStatus(); // Re-sync status from server
      } else {
        const err = await response.json();
        alert('Erro ao abrir caixa: ' + err.error);
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setCashierLoading(false);
    }
  };

  const handleCloseCashier = () => setCashierModal('close');

  const confirmCloseCashier = async () => {
    setCashierLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ saldoFinal: 0 })
      });
      if (response.ok) {
        setCashierModal(null);
        await loadCashierStatus(); // Re-sync status from server
      } else {
        alert('Erro ao fechar caixa.');
      }
    } catch {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setCashierLoading(false);
    }
  };

  // Lgica de Permisses
  const canAccess = (tab: ActiveTab) => {
    if (role === 'ADMIN') return true;
    if (role === 'CAIXA') return ['pos', 'inventory', 'dashboard'].includes(tab); // Restricted access
    if (role === 'PRODUCAO') return ['graphic', 'apparel', 'dashboard'].includes(tab); // Restricted access
    return false;
  };

  // Processar Venda (Baixa de Estoque via API)
  const processSale = async (cart: any[], pagamentos: any[], isFiscal: boolean) => {
    if (!isCashierOpen) {
      alert("ATENO: O Caixa est FECHADO. Abra o caixa para realizar vendas.");
      return null;
    }

    try {
      const response = await fetch('http://localhost:3000/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itens: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
          pagamentos: pagamentos,
          isFiscal,
          clienteId: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        await loadProducts(); // Atualiza estoque visualmente
        const totalVenda = cart.reduce((s, i) => s + i.price * i.quantity, 0);
        const newSale = {
          id: data.venda.id,
          total: totalVenda,
          method: pagamentos.length > 1 ? 'Misto' : pagamentos[0].metodo,
          pagamentos: pagamentos,
          isFiscal,
          items: cart, // Pass cart back for receipt
          date: new Date().toISOString()
        };
        setSales([...sales, newSale]);
        return newSale;
      } else {
        const errorData = await response.json();
        alert("Erro: " + (errorData.error || "Erro desconhecido ao registrar venda."));
        return null;
      }
    } catch (error) {
      console.error("Erro de conexo:", error);
      alert("Erro de conexo com o servidor. Verifique se o backend est rodando.");
      return null;
    }
  };

  const NavItem: React.FC<{ id: ActiveTab; icon: React.ReactNode; label: string }> = ({ id, icon, label }) => {
    const enabled = canAccess(id);
    return (
      <button
        onClick={() => enabled && setActiveTab(id)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${!enabled ? 'opacity-30 cursor-not-allowed grayscale' : ''
          } ${activeTab === id
            ? 'bg-slate-900 text-white shadow-lg translate-x-1'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`${activeTab === id ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`}>{icon}</div>
          <span className={`${!isSidebarOpen && 'hidden'} font-bold text-sm tracking-tight`}>{label}</span>
        </div>
        {!enabled && isSidebarOpen && <Lock size={12} className="text-slate-300" />}
      </button>
    );
  };

  if (license.loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Verificando integridade do sistema...</div>;
  }

  if (!license.active) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={40} className="text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Ativao Necessria</h1>
            <p className="text-slate-500 text-sm font-medium">{license.message}</p>
            <p className="text-xs text-slate-400 mt-2">Entre em contato com o suporte para obter sua chave de acesso.</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Cole sua Chave de Licena aqui..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-center font-bold tracking-widest uppercase outline-none focus:ring-2 focus:ring-indigo-500"
              value={activationKey}
              onChange={e => setActivationKey(e.target.value)}
            />
            <button
              onClick={handleActivate}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
            >
              Ativar Sistema
            </button>
          </div>
          <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>ID: {Math.floor(Math.random() * 1000000)}</span>
            <span>v1.0.0 Secure</span>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans antialiased text-slate-900">
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-500 flex flex-col z-20 shadow-xl`}>
          <div className="p-5 flex items-center justify-between h-20 bg-slate-50/50">
            <div className="flex items-center space-x-3">
              {(() => { const c = JSON.parse(localStorage.getItem('gpv_company') || '{}'); return c.logo ? <img src={c.logo} alt="Logo" className="w-9 h-9 rounded-xl object-contain border border-slate-200 bg-white p-0.5" /> : <div className="bg-slate-900 p-2 rounded-xl"><Zap className="text-indigo-400" size={20} /></div>; })()}
              {isSidebarOpen && <span className="font-black text-base tracking-tighter">{JSON.parse(localStorage.getItem('gpv_company') || '{}').nomeEmpresa || 'GPV Manager'}</span>}
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg">
              <Menu size={18} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            <NavItem id="dashboard" icon={<LayoutDashboard size={20} />} label="Painel Geral" />
            <NavItem id="pos" icon={<ShoppingCart size={20} />} label="PDV Express" />
            <div className="mt-8 mb-4">
              <p className={`text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 ${!isSidebarOpen && 'hidden'}`}>Operacional</p>
            </div>
            <NavItem id="graphic" icon={<Printer size={20} />} label="Grfica" />
            <NavItem id="apparel" icon={<Shirt size={20} />} label="Estamparia" />
            <NavItem id="inventory" icon={<Package size={20} />} label="Estoque" />
            <NavItem id="finance" icon={<DollarSign size={20} />} label="Financeiro" />
            <NavItem id="reports" icon={<BarChart3 size={20} />} label="Relatórios" />
            <NavItem id="bi" icon={<TrendingUp size={20} />} label="Estratégico BI" />
            {(role === 'ADMIN' || user?.id === 999) && (
              <>
                <div className="mt-8 mb-4">
                  <p className={`text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 ${!isSidebarOpen && 'hidden'}`}>Configuraes</p>
                </div>
                <NavItem id="settings" icon={<Settings size={20} />} label="Configuraes" />
              </>
            )}
          </nav>

          <div className="p-5 border-t border-slate-100">
            <div className={`mb-4 ${!isSidebarOpen && 'hidden'}`}>
              <label className="text-[9px] font-black text-slate-400 uppercase">Perfil Ativo</label>
              <div className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 uppercase">
                {role}
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center px-4 py-3 w-full text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-sm">
              <LogOut size={20} />
              {isSidebarOpen && <span className="ml-3">Encerrar Sesso</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm">
            <div className="flex items-center space-x-6">
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${isCashierOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                <Wallet size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isCashierOpen ? 'Caixa Aberto' : 'Caixa Fechado'}</span>
              </div>
              {!isCashierOpen && (
                <button onClick={handleOpenCashier} className="text-xs font-black text-indigo-600 hover:underline">Abrir Caixa Agora</button>
              )}
              {isCashierOpen && (
                <button onClick={handleCloseCashier} className="text-xs font-black text-rose-600 hover:underline">Fechar Caixa</button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">{user?.nome || 'Usurio'}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Unidade Matriz</p>
              </div>
              <div className="w-11 h-11 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg"><User size={22} /></div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
            <div className="max-w-[1600px] mx-auto">
              {activeTab === 'dashboard' && <Dashboard token={token} role={role} />}
              {activeTab === 'pos' && <POS isCashierOpen={isCashierOpen} products={products} onSaleComplete={processSale} />}
              {activeTab === 'graphic' && <GraphicModule />}
              {activeTab === 'apparel' && <ApparelModule />}
              {activeTab === 'inventory' && <Inventory products={products} onRefresh={loadProducts} />}
              {activeTab === 'finance' && <Finance sales={sales} />}
              {activeTab === 'reports' && <Reports />}
              {activeTab === 'bi' && <StrategicBI token={token} />}
              {activeTab === 'settings' && <SettingsPage />}
            </div>
          </div>
        </main>
      </div>

      {/* ── CASHIER MODAL ───────────────────────────────────────── */}
      {cashierModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            {cashierModal === 'open' ? (
              <>
                <h2 className="text-xl font-black text-slate-900 mb-1">Abrir Caixa</h2>
                <p className="text-sm text-slate-500 mb-6">Informe o saldo inicial em dinheiro.</p>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Saldo Inicial (R$)</label>
                <input
                  type="text"
                  value={cashierBalance}
                  onChange={e => setCashierBalance(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl p-4 text-2xl font-black text-slate-800 text-center outline-none focus:border-indigo-400 transition-all"
                  autoFocus
                />
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setCashierModal(null)} className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cancelar</button>
                  <button
                    onClick={confirmOpenCashier}
                    disabled={cashierLoading}
                    className="flex-[2] py-3 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-40"
                  >
                    {cashierLoading ? 'Abrindo...' : '✓ Abrir Caixa'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-black text-slate-900 mb-1">Fechar Caixa</h2>
                <p className="text-sm text-slate-500 mb-6">Tem certeza que deseja fechar o caixa agora?</p>
                <div className="flex gap-3">
                  <button onClick={() => setCashierModal(null)} className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cancelar</button>
                  <button
                    onClick={confirmCloseCashier}
                    disabled={cashierLoading}
                    className="flex-[2] py-3 bg-rose-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-rose-600 transition-all disabled:opacity-40"
                  >
                    {cashierLoading ? 'Fechando...' : '✓ Confirmar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="system-watermark no-print">{companyName}</div>
    </>
  );
};

export default App;
