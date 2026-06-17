/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Shirt, DollarSign, ShoppingBag, Briefcase, 
  MapPin, Users, AlertTriangle, PlusCircle, Search, 
  ArrowRight, Sparkles, TrendingUp
} from 'lucide-react';
import { Product, Customer, Sale, Suitcase, Delivery } from '../types';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  suitcases: Suitcase[];
  deliveries: Delivery[];
  onNavigate: (view: string, subAction?: string) => void;
}

export default function Dashboard({ 
  products, 
  customers, 
  sales, 
  suitcases, 
  deliveries, 
  onNavigate 
}: DashboardProps) {

  // Cálculos de métricas do Dashboard
  const totalStockItems = products.reduce((acc, curr) => acc + curr.stock, 0);
  const totalStockValue = products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);

  // Vendas do mês atual (Filtro por Junho/2026 com base na data local fornecida: 2026-06-17)
  const currentMonthSales = sales.filter(s => {
    if (!s.date) return false;
    const saleDate = new Date(s.date);
    return saleDate.getMonth() === 5 && saleDate.getFullYear() === 2026; // Mês 5 é Junho
  });

  const monthlyRevenue = currentMonthSales.reduce((acc, curr) => acc + curr.total, 0);
  const monthlyItemsSold = currentMonthSales.reduce((acc, curr) => {
    return acc + curr.items.reduce((sum, item) => sum + item.qty, 0);
  }, 0);

  const openSuitcases = suitcases.filter(m => m.status !== 'finalizada' && m.status !== 'cancelada');
  const pendingDeliveries = deliveries.filter(d => d.status === 'pendente' || d.status === 'separando' || d.status === 'enviado');
  const activeCustomers = customers.filter(c => c.status === 'active');

  // Alerta de estoque baixo (menor que 3 peças)
  const lowStockProducts = products.filter(p => p.stock < 3 && p.status === 'disponível');

  return (
    <div className="space-y-6 pb-20 font-sans" id="dashboard_view">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="bg-gradient-to-r from-slate-900 to-rose-950 p-6 rounded-2xl text-white shadow-sm flex justify-between items-center" id="dashboard_banner">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Instagram Closet Admin</span>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">Painel de Gestão</h1>
          <p className="text-slate-300 text-xs mt-1">
            Controle rápido especial para vendas móveis e malas consignadas.
          </p>
        </div>
        <div className="bg-rose-500/10 p-3 rounded-full text-rose-300">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      {/* Alertas Importantes se houver stock baixo */}
      {lowStockProducts.length > 0 && (
        <div 
          className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 cursor-pointer hover:bg-amber-100/50 transition-colors" 
          id="low_stock_announcement"
          onClick={() => onNavigate('produtos', 'estoque_baixo')}
        >
          <div className="bg-amber-100 p-2 rounded-lg text-amber-800">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-amber-900">Alerta de Estoque Baixo</h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Você tem <b>{lowStockProducts.length} produtos</b> com menos de 3 peças em estoque. Toque para visualizar e fazer reposição.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-700 self-center" />
        </div>
      )}

      {/* Atalhos Rápidos para Celular */}
      <div className="space-y-2.5" id="quick_shortcuts_section">
        <h2 className="text-xs font-bold text-[#8C8C88] uppercase tracking-widest px-1">Ações Rápidas</h2>
        <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
          <button 
            id="shortcut_new_sale"
            onClick={() => onNavigate('venda')}
            className="flex flex-col items-center justify-center p-4 bg-[#F1F0EC] hover:bg-[#E5E5E1] rounded-2xl active:scale-95 duration-150 transition-all text-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
            <span className="text-xs font-semibold text-[#1A1A1A]">Nova Venda</span>
          </button>

          <button 
            id="shortcut_new_product"
            onClick={() => onNavigate('produtos', 'novo')}
            className="flex flex-col items-center justify-center p-4 bg-[#F1F0EC] hover:bg-[#E5E5E1] rounded-2xl active:scale-95 duration-150 transition-all text-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
            <span className="text-xs font-semibold text-[#1A1A1A]">Novo Produto</span>
          </button>

          <button 
            id="shortcut_new_suitcase"
            onClick={() => onNavigate('malas', 'nova')}
            className="flex flex-col items-center justify-center p-4 bg-[#F1F0EC] hover:bg-[#E5E5E1] rounded-2xl active:scale-95 duration-150 transition-all text-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">👜</span>
            <span className="text-xs font-semibold text-[#1A1A1A]">Nova Mala</span>
          </button>

          <button 
            id="shortcut_new_customer"
            onClick={() => onNavigate('clientes', 'novo')}
            className="flex flex-col items-center justify-center p-4 bg-[#F1F0EC] hover:bg-[#E5E5E1] rounded-2xl active:scale-95 duration-150 transition-all text-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">👤</span>
            <span className="text-xs font-semibold text-[#1A1A1A]">Novo Cliente</span>
          </button>

          <button 
            id="shortcut_stock"
            onClick={() => onNavigate('produtos', 'movimentar')}
            className="flex flex-col items-center justify-center p-4 bg-[#F1F0EC] hover:bg-[#E5E5E1] rounded-2xl active:scale-95 duration-150 transition-all text-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">📈</span>
            <span className="text-xs font-semibold text-[#1A1A1A]">Entrada Estoque</span>
          </button>

          <button 
            id="shortcut_search"
            onClick={() => onNavigate('produtos', 'buscar')}
            className="flex flex-col items-center justify-center p-4 bg-[#F1F0EC] hover:bg-[#E5E5E1] rounded-2xl active:scale-95 duration-150 transition-all text-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🔍</span>
            <span className="text-xs font-semibold text-[#1A1A1A]">Buscar Produto</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais (Bento-Grid Estilo Moderno) */}
      <div className="space-y-3" id="metrics_section">
        <h2 className="text-xs font-bold text-[#8C8C88] uppercase tracking-widest px-1">Resultados & Visão Geral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Faturamento do Mês */}
          <div className="bg-white p-6 rounded-3xl border border-[#E5E5E1] shadow-sm flex flex-col justify-between" id="metric_revenue">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C8C88]" id="metric_revenue_label">Vendas do Mês</span>
              <div className="text-3xl font-light tracking-tight mt-1 text-[#1A1A1A]" id="metric_revenue_value">
                {monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold mt-3" id="metric_revenue_sub">
              <span>↑ {monthlyItemsSold} peças vendidas</span>
            </div>
          </div>

          {/* Valor Estimado do Estoque */}
          <div className="bg-[#1A1A1A] p-6 rounded-3xl text-white flex flex-col justify-between" id="metric_stock_value">
            <span className="text-xs font-bold uppercase tracking-widest opacity-60 text-white" id="metric_stock_value_label">Estoque Total</span>
            <div className="text-3xl font-light tracking-tight mt-1" id="metric_stock_value_qty">
              {totalStockItems} <span className="text-sm opacity-50 font-sans">unid</span>
            </div>
            <div className="text-xs opacity-60 mt-3" id="metric_stock_value_balance">
              {totalStockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} est.
            </div>
          </div>

          {/* Malas em Aberto */}
          <div 
            onClick={() => onNavigate('malas')}
            className="bg-white p-6 rounded-3xl border border-[#E5E5E1] shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#1A1A1A] hover:shadow-md transition-all duration-200" 
            id="metric_suitcases"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C8C88]" id="metric_suitcases_label">Malas em Aberto</span>
              <div className="text-3xl font-light tracking-tight mt-1 text-[#1A1A1A]" id="metric_suitcases_value">
                {openSuitcases.length} <span className="text-sm opacity-50 font-sans font-normal">ativas</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold mt-3" id="metric_suitcases_sub">
              <span>Sob posse das clientes</span>
            </div>
          </div>

          {/* Entregas Pendentes */}
          <div 
            onClick={() => onNavigate('entregas')} 
            className="bg-white p-6 rounded-3xl border border-[#E5E5E1] shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#1A1A1A] hover:shadow-md transition-all duration-200" 
            id="metric_deliveries"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C8C88]" id="metric_deliveries_label">Entregas Pendentes</span>
              <div className="text-3xl font-light tracking-tight mt-1 text-[#1A1A1A]" id="metric_deliveries_value">
                {pendingDeliveries.length} <span className="text-sm opacity-50 font-sans font-normal">envios</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold mt-3" id="metric_deliveries_sub">
              <span>Separando ou em envio</span>
            </div>
          </div>

          {/* Clientes Cadastrados */}
          <div 
            onClick={() => onNavigate('clientes')}
            className="bg-white p-6 rounded-3xl border border-[#E5E5E1] shadow-sm flex flex-col justify-between cursor-pointer hover:border-[#1A1A1A] hover:shadow-md transition-all duration-200 sm:col-span-2" 
            id="metric_customers"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C8C88]" id="metric_customers_label">Clientes Cadastrados</span>
              <div className="text-3xl font-light tracking-tight mt-1 text-[#1A1A1A]" id="metric_customers_value">
                {activeCustomers.length} <span className="text-sm opacity-50 font-sans font-normal">ativas</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mt-3" id="metric_customers_sub">
              <span>Fichas atualizadas prontas para comprar</span>
            </div>
          </div>

        </div>
      </div>

      {/* Seção Informativa de Guia do Usuário */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200/50" id="user_guide_tip">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-tight">Dica de Gestão</h4>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          O módulo <b>"Malas Consignadas"</b> permite separar e enviar sacolas de roupas pra cliente provar em casa. Retorne-as no sistema marcando quais peças ela escolheu comprar, quais foram devolvidas intactas ou quais sofreram avaria. Os itens comprados viram vendas automáticas de forma mágica!
        </p>
      </div>
    </div>
  );
}
