/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, Shirt, ShoppingCart, Briefcase, Menu, Users, 
  MapPin, TrendingUp, LogOut, Shield, ChevronRight, X, AlertTriangle, Sparkles, RefreshCw,
  Database, Cloud, Copy, Check, Server
} from 'lucide-react';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Checkout from './components/Checkout';
import Suitcases from './components/Suitcases';
import Customers from './components/Customers';
import Deliveries from './components/Deliveries';
import Reports from './components/Reports';

import { User, Product, Customer, Sale, Suitcase, Delivery } from './types';

type ActiveTab = 'inicio' | 'estoque' | 'vender' | 'malas' | 'menu';
type AuxiliaryTab = 'clientes' | 'entregas' | 'relatorios';

export default function App() {
  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core application data states
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suitcases, setSuitcases] = useState<Suitcase[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  // Supabase connection and schema state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<ActiveTab | AuxiliaryTab>('inicio');
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Quick Action triggers 
  const [openNewCustomerImmediately, setOpenNewCustomerImmediately] = useState(false);
  const [openNewSuitcaseImmediately, setOpenNewSuitcaseImmediately] = useState(false);

  // Handle Session Storage
  useEffect(() => {
    const savedUser = sessionStorage.getItem('loja_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('loja_user');
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('loja_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('loja_user');
    setActiveTab('inicio');
    setIsMenuDrawerOpen(false);
  };

  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (err) {
      console.error("Erro ao carregar status do Supabase:", err);
    }
  };

  // Fetch all database metrics
  const fetchAllData = async () => {
    if (!currentUser) return;
    setGlobalLoading(true);
    try {
      fetchSupabaseStatus(); // Carrega o status do Supabase em paralelo
      const [pRes, cRes, sRes, mRes, dRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/customers'),
        fetch('/api/sales'),
        fetch('/api/suitcases'),
        fetch('/api/deliveries')
      ]);

      if (pRes.ok && cRes.ok && sRes.ok && mRes.ok && dRes.ok) {
        const [pData, cData, sData, mData, dData] = await Promise.all([
          pRes.json(),
          cRes.json(),
          sRes.json(),
          mRes.json(),
          dRes.json()
        ]);

        setProducts(pData);
        setCustomers(cData);
        setSales(sData);
        setSuitcases(mData);
        setDeliveries(dData);
      }
    } catch (err) {
      console.error("Erro ao sincronizar informações do servidor:", err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  // Handle navigation requests
  const handleQuickNavigate = (tab: ActiveTab | AuxiliaryTab) => {
    setOpenNewCustomerImmediately(false);
    setOpenNewSuitcaseImmediately(false);
    setActiveTab(tab);
    setIsMenuDrawerOpen(false);
  };

  // Quick setup routes triggers
  const handleQuickAction = (action: 'venda' | 'mala' | 'cliente') => {
    if (action === 'venda') {
      setActiveTab('vender');
    } else if (action === 'mala') {
      setOpenNewSuitcaseImmediately(true);
      setActiveTab('malas');
    } else if (action === 'cliente') {
      setOpenNewCustomerImmediately(true);
      setActiveTab('clientes');
    }
  };

  const handleDashboardNavigate = (view: string, subAction?: string) => {
    setOpenNewCustomerImmediately(false);
    setOpenNewSuitcaseImmediately(false);

    if (view === 'vender' || view === 'venda') {
      setActiveTab('vender');
    } else if (view === 'produtos' || view === 'estoque' || view === 'produtos_novo' || view === 'produtos_buscar' || view === 'produtos_movimentar') {
      setActiveTab('estoque');
    } else if (view === 'malas') {
      if (subAction === 'nova') {
        setOpenNewSuitcaseImmediately(true);
      }
      setActiveTab('malas');
    } else if (view === 'clientes') {
      if (subAction === 'novo') {
        setOpenNewCustomerImmediately(true);
      }
      setActiveTab('clientes');
    } else if (view === 'entregas') {
      setActiveTab('entregas');
    } else if (view === 'relatorios') {
      setActiveTab('relatorios');
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative text-slate-800 font-sans select-none antialiased max-w-lg mx-auto border-x border-slate-200/55 shadow-2xl" id="mobile_shell_viewport">
      
      {/* STATUS AND ADMIN TOP BAR */}
      <header className="bg-white border-b border-[#E5E5E1] flex items-center justify-between px-4 py-3.5 shrink-0 shadow-sm" id="mobile_nav_header">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#1A1A1A] rounded-full flex items-center justify-center text-white font-bold text-xs" id="app_header_logo_avatar">
            CI
          </div>
          <div>
            <h1 className="text-xs font-semibold tracking-tight text-[#1A1A1A] uppercase">Closet Instagram</h1>
            <p className="text-[9px] text-[#8C8C88] uppercase tracking-widest flex items-center gap-1 font-bold">
              <span>● {currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</span>
            </p>
          </div>
        </div>

        {/* Sync loading spinner */}
        <div className="flex items-center gap-2">
          {globalLoading ? (
            <span className="animate-spin text-slate-450">
              <RefreshCw className="h-4 w-4" />
            </span>
          ) : (
            <button 
              onClick={fetchAllData}
              title="Sincronizar"
              className="text-slate-400 hover:text-slate-700 bg-slate-50 p-2 border border-slate-150 rounded-xl"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* CORE ACTIVE PAGE ROUTING */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-full overflow-x-hidden" id="app_routing_outlet">
        {activeTab === 'inicio' && (
          <Dashboard 
            products={products} 
            customers={customers} 
            sales={sales} 
            suitcases={suitcases} 
            deliveries={deliveries}
            onNavigate={handleDashboardNavigate}
          />
        )}

        {activeTab === 'estoque' && (
          <Products 
            products={products} 
            onRefresh={fetchAllData} 
          />
        )}

        {activeTab === 'vender' && (
          <Checkout 
            products={products} 
            customers={customers} 
            onRefresh={fetchAllData} 
            onSuccessNavigate={handleQuickNavigate}
          />
        )}

        {activeTab === 'malas' && (
          <Suitcases 
            suitcases={suitcases} 
            customers={customers}
            products={products}
            onRefresh={fetchAllData}
            openNewSuitcaseImmediately={openNewSuitcaseImmediately}
          />
        )}

        {activeTab === 'clientes' && (
          <Customers 
            customers={customers}
            sales={sales}
            suitcases={suitcases}
            onRefresh={fetchAllData}
            openNewCustomerImmediately={openNewCustomerImmediately}
          />
        )}

        {activeTab === 'entregas' && (
          <Deliveries 
            deliveries={deliveries}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'relatorios' && (
          <Reports 
            sales={sales}
            products={products}
            customers={customers}
          />
        )}
      </main>

      {/* PERSISTENT ELEGANT BOTTOM NAV BAR CONTROLLER */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur-md border-t border-slate-150 py-2.5 px-4 flex justify-between items-center z-40 select-none shadow-xl" id="main_bottom_navbar">
        
        {/* Tab 1: Inicio */}
        <button
          onClick={() => handleQuickNavigate('inicio')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'inicio' ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-700'
          }`}
          id="tab_home_btn"
        >
          <Home className="h-5 w-5" />
          <span>Início</span>
        </button>

        {/* Tab 2: Estoque */}
        <button
          onClick={() => handleQuickNavigate('estoque')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'estoque' ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-700'
          }`}
          id="tab_stock_btn"
        >
          <Shirt className="h-5 w-5" />
          <span>Estoque</span>
        </button>

        {/* Tab 3: PDV Checkout Accent */}
        <button
          onClick={() => handleQuickNavigate('vender')}
          className={`flex flex-col items-center gap-1 text-[10px] font-black tracking-wide -mt-6 bg-[#e11d48] text-white p-3.5 rounded-full shadow-lg border-2 border-white transform active:scale-95 transition-all`}
          id="tab_checkout_btn"
        >
          <ShoppingCart className="h-5.5 w-5.5" />
        </button>

        {/* Tab 4: Malas (Consignado) */}
        <button
          onClick={() => handleQuickNavigate('malas')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            activeTab === 'malas' ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-700'
          }`}
          id="tab_suitcases_btn"
        >
          <Briefcase className="h-5 w-5" />
          <span>Malas</span>
        </button>

        {/* Tab 5: Menu Drawer */}
        <button
          onClick={() => setIsMenuDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
            isMenuDrawerOpen || ['clientes', 'entregas', 'relatorios'].includes(activeTab)
              ? 'text-[#e11d48]' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
          id="tab_more_btn"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>

      </nav>

      {/* DRAWER MENU LIST */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center font-sans" id="apps_more_drawer_menu">
          <div className="bg-white w-full max-w-lg rounded-t-3xl shadow-xl flex flex-col p-6 space-y-5 animate-slide-up max-h-[80vh] overflow-y-auto pb-10">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Acessar Recursos</span>
              <button 
                onClick={() => setIsMenuDrawerOpen(false)}
                className="p-1 px-2.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Fechar
              </button>
            </div>

            {/* Menu options stack */}
            <div className="space-y-2.5">
              
              {/* Clientes */}
              <button
                onClick={() => handleQuickNavigate('clientes')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-rose-50/40 border border-slate-100 transition-colors"
                id="menu_link_customers"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Fichas de Clientes</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Tamanhos, preferências, total comprado e histórico</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {/* Entregas */}
              <button
                onClick={() => handleQuickNavigate('entregas')}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-rose-50/40 border border-slate-100 transition-colors"
                id="menu_link_deliveries"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Logística de Entregas</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Acompanhe envio de motoboy e status do frete</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              {/* Relatórios de caixa */}
              {currentUser.role === 'admin' ? (
                <button
                  onClick={() => handleQuickNavigate('relatorios')}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-rose-50/40 border border-slate-100 transition-colors"
                  id="menu_link_reports"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">Desempenho & Relatórios</p>
                      <p className="text-[10px] text-slate-400 font-semibold font-bold">Faturamento de hoje, metas, e produtos mais vendidos</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ) : (
                <div className="opacity-55 p-4 bg-slate-100 rounded-2xl border border-slate-205 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="text-left font-bold text-xs text-slate-500 text-left">
                      <p className="text-slate-750">Desempenho & Relatórios</p>
                      <p className="text-[9px] text-[#e11d48] flex items-center gap-0.5">⚠️ Restrito para perfil Operador</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Supabase Database Row */}
              <button
                onClick={() => {
                  setIsSupabaseModalOpen(true);
                  setIsMenuDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-[#F1F0EC] border border-[#E5E5E1] rounded-2xl transition-colors text-left"
                id="menu_link_supabase"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">Banco de Dados Supabase</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                      {supabaseStatus?.configured ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          {supabaseStatus?.message || "Conectado"}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold">Apenas Cache Local (Ativo)</span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

            </div>

            {/* Logout Row Action toggle banner */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Acessado por: <span className="font-extrabold text-slate-800">{currentUser.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 py-2 px-3 border border-rose-100 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl hover:bg-rose-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Desconectar</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUPABASE DEPLOY DETAILS MODAL */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans" id="supabase_instructions_modal">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] flex flex-col p-6 shadow-2xl border border-[#E5E5E1] overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-orange-600 animate-pulse" />
                <h3 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">Conexão Supabase</h3>
              </div>
              <button 
                onClick={() => {
                  setIsSupabaseModalOpen(false);
                  setCopiedSql(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Inner Content Scroller */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs text-slate-600">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-1.5 ${
                supabaseStatus?.configured 
                  ? 'bg-emerald-50/50 border-emerald-100' 
                  : 'bg-amber-50/50 border-amber-100'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    supabaseStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                  }`} />
                  <span className={`font-bold uppercase tracking-wider text-[9px] ${
                    supabaseStatus?.configured ? 'text-emerald-800' : 'text-amber-800'
                  }`}>
                    {supabaseStatus?.configured ? 'Instanciado (Nuvem Ativa)' : 'Usando Banco Cache Local'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed font-semibold text-slate-700">
                  {supabaseStatus?.message || "Configure as credenciais remota para usarmos seu banco do Supabase!"}
                </p>
              </div>

              {/* Informative Step Cards */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Cloud className="h-4 w-4 text-slate-400" />
                  Como conectar sua conta Supabase?
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-600 font-semibold text-[11px]">
                  <li>
                    Acesse o painel lateral <strong className="text-slate-800">Secrets (Configurações)</strong> no menu do AI Studio.
                  </li>
                  <li>
                    Adicione os dois novos segredos / secrets:
                    <ul className="list-disc pl-4 mt-1 space-y-1 font-bold text-slate-800">
                      <li><code className="bg-slate-100 px-1 rounded text-orange-600 select-all">SUPABASE_URL</code> &rArr; seu endpoint</li>
                      <li><code className="bg-slate-100 px-1 rounded text-orange-600 select-all">SUPABASE_KEY</code> &rArr; service_role ou anon key</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {/* SQL Table Creation Code */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-slate-400" />
                    Script SQL para o Supabase
                  </h4>
                  <button
                    onClick={() => {
                      const sqlCmd = supabaseStatus?.sql || `CREATE TABLE IF NOT EXISTS closet_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;
                      navigator.clipboard.writeText(sqlCmd);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 px-2.5 rounded-lg font-bold"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                  Rode o comando abaixo no painel <strong className="text-slate-700">SQL Editor</strong> do seu Supabase para criar o repositório sincronizado:
                </p>
                <pre className="bg-slate-900 text-slate-100 font-mono text-[9px] p-2.5 rounded-xl overflow-x-auto border border-slate-800 max-h-36 selection:bg-slate-700 select-all">
                  {supabaseStatus?.sql || `CREATE TABLE IF NOT EXISTS closet_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
                </pre>
              </div>

              {/* Reset to Clean Production Mode */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                  Iniciar Produção (Apagar Mock)
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">
                  Seu banco de dados remoto/local vem com roupas e clientes fictícios para apresentação. Quer remover essas peças falsas para começar a inserir seus produtos reais?
                </p>
                <button
                  onClick={async () => {
                    const confirmClean = window.confirm(
                      "Atenção: Isso excluirá permanentemente todos os produtos, clientes, malas consignadas e vendas fictícias de teste! Seus usuários de acesso continuarão ativos. Deseja prosseguir?"
                    );
                    if (confirmClean) {
                      try {
                        setGlobalLoading(true);
                        const res = await fetch("/api/db/clear", { method: "POST" });
                        if (res.ok) {
                          alert("Todos os dados de teste foram limpos! Agora o sistema está 100% pronto para sua loja física.");
                          await fetchAllData();
                          setIsSupabaseModalOpen(false);
                        } else {
                          const errData = await res.json();
                          alert("Erro ao limpar dados: " + (errData.error || "Erro desconhecido"));
                        }
                      } catch (err: any) {
                        alert("Falha de conexão com o servidor: " + err.message);
                      } finally {
                        setGlobalLoading(false);
                      }
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-[10px] bg-red-50 hover:bg-red-100 text-red-700 py-2.5 px-3 rounded-xl font-bold border border-red-100 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 animate-spin duration-10000" />
                  <span>Apagar Todo o Conteúdo de Teste</span>
                </button>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsSupabaseModalOpen(false);
                  setCopiedSql(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all h-[44px]"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  setGlobalLoading(true);
                  await fetchAllData();
                  setGlobalLoading(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1A1A1A] hover:bg-[#333333] rounded-xl transition-all flex items-center gap-1.5 h-[44px]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${globalLoading ? 'animate-spin' : ''}`} />
                <span>Testar Conexão</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
