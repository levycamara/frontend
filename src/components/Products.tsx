/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Shirt, Search, Filter, Plus, Edit2, Trash, 
  ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Eye, RefreshCw, Layers, CheckCircle 
} from 'lucide-react';
import { Product, ProductCategory, ProductStatus, StockMovement, Category } from '../types';

interface ProductsProps {
  products: Product[];
  onRefresh: () => void;
  openNewProductImmediately?: boolean;
  searchFilterImmediately?: string;
  lowStockImmediately?: boolean;
}

const STATUSES: { label: string; value: ProductStatus }[] = [
  { label: 'Disponível', value: 'disponível' },
  { label: 'Reservado', value: 'reservado' },
  { label: 'Vendido', value: 'vendido' },
  { label: 'Em Mala', value: 'em mala' },
  { label: 'Devolvido', value: 'devolvido' },
  { label: 'Avariado', value: 'avariado' },
  { label: 'Indisponível', value: 'indisponível' }
];

export default function Products({ 
  products, 
  onRefresh, 
  openNewProductImmediately = false,
  searchFilterImmediately = '',
  lowStockImmediately = false
}: ProductsProps) {
  
  // Dynamic Categories states & actions
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !category) {
          setCategory(data[0].name);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatName.trim()) {
      setCatError('O nome da categoria é obrigatório.');
      return;
    }
    setCatError('');
    setCatSuccess('');
    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
      const method = editingCat ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      if (res.ok) {
        setCatSuccess(editingCat ? 'Categoria atualizada!' : 'Categoria criada!');
        setNewCatName('');
        setEditingCat(null);
        await fetchCategories();
        onRefresh();
      } else {
        const errData = await res.json();
        setCatError(errData.error || 'Erro ao salvar categoria.');
      }
    } catch (err: any) {
      setCatError('Erro de conexão: ' + err.message);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const confirmDelete = window.confirm('Deseja realmente excluir esta categoria?');
    if (!confirmDelete) return;
    setCatError('');
    setCatSuccess('');
    try {
      const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
      if (res.ok) {
        setCatSuccess('Categoria excluída!');
        await fetchCategories();
        onRefresh();
      } else {
        const errData = await res.json();
        setCatError(errData.error || 'Erro ao excluir categoria.');
      }
    } catch (err: any) {
      setCatError('Erro ao conectar: ' + err.message);
    }
  };

  // State variables
  const [searchTerm, setSearchTerm] = useState(searchFilterImmediately);
  const [selectedCategory, setSelectedCategory] = useState<string | 'todos'>('todos');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'todos'>('todos');
  const [isFormOpen, setIsFormOpen] = useState(openNewProductImmediately);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  
  // Edit mode vs Creation
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>('');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('0');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('1');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ProductStatus>('disponível');

  // Multi-varieties for fast registration of multiple sizes (bulkSizes)
  const [useBulkSizes, setUseBulkSizes] = useState(false);
  const [bulkSizesList, setBulkSizesList] = useState<string[]>([]);
  const sizeOptions = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'único'];

  // Movement log modal items
  const [activeProductForMovements, setActiveProductForMovements] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Manual stock movement quick-form fields
  const [fastMoveQty, setFastMoveQty] = useState('1');
  const [fastMoveType, setFastMoveType] = useState<'entrada_manual' | 'ajuste' | 'perda_avaria'>('entrada_manual');
  const [fastMoveReason, setFastMoveReason] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle outside entry filters
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchFilterImmediately) {
      setSearchTerm(searchFilterImmediately);
    }
    if (openNewProductImmediately) {
      openCreateForm();
    }
  }, [searchFilterImmediately, openNewProductImmediately]);

  // Open creation form
  const openCreateForm = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategory(categories.length > 0 ? categories[0].name : 'Vestido');
    setSize('M');
    setColor('');
    setBrand('');
    setCost('0');
    setPrice('0');
    setStock('1');
    setImage('');
    setDescription('');
    setNotes('');
    setStatus('disponível');
    setUseBulkSizes(false);
    setBulkSizesList([]);
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  // Open edit form
  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setSize(product.size);
    setColor(product.color);
    setBrand(product.brand || '');
    setCost(product.cost.toString());
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setImage(product.images[0] || '');
    setDescription(product.description || '');
    setNotes(product.notes || '');
    setStatus(product.status);
    setUseBulkSizes(false);
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  // Toggle size selection for bulk sizes
  const handleToggleBulkSizeValue = (sz: string) => {
    if (bulkSizesList.includes(sz)) {
      setBulkSizesList(bulkSizesList.filter(s => s !== sz));
    } else {
      setBulkSizesList([...bulkSizesList, sz]);
    }
  };

  // Save product (Insert or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || Number(price) <= 0) {
      setError('Por favor preencha o nome do produto e preço de venda.');
      return;
    }

    if (useBulkSizes && bulkSizesList.length === 0) {
      setError('Por favor selecione pelo menos um tamanho para o cadastro em massa.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Usar imagem padrão fashion caso o campo esteja vazio
      let resolvedImage = image.trim();
      if (!resolvedImage) {
        resolvedImage = `https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`;
      }

      const payload: any = {
        id: editingProduct ? editingProduct.id : undefined,
        name,
        category,
        size: useBulkSizes ? '' : size,
        color,
        brand,
        cost: Number(cost),
        price: Number(price),
        stock: Number(stock),
        images: [resolvedImage],
        description,
        notes,
        status,
        sku: editingProduct ? editingProduct.sku : undefined
      };

      if (!editingProduct && useBulkSizes) {
        payload.bulkSizes = bulkSizesList;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao salvar produto.');
      }

      setSuccess(editingProduct ? 'Produto atualizado com sucesso!' : 'Novo(s) produto(s) cadastrado(s) com sucesso!');
      onRefresh();

      setTimeout(() => {
        setIsFormOpen(false);
        setEditingProduct(null);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Delete product (archive)
  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Tem certeza que deseja arquivar a peça "${product.name}"? O estoque será zerado.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setSuccess('Produto arquivado!');
        onRefresh();
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const errData = await response.json();
        alert(errData.error || 'Erro ao arquivar produto.');
      }
    } catch {
      alert('Erro ao conectar com servidor.');
    }
  };

  // Fetch stock movements for modal
  const viewProductMovements = async (product: Product) => {
    setActiveProductForMovements(product);
    setIsMovementModalOpen(true);
    setLoadingMovements(true);
    try {
      const response = await fetch(`/api/products/${product.id}/movements`);
      if (response.ok) {
        const data = await response.json();
        // Ordenar do mais novo para o mais antigo
        data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMovements(data);
      }
    } catch {
      console.error('Incapaz de carregar movimentações.');
    } finally {
      setLoadingMovements(false);
    }
  };

  // Execute quick stock movement inside modal
  const handleFastMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProductForMovements || Number(fastMoveQty) <= 0) return;

    try {
      const response = await fetch('/api/stock/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: activeProductForMovements.id,
          qty: Number(fastMoveQty),
          type: fastMoveType,
          reason: fastMoveReason || "Acerto manual no histórico",
          user: "Ana Claudia"
        })
      });

      if (response.ok) {
        setFastMoveReason('');
        setFastMoveQty('1');
        // Recarregar os movimentos e atualizar produtos
        viewProductMovements(activeProductForMovements);
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao salvar movimento.');
      }
    } catch {
      alert('Erro de conexão com o servidor.');
    }
  };

  // Helper colors for badges
  const getStatusColor = (st: ProductStatus) => {
    switch (st) {
      case 'disponível': return 'bg-emerald-100 text-emerald-800';
      case 'reservado': return 'bg-amber-100 text-amber-800';
      case 'vendido': return 'bg-rose-100 text-rose-800';
      case 'em mala': return 'bg-purple-100 text-purple-800';
      case 'devolvido': return 'bg-blue-100 text-blue-800';
      case 'avariado': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // Helper movement descriptions
  const translateMvtType = (tp: string) => {
    switch (tp) {
      case 'entrada_manual': return { label: 'Entrada Manual', icon: <ArrowUpRight className="h-3 w-3 text-emerald-500" /> };
      case 'venda': return { label: 'Venda', icon: <ArrowDownRight className="h-3 w-3 text-rose-500" /> };
      case 'reserva': return { label: 'Reserva', icon: <ArrowDownRight className="h-3 w-3 text-amber-500" /> };
      case 'envio_mala': return { label: 'Envio Consignado', icon: <ArrowDownRight className="h-3 w-3 text-purple-500" /> };
      case 'retorno_mala': return { label: 'Devolução Consignado', icon: <ArrowUpRight className="h-3 w-3 text-emerald-500" /> };
      case 'devolução': return { label: 'Devolução de Venda', icon: <ArrowUpRight className="h-3 w-3 text-teal-500" /> };
      case 'ajuste': return { label: 'Ajuste Geral', icon: <RefreshCw className="h-3 w-3 text-blue-500" /> };
      case 'perda_avaria': return { label: 'Perda/Avaria', icon: <ArrowDownRight className="h-3 w-3 text-red-500" /> };
      default: return { label: 'Outro', icon: <HelpCircle className="h-3 w-3 text-slate-500" /> };
    }
  };

  // Filters calculation
  const filteredProducts = products.filter(p => {
    const pName = p.name.toLowerCase();
    const pSku = p.sku.toLowerCase();
    const pColor = p.color ? p.color.toLowerCase() : '';
    const pSize = p.size ? p.size.toLowerCase() : '';
    const matchesSearch = pName.includes(searchTerm.toLowerCase()) || 
                          pSku.includes(searchTerm.toLowerCase()) ||
                          pColor.includes(searchTerm.toLowerCase()) ||
                          pSize.includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'todos' || 
      (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesStatus = selectedStatus === 'todos' || p.status === selectedStatus;
    
    // Filtro especial para estoque baixo vindo do painel principal
    const matchesLowStock = !lowStockImmediately || (p.stock < 3 && p.status === 'disponível');

    return matchesSearch && matchesCategory && matchesStatus && matchesLowStock;
  });

  return (
    <div className="space-y-4 pb-20 font-sans" id="products_view_container">
      
      {/* HEADER SECTION WITH QUICK BUTTON */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="products_header">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Estoque de Peças</h1>
          <p className="text-xs text-slate-400 font-medium">Cadastre, localize e movimente peças do catálogo</p>
        </div>
        <button
          id="btn_add_product_top"
          onClick={openCreateForm}
          className="bg-slate-900 border border-slate-950 hover:bg-slate-800 transition-colors text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center gap-1 shadow-sm px-4.5 py-3"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar</span>
        </button>
      </div>

      {/* FILTER SHEET & SEARCH BAR - ALWAYS VISIBLE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3" id="product_filters_bar">
        {/* Search input field */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            id="product_search_input"
            type="text"
            placeholder="Buscar por peça, SKU, tamanho ou cor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:border-transparent transition-all shadow-sm"
          />
        </div>

        {/* Categories selector track - Horizontal scrolling for great small screen feel */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center pl-1 pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtrar Categoria</span>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 transition-colors"
              type="button"
            >
              <Edit2 className="h-2.5 w-2.5" />
              Gerenciar Categorias
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="category_scroll_filters">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`text-xs px-3.5 py-2 rounded-xl border font-semibold whitespace-nowrap transition-colors duration-100 ${
                selectedCategory === 'todos' 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`text-xs px-3.5 py-2 rounded-xl border font-semibold whitespace-nowrap transition-colors duration-100 ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase() 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Selector track */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Filtrar Status</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="status_scroll_filters">
            <button
              onClick={() => setSelectedStatus('todos')}
              className={`text-xs px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap transition-colors duration-100 ${
                selectedStatus === 'todos' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
              }`}
            >
              Todos
            </button>
            {STATUSES.map((st) => (
              <button
                key={st.value}
                onClick={() => setSelectedStatus(st.value)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold whitespace-nowrap transition-colors duration-100 ${
                  selectedStatus === st.value 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCT LIST (MOBILE DECK) */}
      <div className="space-y-2.5" id="product_items_deck">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs text-slate-400">Total: <b>{filteredProducts.length}</b> peças localizadas</span>
          {lowStockImmediately && <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Estoque Mínimo</span>}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-250 flex flex-col items-center justify-center space-y-3" id="blank_product_state">
            <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
              <Shirt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Nenhum produto correspondente</p>
              <p className="text-xs text-slate-500 mt-1">Experimente alterar os filtros de categoria ou termo de busca.</p>
            </div>
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div 
              key={p.id}
              className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4.5"
              id={`product_card_${p.id}`}
            >
              {/* Product mini avatar */}
              <div className="relative">
                <img 
                  src={p.images[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200'} 
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 rounded-xl object-cover border border-slate-100 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-md min-w-4 text-center">
                  {p.size}
                </span>
              </div>

              {/* Product Info Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#e11d48] uppercase bg-rose-50 px-1.5 py-0.5 rounded">
                    {p.category}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 font-bold max-w-[120px] truncate">
                    {p.sku}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 truncate mt-1">
                  {p.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span>Cor: <b>{p.color}</b></span>
                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                  <span>Estoque: <b className={p.stock < 3 ? "text-amber-600" : "text-slate-700"}>{p.stock} un</b></span>
                </div>
              </div>

              {/* Status and Action bar */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${getStatusColor(p.status)}`}>
                  {p.status}
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => viewProductMovements(p)}
                    title="Histórico de Estoque"
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors border border-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => openEditForm(p)}
                    title="Editar Peça"
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors border border-slate-100"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(p)}
                    title="Arquivar Peça"
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-colors border border-rose-100"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAILED FORM BOTTOM SHEET (Cadastrar / Editar) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 font-sans" id="product_form_sheet">
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header Form */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Editar Peça' : 'Cadastrar Nova Peça'}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-xs font-semibold text-rose-700 rounded">{error}</div>}
              {success && <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-semibold text-emerald-700 rounded">{success}</div>}

              {/* Nome do Produto */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome da Peça *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vestido Midi Sophia Linho"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Categoria */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria *</label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline"
                    >
                      + Nova / Editar
                    </button>
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {categories.length === 0 && <option value="">Nenhuma cadastrada</option>}
                  </select>
                </div>

                {/* Cor */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Verde Oliva, Preto, Salmon"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>
              </div>

              {/* Sizing variations (Massa vs Único) */}
              {!editingProduct && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-rose-500" />
                      <span className="text-xs font-bold text-slate-700">Pretende cadastrar vários tamanhos?</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useBulkSizes} 
                        onChange={() => setUseBulkSizes(!useBulkSizes)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#e11d48]"></div>
                    </label>
                  </div>

                  {useBulkSizes ? (
                    <div className="space-y-1.5 pt-1.5" id="bulk_sizes_selector">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Selecione os tamanhos para gerar as peças:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {sizeOptions.map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleToggleBulkSizeValue(sz)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                              bulkSizesList.includes(sz)
                                ? 'bg-[#e11d48] text-white border-transparent'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Tamanho {sz}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">Cada tamanho selecionado será gerado como uma peça no estoque, com SKUs individuais.</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-[#e11d48] uppercase tracking-wider mb-1">Tamanho da Peça Unica</label>
                      <input
                        type="text"
                        placeholder="Ex: P, M, 38, Unico"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Se for edição, mostra tamanho simples tradicional */}
              {editingProduct && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tamanho da Peça</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: P, M, G, Único"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                {/* Cost price */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Custo da Peça (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Qty Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    placeholder="1"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Civil da Peça</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProductStatus)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  >
                    {STATUSES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fotos */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Link de Foto do Produto (Uploader)</label>
                <input
                  type="text"
                  placeholder="Cole link de imagem ou deixe em branco para preencher padrão"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                <textarea
                  placeholder="Ex: Vestido longo, tecido macio, linho sintético importado."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                />
              </div>

              {/* Obs */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações Internas</label>
                <input
                  type="text"
                  placeholder="Informações para operadora..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                />
              </div>

              {/* Brand brand */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Marca (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Minha Grife, Amíssima"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                />
              </div>

              {/* Save CTAs */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e11d48] border border-[#e11d48] hover:bg-rose-700 font-semibold text-sm text-white py-3.5 rounded-xl transition-colors duration-150 shadow-sm mt-2 focus:outline-none"
              >
                {loading ? 'Salvando...' : 'Confirmar & Gravar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED STOCK LOGS SHEET (Movimentações) */}
      {isMovementModalOpen && activeProductForMovements && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 font-sans" id="product_movements_modal">
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#e11d48]">Ledger de Movimentações</span>
                <h2 className="text-sm font-extrabold text-slate-900 truncate max-w-[280px]">
                  {activeProductForMovements.name} ({activeProductForMovements.size})
                </h2>
              </div>
              <button 
                onClick={() => setIsMovementModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Quick stock actions directly inside modal */}
            <form onSubmit={handleFastMovementSubmit} className="bg-slate-50 p-4 border-b border-slate-100 grid grid-cols-1 gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-0.5">Movimentar Peça</span>
              <div className="flex gap-2 items-center">
                <input 
                  type="number"
                  min="1"
                  required
                  placeholder="Qtd"
                  value={fastMoveQty}
                  onChange={(e) => setFastMoveQty(e.target.value)}
                  className="w-16 px-2.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
                <select
                  value={fastMoveType}
                  onChange={(e) => setFastMoveType(e.target.value as any)}
                  className="flex-1 px-2.5 py-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="entrada_manual">Entrada (+)</option>
                  <option value="ajuste">Ajuste / Inventário</option>
                  <option value="perda_avaria">Perda/Avaria (-)</option>
                </select>
                <input 
                  type="text"
                  required
                  placeholder="Motivo (Ex: Recebida caixa)"
                  value={fastMoveReason}
                  onChange={(e) => setFastMoveReason(e.target.value)}
                  className="flex-[2] px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-slate-900 text-white text-xs font-semibold py-2 px-3.5 rounded-lg hover:bg-slate-800"
                >
                  Gravar
                </button>
              </div>
            </form>

            {/* Movements list scroll view */}
            <div className="p-4 overflow-y-auto flex-1 min-h-[250px]">
              {loadingMovements ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900 border-r-2 border-r-transparent"></div>
                </div>
              ) : movements.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs">Instrução de histórico vazia.</div>
              ) : (
                <div className="space-y-3">
                  {movements.map((m) => {
                    const mInfo = translateMvtType(m.type);
                    return (
                      <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shrink-0 shadow-sm">
                          {mInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-800">{mInfo.label}</span>
                            <span className="text-[10px] font-bold text-rose-600">Qtd: {m.qty} un</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 italic">"{m.reason}"</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[9px] text-slate-400">
                            <span>Surgido em: <b>{new Date(m.date).toLocaleDateString('pt-BR')}</b></span>
                            <span>•</span>
                            <span>Por: <b>{m.user}</b></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans" id="category_manager_modal">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Gerenciar Categorias</h2>
                <p className="text-[10px] text-slate-400 font-medium">Crie, edite ou exclua categorias</p>
              </div>
              <button 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCat(null);
                  setNewCatName('');
                  setCatError('');
                  setCatSuccess('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Content area */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {catError && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-xs font-semibold text-rose-700 rounded-lg">{catError}</div>}
              {catSuccess && <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-semibold text-emerald-700 rounded-lg">{catSuccess}</div>}

              {/* Form to Create/Edit */}
              <form onSubmit={handleSaveCategory} className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {editingCat ? 'Editar Categoria' : 'Nova Categoria'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vestido de Festa, Tricô"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors shrink-0"
                  >
                    {editingCat ? 'Salvar' : 'Adicionar'}
                  </button>
                  {editingCat && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(null);
                        setNewCatName('');
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-2 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      X
                    </button>
                  )}
                </div>
              </form>

              {/* List of categories */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Categorias Cadastradas ({categories.length})</span>
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1 border border-slate-100 rounded-xl bg-white">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-2.5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-850">{cat.name}</span>
                        <span className="text-[9px] font-medium text-slate-400">Slug: {cat.slug}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat(cat);
                            setNewCatName(cat.name);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs italic">Nenhuma categoria cadastrada.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
