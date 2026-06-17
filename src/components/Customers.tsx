/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Edit2, Trash, Eye, 
  ShoppingBag, Briefcase, DollarSign, Instagram, 
  MessageSquare, Sliders, ChevronDown, CheckCircle, 
  MapPin, Clock, ShieldAlert
} from 'lucide-react';
import { Customer, CustomerStatus, Sale, Suitcase } from '../types';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  suitcases: Suitcase[];
  onRefresh: () => void;
  openNewCustomerImmediately?: boolean;
}

export default function Customers({ 
  customers, 
  sales, 
  suitcases, 
  onRefresh,
  openNewCustomerImmediately = false
}: CustomersProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(openNewCustomerImmediately);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerViewOpen, setIsCustomerViewOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Field states
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [cep, setCep] = useState('');
  const [notes, setNotes] = useState('');
  const [stylePreferences, setStylePreferences] = useState('');
  const [sizesUsed, setSizesUsed] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (openNewCustomerImmediately) {
      openCreateForm();
    }
  }, [openNewCustomerImmediately]);

  const openCreateForm = () => {
    setEditingCustomer(null);
    setName('');
    setWhatsapp('');
    setInstagram('');
    setEmail('');
    setCpf('');
    setAddress('');
    setNeighborhood('');
    setCity('');
    setState('SP');
    setCep('');
    setNotes('');
    setStylePreferences('');
    setSizesUsed('');
    setStatus('active');
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  const openEditForm = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar abrir visualização de detalhes ao mesmo tempo
    setEditingCustomer(customer);
    setName(customer.name);
    setWhatsapp(customer.whatsapp);
    setInstagram(customer.instagram);
    setEmail(customer.email || '');
    setCpf(customer.cpf || '');
    setAddress(customer.address);
    setNeighborhood(customer.neighborhood);
    setCity(customer.city);
    setState(customer.state);
    setCep(customer.cep);
    setNotes(customer.notes || '');
    setStylePreferences(customer.stylePreferences || '');
    setSizesUsed(customer.sizesUsed || '');
    setStatus(customer.status);
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) {
      setError('Por favor preencha Nome e WhatsApp.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: Customer = {
        id: editingCustomer ? editingCustomer.id : `c_${Math.random().toString(36).substring(2, 9)}`,
        name,
        whatsapp,
        instagram: instagram.startsWith('@') ? instagram : (instagram ? `@${instagram}` : '@'),
        email,
        cpf,
        address,
        neighborhood,
        city,
        state,
        cep,
        notes,
        stylePreferences,
        sizesUsed,
        status,
        createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString()
      };

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao registrar cliente.');
      }

      setSuccess(editingCustomer ? 'Cadastro atualizado com sucesso!' : 'Novo cliente cadastrado com sucesso!');
      onRefresh();
      
      setTimeout(() => {
        setIsFormOpen(false);
        setEditingCustomer(null);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleInactivateCustomer = async (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Inativar cadastro do cliente: ${customer.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Cadastro de cliente inativado!');
        onRefresh();
      }
    } catch {
      alert('Incapaz de inativar cliente.');
    }
  };

  const viewCustomerProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerViewOpen(true);
  };

  // Filtragem
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.whatsapp.toLowerCase().includes(term) ||
      c.instagram.toLowerCase().includes(term)
    );
  });

  // Auxiliares para o Perfil selecionado
  const getCustomerSales = (custId: string) => {
    return sales.filter(s => s.customerId === custId);
  };

  const getCustomerSuitcases = (custId: string) => {
    return suitcases.filter(m => m.customerId === custId);
  };

  return (
    <div className="space-y-4 pb-20 font-sans" id="customers_view_main">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="customer_header">
        <div>
          <h1 className="text-xl font-bold text-slate-950">Meus Clientes</h1>
          <p className="text-xs text-slate-400 font-medium font-semibold">Consulte perfis, compras e malas enviadas</p>
        </div>
        <button
          id="btn_add_customer_top"
          onClick={openCreateForm}
          className="bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-950 text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center gap-1 shadow-sm px-4.5 py-3"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar</span>
        </button>
      </div>

      {/* SEARCH AND CONTROL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="customer_search_bar">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            id="customer_search_input"
            type="text"
            placeholder="Buscar por nome, WhatsApp ou Instagram..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e11d48] focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* CUSTOMER MOBILE CARD LIST */}
      <div className="space-y-2.5" id="customer_card_list">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-250 flex flex-col items-center justify-center space-y-3" id="blank_customer_state">
            <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Nenhum cliente localizado</p>
              <p className="text-xs text-slate-500 mt-1">Toque no botão superior para cadastrar um novo cliente.</p>
            </div>
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div 
              key={c.id}
              onClick={() => viewCustomerProfile(c)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-rose-100 transition-all active:scale-[0.99]"
              id={`customer_card_${c.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{c.name}</h3>
                  {c.status === 'blocked' && (
                    <span className="text-[8px] bg-red-100 text-red-800 font-extrabold uppercase px-1.5 py-0.5 rounded">Bloqueado</span>
                  )}
                  {c.status === 'inactive' && (
                    <span className="text-[8px] bg-slate-100 text-slate-500 font-extrabold uppercase px-1.5 py-0.5 rounded">Inativo</span>
                  )}
                </div>
                
                {/* Instagram handle + WhatsApp */}
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <div className="flex items-center gap-0.5 font-medium text-purple-600">
                    <Instagram className="h-3 w-3" />
                    <span>{c.instagram || '@'}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-emerald-600 font-medium">
                    <MessageSquare className="h-3 w-3" />
                    <span>{c.whatsapp}</span>
                  </div>
                </div>

                {/* Relational aggregates spent */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-2">
                  <div>Comprado: <span className="text-slate-800 font-bold">{(c.totalSpent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                  <div className="h-1.5 w-1.5 bg-slate-250 rounded-full" />
                  <div>Frequência: <span className="text-slate-800 font-bold">{c.purchaseCount || 0} compras</span></div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-1 border-l border-slate-50 pl-3 shrink-0">
                <button 
                  onClick={(e) => openEditForm(c, e)}
                  title="Editar dados"
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-colors border border-slate-105"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={(e) => handleInactivateCustomer(c, e)}
                  title="Inativar"
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-colors border border-rose-105"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CUSTOMER DETAILED PROFILE SHEET (Visualizar) */}
      {isCustomerViewOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 font-sans" id="customer_profile_sheet">
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-600">Perfil Premium de Cliente</span>
                <h2 className="text-base font-extrabold text-slate-900">{selectedCustomer.name}</h2>
              </div>
              <button 
                onClick={() => setIsCustomerViewOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
              
              {/* Contatos rapidos */}
              <div className="grid grid-cols-2 gap-3.5">
                <a 
                  href={`https://wa.me/55${selectedCustomer.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 border border-emerald-100 text-[#16a34a] font-semibold text-xs rounded-xl bg-emerald-50/20 hover:bg-emerald-50 transition-all shadow-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  Abrir Conversa WhatsApp
                </a>
                <a 
                  href={`https://instagram.com/${selectedCustomer.instagram.replace('@', '')}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 p-3 border border-purple-100 text-purple-700 font-semibold text-xs rounded-xl bg-purple-50/20 hover:bg-purple-50 transition-all shadow-xs"
                >
                  <Instagram className="h-4 w-4" />
                  Ver Instagram
                </a>
              </div>

              {/* Informações de Faturamento acumulado */}
              <div className="bg-slate-900 rounded-2xl p-4.5 text-white shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-350 tracking-wider uppercase font-semibold">Gasto Total Acumulado</span>
                  <h3 className="text-xl font-bold mt-0.5">
                    {(selectedCustomer.totalSpent || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </h3>
                </div>
                <div className="text-right border-l border-slate-700 pl-4">
                  <span className="text-[10px] text-slate-350 tracking-wider uppercase font-semibold">Pedidos Pagos</span>
                  <h3 className="text-xl font-bold mt-0.5">{selectedCustomer.purchaseCount || 0}</h3>
                </div>
              </div>

              {/* Preferências e Tamanhos estilo bento */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tamanhos Usados</span>
                  <p className="font-extrabold text-slate-800">{selectedCustomer.sizesUsed || "Não especificado"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Gostos / Preferências</span>
                  <p className="font-extrabold text-slate-800">{selectedCustomer.stylePreferences || "Não especificado"}</p>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="text-xs space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Endereço Cadastrado para Entrega</span>
                <div className="p-3 bg-white border border-slate-100 rounded-xl flex gap-2 items-center">
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {selectedCustomer.address ? (
                      <>
                        {selectedCustomer.address}, {selectedCustomer.neighborhood} <br/>
                        <b>{selectedCustomer.city} - {selectedCustomer.state}</b>, CEP: {selectedCustomer.cep}
                      </>
                    ) : "Ainda sem endereço cadastrado."}
                  </p>
                </div>
              </div>

              {/* Histórico Recente de Compras */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Histórico de Pedidos</span>
                {getCustomerSales(selectedCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-1">Sem compras efetuadas em sistema.</p>
                ) : (
                  <div className="space-y-1.5" id="profile_sales_history">
                    {getCustomerSales(selectedCustomer.id).map(sale => (
                      <div key={sale.id} className="p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">Pedido #{sale.id.slice(-5).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(sale.date).toLocaleDateString('pt-BR')}  • {sale.paymentMethod.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-[#e11d48]">
                            {sale.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                          <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase font-bold">
                            {sale.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico Recente de Malas Consignadas */}
              <div className="space-y-2 pb-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Malas Consignadas Enviadas</span>
                {getCustomerSuitcases(selectedCustomer.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic pl-1">Nenhuma mala enviada.</p>
                ) : (
                  <div className="space-y-1.5" id="profile_suitcases_history">
                    {getCustomerSuitcases(selectedCustomer.id).map(suit => (
                      <div key={suit.id} className="p-3 bg-[#FAF5FF] border border-purple-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-purple-900">{suit.code}</p>
                          <p className="text-[10px] text-purple-600 mt-0.5">
                            Enviado em: {new Date(suit.dateSent).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200 rounded-full uppercase">
                          {suit.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações administrativas */}
              {selectedCustomer.notes && (
                <div className="p-3.5 bg-yellow-50/55 border border-yellow-100 text-xs text-slate-700 rounded-xl">
                  <b>Importante:</b> {selectedCustomer.notes}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* DETAILED CREATE/EDIT DIALOG */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center z-50 font-sans" id="customer_form_sheet">
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
            
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingCustomer ? 'Editar Ficha do Cliente' : 'Cadastrar Dados da Cliente'}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full h-8 w-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 overflow-y-auto space-y-4 flex-1">
              {error && <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-xs font-semibold text-rose-700 rounded">{error}</div>}
              {success && <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 text-xs font-semibold text-emerald-700 rounded">{success}</div>}

              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Vasconcellos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98765-4321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Instagram (@)</label>
                  <input
                    type="text"
                    placeholder="Ex: @bia_vascon"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* CPF */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">CPF (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">E-mail (Opcional)</label>
                  <input
                    type="email"
                    placeholder="Ex: bia.v@outlook.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1.5 focus:ring-[#e11d48]"
                  />
                </div>
              </div>

              {/* Preferências & tamanhos */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Anotações de Moda/Estilo</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tamanhos que Costuma Usar</label>
                    <input
                      type="text"
                      placeholder="Ex: M ou G, calça 40"
                      value={sizesUsed}
                      onChange={(e) => setSizesUsed(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Preferências de Estilo / Cores</label>
                    <input
                      type="text"
                      placeholder="Ex: Cores sóbrias, linho, alfaiataria"
                      value={stylePreferences}
                      onChange={(e) => setStylePreferences(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2 border-t border-slate-100 pt-3" id="form_address_group">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Endereço Completo de Destino</span>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Av / Rua / Número / Apto *</label>
                    <input
                      type="text"
                      placeholder="Ex: Alameda Lorena, 1420 - Apt 51"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Bairro *</label>
                    <input
                      type="text"
                      placeholder="Ex: Jardins"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Cidade *</label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Estado (UF) *</label>
                    <input
                      type="text"
                      placeholder="Ex: SP"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-0.5 font-bold">CEP *</label>
                  <input
                    type="text"
                    placeholder="Ex: 01424-002"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Status e Observações */}
              <div className="grid grid-cols-2 gap-3.5">
                {editingCustomer && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status da Ficha</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="blocked">Bloqueado / Restringido</option>
                    </select>
                  </div>
                )}
                
                <div className={editingCustomer ? '' : 'col-span-2'}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-bold">Aviso / Notas Internas</label>
                  <input
                    type="text"
                    placeholder="Ex: Cobra taxa motoboy especial, prefere provar de tarde"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#e11d48] border border-[#e11d48] hover:bg-rose-700 font-semibold text-sm text-white py-3.5 rounded-xl transition-colors duration-150 shadow-sm mt-3"
              >
                {loading ? 'Processando...' : 'Gravar Ficha de Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
