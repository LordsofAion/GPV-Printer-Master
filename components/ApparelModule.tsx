
import React, { useState, useRef } from 'react';
import {
  Shirt,
  Palette,
  Layers,
  Calculator,
  Plus,
  Package,
  Activity,
  Upload,
  TrendingUp,
  Trash2,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  Droplets,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  FileText,
  Ruler,
  AlertTriangle,
  Maximize2,
  X,
  Eye
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import CustomerSelector from './CustomerSelector';

const ApparelModule: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [selectedProduct, setSelectedProduct] = useState('Camiseta Algodão 30.1');
  const [selectedSize, setSelectedSize] = useState('M');
  const [qty, setQty] = useState(10);
  const [technique, setTechnique] = useState('DTF');
  const [uploadedArt, setUploadedArt] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fabricType, setFabricType] = useState('30.1');
  const [printWidth, setPrintWidth] = useState(30);
  const [printHeight, setPrintHeight] = useState(40);
  const [inkCoverage, setInkCoverage] = useState(75);
  const [showTechSheet, setShowTechSheet] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fabricTypes: Record<string, { name: string; grammage: number; shrinkW: number; shrinkH: number; inkAbsorption: number; quality: string; baseCostMod: number }> = {
    '30.1': { name: 'Algodão 30.1', grammage: 165, shrinkW: 5, shrinkH: 3, inkAbsorption: 1.0, quality: 'Standard', baseCostMod: 0 },
    'penteado': { name: 'Algodão Penteado', grammage: 175, shrinkW: 3, shrinkH: 2, inkAbsorption: 1.0, quality: 'Premium', baseCostMod: 4.50 },
    'dryfit': { name: 'Dry-Fit / Poliéster', grammage: 140, shrinkW: 1, shrinkH: 0.5, inkAbsorption: 0.6, quality: 'Esportivo', baseCostMod: 3.00 },
    'moletom': { name: 'Moletom Flanelado', grammage: 280, shrinkW: 7, shrinkH: 5, inkAbsorption: 0.8, quality: 'Premium', baseCostMod: 18.00 },
    'pv': { name: 'Malha PV (67/33)', grammage: 155, shrinkW: 2, shrinkH: 1, inkAbsorption: 0.7, quality: 'Econômico', baseCostMod: -3.00 }
  };

  const printTolerances: Record<string, { mm: number; level: string; color: string }> = {
    DTF: { mm: 1.5, level: 'Bom', color: '#3b82f6' },
    SILK: { mm: 2.0, level: 'Aceitável', color: '#f59e0b' },
    SUBLIMATION: { mm: 1.0, level: 'Excelente', color: '#10b981' },
    BORDADO: { mm: 3.0, level: 'Variável', color: '#ef4444' }
  };

  React.useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3000/api/ordens', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const apparelOrders = data.filter((o: any) => o.tipo === 'APPAREL').map((o: any) => ({
          id: o.id,
          product: JSON.parse(o.especificacoes).produto,
          technique: JSON.parse(o.especificacoes).tecnica,
          qty: JSON.parse(o.especificacoes).quantidade,
          total: o.valor,
          status: o.status,
          date: o.data_criacao
        }));
        setOrders(apparelOrders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const insumosConfig = {
    DTF: { inkPerUnit: 0.15, paperPerUnit: 1.20, laborPerUnit: 4.50 },
    SILK: { inkPerUnit: 0.08, paperPerUnit: 0.05, laborPerUnit: 8.00 },
    SUBLIMATION: { inkPerUnit: 0.12, paperPerUnit: 0.85, laborPerUnit: 3.00 },
    BORDADO: { inkPerUnit: 0.05, paperPerUnit: 0.20, laborPerUnit: 12.00 }
  };

  const getProductBaseCost = () => {
    if (selectedProduct.includes('Moletom')) return 48.90;
    if (selectedProduct.includes('Caneca')) return 14.20;
    return 19.90;
  };

  const currentConfig = insumosConfig[technique as keyof typeof insumosConfig] || insumosConfig.DTF;
  const currentFabric = fabricTypes[fabricType];
  const currentTolerance = printTolerances[technique as keyof typeof printTolerances] || printTolerances.DTF;

  const unitBaseCost = getProductBaseCost() + currentFabric.baseCostMod;
  const printAreaCm2 = printWidth * printHeight;
  const inkMlPerUnit = (printAreaCm2 / 100) * (inkCoverage / 100) * currentFabric.inkAbsorption * (technique === 'SILK' ? 0.6 : technique === 'SUBLIMATION' ? 0.9 : technique === 'BORDADO' ? 0.3 : 1.0);
  const unitInkCost = inkMlPerUnit * 0.18;
  const unitPaperCost = currentConfig.paperPerUnit;
  const unitLaborCost = currentConfig.laborPerUnit;

  const unitTotalCost = unitBaseCost + unitInkCost + unitPaperCost + unitLaborCost;
  const totalProductionCost = unitTotalCost * qty;
  const suggestedUnitPrice = unitTotalCost * 2.5;
  const totalProfit = (suggestedUnitPrice * qty) - totalProductionCost;
  const costPerCm2 = unitTotalCost / printAreaCm2;

  const shrinkWidthAfter = printWidth * (1 - currentFabric.shrinkW / 100);
  const shrinkHeightAfter = printHeight * (1 - currentFabric.shrinkH / 100);
  const maxShrink = Math.max(currentFabric.shrinkW, currentFabric.shrinkH);

  const handleCreateOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Erro de autenticação. Faça login novamente.");
        return;
      }

      const payload = {
        tipo: 'APPAREL',
        especificacoes: {
          produto: selectedProduct,
          tamanho: selectedSize,
          quantidade: qty,
          tecnica: technique,
          cor_base: selectedColor,
          custo_producao: totalProductionCost
        },
        valor: suggestedUnitPrice * qty,
        clienteId: null, // Pode ser adicionado seleção de cliente depois
        dataEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // D+5
      };

      const response = await fetch('http://localhost:3000/api/ordens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Ordem de Produção #${data.os.id} enviada para a fila!`);
        loadOrders(); // Refresh list after create
        // Opcional: Resetar form
      } else {
        const err = await response.json();
        alert('Erro ao criar ordem: ' + err.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (f) => setUploadedArt(f.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const colorInsights = [
    { name: 'Branco', value: 48, color: '#f8fafc' },
    { name: 'Preto', value: 32, color: '#1e293b' },
    { name: 'Navy', value: 20, color: '#1e1b4b' },
  ];

  const printBudget = (order: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const company = (() => { try { return JSON.parse(localStorage.getItem('gpv_company') || '{}'); } catch { return {}; } })();

    win.document.write(`<html><head><title>Orçamento #${order.id}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
      body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; line-height: 1.5; }
      .header { display: flex; justify-content: space-between; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
      .logo-text { font-size: 26px; font-weight: 900; color: #1e1b4b; }
      .info { text-align: right; font-size: 11px; color: #64748b; }
      .title { font-size: 24px; font-weight: 900; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1.5px; color: #1e1b4b; border-left: 5px solid #6366f1; padding-left: 15px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
      .section { border: 1px solid #e2e8f0; padding: 18px; border-radius: 16px; background: #fff; }
      .label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px; }
      .val { font-size: 14px; font-weight: 700; color: #1e293b; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th { text-align: left; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding: 15px 12px; }
      td { padding: 15px 12px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #334155; }
      .total-box { margin-top: 40px; text-align: right; padding: 30px; background: #1e1b4b; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(30, 27, 75, 0.2); }
      .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); width: 600px; opacity: 0.05; z-index: -1; pointer-events: none; filter: grayscale(100%); }
      .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 25px; }
      .spec-pill { background: #f1f5f9; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #475569; display: inline-block; margin-right: 5px; margin-top: 5px; }
    </style></head><body>
      <img src="/watermark_logo.png" class="watermark" alt="">
      <div class="header">
        <div class="logo">
          <img src="/watermark_logo.png" style="max-height:90px">
        </div>
        <div class="info">
          <div style="font-weight:900; font-size:14px; color:#1e1b4b; margin-bottom:4px;">${company.nomeEmpresa || 'GPV STUDIO'}</div>
          <div>${company.email || ''}</div>
          <div>${company.telefone || ''}</div>
          <div>${company.endereco || ''}</div>
          ${company.site ? `<div>${company.site}</div>` : ''}
        </div>
      </div>
      <div class="title">Cotação de Produção Têxtil #${order.id}</div>
      <div class="grid">
        <div class="section">
          <div class="label">Informações do Cliente</div>
          <div class="val">${selectedCustomer?.nome || 'Cliente Balcão'}</div>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">${selectedCustomer?.telefone || ''}</div>
        </div>
        <div class="section">
          <div class="label">Data de Emissão</div>
          <div class="val">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 60%">Descrição do Lote / Especificações</th>
            <th style="text-align:center">Qtd</th>
            <th style="text-align:right">Unitário</th>
            <th style="text-align:right">Total do Lote</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight:700; font-size:15px; margin-bottom:8px;">${order.product}</div>
              <div class="spec-pill">${order.technique}</div>
              <div class="spec-pill">Tamanho ${selectedSize}</div>
              <div class="spec-pill">${currentFabric.name}</div>
            </td>
            <td style="text-align:center; font-weight:700;">${order.qty} un</td>
            <td style="text-align:right; font-weight:700;">R$ ${(order.total / order.qty).toFixed(2)}</td>
            <td style="text-align:right; font-weight:900; color:#1e1b4b; font-size:16px;">R$ ${parseFloat(order.total).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <div class="total-box">
        <div class="label" style="color:rgba(255,255,255,0.6)">Investimento Total Estimado</div>
        <div style="font-size:32px; font-weight:900; letter-spacing:-1px;">R$ ${parseFloat(order.total).toFixed(2)}</div>
      </div>
      <div class="footer">
        <div style="font-weight:900; text-transform:uppercase; margin-bottom:10px; color:#64748b; letter-spacing:1px;">Cláusulas Técnicas e Comerciais</div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div>
            • <b>Validade:</b> Esta cotação expira em 3 dias úteis devido à oscilação de insumos.<br>
            • <b>Produção:</b> Início imediato após aprovação da prova digital e sinal de 50%.<br>
            • <b>Entrega:</b> Prevista para até 7 dias úteis após início da produção.
          </div>
          <div style="text-align:right;">
            Documento de caráter informativo gerado industrialmente.<br>
            Responsável: ${user?.nome || 'Sistema GPV'}<br>
            <b>${company.nomeEmpresa || 'GPV STUDIO'}</b>
          </div>
        </div>
      </div>
      <script>window.onload=()=>{ window.print(); setTimeout(()=>window.close(), 500); }</script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shirt className="text-slate-900" size={24} />
            Engenharia de Estamparia
          </h1>
          <p className="text-slate-500 text-sm font-medium">Dimensionamento técnico, simulador de insumos e orçamentação industrial.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTechSheet(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm">
            <FileText size={16} />
            Ficha Técnica
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all">
            <BarChart2 size={16} />
            Relatórios
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm">
            <Plus size={16} />
            Novo Projeto
          </button>
        </div>
      </header>

      {/* ─── Seletor de Tipo de Malha ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Layers size={14} className="text-indigo-600" />
          Tipo de Malha
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(fabricTypes).map(([key, fb]) => (
            <button key={key} onClick={() => setFabricType(key)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left group hover:shadow-md ${fabricType === key ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
              <div className="absolute top-2 right-2">
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${fb.quality === 'Premium' ? 'bg-amber-100 text-amber-700' : fb.quality === 'Esportivo' ? 'bg-blue-100 text-blue-700' : fb.quality === 'Econômico' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{fb.quality}</span>
              </div>
              <p className={`text-sm font-bold mb-1 ${fabricType === key ? 'text-indigo-700' : 'text-slate-700'}`}>{fb.name}</p>
              <p className="text-[10px] text-slate-400 font-bold">{fb.grammage} g/m²</p>
              <p className="text-[9px] text-slate-400 mt-1">Encolhimento: ~{fb.shrinkW}%</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Simulador Centralizado */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
            <div className="flex-[1.2] bg-slate-50 p-10 flex flex-col items-center justify-center relative">
              <div className="absolute top-4 left-4 bg-white/80 border border-slate-200 px-3 py-1 rounded-full">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Viewport Técnico</span>
              </div>

              <div className="relative group transition-transform duration-500 hover:scale-[1.02]">
                {/* Size badge */}
                <div className="absolute -top-2 -right-2 z-10 bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">{selectedSize}</div>
                <svg viewBox="0 0 380 420" width="320" height="356" xmlns="http://www.w3.org/2000/svg" className="transition-all duration-300">
                  <defs>
                    <linearGradient id="tBody" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.18" />
                      <stop offset="45%" stopColor="white" stopOpacity="0.03" />
                      <stop offset="100%" stopColor="black" stopOpacity="0.12" />
                    </linearGradient>
                    <linearGradient id="tShadL" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" stopOpacity="0.24" />
                      <stop offset="45%" stopColor="black" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="tShadR" x1="100%" y1="0%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="black" stopOpacity="0.24" />
                      <stop offset="45%" stopColor="black" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="tSpec" x1="20%" y1="0%" x2="80%" y2="100%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.30" />
                      <stop offset="35%" stopColor="white" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <filter id="tDrop">
                      <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="rgba(0,0,0,0.28)" />
                    </filter>
                  </defs>
                  {/* Ground shadow */}
                  <ellipse cx="190" cy="414" rx="116" ry="7" fill="rgba(0,0,0,0.10)" />
                  {/* Base shirt body */}
                  <path d="M142 32C152 26 163 22 190 22C217 22 228 26 238 32C252 42 270 54 294 60L338 68C348 70 355 74 358 82L368 148C370 158 364 166 354 165L316 160C308 165 305 172 304 182L298 400C298 406 293 410 287 410L93 410C87 410 82 406 82 400L76 182C75 172 72 165 64 160L26 165C16 166 10 158 12 148L22 82C25 74 32 70 42 68L86 60C110 54 128 42 142 32Z"
                    fill={selectedColor} filter="url(#tDrop)"
                    stroke={selectedColor === '#ffffff' ? '#cbd5e1' : 'none'} strokeWidth={selectedColor === '#ffffff' ? 1.5 : 0} />
                  {/* Ambient gradient */}
                  <path d="M142 32C152 26 163 22 190 22C217 22 228 26 238 32C252 42 270 54 294 60L338 68C348 70 355 74 358 82L368 148C370 158 364 166 354 165L316 160C308 165 305 172 304 182L298 400C298 406 293 410 287 410L93 410C87 410 82 406 82 400L76 182C75 172 72 165 64 160L26 165C16 166 10 158 12 148L22 82C25 74 32 70 42 68L86 60C110 54 128 42 142 32Z" fill="url(#tBody)" />
                  {/* Specular */}
                  <path d="M142 32C163 22 190 22 190 22C190 22 217 22 238 32L294 60L316 160L82 400L76 182L64 160L86 60Z" fill="url(#tSpec)" />
                  {/* Sleeve depth shadows */}
                  <path d="M12 148L22 82L86 60L64 160Z" fill="url(#tShadL)" />
                  <path d="M368 148L358 82L294 60L316 160Z" fill="url(#tShadR)" />
                  {/* Armhole fold creases */}
                  <path d="M86 60C94 82 90 110 87 142" stroke="rgba(0,0,0,0.09)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M294 60C286 82 290 110 293 142" stroke="rgba(0,0,0,0.09)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  {/* Sleeve cuffs - double stitch */}
                  <path d="M12 148C28 153 50 158 64 160" stroke="rgba(0,0,0,0.16)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M14 142C30 147 52 152 66 154" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" strokeLinecap="round" />
                  <path d="M368 148C352 153 330 158 316 160" stroke="rgba(0,0,0,0.16)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M366 142C350 147 328 152 314 154" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" strokeLinecap="round" />
                  {/* Side seams */}
                  <path d="M97 162C95 260 94 340 93 400" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" fill="none" />
                  <path d="M283 162C285 260 286 340 287 400" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" fill="none" />
                  {/* Fabric fold wrinkles */}
                  <path d="M118 200C145 207 168 204 190 202C212 200 238 207 264 200" stroke="rgba(0,0,0,0.04)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  <path d="M106 310C140 323 168 319 190 317C212 315 246 323 274 310" stroke="rgba(0,0,0,0.035)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  {/* Hem double stitch */}
                  <path d="M93 400L287 400" stroke="rgba(0,0,0,0.15)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M94 393L286 393" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                  {/* Collar */}
                  <path d="M155 35C162 28 172 24 190 24C208 24 218 28 225 35C222 60 212 76 190 80C168 76 158 60 155 35Z"
                    fill={selectedColor === '#ffffff' ? '#e2e8f0' : 'rgba(0,0,0,0.22)'} stroke="rgba(0,0,0,0.08)" strokeWidth="0.8" />
                  <path d="M160 38C166 32 175 28 190 28C205 28 214 32 220 38C217 58 208 72 190 76C172 72 163 58 160 38Z"
                    fill={selectedColor === '#ffffff' ? '#f1f5f9' : 'rgba(255,255,255,0.07)'} />
                  {[168, 175, 182, 198, 205, 212].map((x, i) => (
                    <path key={i} d={`M${x} 30C${x + (i < 3 ? -2 : 2)} 50,${x + (i < 3 ? -3 : 3)} 65,190 78`} stroke="rgba(0,0,0,0.06)" strokeWidth="1" fill="none" />
                  ))}
                  {/* Print area */}
                  {uploadedArt ? (
                    <image href={uploadedArt} x="130" y="100" width="120" height="120" preserveAspectRatio="xMidYMid meet" style={{ mixBlendMode: 'multiply' as any, opacity: 0.93 }} />
                  ) : (
                    <g>
                      <rect x="132" y="100" width="116" height="116" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(0,0,0,0.14)" strokeWidth="1.2" strokeDasharray="6 3.5" />
                      {([[132, 100], [248, 100], [132, 216], [248, 216]] as [number, number][]).map(([cx, cy], i) => (
                        <g key={i}>
                          <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="rgba(0,0,0,0.20)" strokeWidth="1.2" />
                          <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke="rgba(0,0,0,0.20)" strokeWidth="1.2" />
                        </g>
                      ))}
                      <text x="190" y="153" textAnchor="middle" fill="rgba(0,0,0,0.18)" fontSize="9.5" fontFamily="monospace" fontWeight="700" letterSpacing="1.5">ÁREA DE</text>
                      <text x="190" y="168" textAnchor="middle" fill="rgba(0,0,0,0.18)" fontSize="9.5" fontFamily="monospace" fontWeight="700" letterSpacing="1.5">ESTAMPA</text>
                      <text x="190" y="183" textAnchor="middle" fill="rgba(0,0,0,0.10)" fontSize="7.5" fontFamily="monospace" letterSpacing="0.5">116 Ã— 116 px</text>
                    </g>
                  )}
                  {/* Technique sleeve badge */}
                  <g transform="translate(30,92) rotate(-35)">
                    <rect width="46" height="15" rx="3" fill="rgba(0,0,0,0.22)" />
                    <text x="23" y="11" textAnchor="middle" fill="rgba(255,255,255,0.75)" fontSize="7" fontFamily="monospace" fontWeight="700" letterSpacing="0.5">{technique}</text>
                  </g>
                </svg>
              </div>

              {/* ─ Paleta de Cores Expandida ─ */}
              <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Paleta de Cores</p>

                {/* Neutros */}
                <div>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Neutros</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { hex: '#ffffff', nome: 'Branco' },
                      { hex: '#f8fafc', nome: 'Gelo' },
                      { hex: '#e2e8f0', nome: 'Prata Claro' },
                      { hex: '#94a3b8', nome: 'Cinza Médio' },
                      { hex: '#475569', nome: 'Cinza Escuro' },
                      { hex: '#1e293b', nome: 'Azul Noite' },
                      { hex: '#0f172a', nome: 'Quase Preto' },
                    ].map(c => (
                      <button key={c.hex} title={c.nome}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${selectedColor === c.hex ? 'border-indigo-600 scale-110 shadow-md' : 'border-white hover:border-slate-300'}`}
                        style={{ backgroundColor: c.hex, boxShadow: selectedColor === c.hex ? '0 0 0 2px #6366f1' : '' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Azuis e Roxos */}
                <div>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Azuis &amp; Roxos</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { hex: '#dbeafe', nome: 'Azul Bebê' },
                      { hex: '#60a5fa', nome: 'Azul Claro' },
                      { hex: '#3b82f6', nome: 'Azul Royal' },
                      { hex: '#1d4ed8', nome: 'Azul Escuro' },
                      { hex: '#1e3a8a', nome: 'Azul Marinho' },
                      { hex: '#a78bfa', nome: 'Lavanda' },
                      { hex: '#7c3aed', nome: 'Roxo' },
                      { hex: '#4c1d95', nome: 'Vinho Roxo' },
                    ].map(c => (
                      <button key={c.hex} title={c.nome}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${selectedColor === c.hex ? 'border-indigo-600 scale-110 shadow-md' : 'border-white hover:border-slate-300'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Verdes e Amarelos */}
                <div>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Verdes &amp; Amarelos</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { hex: '#dcfce7', nome: 'Verde Menta' },
                      { hex: '#4ade80', nome: 'Verde Claro' },
                      { hex: '#16a34a', nome: 'Verde Médio' },
                      { hex: '#14532d', nome: 'Verde Musgo' },
                      { hex: '#84cc16', nome: 'Verde Lima' },
                      { hex: '#fef08a', nome: 'Amarelo Claro' },
                      { hex: '#f59e0b', nome: 'Amarelo Âmbar' },
                      { hex: '#92400e', nome: 'Marrom Âmbar' },
                    ].map(c => (
                      <button key={c.hex} title={c.nome}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${selectedColor === c.hex ? 'border-indigo-600 scale-110 shadow-md' : 'border-white hover:border-slate-300'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Vermelhos e Rosas */}
                <div>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Vermelhos &amp; Rosas</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { hex: '#fecaca', nome: 'Rosa Claro' },
                      { hex: '#f87171', nome: 'Vermelho Claro' },
                      { hex: '#ef4444', nome: 'Vermelho' },
                      { hex: '#b91c1c', nome: 'Vermelho Escuro' },
                      { hex: '#7f1d1d', nome: 'Bordô' },
                      { hex: '#f472b6', nome: 'Rosa Pink' },
                      { hex: '#db2777', nome: 'Rosa Escuro' },
                    ].map(c => (
                      <button key={c.hex} title={c.nome}
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${selectedColor === c.hex ? 'border-indigo-600 scale-110 shadow-md' : 'border-white hover:border-slate-300'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Input de cor personalizada */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Cor personalizada</label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={e => setSelectedColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                    title="Escolher cor"
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setSelectedColor(e.target.value); }}
                    className="flex-1 py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 outline-none focus:ring-1 focus:ring-indigo-300"
                    placeholder="#000000"
                    maxLength={7}
                  />
                  <div className="w-7 h-7 rounded-full border-2 border-slate-200 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: selectedColor }} />
                </div>
              </div>
            </div>

            <div className="flex-1 p-8 border-l border-slate-100 bg-white flex flex-col justify-between">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Palette size={14} className="text-indigo-600" />
                    Especificações do Item
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Produto Base</label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-100 transition-all text-sm"
                      >
                        <option>Camiseta Algodão 30.1</option>
                        <option>Baby Look Dry-Fit</option>
                        <option>Moletom Canguru Premium</option>
                        <option>Caneca Cerâmica Sublimação</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tamanho</label>
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none text-sm"
                        >
                          {['P', 'M', 'G', 'GG', 'XG'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Quantidade</label>
                        <input
                          type="number"
                          value={qty}
                          onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Processo de Impressão</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(insumosConfig).map(t => (
                          <button
                            key={t}
                            onClick={() => setTechnique(t)}
                            className={`py-2 px-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${technique === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} className="text-slate-600" />
                    Asset Digital
                  </h3>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                    <Upload size={20} className="text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{uploadedArt ? 'Atualizar Arte' : 'Vincular Arquivo de Arte'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <PieChartIcon size={18} className="text-indigo-600" />
                Distribuição de Cores (30d)
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={colorInsights} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" hide />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {colorInsights.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#e2e8f0" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-emerald-600" />
                Performance Produtiva
              </h3>
              <div className="space-y-3">
                {['M', 'G', 'GG'].map(s => (
                  <div key={s} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 w-6">{s}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orçamentação e Fechamento */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg mb-8 flex items-center gap-2">
              <Calculator size={20} className="text-indigo-600" />
              Memória de Cálculo
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Material Base</span>
                  <span className="font-bold text-slate-900">R$ {(unitBaseCost * qty).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Consumo de Tinta</span>
                  <span className="font-bold text-slate-900">R$ {(unitInkCost * qty).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold uppercase">Insumos Adicionais</span>
                  <span className="font-bold text-slate-900">R$ {(unitPaperCost * qty).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-4 border-b border-slate-50">
                  <span className="text-slate-500 font-bold uppercase">Custo Operacional</span>
                  <span className="font-bold text-slate-900">R$ {(unitLaborCost * qty).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Total Produção</span>
                  <span className="text-lg font-black text-slate-900">R$ {totalProductionCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl text-white shadow-lg">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preço de Venda Sugerido</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-xl font-bold text-slate-500">R$</span>
                  <input
                    type="number"
                    className="bg-transparent text-4xl font-extrabold text-white outline-none w-full border-b border-slate-700 focus:border-indigo-500 transition-colors"
                    defaultValue={suggestedUnitPrice.toFixed(2)}
                  />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Margem Bruta</p>
                    <p className="text-sm font-bold text-emerald-400">150% (R$ {totalProfit.toFixed(2)})</p>
                  </div>
                  <button className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                  <DollarSign size={16} />
                  Efetivar Venda
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                  <Clock size={16} />
                  Fila de Produção
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Estoque Insumos</p>
              <p className="text-sm font-bold text-slate-800">OK - Pronto para Produção</p>
            </div>
          </div>

          {/* ─── Área de Impressão & Custo/cm² ─── */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Maximize2 size={14} className="text-indigo-600" />
              Área de Impressão
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Largura (cm)</label>
                <input type="number" value={printWidth} onChange={e => setPrintWidth(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Altura (cm)</label>
                <input type="number" value={printHeight} onChange={e => setPrintHeight(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 outline-none text-sm" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Área Total</span>
                <span className="text-sm font-black text-indigo-700">{printAreaCm2.toLocaleString()} cm²</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Custo / cm²</span>
                <span className="text-sm font-black text-indigo-700">R$ {costPerCm2.toFixed(4)}</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-100 rounded-full mt-2">
                <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${Math.min(100, costPerCm2 / 0.05 * 100)}%` }}></div>
              </div>
              <p className="text-[8px] text-slate-400">Benchmark: R$ 0.02~0.05/cm²</p>
            </div>
          </div>

          {/* ─── Consumo de Tinta Detalhado ─── */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Droplets size={14} className="text-cyan-600" />
              Consumo de Tinta
            </h3>
            <div className="space-y-3 mb-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Cobertura de Tinta</label>
                  <span className="text-[9px] font-black text-indigo-600">{inkCoverage}%</span>
                </div>
                <input type="range" min={10} max={100} value={inkCoverage} onChange={e => setInkCoverage(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">ml / unidade</span>
                <span className="font-black text-slate-800">{inkMlPerUnit.toFixed(2)} ml</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-bold">Custo tinta / un.</span>
                <span className="font-black text-slate-800">R$ {unitInkCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Total do lote</span>
                <span className="font-black text-cyan-700">R$ {(unitInkCost * qty).toFixed(2)}</span>
              </div>
              {/* Gauge */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${inkMlPerUnit > 8 ? 'bg-red-500' : inkMlPerUnit > 4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (inkMlPerUnit / 12) * 100)}%` }}></div>
                </div>
                <span className={`text-[9px] font-black uppercase ${inkMlPerUnit > 8 ? 'text-red-500' : inkMlPerUnit > 4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {inkMlPerUnit > 8 ? 'Alto' : inkMlPerUnit > 4 ? 'Médio' : 'Baixo'}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Encolhimento Estimado ─── */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Ruler size={14} className="text-amber-600" />
              Encolhimento Estimado
              {maxShrink > 5 && <AlertTriangle size={12} className="text-amber-500" />}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Antes (L×A)</p>
                <p className="text-sm font-black text-slate-800">{printWidth} × {printHeight} cm</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-[8px] font-bold text-amber-500 uppercase mb-1">Após Lavagem</p>
                <p className="text-sm font-black text-amber-700">{shrinkWidthAfter.toFixed(1)} × {shrinkHeightAfter.toFixed(1)} cm</p>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 text-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase block">Largura</span>
                <span className="text-xs font-black text-slate-700">-{currentFabric.shrinkW}%</span>
              </div>
              <div className="flex-1 text-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase block">Comprimento</span>
                <span className="text-xs font-black text-slate-700">-{currentFabric.shrinkH}%</span>
              </div>
            </div>
            {maxShrink > 3 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[10px] font-bold text-amber-700">⚠ Recomendação: Ampliar arte em {maxShrink}% para compensar encolhimento</p>
              </div>
            )}
          </div>

          {/* ─── Margem de Erro de Impressão ─── */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle size={14} className="text-rose-500" />
              Margem de Erro
            </h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-lg font-black text-slate-800">±{currentTolerance.mm}mm</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{technique}</p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border" style={{
                backgroundColor: `${currentTolerance.color}15`,
                color: currentTolerance.color,
                borderColor: `${currentTolerance.color}30`
              }}>{currentTolerance.level}</span>
            </div>
            <div className="space-y-2">
              {Object.entries(printTolerances).map(([t, tol]) => (
                <div key={t} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${technique === t ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}>
                  <span className="font-bold">{t}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black">±{tol.mm}mm</span>
                    <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: tol.color }}></span>
                  </div>
                </div>
              ))}
            </div>
            {currentTolerance.mm >= 2.0 && (
              <p className="text-[9px] text-amber-600 font-bold mt-3">💡 Calibrar equipamento antes do lote para melhor precisão.</p>
            )}
          </div>
        </div>
      </div> {/* Closing div for xl:grid-cols-12 */}

      {/* Histórico de Produção Têxtil */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Activity size={20} className="text-slate-400" />
            Linha do Tempo de Produção
          </h3>
          <span className="text-xs font-bold text-slate-400 uppercase">{orders.length} Lotes em Processamento</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Lote #</th>
                <th className="px-6 py-4">Produto / Técnica</th>
                <th className="px-6 py-4 text-center">Volume</th>
                <th className="px-6 py-4">Status Atual</th>
                <th className="px-6 py-4 text-right">Valor Total</th>
                <th className="px-6 py-4 text-center">Previsão</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm">Carregando dados da produção...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm">Nenhuma ordem de produção ativa.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-300">#{order.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{order.product}</p>
                      <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{order.technique}</span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-600">{order.qty} un</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        order.status === 'PRODUCTION' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                        {order.status === 'AWAITING' ? 'Aguardando' :
                          order.status === 'PRODUCTION' ? 'Em Produção' :
                            order.status === 'FINISHED' ? 'Concluído' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800">R$ {parseFloat(order.total).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">
                      {new Date(new Date(order.date).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => printBudget(order)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all" title="Gerar PDF do Orçamento">
                          <FileText size={16} />
                        </button>
                        <button className="p-2 text-slate-300 hover:text-rose-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ MODAL: Ficha Técnica Automática ═══ */}
      {showTechSheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTechSheet(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} id="tech-sheet-print">
            <div className="p-8 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText size={22} className="text-emerald-600" />
                  Ficha Técnica de Produção
                </h2>
                <p className="text-xs text-slate-400 mt-1">Gerada em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { const el = document.getElementById('tech-sheet-print'); if (el) { const w = window.open('', '_blank'); if (w) { w.document.write('<html><head><title>Ficha Técnica</title><style>body{font-family:system-ui;padding:40px;color:#1e293b}table{width:100%;border-collapse:collapse}td,th{padding:10px 14px;border:1px solid #e2e8f0;text-align:left;font-size:13px}th{background:#f8fafc;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:1px;color:#64748b}h2{margin:0 0 4px}</style></head><body>'); w.document.write(el.innerHTML); w.document.write('</body></html>'); w.document.close(); w.print(); } } }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-emerald-700 transition-all">
                  <Printer size={14} /> Imprimir
                </button>
                <button onClick={() => setShowTechSheet(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-8">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', color: '#64748b', textAlign: 'left' }}>Parâmetro</th>
                    <th style={{ padding: '10px 14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', color: '#64748b', textAlign: 'left' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Produto Base', selectedProduct],
                    ['Tipo de Malha', `${currentFabric.name} (${currentFabric.grammage} g/m²)`],
                    ['Cor Base', selectedColor],
                    ['Tamanho', selectedSize],
                    ['Quantidade', `${qty} unidades`],
                    ['Técnica de Impressão', technique],
                    ['Área de Estampa', `${printWidth} × ${printHeight} cm (${printAreaCm2} cm²)`],
                    ['Cobertura de Tinta', `${inkCoverage}%`],
                    ['Consumo de Tinta / un.', `${inkMlPerUnit.toFixed(2)} ml`],
                    ['Encolhimento (L / A)', `${currentFabric.shrinkW}% / ${currentFabric.shrinkH}%`],
                    ['Dimensão Pós-Lavagem', `${shrinkWidthAfter.toFixed(1)} × ${shrinkHeightAfter.toFixed(1)} cm`],
                    ['Margem de Erro', `±${currentTolerance.mm}mm (${currentTolerance.level})`],
                    ['Custo Unitário', `R$ ${unitTotalCost.toFixed(2)}`],
                    ['Custo / cm²', `R$ ${costPerCm2.toFixed(4)}`],
                    ['Custo Total do Lote', `R$ ${totalProductionCost.toFixed(2)}`],
                    ['Preço de Venda Sugerido', `R$ ${suggestedUnitPrice.toFixed(2)} / un.`],
                    ['Margem Bruta', `150% (R$ ${totalProfit.toFixed(2)})`],
                  ].map(([label, val], i) => (
                    <tr key={i}>
                      <td style={{ padding: '10px 14px', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '13px', color: '#475569' }}>{label}</td>
                      <td style={{ padding: '10px 14px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b', fontWeight: label?.toString().includes('Custo Total') || label?.toString().includes('Preço') ? 800 : 400 }}>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {maxShrink > 3 && (
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', marginTop: '12px', fontWeight: 700 }}>
                  ⚠ Recomendação: Ampliar arte em {maxShrink}% para compensar encolhimento da malha {currentFabric.name}
                </div>
              )}
              {currentTolerance.mm >= 2.0 && (
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', marginTop: '8px', fontWeight: 700 }}>
                  💡 Calibrar equipamento ({technique}) antes do lote para melhor precisão.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApparelModule;
