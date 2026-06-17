/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Search, Plus, Check, X, Calendar, 
  ChevronRight, AlertTriangle, MessageSquare, ArrowRight,
  User, Shirt, CheckCircle2, RefreshCw, Trash2, HelpCircle,
  Clock, DollarSign, LayoutList, ClipboardCopy, Send
} from 'lucide-react';
import { 
  Suitcase, SuitcaseStatus, SuitcaseItem, SuitcaseItemStatus, 
  Customer, Product, ProductCategory, PaymentMethod 
} from '../types';

interface SuitcasesProps {
  suitcases: Suitcase[];
  customers: Customer[];
  products: Product[];
  onRefresh: () => void;
  openNewSuitcaseImmediately?: boolean;
}

export default function Suitcases({
  suitcases,
  customers,
  products,
  onRefresh,
  openNewSuitcaseImmediately = false
}: SuitcasesProps) {

  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'create'>('open');
  
  // Creation States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [suitcaseItems, setSuitcaseItems] = useState<Product[]>([]);
  const [dateSent, setDateSent] = useState(new Date().toISOString().split('T')[0]);
  const [dateReturnExpected, setDateReturnExpected] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [deliveryMethod, setDeliveryMethod] = useState('motoboy');
  const [notes, setNotes] = useState('');
  const [responsible, setResponsible] = useState('Ana Claudia');

  // Search inside suitcase form
  const [prodSearch, setProdSearch] = useState('');
  
  // Closing / Resolvendo States
  const [activeSuitcaseForClosing, setActiveSuitcaseForClosing] = useState<Suitcase | null>(null);
  const [itemStatuses, setItemStatuses] = useState<{ [itemId: string]: SuitcaseItemStatus }>({});
  const [discountVal, setDiscountVal] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [closingNotes, setClosingNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (openNewSuitcaseImmediately) {
      setActiveTab('create');
    }
  }, [openNewSuitcaseImmediately]);

  // Handle item adding to suitcase list
  const handleAddProductToSuitcase = (p: Product) => {
    if (suitcaseItems.find(item => item.id === p.id)) {
      alert('Esta peça já foi incluída na mala.');
      return;
    }
    setSuitcaseItems([...suitcaseItems, p]);
    setProdSearch('');
  };

  const handleRemoveFromNewSuitcase = (id: string) => {
    setSuitcaseItems(suitcaseItems.filter(item => item.id !== id));
  };

  // Submit suitcase creation
  const handleCreateSuitcase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Por favor selecione a cliente para envio da mala.');
      return;
    }
    if (suitcaseItems.length === 0) {
      setError('Favor selecionar pelo menos uma peça para compor a mala.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        customerId: selectedCustomerId,
        items: suitcaseItems.map(p => ({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          size: p.size,
          color: p.color,
          price: p.price
        })),
        dateSent,
        dateReturnExpected,
        deliveryMethod,
        notes,
        responsible
      };

      const response = await fetch('/api/suitcases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao registrar mala consignada.');
      }

      setSuccess('Mala Consignada enviada e despachada!');
      onRefresh();
      
      setTimeout(() => {
        setSuitcaseItems([]);
        setSelectedCustomerId('');
        setNotes('');
        setActiveTab('open');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Open the "fechamento" sheet panel
  const handleOpenClosingFlow = (sc: Suitcase) => {
    setActiveSuitcaseForClosing(sc);
    // Inicializar os estados de todos os itens como 'purchased' ou 'returned'
    const initialStates: { [key: string]: SuitcaseItemStatus } = {};
    sc.items.forEach(it => {
      initialStates[it.id] = 'returned'; // default volta para estoque de volta
    });
    setItemStatuses(initialStates);
    setDiscountVal('0');
    setPaymentMethod('pix');
    setClosingNotes('');
    setSuccess('');
    setError('');
  };

  // Submit the closing flow
  const handleCloseSuitcaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSuitcaseForClosing) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        itemsDecisions: itemStatuses,
        discount: Number(discountVal || 0),
        paymentMethod,
        notes: closingNotes,
        responsible: 'Ana Claudia'
      };

      const response = await fetch(`/api/suitcases/${activeSuitcaseForClosing.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao finalizar acerto da mala.');
      }

      setSuccess('Mala consignada resolvida e finalizada com sucesso!');
      onRefresh();

      setTimeout(() => {
        setActiveSuitcaseForClosing(null);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  // Suitcases filtering
  const openSuitcases = suitcases.filter(m => m.status !== 'finalizada' && m.status !== 'cancelada');
  const closedSuitcases = suitcases.filter(m => m.status === 'finalizada' || m.status === 'cancelada');

  // Available pieces to choose
  const availableToConsign = products.filter(p => p.status === 'disponível' && p.stock > 0 && !suitcaseItems.find(it => it.id === p.id));

  const filteredToConsign = availableToConsign.filter(p => {
    if (!prodSearch) return true;
    const term = prodSearch.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term) || p.size.toLowerCase().includes(term);
  });

  // Calculate suitcase totals potential
  const getSuitcasePotentialValue = (items: SuitcaseItem[]) => {
    return items.reduce((acc, curr) => acc + curr.price, 0);
  };

  // Get count items purchased
  const getClosingPurchasedSum = () => {
    if (!activeSuitcaseForClosing) return 0;
    return activeSuitcaseForClosing.items.reduce((acc, curr) => {
      if (itemStatuses[curr.id] === 'purchased') {
        return acc + curr.price;
      }
      return acc;
    }, 0);
  };

  const finalAcertTotal = Math.max(0, getClosingPurchasedSum() - Number(discountVal || 0));

  return (
    <div className="space-y-4 pb-20 font-sans" id="suitcases_main_view">
      
      {/* TABS CONTROLLER */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm" id="suitcase_tabs">
        <button
          onClick={() => { setActiveTab('open'); setActiveSuitcaseForClosing(null); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'open' 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Consignadas ({openSuitcases.length})
        </button>
        <button
          onClick={() => { setActiveTab('closed'); setActiveSuitcaseForClosing(null); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'closed' 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Histórico Resolvido
        </button>
        <button
          onClick={() => { setActiveTab('create'); setActiveSuitcaseForClosing(null); }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'create' 
              ? 'bg-rose-900 text-white shadow-sm' 
              : 'text-[#e11d48] hover:bg-rose-50'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Nova Mala</span>
        </button>
      </div>

      {/* 1. OPEN SUITCASES LIST */}
      {activeTab === 'open' && !activeSuitcaseForClosing && (
        <div className="space-y-3" id="open_suitcases_list">
          {openSuitcases.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-250 flex flex-col items-center justify-center space-y-3">
              <Briefcase className="h-10 w-10 text-slate-350" />
              <div>
                <p className="text-sm font-bold text-slate-800">Nenhuma mala em circulação</p>
                <p className="text-xs text-slate-500 mt-1">Toque em "Nova Mala" para preencher dados de uma cliente.</p>
              </div>
            </div>
          ) : (
            openSuitcases.map(m => {
              const potentialVal = getSuitcasePotentialValue(m.items);
              const isLate = new Date(m.dateReturnExpected).getTime() < Date.now();
              return (
                <div 
                  key={m.id}
                  onClick={() => handleOpenClosingFlow(m)}
                  className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5 cursor-pointer hover:border-purple-200 active:scale-[0.99] transition-all"
                  id={`suitcase_card_${m.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {m.code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5">{m.customerName}</h3>
                    </div>
                    {isLate ? (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase px-2 py-1 rounded-full flex items-center gap-1 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                        Atrasada
                      </span>
                    ) : (
                      <span className="bg-purple-100 text-purple-900 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Com Cliente
                      </span>
                    )}
                  </div>

                  {/* Informações detalhadas */}
                  <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Previsão Devolução</p>
                      <p className="text-slate-800 font-semibold mt-0.5">
                        {new Date(m.dateReturnExpected).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Potencial</p>
                      <p className="text-slate-900 font-extrabold mt-0.5 text-sm">
                        {potentialVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  {/* Pecas inclusas list counters */}
                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/30 flex items-center justify-between text-xs text-purple-900">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Shirt className="h-4 w-4" />
                      <span>{m.items.length} peças consignadas</span>
                    </div>
                    <span className="text-[10px] bg-white border border-purple-100 font-bold px-2 py-0.5 rounded-lg text-purple-700 flex items-center gap-0.5 whitespace-nowrap">
                      Resolver Acerto
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. CHOOSE RESOLVER CLOSING SHEET */}
      {activeSuitcaseForClosing && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md space-y-4" id="suitcase_closing_panel">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider">Acerto / Fechamento de Mala</span>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{activeSuitcaseForClosing.customerName}</h2>
              <span className="font-mono text-xs font-bold text-slate-400">Código: {activeSuitcaseForClosing.code}</span>
            </div>
            <button 
              onClick={() => setActiveSuitcaseForClosing(null)}
              className="p-1 px-2.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Voltar
            </button>
          </div>

          {/* Form resolver action */}
          <form onSubmit={handleCloseSuitcaseSubmit} className="space-y-4">
            {error && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-xs font-bold text-rose-700 rounded-xl">{error}</div>}
            {success && <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-bold text-emerald-700 rounded-xl">{success}</div>}

            <span className="text-xs font-bold text-slate-700 block pl-0.5">Defina o destino de cada peça:</span>
            
            {/* ITEM BY ITEM STATUS TOGGLERS */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1" id="closing_items_deck">
              {activeSuitcaseForClosing.items.map((item) => {
                const isSelected = itemStatuses[item.id];
                return (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-800">{item.productName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku} | Tam: {item.size} • Cor: {item.color}</p>
                      </div>
                      <span className="font-bold text-slate-700 font-mono">
                        {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    {/* Decision row targets button block */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setItemStatuses({ ...itemStatuses, [item.id]: 'purchased' })}
                        className={`py-2 px-2.5 border rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          isSelected === 'purchased'
                            ? 'bg-emerald-600 text-white border-transparent'
                            : 'bg-white text-emerald-800 border-emerald-100 hover:bg-emerald-50/20'
                        }`}
                      >
                        Comprado ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemStatuses({ ...itemStatuses, [item.id]: 'returned' })}
                        className={`py-2 px-2.5 border rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          isSelected === 'returned'
                            ? 'bg-slate-900 text-white border-transparent'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Devolvido
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemStatuses({ ...itemStatuses, [item.id]: 'damaged' })}
                        className={`py-2 px-2.5 border rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          isSelected === 'damaged'
                            ? 'bg-amber-600 text-white border-transparent'
                            : 'bg-white text-amber-800 border-amber-150 hover:bg-amber-50/20'
                        }`}
                      >
                        Avariado ⚠️
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemStatuses({ ...itemStatuses, [item.id]: 'missing' })}
                        className={`py-2 px-2.5 border rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          isSelected === 'missing'
                            ? 'bg-rose-900 text-white border-transparent'
                            : 'bg-white text-rose-800 border-rose-150 hover:bg-rose-50/20'
                        }`}
                      >
                        Não Retornou
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FINANCE OUTCOMES IF PIECES PURCHASED */}
            {getClosingPurchasedSum() > 0 && (
              <div className="bg-purple-50 p-4 border border-purple-100 rounded-2xl space-y-3 animate-fade-in" id="suitcase_closing_financials">
                <span className="text-[10px] font-bold text-purple-900 uppercase tracking-widest block">Acerto Financeiro das Peças Compradas</span>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Desconto */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Desconto R$</label>
                    <input
                      type="number"
                      min="0"
                      value={discountVal}
                      onChange={(e) => setDiscountVal(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Forma de Pagamento</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="link_pagamento">Link de Pagamento</option>
                    </select>
                  </div>
                </div>

                {/* Resumo Invoice */}
                <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Total Comprado (Bruto)</span>
                    <span>{getClosingPurchasedSum().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  {Number(discountVal) > 0 && (
                    <div className="flex justify-between items-center text-xs text-rose-300">
                      <span>Desconto Especial</span>
                      <span>-{Number(discountVal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-750 pt-1.5 flex justify-between items-center text-xs font-bold text-white">
                    <span>Faturamento Líquido</span>
                    <span className="text-sm text-emerald-400 font-extrabold">{finalAcertTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Obs adicionais do acerto */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Anotações do Acerto / Devolução</label>
              <input
                type="text"
                placeholder="Ex: Devolveu sacola limpa e gostou muito do caimento."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e11d48] border border-[#e11d48] hover:bg-rose-700 text-sm font-bold text-white py-3.5 rounded-xl shadow-md transition-colors mt-2"
              id="suitcase_close_btn"
            >
              {loading ? 'Processando Acerto...' : 'Processar & Fechar Mala'}
            </button>
          </form>
        </div>
      )}

      {/* 3. CLOSED HISTORY LIST */}
      {activeTab === 'closed' && (
        <div className="space-y-3" id="closed_suitcases_list">
          {closedSuitcases.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-250 flex flex-col items-center justify-center space-y-3">
              <Briefcase className="h-10 w-10 text-slate-350" />
              <p className="text-xs text-slate-400 italic">Nenhuma mala consignada do histórico encontrada.</p>
            </div>
          ) : (
            closedSuitcases.map(m => (
              <div 
                key={m.id}
                className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/50 space-y-1.5"
                id={`closed_suitcase_${m.id}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    {m.code}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full">
                    Resolvida ✓
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">{m.customerName}</h3>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-100/30">
                  <span>Enviada: {new Date(m.dateSent).toLocaleDateString('pt-BR')}</span>
                  <span>Devolvida: {m.dateReturnActual ? new Date(m.dateReturnActual).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
                <p className="text-xs text-slate-500 italic mt-1 font-semibold">"{m.notes}"</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* 4. NEW SUITCASE CREATION TAB FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateSuitcase} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4" id="suitcase_create_form">
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-2">Separar Nova Mala Consignada</span>

          {error && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-xs font-bold text-rose-700 rounded-xl">{error}</div>}
          {success && <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-bold text-emerald-700 rounded-xl">{success}</div>}

          {/* Escolher Cliente */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Selecionar Cliente Destinatário *</label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="">-- Escolha a cliente --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.whatsapp})</option>
              ))}
            </select>
          </div>

          {/* Selecionar e Adicionar Peças */}
          <div className="space-y-1.5" id="suitcase_items_selector_box">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Adicionar Roupas à Mala *</label>
            <input 
              type="text"
              placeholder="Buscar roupas por nome ou SKU..."
              value={prodSearch}
              onChange={(e) => setProdSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e11d48]"
            />

            {/* Suggestions drawer */}
            {prodSearch && (
              <div className="bg-white border border-slate-150 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-50 relative z-10 w-full" id="suitcase_suggestions_dropdown">
                {filteredToConsign.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 text-center">Nenhuma peça livre disponível.</p>
                ) : (
                  filteredToConsign.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleAddProductToSuitcase(p)}
                      className="p-3 text-xs cursor-pointer hover:bg-slate-50 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p.name} [{p.size}]</span>
                        <p className="text-[10px] text-slate-400">Cor: {p.color} | SKU: {p.sku}</p>
                      </div>
                      <span className="font-extrabold text-slate-700">
                        {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected garments deck */}
            <div className="space-y-1.5 pt-1">
              {suitcaseItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center select-none">Mala sem peças selecionadas.</p>
              ) : (
                suitcaseItems.map(item => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-slate-800">{item.name}</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sku} [Tam: {item.size}]</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveFromNewSuitcase(item.id)}
                      className="text-xs text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded"
                    >
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3.5 pt-1.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Data de Envio</label>
              <input
                type="date"
                required
                value={dateSent}
                onChange={(e) => setDateSent(e.target.value)}
                className="w-full px-2.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Prazo Devolução *</label>
              <input
                type="date"
                required
                value={dateReturnExpected}
                onChange={(e) => setDateReturnExpected(e.target.value)}
                className="w-full px-2.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Método Envio */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Forma de Despacho</label>
              <select
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full px-2.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="motoboy">Motoboy Express</option>
                <option value="entrega_local">Carro Motorista</option>
                <option value="retirada">Retirada em Mãos</option>
                <option value="correios">Correios PAC</option>
              </select>
            </div>

            {/* Obs */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Observações Mala</label>
              <input
                type="text"
                placeholder="Ex: Levar Cabides, Brindes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Botao Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e11d48] border border-[#e11d48] hover:bg-rose-700 font-bold text-sm text-white py-3.5 rounded-xl transition-colors shadow-sm duration-100"
            id="suitcase_submit_btn"
          >
            {loading ? 'Enviando e deduzindo estoque...' : 'Gerar & Despachar Consignado ✓'}
          </button>
        </form>
      )}

    </div>
  );
}
