
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Trash2, Plus, Minus, CreditCard, Banknote, QrCode,
  Printer, FileText, ShoppingCart, X, AlertCircle, Tag,
  ChevronLeft, CheckCircle2, Percent, Calculator, Package,
  Receipt, MessageSquare, Zap, Hash, Store, Clock, User,
  LayoutGrid, Layers, MousePointer2, Sparkles, ArrowRight,
  Monitor, Smartphone, History, Settings
} from 'lucide-react';
import { PaymentMethod } from '../types';
import CustomerSelector from './CustomerSelector';

interface POSProps {
  isCashierOpen: boolean;
  products: any[];
  onSaleComplete: (cart: any[], method: string, isFiscal: boolean) => Promise<any>;
}

const CATEGORIES_CONFIG = [
  { id: 'Todos', label: 'Tudo', icon: LayoutGrid },
  { id: 'Gráfica', label: 'Gráfica', icon: Printer },
  { id: 'Estamparia', label: 'Estampas', icon: Layers },
  { id: 'Papelaria', label: 'Papelaria', icon: FileText },
  { id: 'Brindes', label: 'Brindes', icon: Sparkles },
  { id: 'Geral', label: 'Outros', icon: Package },
];

const PAYMENT_METHODS = [
  { id: PaymentMethod.CASH, label: 'Dinheiro', icon: Banknote, color: '#10b981', bg: '#064e3b' },
  { id: PaymentMethod.PIX, label: 'PIX Instantâneo', icon: QrCode, color: '#8b5cf6', bg: '#2e1065' },
  { id: PaymentMethod.CREDIT_CARD, label: 'Cartão Crédito', icon: CreditCard, color: '#0ea5e9', bg: '#0c4a6e' },
  { id: PaymentMethod.DEBIT_CARD, label: 'Cartão Débito', icon: CreditCard, color: '#14b8a6', bg: '#134e4a' },
];

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const now = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ―― Live Receipt Component (Classic Thermal Style) ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
const LiveReceipt: React.FC<{
  cart: any[];
  subtotal: number;
  discountValue: number;
  total: number;
  discount: string;
  selectedMethod: PaymentMethod;
  payments?: { method: PaymentMethod; valor: number }[];
  isFiscal: boolean;
  cashReceived?: string;
  change?: number;
  saleId?: number;
  finished?: boolean;
}> = ({ cart, subtotal, discountValue, total, discount, selectedMethod, payments, isFiscal, cashReceived, change, saleId, finished }) => {
  const company = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('gpv_company') || '{}'); } catch { return {}; }
  }, []);
  const methodLabel = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label || 'Buscando...';

  return (
    <div className={`h-full flex flex-col transition-transform duration-300 ${finished ? 'scale-100' : 'scale-[0.99] opacity-90'}`}>
      <div className="flex-1 bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col relative overflow-hidden">
        {/* Header Status Bar (Traditional) */}
        <div className={`px-4 py-2 border-b flex items-center justify-between ${finished ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <div className="flex items-center gap-2">
            <Receipt size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              {finished ? 'Comprovante Local' : 'Monitor de Venda'}
            </span>
          </div>
          {finished && <CheckCircle2 size={14} className="animate-pulse" />}
        </div>

        {/* Paper Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col items-center">
          <div className="w-full max-w-[280px] bg-white text-black p-6 border border-slate-200 shadow-sm relative min-h-[450px]" style={{ fontFamily: "'Courier New', monospace" }}>

            {/* Thermal Header */}
            <div className="text-center mb-6">
              <h3 className="font-black text-sm tracking-tighter uppercase mb-0.5">{company.nomeEmpresa || 'GPV STUDIO'}</h3>
              <p className="text-[9px] leading-tight text-slate-800">{company.slogan || 'SOLUÇÕES GRÁFICAS & DESIGN'}</p>
              <div className="h-px bg-black/10 my-3" />
              <div className="flex justify-between text-[8px] text-slate-600 uppercase">
                <span>{now()}</span>
                {saleId && <span>#{String(saleId).padStart(6, '0')}</span>}
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-3 opacity-10">
                  <ShoppingCart size={40} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Caixa Disponível</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black border-b border-black/10 pb-1 uppercase">
                    <span className="flex-1">Descrião</span>
                    <span className="w-12 text-right">Total</span>
                  </div>
                  {cart.map((item, idx) => (
                    <div key={item.id} className="text-[10px]">
                      <div className="flex gap-1">
                        <span className="font-bold">{String(idx + 1).padStart(2, '0')}</span>
                        <span className="flex-1 font-black truncate">{item.name}</span>
                      </div>
                      <div className="flex justify-between pl-5 text-[9px] text-slate-600">
                        <span>{item.quantity}un x {fmt(item.price)}</span>
                        <span className="font-bold text-black">{fmt(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="mt-8 pt-4 border-t-2 border-black border-dotted space-y-2">
              <div className="flex justify-between text-[11px]">
                <span>SUBTOTAL</span>
                <span className="font-bold">{fmt(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span>DESCONTO</span>
                  <span className="font-bold">-{fmt(discountValue)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black border-t border-black pt-2 mt-2">
                <span>TOTAL</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-4 pt-3 border-t border-black/10 space-y-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Forma(s) de Pagamento:</span>
              {(payments && payments.length > 0) ? (
                payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="uppercase">{PAYMENT_METHODS.find(m => m.id === p.method)?.label}</span>
                    <span className="font-black">{fmt(p.valor)}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-[10px]">
                  <span className="uppercase">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}</span>
                  <span className="font-black">{fmt(total)}</span>
                </div>
              )}
            </div>

            {cashReceived && parseFloat(cashReceived) > 0 && (
              <div className="flex justify-between text-[11px] font-bold mt-1">
                <span>PAGO:</span>
                <span>{fmt(parseFloat(cashReceived))}</span>
              </div>
            )}

            {change !== undefined && change > 0 && (
              <div className="flex justify-between text-[11px] font-black bg-slate-100 -mx-6 px-6 py-1 my-1">
                <span>TROCO:</span>
                <span>{fmt(change)}</span>
              </div>
            )}

            {/* Barcode Footer */}
            <div className="text-center mt-10 space-y-4">
              <div className="inline-flex gap-px h-10 items-end justify-center grayscale">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="bg-black" style={{ width: i % 5 === 0 ? 1 : i % 3 === 0 ? 3 : 2, height: (i % 4 === 0 ? 100 : i % 7 === 0 ? 85 : 70) + '%' }} />
                ))}
              </div>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.5em]">Obrigado pela Preferência</p>
            </div>

            {/* Cut Line */}
            <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fff_4px)] bg-[length:8px_8px] z-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ―― Live Receipt Component (Premium View) ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
// const LiveReceipt: React.FC<{
//   cart: any[];
//   subtotal: number;
//   discountValue: number;
//   total: number;
//   discount: string;
//   selectedMethod: PaymentMethod;
//   isFiscal: boolean;
//   cashReceived?: string;
//   change?: number;
//   saleId?: number;
//   finished?: boolean;
// }> = ({ cart, subtotal, discountValue, total, discount, selectedMethod, isFiscal, cashReceived, change, saleId, finished }) => {
//   const company = useMemo(() => {
//     try { return JSON.parse(localStorage.getItem('gpv_company') || '{}'); } catch { return {}; }
//   }, []);
//   const methodLabel = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label || 'A definir';

//   return (
//     <div className={`h-full flex flex-col transition-all duration-500 overflow-hidden ${finished ? 'scale-100' : 'scale-[0.98]'}`}>
//       <div className="flex-1 dark-glass rounded-2xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
//         {/* Decorative Top Line */}
//         <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

//         {/* Status Header */}
//         <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
//           <div className="flex items-center gap-2">
//             <Receipt size={14} className="text-indigo-400" />
//             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/60">
//               Digital Checkout
//             </span>
//           </div>
//           {finished && (
//             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//               <span className="text-[9px] font-black text-emerald-400">APROVADO</span>
//             </div>
//           )}
//         </div>

//         {/* Paper Background Wrapper */}
//         <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
//           <div className="w-full max-w-[240px] bg-[#fdfdfd] text-slate-900 shadow-xl rounded-sm p-5 relative min-h-[400px]" style={{ fontFamily: "'Courier New', monospace" }}>
//             {/* Texture overlay */}
//             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

//             {/* Jagged Edges (CSS instead of SVG for performance) */}
//             <div className="absolute -top-1 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fdfdfd_4px)] bg-[length:8px_8px] -scale-y-100" />

//             {/* Content */}
//             <div className="relative z-10">
//               <div className="text-center mb-6">
//                 <h3 className="font-extrabold text-xs tracking-tighter uppercase mb-1">{company.nomeEmpresa || 'GPV STUDIO'}</h3>
//                 <p className="text-[8px] leading-tight text-slate-500">{company.slogan || 'SOLUÇÕES GRÁFICAS & DESIGN'}</p>
//                 <div className="h-px bg-slate-200 mt-4 mb-3" />
//                 <p className="text-[7px] text-slate-400 uppercase tracking-widest">{now()}</p>
//                 {saleId && <p className="text-[8px] font-bold text-indigo-600 mt-1">ID: #{String(saleId).padStart(6, '0')}</p>}
//               </div>

//               <div className="space-y-3">
//                 {cart.length === 0 ? (
//                   <div className="py-12 flex flex-col items-center gap-3 opacity-20">
//                     <ShoppingCart size={32} />
//                     <span className="text-[8px] font-bold">AGUARDANDO ITENS</span>
//                   </div>
//                 ) : (
//                   <table className="w-full text-[9px] border-collapse">
//                     <thead>
//                       <tr className="border-b border-slate-100 text-slate-400">
//                         <th className="text-left font-normal pb-1">DESCRIÇÃO</th>
//                         <th className="text-right font-normal pb-1">TOTAL</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                       {cart.map((item) => (
//                         <tr key={item.id}>
//                           <td className="py-2">
//                             <span className="block font-bold truncate pr-2">{item.name}</span>
//                             <span className="text-[8px] text-slate-500">{item.quantity}un x {fmt(item.price)}</span>
//                           </td>
//                           <td className="py-2 text-right align-top font-bold">{fmt(item.price * item.quantity)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>

//               <div className="border-t-2 border-slate-900 border-dotted my-4" />

//               <div className="space-y-1.5">
//                 <div className="flex justify-between text-[10px]">
//                   <span>SUBTOTAL</span>
//                   <span>{fmt(subtotal)}</span>
//                 </div>
//                 {discountValue > 0 && (
//                   <div className="flex justify-between text-[10px] text-emerald-600">
//                     <span>DESCONTO</span>
//                     <span>- {fmt(discountValue)}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between text-xs font-black mt-2 pt-2 border-t border-slate-200">
//                   <span>TOTAL</span>
//                   <span>{fmt(total)}</span>
//                 </div>
//               </div>

//               {selectedMethod && (
//                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-5 px-5 py-2">
//                   <span className="text-[8px] font-bold text-slate-400">PAGAMENTO</span>
//                   <span className="text-[9px] font-black text-slate-700">{methodLabel}</span>
//                 </div>
//               )}

//               {cashReceived && parseFloat(cashReceived) > 0 && (
//                 <div className="flex justify-between text-[10px] mt-1 font-bold text-indigo-600">
//                   <span>PAGO</span>
//                   <span>{fmt(parseFloat(cashReceived))}</span>
//                 </div>
//               )}

//               <div className="text-center mt-8 space-y-3">
//                 <p className="text-[7px] text-slate-400 leading-tight">Vendedor: {localStorage.getItem('gpv_user_name') || 'Balcão'}</p>
//                 <div className="inline-flex gap-px h-8 items-end justify-center">
//                   {Array.from({ length: 42 }).map((_, i) => (
//                     <div key={i} className="bg-slate-900" style={{ width: i % 4 === 0 ? 1 : 2, height: (i % 3 === 0 ? 100 : i % 5 === 0 ? 80 : 60) + '%' }} />
//                   ))}
//                 </div>
//                 <p className="text-[8px] font-bold text-slate-400 tracking-[0.4em]">WWW.GPVSTUDIO.COM.BR</p>
//               </div>
//             </div>

//             {/* Bottom edge */}
//             <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fdfdfd_4px)] bg-[length:8px_8px]" />
//           </div>
//         </div>

//         {/* Action Button Overlays */}
//         {!finished && cart.length > 0 && (
//           <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-2">
//             <button className="flex-1 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500/30 transition-all">
//               Salvar Rascunho
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// ―― Live Receipt Component (Premium View) ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
// const LiveReceipt: React.FC<{
//   cart: any[];
//   subtotal: number;
//   discountValue: number;
//   total: number;
//   discount: string;
//   selectedMethod: PaymentMethod;
//   isFiscal: boolean;
//   cashReceived?: string;
//   change?: number;
//   saleId?: number;
//   finished?: boolean;
// }> = ({ cart, subtotal, discountValue, total, discount, selectedMethod, isFiscal, cashReceived, change, saleId, finished }) => {
//   const company = useMemo(() => {
//     try { return JSON.parse(localStorage.getItem('gpv_company') || '{}'); } catch { return {}; }
//   }, []);
//   const methodLabel = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label || 'A definir';

//   return (
//     <div className={`h-full flex flex-col transition-all duration-500 overflow-hidden ${finished ? 'scale-100' : 'scale-[0.98]'}`}>
//       <div className="flex-1 dark-glass rounded-2xl border border-white/10 shadow-2xl flex flex-col relative overflow-hidden">
//         {/* Decorative Top Line */}
//         <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />

//         {/* Status Header */}
//         <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
//           <div className="flex items-center gap-2">
//             <Receipt size={14} className="text-indigo-400" />
//             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/60">
//               Digital Checkout
//             </span>
//           </div>
//           {finished && (
//             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//               <span className="text-[9px] font-black text-emerald-400">APROVADO</span>
//             </div>
//           )}
//         </div>

//         {/* Paper Background Wrapper */}
//         <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
//           <div className="w-full max-w-[240px] bg-[#fdfdfd] text-slate-900 shadow-xl rounded-sm p-5 relative min-h-[400px]" style={{ fontFamily: "'Courier New', monospace" }}>
//             {/* Texture overlay */}
//             <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

//             {/* Jagged Edges (CSS instead of SVG for performance) */}
//             <div className="absolute -top-1 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fdfdfd_4px)] bg-[length:8px_8px] -scale-y-100" />

//             {/* Content */}
//             <div className="relative z-10">
//               <div className="text-center mb-6">
//                 <h3 className="font-extrabold text-xs tracking-tighter uppercase mb-1">{company.nomeEmpresa || 'GPV STUDIO'}</h3>
//                 <p className="text-[8px] leading-tight text-slate-500">{company.slogan || 'SOLUÇÕES GRÁFICAS & DESIGN'}</p>
//                 <div className="h-px bg-slate-200 mt-4 mb-3" />
//                 <p className="text-[7px] text-slate-400 uppercase tracking-widest">{now()}</p>
//                 {saleId && <p className="text-[8px] font-bold text-indigo-600 mt-1">ID: #{String(saleId).padStart(6, '0')}</p>}
//               </div>

//               <div className="space-y-3">
//                 {cart.length === 0 ? (
//                   <div className="py-12 flex flex-col items-center gap-3 opacity-20">
//                     <ShoppingCart size={32} />
//                     <span className="text-[8px] font-bold">AGUARDANDO ITENS</span>
//                   </div>
//                 ) : (
//                   <table className="w-full text-[9px] border-collapse">
//                     <thead>
//                       <tr className="border-b border-slate-100 text-slate-400">
//                         <th className="text-left font-normal pb-1">DESCRIÇÃO</th>
//                         <th className="text-right font-normal pb-1">TOTAL</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-50">
//                       {cart.map((item) => (
//                         <tr key={item.id}>
//                           <td className="py-2">
//                             <span className="block font-bold truncate pr-2">{item.name}</span>
//                             <span className="text-[8px] text-slate-500">{item.quantity}un x {fmt(item.price)}</span>
//                           </td>
//                           <td className="py-2 text-right align-top font-bold">{fmt(item.price * item.quantity)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>

//               <div className="border-t-2 border-slate-900 border-dotted my-4" />

//               <div className="space-y-1.5">
//                 <div className="flex justify-between text-[10px]">
//                   <span>SUBTOTAL</span>
//                   <span>{fmt(subtotal)}</span>
//                 </div>
//                 {discountValue > 0 && (
//                   <div className="flex justify-between text-[10px] text-emerald-600">
//                     <span>DESCONTO</span>
//                     <span>- {fmt(discountValue)}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between text-xs font-black mt-2 pt-2 border-t border-slate-200">
//                   <span>TOTAL</span>
//                   <span>{fmt(total)}</span>
//                 </div>
//               </div>

//               {selectedMethod && (
//                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-5 px-5 py-2">
//                   <span className="text-[8px] font-bold text-slate-400">PAGAMENTO</span>
//                   <span className="text-[9px] font-black text-slate-700">{methodLabel}</span>
//                 </div>
//               )}

//               {cashReceived && parseFloat(cashReceived) > 0 && (
//                 <div className="flex justify-between text-[10px] mt-1 font-bold text-indigo-600">
//                   <span>PAGO</span>
//                   <span>{fmt(parseFloat(cashReceived))}</span>
//                 </div>
//               )}

//               <div className="text-center mt-8 space-y-3">
//                 <p className="text-[7px] text-slate-400 leading-tight">Vendedor: {localStorage.getItem('gpv_user_name') || 'Balcão'}</p>
//                 <div className="inline-flex gap-px h-8 items-end justify-center">
//                   {Array.from({ length: 42 }).map((_, i) => (
//                     <div key={i} className="bg-slate-900" style={{ width: i % 4 === 0 ? 1 : 2, height: (i % 3 === 0 ? 100 : i % 5 === 0 ? 80 : 60) + '%' }} />
//                   ))}
//                 </div>
//                 <p className="text-[8px] font-bold text-slate-400 tracking-[0.4em]">WWW.GPVSTUDIO.COM.BR</p>
//               </div>
//             </div>

//             {/* Bottom edge */}
//             <div className="absolute -bottom-1 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_0,transparent_4px,#fdfdfd_4px)] bg-[length:8px_8px]" />
//           </div>
//         </div>

//         {/* Action Button Overlays */}
//         {!finished && cart.length > 0 && (
//           <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-2">
//             <button className="flex-1 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500/30 transition-all">
//               Salvar Rascunho
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// ââ Main POS Component ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const POS: React.FC<POSProps> = ({ isCashierOpen, products, onSaleComplete }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [payments, setPayments] = useState<{ method: PaymentMethod; valor: number }[]>([]);
  const [paymentValue, setPaymentValue] = useState('');
  const [isFiscal, setIsFiscal] = useState(false);
  const [step, setStep] = useState<'cart' | 'payment' | 'change'>('cart');
  const [discount, setDiscount] = useState('');
  const [cashReceived, setCashReceived] = useState(''); // Only for change calculation at the end
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setStep('cart'); }
      if (e.key === 'F9') { e.preventDefault(); if (cart.length > 0) setStep('payment'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cart.length]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchText = p.name.toLowerCase().includes(query) || (p.sku || '').toLowerCase().includes(query);
      const matchCat = activeCategory === 'Todos' || (p.category || 'Geral') === activeCategory;
      return matchText && matchCat;
    });
  }, [products, searchQuery, activeCategory]);

  const addToCart = (product: any) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    const prod = products.find(p => p.id === id);
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nq = i.quantity + delta;
      if (nq <= 0) return null as any;
      if (prod && nq > prod.stock) return i;
      return { ...i, quantity: nq };
    }).filter(Boolean));
  };

  const removeFromCart = (id: number) => setCart(c => c.filter(i => i.id !== id));
  const clearCart = () => { if (cart.length > 0) setCart([]); };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const discountValue = useMemo(() => {
    const d = parseFloat(discount);
    return d > 0 ? (subtotal * d) / 100 : 0;
  }, [subtotal, discount]);

  const total = Math.max(0, subtotal - discountValue);
  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.valor, 0), [payments]);
  const remainingTotal = Math.max(0, total - totalPaid);
  const change = totalPaid - total;

  const addPayment = () => {
    const val = parseFloat(paymentValue);
    if (!val || val <= 0) return;
    setPayments([...payments, { method: selectedMethod, valor: val }]);
    setPaymentValue('');
  };

  const removePayment = (idx: number) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const printReceipt = (sale: any) => {
    const win = window.open('', '_blank', 'width=340,height=600');
    if (!win) return;
    const company = (() => { try { return JSON.parse(localStorage.getItem('gpv_company') || '{}'); } catch { return {}; } })();
    const methodLabel = PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label || '';
    win.document.write(`<html><head><style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; padding: 8px; }
      .c { text-align: center; } .b { font-weight: bold; } .lg { font-size: 14px; }
      .xl { font-size: 18px; } .div { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; margin: 2px 0; }
    </style></head><body>
      <div class="c"><div class="b xl">${company.nomeEmpresa || 'GPV STUDIO'}</div>
      ${company.cnpj ? `<div>CNPJ: ${company.cnpj}</div>` : ''}
      <div>${new Date().toLocaleString('pt-BR')}</div>
      <div>Venda #${sale.id}</div></div>
      <div class="div"></div>
      ${sale.items.map((i: any) => `<div><span>${i.quantity}x ${i.name}</span><div class="row"><span>&nbsp;&nbsp;${fmt(i.price)} un.</span><span>${fmt(i.price * i.quantity)}</span></div></div>`).join('')}
      <div class="div"></div>
      <div class="row"><span>SUBTOTAL</span><span>${fmt(subtotal)}</span></div>
      ${discountValue > 0 ? `<div class="row"><span>DESCONTO (${discount}%)</span><span>- ${fmt(discountValue)}</span></div>` : ''}
      <div class="row b lg"><span>TOTAL</span><span>${fmt(sale.total)}</span></div>
      <div class="div"></div>
      <div class="b text-[9px]">PAGAMENTO(S):</div>
      ${(sale.pagamentos || []).map((p: any) => `
        <div class="row">
          <span>${PAYMENT_METHODS.find(m => m.id === p.method)?.label || p.metodo}</span>
          <span>${fmt(p.valor || p.value)}</span>
        </div>
      `).join('')}
      ${change > 0 ? `<div class="row b"><span>TROCO</span><span>${fmt(change)}</span></div>` : ''}
      <div class="div"></div>
      <div class="c">Obrigado pela preferência!<br>${company.site || 'www.gpvestudio.com.br'}</div>
      <script>window.onload=()=>{window.print();window.close();}</script>
    </body></html>`);
    win.document.close();
  };

  const handleFinishSale = async () => {
    if (isProcessing) return;
    if (totalPaid < total) {
      alert("Aviso: O valor pago é inferior ao total da venda.");
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        itens: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
        pagamentos: payments.length > 0 ? payments.map(p => ({ metodo: p.method, valor: p.valor })) : [{ metodo: selectedMethod, valor: total }],
        isFiscal,
        clienteId: selectedCustomer?.id || null
      };

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setLastSale({ ...data.venda, items: cart });
        setStep('change');
        setCashReceived('');
        setPayments([]);
        // Não limpar o carrinho aqui para permitir re-impressão se necessário,
        // mas marcamos como finalizado

        if (selectedCustomer?.telefone) {
          if (window.confirm("Deseja enviar o comprovante via WhatsApp?")) {
            sendWhatsAppReceipt(data.venda, cart, selectedCustomer);
          }
        }

        // Auto cleanup after success
        setTimeout(() => {
          setCart([]);
          setDiscount('');
          setPayments([]);
          setPaymentValue('');
          setCashReceived('');
          setStep('cart');
          setLastSale(null);
        }, 4000);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // ―― CASHIER CLOSED ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
  if (!isCashierOpen) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 p-6">
        <div className="text-center space-y-6 max-w-sm p-10 bg-white shadow-xl rounded-3xl border border-slate-200">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100 text-rose-500">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">CAIXA FECHADO</h2>
            <p className="text-slate-500 text-sm mt-3 leading-relaxed">O terminal de vendas está desativado. Por favor, abra o caixa para iniciar as operaões.</p>
          </div>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
              <Store size={12} /> Status: Offline
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ―― SUCCESS ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
  const sendWhatsAppReceipt = (sale: any, items: any[], customer: any) => {
    const company = JSON.parse(localStorage.getItem('gpv_company') || '{}');
    const itemsText = items.map(i => `- ${i.quantity}x ${i.name}: ${fmt(i.price * i.quantity)}`).join('\n');
    const msg = `*${company.nomeEmpresa || 'GPV Studio'} - Recibo Digital*\n\n*Olá, ${customer.nome}!*\nSegue o comprovante da sua compra:\n\n*Venda #${sale.id}*\n*Data:* ${new Date(sale.data).toLocaleString('pt-BR')}\n\n*Itens:*\n${itemsText}\n\n*Total:* ${fmt(sale.valor_total)}\n*Pagamento:* ${sale.forma_pagamento}\n\nObrigado pela preferência! 🚀`;
    const phone = customer.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (step === 'change' && lastSale) {
    return (
      <div className="h-full flex flex-col md:flex-row gap-8 p-8 bg-slate-50 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-12">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Venda Realizada!</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">A transaão foi registrada com sucesso</p>
          </div>

          {selectedMethod === PaymentMethod.CASH && change > 0 && (
            <div className="w-full max-w-xs p-8 bg-slate-900 text-white rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-[10px] text-green-400 uppercase font-black tracking-[0.2em] mb-3">Devolver Troco</p>
              <p className="text-6xl font-black tracking-tighter">{fmt(change)}</p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <button onClick={() => setStep('cart')} className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
              Próxima Venda (Esc)
            </button>
          </div>
        </div>
        <div className="w-full md:w-[360px] flex flex-col pt-0">
          <LiveReceipt cart={lastSale?.items || cart} subtotal={subtotal} discountValue={discountValue}
            total={total} discount={discount} selectedMethod={selectedMethod}
            payments={lastSale?.pagamentos || payments}
            isFiscal={isFiscal}
            cashReceived={totalPaid.toString()} change={Math.max(0, change)} saleId={lastSale?.id} finished />
        </div>
      </div>
    );
  }

  // ―― PAYMENT ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
  if (step === 'payment') {
    return (
      <div className="h-full flex flex-col md:flex-row gap-8 p-6 bg-slate-50 animate-in fade-in duration-500 overflow-hidden">
        {/* Left: Payment Controls */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('cart')} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all">
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Finalizar Venda</h2>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Selecione o método de pagamento</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total a Pagar</p>
              <p className="text-2xl font-black text-green-600 tracking-tighter">{fmt(total)}</p>
            </div>
          </div>

          {/* Customer Selection CRM */}
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <CustomerSelector
              onSelect={setSelectedCustomer}
              selectedId={selectedCustomer?.id}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PAYMENT_METHODS.map(m => {
              const Icon = m.icon;
              const isActive = selectedMethod === m.id;
              return (
                <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                  className={`relative flex items-center gap-5 p-6 rounded-3xl border-2 transition-all duration-200 ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-lg tracking-tight">{m.label}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                      Atalho {m.id === PaymentMethod.CASH ? 'F4' : ''}
                    </p>
                  </div>
                  {isActive && <CheckCircle2 size={24} className="absolute top-4 right-4 text-green-400" />}
                </button>
              );
            })}
          </div>

          {/* Calculator for Cash */}
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 space-y-6 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Calculator size={14} /> Informe o Valor ({PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label})
              </p>
            </div>

            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">R$</span>
              <input type="number" placeholder="0,00" value={paymentValue} onChange={e => setPaymentValue(e.target.value)} autoFocus
                className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-5xl text-slate-900 outline-none focus:border-slate-900 transition-all"
                onKeyDown={e => e.key === 'Enter' && addPayment()}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[5, 10, 20, 50, 100].map(v => (
                <button key={v} onClick={() => setPaymentValue(prev => String((parseFloat(prev) || 0) + v))}
                  className="py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-95">
                  +{v}
                </button>
              ))}
              <button onClick={() => setPaymentValue(String(remainingTotal))}
                className="col-span-2 py-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-sm font-black text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all">
                Valor Restante
              </button>
            </div>

            <button onClick={addPayment} disabled={!paymentValue || parseFloat(paymentValue) <= 0}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all disabled:opacity-30">
              Confirmar Pagamento
            </button>
          </div>

          {/* List of Payments Added */}
          {payments.length > 0 && (
            <div className="bg-white rounded-[32px] border border-slate-200 p-6 space-y-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pagamentos Adicionados</p>
              <div className="space-y-2">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                        {React.createElement(PAYMENT_METHODS.find(m => m.id === p.method)?.icon || CreditCard, { size: 16 })}
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase">{PAYMENT_METHODS.find(m => m.id === p.method)?.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-slate-900">{fmt(p.valor)}</span>
                      <button onClick={() => removePayment(i)} className="text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-green-600">
                <span className="text-xs font-black uppercase">Total Pago</span>
                <span className="text-lg font-black">{fmt(totalPaid)}</span>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isFiscal ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 leading-none">Documento Fiscal</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Emitir NFC-e Manual</p>
              </div>
            </div>
            <button onClick={() => setIsFiscal(!isFiscal)}
              className={`w-14 h-8 rounded-full p-1 transition-all ${isFiscal ? 'bg-orange-500' : 'bg-slate-200'}`}>
              <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isFiscal ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="pt-4 flex gap-4">
            <button disabled={isProcessing || totalPaid < total}
              onClick={handleFinishSale}
              className={`flex-1 py-6 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-[28px] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-green-200/50 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4 shine-effect ${totalPaid >= total && !isProcessing ? 'animate-pay-pulse' : ''}`}>
              {isProcessing ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={24} className={totalPaid >= total ? 'animate-bounce' : ''} />
                  CONCLUIR VENDA (F9)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right column: Monitoring Receipt */}
        <div className="w-full md:w-[380px] h-full flex flex-col pt-0 animate-in slide-in-from-right duration-500">
          <LiveReceipt cart={cart} subtotal={subtotal} discountValue={discountValue}
            total={total} discount={discount} selectedMethod={selectedMethod}
            payments={payments}
            isFiscal={isFiscal}
            cashReceived={totalPaid.toString()} change={Math.max(0, change)} />
        </div>
      </div>
    );
  }

  // ―― MAIN INTERFACE ――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
  return (
    <div className="h-full flex bg-slate-50 text-slate-900 overflow-hidden select-none">

      {/* Main Content Area (75% approx) */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Top Bar: Search & Status */}
        <header className="px-8 py-5 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shadow-sm relative z-20">
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
            <input ref={searchRef} type="text" placeholder="PESQUISAR PRODUTO OU SKU... (F2)"
              className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all placeholder:text-slate-400 uppercase"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-black text-slate-400">
              F2
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-nowrap">Caixa Aberto</span>
            </div>
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <User size={20} className="text-slate-500" />
            </div>
          </div>
        </header>

        {/* Categories Bar (Horizontal Bento) */}
        <div className="px-8 py-4 bg-white border-b border-slate-200 flex items-center gap-3 overflow-x-auto scrollbar-hide shrink-0">
          <button onClick={() => setActiveCategory('Todos')}
            className={`px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeCategory === 'Todos' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            Todos
          </button>
          {CATEGORIES_CONFIG.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <cat.icon size={16} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
              <Package size={64} className="mb-4" />
              <p className="text-lg font-black uppercase tracking-widest">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredProducts.map(p => {
                const inCart = cart.find(i => i.id === p.id);
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0}
                    className={`bg-white p-6 rounded-3xl text-left relative group border-2 transition-all shadow-sm flex flex-col justify-between h-[180px] ${p.stock <= 0 ? 'opacity-40 grayscale' : 'hover:border-slate-900 hover:shadow-xl'} ${inCart ? 'border-slate-900 bg-slate-50' : 'border-slate-100'}`}>

                    <div className="flex justify-between items-start">
                      <div className="space-y-1 w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate block">{p.category || 'Geral'}</span>
                          {p.stock <= (p.minStock || 10) && (
                            <span className="text-[8px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm font-black animate-pulse">ESTOQUE BAIXO</span>
                          )}
                        </div>
                        <h3 className="font-black text-sm text-slate-900 line-clamp-2 leading-tight uppercase tracking-tight">{p.name}</h3>
                      </div>
                      {inCart && (
                        <div className="absolute top-4 right-4 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform translate-x-1/2 -translate-y-1/2 border-4 border-white">
                          <span className="text-[11px] font-black">{inCart.quantity}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Preo</span>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">{fmt(p.price)}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${p.stock < 10 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-500'}`}>
                        STOCK: {p.stock}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Checkout Bar (400px fixed) */}
      <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl relative z-30">

        {/* Cart Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <ShoppingCart size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Carrinho</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 uppercase transition-all">Limpar</button>
          )}
        </div>

        {/* Cart Listing */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 opacity-60 gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-dashed flex items-center justify-center">
                <ShoppingCart size={24} className="text-slate-200" />
              </div>
              <p className="text-[10px] font-black uppercase text-center tracking-widest leading-relaxed">Aguardando Produtos<br />No Terminal</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-900 leading-tight truncate uppercase tracking-tight">{item.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-tight">{fmt(item.price)} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-slate-100 shadow-sm">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-500"><Minus size={14} /></button>
                  <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-900"><Plus size={14} /></button>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900">{fmt(item.price * item.quantity)}</p>
                  <button onClick={() => removeFromCart(item.id)} className="text-rose-500/30 hover:text-rose-500 mt-1"><Trash2 size={12} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Huge Total Footer */}
        <div className="p-8 bg-slate-900 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
          {/* Decorative Grid Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400 opacity-50" />

          <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-xl border border-white/5 focus-within:border-white/20">
            <Percent size={14} className="text-slate-500" />
            <input type="number" placeholder="DESCONTO %" value={discount} onChange={e => setDiscount(e.target.value)}
              className="bg-transparent text-[11px] font-black text-white outline-none flex-1 placeholder:text-slate-600 uppercase tracking-widest" />
            {discountValue > 0 && <span className="text-[11px] font-black text-green-400">-{fmt(discountValue)}</span>}
          </div>

          <div className="space-y-1 mb-8">
            <div className="flex justify-between items-center opacity-50">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Subtotal</span>
              <span className="text-xs font-bold text-white line-through">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-black text-green-400 uppercase tracking-[0.3em]">Total</span>
              <span className="text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
                {fmt(total).replace('R$', '').trim()}
                <span className="text-base font-bold ml-2 text-green-400">BRL</span>
              </span>
            </div>
          </div>

          <button disabled={cart.length === 0} onClick={() => setStep('payment')}
            className="w-full py-6 bg-green-500 hover:bg-green-400 text-slate-900 rounded-3xl font-black text-lg uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-3">
            PAGAR (F9) <ArrowRight size={20} />
          </button>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => { if (cart.length > 0) { const msg = cart.map(i => `• ${i.quantity}x ${i.name} - ${fmt(i.price)}`).join('\n'); window.open(`https://wa.me/?text=${encodeURIComponent('*Informativo de Venda*\n' + msg + '\n\n*Total:* ' + fmt(total))}`, '_blank'); } }}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-green-400 transition-all">
              <MessageSquare size={14} /> WHATSAPP
            </button>
            <button disabled={cart.length === 0}
              className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:text-white transition-all">
              <History size={14} /> HISTÓRICO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
