import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowDown, ArrowUp, Barcode, Filter, Search, MoreVertical, Plus, X, Save, Share2 } from 'lucide-react';

interface InventoryProps {
  products: any[];
  onRefresh: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // New Product Form
  const [newProduct, setNewProduct] = useState({
    nome: '',
    categoria: 'Geral',
    preco: '',
    custo: '',
    estoque: '',
    sku: '',
    estoque_minimo: '10',
    modeloNegocio: 'VAREJO',
    tempoProducao: '0',
    desperdicioMedio: '0'
  });

  const [editForm, setEditForm] = useState({
    id: '',
    nome: '',
    categoria: '',
    preco: '',
    custo: '',
    sku: '',
    estoque_minimo: '',
    modeloNegocio: 'VAREJO',
    tempoProducao: '0',
    desperdicioMedio: '0'
  });

  // Stock Update Form
  const [stockUpdate, setStockUpdate] = useState({ quantity: 0, type: 'IN' });

  const stockStats = {
    totalValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0),
    lowStockCount: products.filter(p => p.stock < (p.minStock || 10)).length,
    totalItems: products.length
  };

  const handleCreateProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        showToast("Produto cadastrado com sucesso!", 'success');
        setShowAddModal(false);
        onRefresh();
        setNewProduct({
          nome: '', categoria: 'Geral', preco: '', custo: '', estoque: '', sku: '', estoque_minimo: '10',
          modeloNegocio: 'VAREJO', tempoProducao: '0', desperdicioMedio: '0'
        });
      } else {
        showToast("Erro ao cadastrar produto.", 'error');
      }
    } catch (error) {
      console.error(error);
      showToast("Erro de conexão.", 'error');
    }
  };

  const handleEditProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/produtos/${editForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          nome: editForm.nome,
          categoria: editForm.categoria,
          preco: parseFloat(editForm.preco),
          sku: editForm.sku,
          estoque_minimo: parseInt(editForm.estoque_minimo),
          modeloNegocio: editForm.modeloNegocio,
          tempoProducao: parseInt(editForm.tempoProducao),
          desperdicioMedio: parseFloat(editForm.desperdicioMedio)
        })
      });

      if (response.ok) {
        showToast("Produto atualizado!", 'success');
        setShowEditModal(false);
        onRefresh();
      } else {
        showToast("Erro ao atualizar.", 'error');
      }
    } catch (error) {
      showToast("Erro de conexão.", 'error');
    }
  };

  const shareCatalog = () => {
    const company = JSON.parse(localStorage.getItem('gpv_company') || '{}');
    const catalogItems = products
      .filter(p => p.stock > 0)
      .slice(0, 15)
      .map(p => `*${p.nome}*\n💰 ${p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n📦 Em estoque: ${p.stock}`)
      .join('\n\n');

    const msg = `*${company.nomeEmpresa || 'GPV Studio'} - Catálogo de Produtos*\n\nConfira alguns dos nossos itens disponíveis:\n\n${catalogItems}\n\nEntre em contato para fazer seu pedido! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const openEditModal = (product: any) => {
    setEditForm({
      id: product.id,
      nome: product.name,
      categoria: product.category,
      preco: product.price.toString(),
      custo: '',
      sku: product.sku,
      estoque_minimo: product.minStock?.toString() || '10',
      modeloNegocio: product.modeloNegocio || 'VAREJO',
      tempoProducao: product.tempoProducao?.toString() || '0',
      desperdicioMedio: product.desperdicioMedio?.toString() || '0'
    });
    setShowEditModal(true);
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
    try {
      const token = localStorage.getItem('token');
      const newStock = stockUpdate.type === 'IN'
        ? selectedProduct.stock + Number(stockUpdate.quantity)
        : selectedProduct.stock - Number(stockUpdate.quantity);

      const response = await fetch(`http://localhost:3000/api/produtos/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estoque: newStock })
      });

      if (response.ok) {
        showToast("Estoque atualizado!", 'success');
        setShowStockModal(false);
        onRefresh();
      } else {
        showToast("Erro ao atualizar estoque.", 'error');
      }
    } catch (error) {
      console.error(error);
      showToast("Erro de conexão.", 'error');
    }
  };

  const openStockModal = (product: any) => {
    setSelectedProduct(product);
    setStockUpdate({ quantity: 0, type: 'IN' });
    setShowStockModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Almoxarifado Inteligente</h1>
          <p className="text-slate-500 text-sm font-medium">Controle de insumos sincronizado com produção e PDV.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-2 hover:bg-black transition-all"
          >
            <Barcode size={16} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="p-3 bg-slate-900 text-white rounded-lg"><Package size={24} /></div>
          <div><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Itens em Linha</p><p className="text-3xl font-black text-slate-800">{stockStats.totalItems}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div><p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1">Reposição Urgente</p><p className="text-3xl font-black text-rose-600">{stockStats.lowStockCount}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><ArrowUp size={24} /></div>
          <div><p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Patrimônio em Estoque</p><p className="text-2xl font-black text-slate-800">R$ {stockStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
            <tr>
              <th className="px-8 py-5">Descrição</th>
              <th className="px-8 py-5">Categoria</th>
              <th className="px-8 py-5 text-center">Saldo</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Preço Unit.</th>
              <th className="px-8 py-5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-8 py-5"><p className="font-bold text-slate-800 text-sm">{product.name}</p><p className="text-[9px] text-slate-400 font-black uppercase">SKU: {product.sku}</p></td>
                <td className="px-8 py-5 font-bold text-xs text-slate-500 uppercase">{product.category}</td>
                <td className={`px-8 py-5 text-center font-black text-sm ${product.stock < (product.minStock || 10) ? 'text-rose-600' : 'text-indigo-600'}`}>{product.stock}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${product.stock < (product.minStock || 10) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {product.stock < (product.minStock || 10) ? 'Nível Crítico' : 'Operacional'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right font-bold text-slate-800 text-sm">R$ {product.price.toFixed(2)}</td>
                <td className="px-8 py-5 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => openStockModal(product)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Ajustar Estoque"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Editar Detalhes"
                    >
                      <Filter size={16} className="rotate-90" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Produto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Novo Produto</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400 hover:text-rose-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nome do Produto</label>
                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.nome} onChange={e => setNewProduct({ ...newProduct, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Preço Venda</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.preco} onChange={e => setNewProduct({ ...newProduct, preco: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Custo Compra</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.custo} onChange={e => setNewProduct({ ...newProduct, custo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estoque Inicial</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.estoque} onChange={e => setNewProduct({ ...newProduct, estoque: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estoque Mínimo (Alerta)</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.estoque_minimo} onChange={e => setNewProduct({ ...newProduct, estoque_minimo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">SKU / Código</label>
                  <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Categoria</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.categoria} onChange={e => setNewProduct({ ...newProduct, categoria: e.target.value })}>
                    <option>Geral</option>
                    <option>Papelaria</option>
                    <option>Têxtil</option>
                    <option>Insumos</option>
                    <option>Gráfica</option>
                    <option>Estamparia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Modelo Negócio</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-bold" value={newProduct.modeloNegocio} onChange={e => setNewProduct({ ...newProduct, modeloNegocio: e.target.value })}>
                    <option value="VAREJO">Varejo</option>
                    <option value="PRODUCAO">Produção</option>
                    <option value="ACESSORIOS">Acessórios</option>
                    <option value="PAPELARIA">Papelaria</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Tempo Prod (min)</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.tempoProducao} onChange={e => setNewProduct({ ...newProduct, tempoProducao: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Desperdício (%)</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={newProduct.desperdicioMedio} onChange={e => setNewProduct({ ...newProduct, desperdicioMedio: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={shareCatalog}
                  className="px-6 py-3 bg-green-50 text-green-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-100 transition-all flex items-center gap-2 border border-green-200"
                >
                  <Share2 size={16} /> Compartilhar Catálogo
                </button>
                <button onClick={handleCreateProduct} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg text-sm uppercase tracking-wide hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <Save size={16} /> Salvar Produto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Estoque */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Ajustar Estoque</h3>
              <button onClick={() => setShowStockModal(false)}><X size={20} className="text-slate-400 hover:text-rose-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">Produto Selecionado</p>
                <p className="font-black text-slate-800 text-lg">{selectedProduct.name}</p>
                <p className="text-indigo-600 font-black text-3xl mt-2">{selectedProduct.stock}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Saldo Atual</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setStockUpdate({ ...stockUpdate, type: 'IN' })}
                  className={`py-2 text-xs font-bold uppercase rounded-md transition-all ${stockUpdate.type === 'IN' ? 'bg-white shadow text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Entrada (+)
                </button>
                <button
                  onClick={() => setStockUpdate({ ...stockUpdate, type: 'OUT' })}
                  className={`py-2 text-xs font-bold uppercase rounded-md transition-all ${stockUpdate.type === 'OUT' ? 'bg-white shadow text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Saída (-)
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Quantidade do Ajuste</label>
                <input
                  type="number"
                  autoFocus
                  className="w-full p-3 border-2 border-indigo-100 focus:border-indigo-500 rounded-xl text-center font-black text-2xl outline-none text-slate-800"
                  value={stockUpdate.quantity}
                  onChange={e => setStockUpdate({ ...stockUpdate, quantity: Number(e.target.value) })}
                />
              </div>

              <button onClick={handleUpdateStock} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm uppercase tracking-wide hover:bg-black transition-all">
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Produto */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Editar Produto</h3>
              <button onClick={() => setShowEditModal(false)}><X size={20} className="text-slate-400 hover:text-rose-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Nome do Produto</label>
                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Preço Venda</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.preco} onChange={e => setEditForm({ ...editForm, preco: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Estoque Mínimo (Alerta)</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.estoque_minimo} onChange={e => setEditForm({ ...editForm, estoque_minimo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">SKU</label>
                  <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Categoria</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.categoria} onChange={e => setEditForm({ ...editForm, categoria: e.target.value })}>
                    <option>Geral</option>
                    <option>Papelaria</option>
                    <option>Têxtil</option>
                    <option>Insumos</option>
                    <option>Gráfica</option>
                    <option>Estamparia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Modelo Negócio</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg text-[10px] font-bold" value={editForm.modeloNegocio} onChange={e => setEditForm({ ...editForm, modeloNegocio: e.target.value })}>
                    <option value="VAREJO">Varejo</option>
                    <option value="PRODUCAO">Produção</option>
                    <option value="ACESSORIOS">Acessórios</option>
                    <option value="PAPELARIA">Papelaria</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Tempo Prod (min)</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.tempoProducao} onChange={e => setEditForm({ ...editForm, tempoProducao: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Desperdício (%)</label>
                  <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold" value={editForm.desperdicioMedio} onChange={e => setEditForm({ ...editForm, desperdicioMedio: e.target.value })} />
                </div>
              </div>
              <button onClick={handleEditProduct} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg text-sm uppercase tracking-wide hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                <Save size={16} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-right-10 flex items-center gap-2 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {toast.type === 'success' ? <div className="p-1 bg-white/20 rounded-full"><Save size={12} /></div> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Inventory;
