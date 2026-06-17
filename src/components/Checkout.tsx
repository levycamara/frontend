/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Search, PlusCircle, Trash, HelpCircle, 
  CheckCircle, Percent, DollarSign, Copy, ArrowRight, 
  MessageSquare, UserPlus, Check, X, ClipboardCheck, ArrowLeft
} from 'lucide-react';
import { Product, Customer, Sale, PaymentMethod, PaymentStatus, DeliveryMethod, SaleItem } from '../types';

interface CheckoutProps {
  products: Product[];
  customers: Customer[];
  onRefresh: () => void;
  onSuccessNavigate: (view: string) => void;
}

export default function Checkout({ 
  products, 
  customers, 
  onRefresh,
  onSuccessNavigate
}: CheckoutProps) {

  // Cart State
  const [cartItems, setCartItems] = useState<Omit<SaleItem, 'id'>[]>([]);
  
  // Selection States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  // Quick Customer Creation on the fly
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerWhatsapp, setNewCustomerWhatsapp] = useState('');

  // Discount
  const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
  const [discountVal, setDiscountVal] = useState('0');

  // Checkout inputs
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pago');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('retirada');
  const [notes, setNotes] = useState('');

  // Search products inside POS
  const [productSearch, setProductSearch] = useState('');
  const [isProductListOpen, setIsProductListOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Filter available items to sell
  const activeProductsToSelect = products.filter(p => {
    const isAvail = p.status === 'disponível' && p.stock > 0;
    const term = productSearch.toLowerCase();
    return isAvail && (p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.color.toLowerCase().includes(term));
  });

  // Calculate totals
  const subtotal = cartItems.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);
  
  const discountAmount = discountType === 'value' 
    ? Number(discountVal || 0)
    : (subtotal * Number(discountVal || 0)) / 100;

  const total = Math.max(0, subtotal - discountAmount);

  // Cart modifiers
  const handleAddProductToCart = (p: Product) => {
    const existingIdx = cartItems.findIndex(item => item.productId === p.id);
    if (existingIdx > -1) {
      const updated = [...cartItems];
      if (updated[existingIdx].qty >= p.stock) {
        alert(`Estoque máximo para essa peça atingido! (${p.stock} un disponíveis)`);
        return;
      }
      updated[existingIdx].qty += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        qty: 1,
        price: p.price,
        originalPrice: p.price
      }]);
    }
    setProductSearch('');
    setIsProductListOpen(false);
  };

  const handleUpdateQty = (prodId: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.productId === prodId) {
        const prod = products.find(p => p.id === prodId)!;
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        if (newQty > prod.stock) {
          alert(`Estoque limite de ${prod.name} atingido! (${prod.stock} un)`);
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean) as Omit<SaleItem, 'id'>[];

    setCartItems(updated);
  };

  const handleRemoveFromCart = (prodId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== prodId));
  };

  // Quick customer submit
  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerWhatsapp) {
      alert('Favor digitar o Nome e WhatsApp da nova cliente.');
      return;
    }

    try {
      const payload: Partial<Customer> = {
        name: newCustomerName,
        whatsapp: newCustomerWhatsapp,
        instagram: '@',
        address: 'Cliente Consumidor Expresso',
        neighborhood: '-',
        city: '-',
        state: 'SP',
        cep: '-',
        status: 'active'
      };

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        onRefresh(); // atualizar lista de clientes global
        setSelectedCustomerId(data.id);
        setIsQuickCustomerOpen(false);
        setNewCustomerName('');
        setNewCustomerWhatsapp('');
      } else {
        const err = await response.json();
        alert(err.error || 'Erro ao salvar cliente.');
      }
    } catch {
      alert('Incapaz de conectar com o servidor.');
    }
  };

  // Checkout order submission
  const handleCheckoutSubmit = async () => {
    if (cartItems.length === 0) {
      setError('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    if (!selectedCustomerId) {
      setError('Selecione ou cadastre uma cliente para a venda.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const payload = {
        customerId: selectedCustomerId,
        customerName: customer ? customer.name : "Cliente Consumidor",
        customerWhatsapp: customer ? customer.whatsapp : "",
        items: cartItems,
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        paymentStatus,
        deliveryMethod,
        notes
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ocorreu um erro ao registrar venda.');
      }

      const orderCreated = await response.json();
      setCompletedSale(orderCreated);
      onRefresh(); // Recarrega produtos / estoque atualizados
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Generate WhatsApp summary text 
  const generateWhatsAppMessageText = (): string => {
    if (!completedSale) return '';
    const itemsText = completedSale.items.map(it => {
      return `• ${it.qty}x ${it.productName} [${it.sku}] - ${it.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
    }).join('\n');

    const discountText = completedSale.discount > 0 
      ? `\n💰 Desconto: - ${completedSale.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      : '';

    const translateDelivery = (dm: string) => {
      switch (dm) {
        case 'retirada': return 'Retirada no Closet';
        case 'motoboy': return 'Envio de Motoboy Express';
        case 'correios': return 'Postagem nos Correios';
        case 'entrega_local': return 'Entrega Local Motorista';
        case 'mala_enviada': return 'Comprado da Mala Consignada';
        default: return dm;
      }
    };

    const translatePayment = (pm: string) => {
      switch (pm) {
        case 'pix': return 'Pix Instantâneo';
        case 'dinheiro': return 'Dinheiro';
        case 'cartao_credito': return 'Cartão de Crédito';
        case 'cartao_debito': return 'Cartão de Débito';
        case 'link_pagamento': return 'Link de Pagamento';
        default: return pm;
      }
    };

    return `Olá ${completedSale.customerName}! 💖 Aqui está o resumo da sua compra no nosso Closet:\n\n` +
           `🛍️ *PEÇAS ESCOLHIDAS* 🛍️\n` +
           `${itemsText}\n\n` +
           `---------------------------------\n` +
           `Subtotal: ${completedSale.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${discountText}\n` +
           `🔥 *Total Pago: ${completedSale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n` +
           `---------------------------------\n` +
           `💳 Pagamento: ${translatePayment(completedSale.paymentMethod)} (${completedSale.paymentStatus.toUpperCase()})\n` +
           `📦 Envio: ${translateDelivery(completedSale.deliveryMethod)}\n` +
           (completedSale.notes ? `📝 Obs: ${completedSale.notes}\n` : '') +
           `\nMuito obrigada pela preferência! Adoramos vestir você! Siga nosso Instagram para novidades. 🌸🌟`;
  };

  // Copy text to clipboard 
  const handleCopyMessage = () => {
    const text = generateWhatsAppMessageText();
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  return (
    <div className="space-y-4 pb-20 font-sans" id="checkout_view_main">
      
      {/* SUCCESS SCREEN OVERLAY if checkout completed */}
      {completedSale ? (
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-md space-y-4 flex flex-col justify-center animate-fade-in" id="sale_success_panel">
          <div className="text-center space-y-2">
            <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Venda Efetuada com Sucesso!</h2>
            <p className="text-xs text-slate-500">Estoque baixado e movimentado no livro caixa automaticamente.</p>
          </div>

          {/* Resumo formatado para visualização antes de enviar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5 font-mono text-[11px] leading-relaxed relative max-w-full overflow-x-hidden select-all" id="whatsapp_text_preview">
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest mb-1 font-sans">Texto Gerado para WhatsApp</span>
            <p className="whitespace-pre-line text-slate-700">
              {generateWhatsAppMessageText()}
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleCopyMessage}
              className="w-full bg-[#16a34a] border border-[#16a34a] hover:bg-green-700 font-bold text-sm text-white py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
              id="copy_whatsapp_msg_btn"
            >
              <Copy className="h-4 w-4" />
              <span>{copiedMessage ? '✓ Copiado com Sucesso!' : 'Copiar Texto da Venda'}</span>
            </button>
            
            <a
              href={`https://api.whatsapp.com/send?phone=55${completedSale.customerWhatsapp?.replace(/\D/g, '')}&text=${encodeURIComponent(generateWhatsAppMessageText())}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-green-600 border border-green-500 font-bold text-sm text-white py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors text-center"
              id="send_whatsapp_direct_btn"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Enviar direto no WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setCompletedSale(null);
                setCartItems([]);
                setSelectedCustomerId('');
                setDiscountVal('0');
                setNotes('');
                onSuccessNavigate('inicio');
              }}
              className="mt-2 text-xs font-semibold text-slate-550 border border-slate-150 py-3 rounded-xl hover:bg-slate-50 text-center"
              id="back_to_dashboard_btn"
            >
              Ir para o Painel Inicial
            </button>
          </div>
        </div>
      ) : (
        /* NORMAL CHECKOUT INTERFACE */
        <div className="space-y-4" id="checkout_form_container">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="checkout_headline">
            <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#e11d48]" />
              Frente de Caixa (PDV)
            </h1>
            <p className="text-xs text-slate-400 font-semibold font-medium">Fluxo ultra rápido de venda direta</p>
          </div>

          {/* SELECIONAR CLIENTE */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3" id="pos_customer_section">
            <div className="flex justify-between items-center bg-slate-50/50 p-2 rounded-xl">
              <span className="text-xs font-extrabold text-slate-800 uppercase pl-1 tracking-wider">Identificar Cliente</span>
              <button
                onClick={() => setIsQuickCustomerOpen(!isQuickCustomerOpen)}
                className="text-xs font-bold text-[#e11d48] flex items-center gap-0.5"
              >
                <UserPlus className="h-4 w-4" />
                <span>Rápido +</span>
              </button>
            </div>

            {/* Quick customer creation inline drawer */}
            {isQuickCustomerOpen && (
              <form onSubmit={handleQuickCustomerSubmit} className="p-3.5 bg-rose-50/30 rounded-xl border border-rose-100 space-y-3 animate-fade-in" id="pos_quick_customer_drawer">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block">Cadastro Rápido</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    placeholder="WhatsApp"
                    value={newCustomerWhatsapp}
                    onChange={(e) => setNewCustomerWhatsapp(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => setIsQuickCustomerOpen(false)}
                    className="px-3 py-1.5 text-[10px] bg-white border border-slate-200 rounded-lg hover:bg-slate-100 font-semibold text-slate-600"
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 text-[10px] bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
                  >
                    Salvar & Selecionar
                  </button>
                </div>
              </form>
            )}

            {/* Cliente Selector dropdown */}
            {!isQuickCustomerOpen && (
              <select
                id="pos_customer_select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
              >
                <option value="">-- Escolha a Cliente para faturar --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.whatsapp})</option>
                ))}
              </select>
            )}
          </div>

          {/* BUSCAR E ADICIONAR PRODUTOS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3" id="pos_items_section">
            <span className="text-xs font-extrabold text-slate-800 uppercase pl-1 tracking-wider block">Adicionar Peças no Carrinho</span>
            
            {/* Search Input bar */}
            <div className="relative">
              <input
                id="pos_product_search_input"
                type="text"
                placeholder="Insira nome ou SKU para carregar produtos do estoque..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductListOpen(true);
                }}
                onFocus={() => setIsProductListOpen(true)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
              />
              {productSearch && (
                <button 
                  onClick={() => {
                    setProductSearch('');
                    setIsProductListOpen(false);
                  }}
                  className="absolute right-3 top-3.5 text-xs text-slate-400"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Results popup suggestions dropdown list */}
            {isProductListOpen && productSearch && (
              <div className="bg-white border border-slate-150 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-50 absolute z-10 w-[calc(100%-2rem)] max-w-sm" id="pos_suggestions_dropdown">
                {activeProductsToSelect.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">Nenhum produto disponível em estoque.</div>
                ) : (
                  activeProductsToSelect.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleAddProductToCart(p)}
                      className="p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{p.name} <span className="text-rose-500">[{p.size}]</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Cor: {p.color} | SKU: {p.sku} | Restam: {p.stock} un</p>
                      </div>
                      <span className="font-extrabold text-slate-700 font-mono">
                        {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SHOPPING CART LIST ITEM LOGS */}
            <div className="space-y-2.5 pt-2" id="pos_cart_box">
              {cartItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl select-none" id="blank_cart_state">
                  Carrinho de Vendas Vazio. Adicione peças acima.
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Itens Escolhidos</span>
                  {cartItems.map((item, idx) => (
                    <div 
                      key={`${item.productId}-${idx}`} 
                      className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      id={`cart_row_${item.productId}`}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{item.productName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku}</p>
                      </div>

                      {/* Quantity modifiers */}
                      <div className="flex items-center gap-2 border border-slate-200/50 bg-white px-2 py-1 rounded-lg">
                        <button 
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          className="text-xs text-slate-500 font-semibold px-1 focus:outline-none"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-slate-800">{item.qty}</span>
                        <button 
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          className="text-xs text-slate-500 font-semibold px-1 focus:outline-none"
                        >
                          +
                        </button>
                      </div>

                      {/* Price target */}
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-slate-800 font-mono">
                          {(item.price * item.qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>

                      <button 
                        onClick={() => handleRemoveFromCart(item.productId)}
                        className="text-rose-500 p-1.5 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 focus:outline-none shrink-0"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DESCONTO E FORMA FINANCEIRA */}
          {cartItems.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3" id="pos_pricing_finance">
              
              {/* Discount selection row */}
              <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Aplicar Desconto</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDiscountType('value')}
                    className={`px-2 py-1 rounded-md transition-colors ${discountType === 'value' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    R$
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-1 rounded-md transition-colors ${discountType === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    %
                  </button>
                </div>
              </div>

              {/* Discount Input field */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
                <span className="text-xs text-slate-400">
                  {discountType === 'value' ? 'reais aplicados' : 'por cento calculados sobre o total'}
                </span>
              </div>

              {/* Pagamento e Entrega */}
              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-50">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="pix">Pix Instantâneo</option>
                    <option value="dinheiro">Dinheiro vivo</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="link_pagamento">Link de Pagamento</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="outro">Outro método</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Pagamento</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="pago">Pago / Resolvido</option>
                    <option value="pendente">Pendente / Fiado</option>
                    <option value="parcial">Sinal / Parcial</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forma de Envio</label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="retirada">Retirada no Ateliê</option>
                    <option value="motoboy">Motoboy Express</option>
                    <option value="entrega_local">Carro / Entrega Local</option>
                    <option value="correios">Correios PAC/Sedex</option>
                    <option value="transportadora">Transportadora Privada</option>
                    <option value="mala_enviada">Comprado de Mala</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notas Administrativas</label>
                  <input
                    type="text"
                    placeholder="Ex: Entregar após as 18h..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* OUTLINE SUM TOTAL BILL CARD */}
              <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-2 mt-4 shadow-sm" id="pos_invoice_card">
                <div className="flex justify-between items-center text-xs text-slate-350">
                  <span>Subtotal</span>
                  <span className="font-mono">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-300">
                    <span>Desconto Aplicado</span>
                    <span className="font-mono font-bold">-{discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                )}
                <div className="border-t border-slate-750 pt-2.5 flex justify-between items-center">
                  <span className="text-sm font-bold">Total Final</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-400">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {error && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-xs font-bold text-rose-700 rounded-xl">{error}</div>}

              {/* CTAS TO SUBMIT */}
              <button
                type="button"
                onClick={handleCheckoutSubmit}
                disabled={loading}
                className="w-full bg-[#e11d48] border border-[#e11d48] hover:bg-rose-700 text-sm font-bold text-white py-4 rounded-xl shadow-md transition-colors duration-150 mt-4 outline-none"
                id="pos_commit_checkout_btn"
              >
                {loading ? 'Faturando Pedido...' : 'Concluir Venda & Gerar Whatsapp ✓'}
              </button>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
