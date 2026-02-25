
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, FileText, Upload, Calendar, CheckCircle2, Clock, Paintbrush,
  Printer as PrinterIcon, ChevronRight, MoreVertical, X, Activity, Package, Pencil,
  Trash2, AlertTriangle, Save, Phone, ArrowRight
} from 'lucide-react';
import { OrderStatus } from '../types';
import CustomerSelector from './CustomerSelector';

const GraphicModule: React.FC = () => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form States (New Order)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [substrate, setSubstrate] = useState('Couché 150g Brilho');
  const [colors, setColors] = useState('4x4 (Full Color)');
  const [finishes, setFinishes] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [price, setPrice] = useState(250.00);
  const [width, setWidth] = useState(100); // cm
  const [height, setHeight] = useState(100); // cm
  const [quantity, setQuantity] = useState(1);

  const SUBS_CONFIG: Record<string, { unit: 'm2' | 'unit', cost: number }> = {
    'Couché 150g Brilho': { unit: 'unit', cost: 0.15 },
    'Supremo 300g (Cartão)': { unit: 'unit', cost: 0.45 },
    'Adesivo Vinil': { unit: 'm2', cost: 35.00 },
    'Lona 440g Fosca': { unit: 'm2', cost: 28.00 }
  };

  const calculateGraphicCost = () => {
    const config = SUBS_CONFIG[substrate] || { unit: 'unit', cost: 0 };
    let cost = 0;
    if (config.unit === 'm2') {
      const areaM2 = (width * height) / 10000;
      cost = areaM2 * config.cost * quantity;
    } else {
      cost = quantity * config.cost;
    }
    // Adicionar custo de acabamentos (simples)
    cost += finishes.length * 2.00 * quantity;
    return cost;
  };

  const productionCost = calculateGraphicCost();
  const suggestedPrice = productionCost * 2.5; // Margem de 150%

  // Rework & Approval States
  const [isRetrabalho, setIsRetrabalho] = useState(false);
  const [motivoRetrabalho, setMotivoRetrabalho] = useState('');
  const [custoRetrabalho, setCustoRetrabalho] = useState(0);
  const [respRetrabalho, setRespRetrabalho] = useState('');
  const [aprovacaoDigital, setAprovacaoDigital] = useState('PENDENTE');

  // Edit Form States
  const [editClientName, setEditClientName] = useState('');
  const [editSubstrate, setEditSubstrate] = useState('');
  const [editColors, setEditColors] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [editPrice, setEditPrice] = useState(0);
  const [editFinishes, setEditFinishes] = useState<string[]>([]);

  // State for Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/api/ordens', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedOrders = data.map((o: any) => {
          let specs: any = {};
          try { specs = JSON.parse(o.especificacoes); } catch { }
          return {
            id: o.id.toString(),
            client: o.cliente ? o.cliente.nome : (specs.cliente_nome || 'Cliente Balcão'),
            total: o.valor,
            status: o.status,
            deadline: o.data_entrega || new Date().toISOString(),
            description: specs.substrato ? `${specs.substrato} - ${specs.cores}` : 'Sem descrição',
            isRetrabalho: o.isRetrabalho,
            motivoRetrabalho: o.motivoRetrabalho,
            aprovacaoDigital: o.aprovacaoDigital,
            _raw: { specs, valor: o.valor, o }
          };
        });
        setOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const toggleFinish = (finish: string) => {
    setFinishes(prev => prev.includes(finish) ? prev.filter(f => f !== finish) : [...prev, finish]);
  };

  const toggleEditFinish = (finish: string) => {
    setEditFinishes(prev => prev.includes(finish) ? prev.filter(f => f !== finish) : [...prev, finish]);
  };

  const handleCreateOrder = async () => {
    try {
      const payload = {
        tipo: 'GRAPHIC',
        especificacoes: {
          cliente_nome: selectedCustomer?.nome || 'Cliente Balcão',
          cliente_telefone: selectedCustomer?.telefone || '',
          substrato: substrate,
          cores: colors,
          acabamentos: finishes,
          instrucoes: instructions,
          custo_producao: productionCost
        },
        valor: price,
        clienteId: selectedCustomer?.id || null,
        dataEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isRetrabalho,
        motivoRetrabalho,
        custoRetrabalho,
        respRetrabalho,
        aprovacaoDigital
      };

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/ordens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setShowOrderModal(false);
        loadOrders();
        showToast(`Ordem #${data.os.id} criada com sucesso!`, 'success');
        if (selectedCustomer?.telefone) {
          if (window.confirm("Deseja enviar o comprovante via WhatsApp?")) {
            const msg = `*${JSON.parse(localStorage.getItem('gpv_company') || '{}').nomeEmpresa || 'GPV Studio'} - Ordem de Serviço #${data.os.id}*\n*Cliente:* ${selectedCustomer.nome}\n*Produto:* ${substrate} (${colors})\n*Valor:* R$ ${price.toFixed(2)}\n*Status:* Aguardando Produção`;
            window.open(`https://wa.me/${selectedCustomer.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
          }
        }
      }
    } catch { showToast('Erro de conexão.', 'error'); }
  };

  const handleEditOrder = async () => {
    if (!selectedOrder) return;
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/ordens/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          especificacoes: {
            cliente_nome: editClientName,
            substrato: editSubstrate,
            cores: editColors,
            acabamentos: editFinishes,
            instrucoes: editInstructions
          },
          valor: editPrice
        })
      });
      if (response.ok) {
        setShowEditModal(false);
        loadOrders();
        showToast('Ordem atualizada!', 'success');
      }
    } catch { showToast('Erro de conexão.', 'error'); }
    finally { setEditLoading(false); }
  };

  const sendApprovalLink = (order: any) => {
    const company = JSON.parse(localStorage.getItem('gpv_company') || '{}');
    const msg = `*${company.nomeEmpresa || 'GPV Studio'} - Aprovação de Orçamento*\n\nOlá! Segue o orçamento para sua aprovação:\n\n*Pedido:* ${order.description}\n*Valor:* R$ ${order.total.toFixed(2)}\n\nPara aprovar, responda com *APROVADO* ou clique no link abaixo:\n[Link de Aprovação Simulado]\n\n_A produção iniciará após sua aprovação._`;
    const phone = order._raw?.specs?.cliente_telefone?.replace(/\D/g, '') || '';
    if (!phone) return alert("Telefone não cadastrado.");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const advanceStatus = async (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus = '';
    switch (order.status) {
      case 'AWAITING': nextStatus = 'ART_DESIGN'; break;
      case 'ART_DESIGN': nextStatus = 'PRODUCTION'; break;
      case 'PRODUCTION': nextStatus = 'FINISHED'; break;
      case 'FINISHED': nextStatus = 'DELIVERED'; break;
      default: return;
    }
    if (!window.confirm(`Avançar status para ${nextStatus}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/ordens/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        loadOrders();
        showToast('Status atualizado!', 'success');
        if (nextStatus === 'FINISHED') {
          const company = JSON.parse(localStorage.getItem('gpv_company') || '{}');
          const msg = `*${company.nomeEmpresa || 'GPV Studio'} - Pedido Pronto!* 🎉\n\nOlá, seu pedido de *${order.description}* (OS #${order.id}) já está pronto para retirada.\n\nAté breve!`;
          const phone = order._raw?.specs?.cliente_telefone?.replace(/\D/g, '') || '';
          if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }
    } catch { showToast('Erro ao atualizar.', 'error'); }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/ordens/${selectedOrder.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setShowDeleteModal(false);
        loadOrders();
        showToast('Ordem excluída!', 'success');
      }
    } catch { showToast('Erro ao excluir.', 'error'); }
    finally { setDeleteLoading(false); }
  };

  const printBudget = (order: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const company = (() => { try { return JSON.parse(localStorage.getItem('gpv_company') || '{}'); } catch { return {}; } })();

    win.document.write(`<html><head><title>Orçamento #${order.id}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
      .logo-text { font-size: 24px; font-weight: 900; color: #0f172a; }
      .info { text-align: right; font-size: 11px; color: #64748b; }
      .title { font-size: 22px; font-weight: 900; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
      .section { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; }
      .label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
      .val { font-size: 13px; font-weight: 700; color: #1e293b; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { text-align: left; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding: 12px 10px; }
      td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
      .total-box { margin-top: 40px; text-align: right; padding: 25px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); width: 600px; opacity: 0.04; z-index: -1; pointer-events: none; filter: grayscale(100%); }
      .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; pt: 20px; }
    </style></head><body>
      <img src="/watermark_logo.png" class="watermark" alt="">
      <div class="header">
        <div class="logo">
          <img src="/watermark_logo.png" style="max-height:80px">
        </div>
        <div class="info">
          <div style="font-weight:900; font-size:13px; color:#0f172a; margin-bottom:4px;">${company.nomeEmpresa || 'GPV STUDIO'}</div>
          <div>${company.email || ''}</div>
          <div>${company.telefone || ''}</div>
          <div>${company.endereco || ''}</div>
          ${company.site ? `<div>${company.site}</div>` : ''}
        </div>
      </div>
      <div class="title">Orçamento de Serviço #${order.id}</div>
      <div class="grid">
        <div class="section">
          <div class="label">Cliente / Solicitante</div>
          <div class="val">${order.client}</div>
        </div>
        <div class="section">
          <div class="label">Data de Emissão</div>
          <div class="val">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 70%">Descrição Detalhada do Serviço</th>
            <th style="text-align:right">Total do Item</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:700;">${order.description}</td>
            <td style="text-align:right; font-weight:900; color:#0f172a; font-size:15px;">R$ ${order.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="total-box">
        <div class="label">Valor Líquido Total</div>
        <div style="font-size:28px; font-weight:900; color:#0f172a; letter-spacing:-1px;">R$ ${order.total.toFixed(2)}</div>
      </div>
      <div class="footer">
        <div style="font-weight:900; text-transform:uppercase; margin-bottom:8px; color:#64748b;">Termos e Condições</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            1. Validade deste orçamento: 05 dias corridos.<br>
            2. Início da produção: Após aprovação formal e confirmação de pagamento.<br>
            3. Prazo de entrega estimado: ${new Date(order.deadline).toLocaleDateString('pt-BR')}.
          </div>
          <div style="text-align:right;">
            Este documento é um orçamento preliminar e não constitui fatura fiscal.<br>
            Gerado automaticamente por ${company.nomeEmpresa || 'GPV STUDIO'}.
          </div>
        </div>
      </div>
      <script>window.onload=()=>{ window.print(); setTimeout(()=>window.close(), 500); }</script>
    </body></html>`);
    win.document.close();
  };

  const FINISHES_OPTIONS = ['Verniz Local UV', 'Refile Precisão', 'Dobra C', 'Furação 5mm', 'Numeração Sequencial'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AWAITING': return <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border border-slate-200"><Clock size={12} /> <span>Pendente</span></span>;
      case 'ART_DESIGN': return <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border border-indigo-100"><Paintbrush size={12} /> <span>Criação</span></span>;
      case 'PRODUCTION': return <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border border-blue-100"><PrinterIcon size={12} /> <span>Impressão</span></span>;
      case 'FINISHED': return <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center space-x-1.5 border border-emerald-100"><CheckCircle2 size={12} /> <span>Pronto</span></span>;
      default: return <span className="px-3 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100">{status}</span>;
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'APROVADO': return <span className="text-[9px] font-black text-emerald-500 uppercase px-2 py-0.5 bg-emerald-50 rounded border border-emerald-100">Aprovado</span>;
      case 'NEGADO': return <span className="text-[9px] font-black text-rose-500 uppercase px-2 py-0.5 bg-rose-50 rounded border border-rose-100">Negado</span>;
      default: return <span className="text-[9px] font-black text-amber-500 uppercase px-2 py-0.5 bg-amber-50 rounded border border-amber-100">Pendente</span>;
    }
  };

  const getNextActionLabel = (status: string) => {
    switch (status) {
      case 'AWAITING': return { label: 'Iniciar Arte', icon: <Paintbrush size={16} />, color: 'text-indigo-600 hover:bg-indigo-50' };
      case 'ART_DESIGN': return { label: 'Enviar p/ Impressão', icon: <PrinterIcon size={16} />, color: 'text-blue-600 hover:bg-blue-50' };
      case 'PRODUCTION': return { label: 'Finalizar', icon: <CheckCircle2 size={16} />, color: 'text-emerald-600 hover:bg-emerald-50' };
      case 'FINISHED': return { label: 'Entregar', icon: <Package size={16} />, color: 'text-slate-600 hover:bg-slate-50' };
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fluxo de Produção Gráfica</h1>
          <p className="text-slate-500 text-sm font-medium">Controle operacional e WhatsApp integrado.</p>
        </div>
        <button onClick={() => setShowOrderModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all">
          <Plus size={18} /> Nova Ordem
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Em Aberto', value: orders.filter(o => o.status === 'AWAITING').length, color: 'slate' },
          { label: 'Produzindo', value: orders.filter(o => ['ART_DESIGN', 'PRODUCTION'].includes(o.status)).length, color: 'blue' },
          { label: 'Prontos', value: orders.filter(o => o.status === 'FINISHED').length, color: 'emerald' },
          { label: 'Total', value: orders.length, color: 'indigo' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl font-black text-slate-800">{s.value.toString().padStart(2, '0')}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">OS</th>
                <th className="px-8 py-5">Cliente / Descrição</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5">Entrega</th>
                <th className="px-8 py-5 text-right">Valor</th>
                <th className="px-8 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-5 font-black text-slate-300">#{o.id}</td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-800 text-sm">{o.client}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{o.description}</p>
                      {o.isRetrabalho && <span className="text-[8px] font-black bg-rose-500 text-white px-1 rounded">RETRABALHO</span>}
                      {getApprovalBadge(o.aprovacaoDigital)}
                    </div>
                  </td>
                  <td className="px-8 py-5 flex justify-center">{getStatusBadge(o.status)}</td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-600">{new Date(o.deadline).toLocaleDateString('pt-BR')}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-800">R$ {o.total.toFixed(2)}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2">
                      {getNextActionLabel(o.status) && (
                        <button onClick={(e) => advanceStatus(o, e)} className={`p-2 rounded-lg transition-all font-bold text-[10px] uppercase flex items-center gap-1 ${getNextActionLabel(o.status)?.color}`}>
                          {getNextActionLabel(o.status)?.icon}
                          <span className="hidden xl:inline">{getNextActionLabel(o.status)?.label}</span>
                        </button>
                      )}
                      {o.status === 'FINISHED' && (
                        <button onClick={() => {
                          const company = JSON.parse(localStorage.getItem('gpv_company') || '{}');
                          const msg = `*${company.nomeEmpresa || 'GPV Studio'} - Pedido Pronto!* 🎉\n\nOlá, seu pedido de *${o.description}* (OS #${o.id}) já está pronto para retirada.\n\nAté breve!`;
                          const phone = o._raw?.specs?.cliente_telefone?.replace(/\D/g, '') || '';
                          if (!phone) return alert("Telefone não cadastrado.");
                          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Avisar WhatsApp">
                          <Phone size={16} />
                        </button>
                      )}
                      <button onClick={() => printBudget(o)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" title="Gerar PDF do Orçamento">
                        <FileText size={16} />
                      </button>
                      {o.aprovacaoDigital === 'PENDENTE' && (
                        <button onClick={() => sendApprovalLink(o)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Enviar Orçamento">
                          <Upload size={16} />
                        </button>
                      )}
                      <button onClick={() => { setSelectedOrder(o); setEditClientName(o.client); setShowEditModal(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><Pencil size={15} /></button>
                      <button onClick={(e) => { setSelectedOrder(o); setShowDeleteModal(true); }} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVA ORDEM */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nova Ordem de Serviço</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Integração WhatsApp & CRM</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <CustomerSelector onSelect={setSelectedCustomer} selectedId={selectedCustomer?.id} />

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Substrato</label>
                    <select value={substrate} onChange={e => setSubstrate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                      <option>Couché 150g Brilho</option>
                      <option>Supremo 300g (Cartão)</option>
                      <option>Adesivo Vinil</option>
                      <option>Lona 440g Fosca</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cromia</label>
                    <select value={colors} onChange={e => setColors(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                      <option>4x4 (Full Color)</option>
                      <option>4x0 (Mono Lado)</option>
                      <option>1x0 (Preto e Branco)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Qtd</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                  </div>
                  {SUBS_CONFIG[substrate]?.unit === 'm2' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Largura (cm)</label>
                        <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Altura (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Acabamentos</label>
                  <div className="flex flex-wrap gap-2">
                    {FINISHES_OPTIONS.map(f => (
                      <button key={f} onClick={() => toggleFinish(f)} className={`px-4 py-2 border rounded-xl text-[10px] font-bold uppercase transition-all ${finishes.includes(f) ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 text-slate-500 hover:border-indigo-400'}`}>{f}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Instruções</label>
                  <textarea rows={2} value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="Observações de produção..." />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => {
                    const message = `Olá! Segue seu orçamento de Gráfica:\n\n*Pedido:* ${substrate}\n*Cores:* ${colors}\n*Qtd:* ${quantity}\n*Valor:* R$ ${price.toFixed(2)}\n\nPara aprovar este orçamento e iniciar a produção, responda com *APROVAR*.`;
                    const whatsappUrl = `https://wa.me/${selectedCustomer?.telefone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
                    <svg size={18} fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    Aprovação WhatsApp
                  </button>
                  <button onClick={() => {
                    const message = `Olá! Fizemos seu orçamento:\n\n*OS:* #${Math.floor(Math.random() * 9000) + 1000}\n*Produto:* ${substrate}\n*Total:* R$ ${price.toFixed(2)}\n\n_Compartilhe este link com seu cliente._`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }} className="px-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Custo de Produção</p>
                    <p className="text-xl font-black text-indigo-900">R$ {productionCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Preço Sugerido (150%)</p>
                    <p className="text-xl font-black text-indigo-900 line-through opacity-50">R$ {suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isRetrabalho} onChange={e => setIsRetrabalho(e.target.checked)} className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500" />
                      <span className="text-xs font-black text-rose-700 uppercase">É um Retrabalho?</span>
                    </label>
                    {isRetrabalho && <AlertTriangle size={16} className="text-rose-500 animate-pulse" />}
                  </div>

                  {isRetrabalho && (
                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-rose-400">Motivo do Retrabalho</label>
                        <select value={motivoRetrabalho} onChange={e => setMotivoRetrabalho(e.target.value)} className="w-full p-2 bg-white border border-rose-200 rounded-xl text-[10px] font-bold outline-none">
                          <option value="">Selecione um motivo...</option>
                          <option value="ERRO_IMPRESSAO">Erro de Impressão</option>
                          <option value="ERRO_ARTE">Erro na Arte</option>
                          <option value="MATERIAL_DEFEITUOSO">Material Defeituoso</option>
                          <option value="ERRO_FINALIZACAO">Erro na Finalização</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-rose-400">Custo Adicional (R$)</label>
                        <input type="number" value={custoRetrabalho} onChange={e => setCustoRetrabalho(Number(e.target.value))} className="w-full p-2 bg-white border border-rose-200 rounded-xl text-xs font-black outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl">
                  <div className="flex justify-between items-center text-2xl mb-8">
                    <span className="text-xs font-black uppercase text-slate-500">Valor Final</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold font-mono">R$</span>
                      <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-32 bg-transparent text-right outline-none font-black text-indigo-400 text-4xl" />
                    </div>
                  </div>
                  <button onClick={handleCreateOrder} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/50">
                    <CheckCircle2 size={20} /> Emitir Ordem & Notificar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR, DELETE, TOAST (Simplificado) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black text-slate-900">Excluir Ordem?</h3>
            <p className="text-sm text-slate-500 mt-2 mb-8">Esta ação removerá permanentemente a OS #{selectedOrder?.id}.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase text-[10px]">Cancelar</button>
              <button onClick={handleDeleteOrder} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold uppercase text-[10px]">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-8 right-8 px-8 py-4 rounded-2xl shadow-2xl text-white font-black text-xs uppercase tracking-widest animate-in slide-in-from-right-10 flex items-center gap-3 z-[100] ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default GraphicModule;
