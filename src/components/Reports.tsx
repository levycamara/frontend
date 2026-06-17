/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Sliders, ShoppingBag, 
  ChevronRight, RefreshCw, Layers, PieChart, Users, ArrowUpRight
} from 'lucide-react';
import { Sale, Product, Customer } from '../types';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
}

export default function Reports({ sales, products, customers }: ReportsProps) {
  
  // Total Revenue Calculated
  const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);

  // Today's total sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, curr) => acc + curr.total, 0);

  // Best selling products calculation
  const productSalesMap: { [name: string]: { qty: number, total: number } } = {};
  
  sales.forEach(sale => {
    sale.items.forEach(it => {
      if (!productSalesMap[it.productName]) {
        productSalesMap[it.productName] = { qty: 0, total: 0 };
      }
      productSalesMap[it.productName].qty += it.qty;
      productSalesMap[it.productName].total += it.price * it.qty;
    });
  });

  const topSellingPieces = Object.entries(productSalesMap)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Payment methods preference percentage ratio
  const payMap: { [key: string]: number } = {};
  sales.forEach(s => {
    payMap[s.paymentMethod] = (payMap[s.paymentMethod] || 0) + s.total;
  });

  const translatePayment = (pm: string) => {
    switch (pm) {
      case 'pix': return 'Pix';
      case 'dinheiro': return 'Dinheiro';
      case 'cartao_credito': return 'C. Crédito';
      case 'cartao_debito': return 'C. Débito';
      case 'link_pagamento': return 'Link Pagto';
      default: return pm;
    }
  };

  // Stock health counters
  const totalStockUnits = products.reduce((acc, curr) => acc + curr.stock, 0);
  const totalStockAssetsValue = products.reduce((acc, curr) => acc + (curr.stock * curr.price), 0);
  const lowStockPieces = products.filter(p => p.stock <= (p.minStock ?? 3));

  return (
    <div className="space-y-4 pb-20 font-sans" id="reports_view_container">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="reports_header">
        <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#e11d48]" />
          Relatórios & Métricas
        </h1>
        <p className="text-xs text-slate-400 font-semibold font-medium">Históricos financeiros e desempenho da loja no Instagram</p>
      </div>

      {/* THREE BENTO METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3" id="bento_reports_metrics">
        
        {/* Today's total sold */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden" id="metric_today">
          <div className="h-24 w-24 bg-rose-500/10 rounded-full absolute -right-6 -bottom-6" />
          <div className="z-10">
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">Faturado Hoje</span>
            <p className="text-lg font-black mt-2 font-mono text-emerald-400">
              {todayRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <span className="text-[9px] text-slate-400 mt-3 font-semibold block z-10">
            {todaySales.length} vendas registradas
          </span>
        </div>

        {/* Global Total Revenue accumulated */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="metric_total_sales">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Faturamento Total</span>
            <p className="text-lg font-black mt-2 font-mono text-slate-900">
              {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <span className="text-[9px] text-[#e11d48] font-bold mt-3 block">
            {sales.length} transações liquidadas
          </span>
        </div>

        {/* Total Cost Inventory asset value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="metric_stock_assets">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Patrimônio em Estoque</span>
            <p className="text-lg font-black mt-2 font-mono text-slate-900">
              {totalStockAssetsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <span className="text-[9px] text-slate-500 font-semibold mt-3 block">
            {totalStockUnits} peças físicas listadas
          </span>
        </div>

        {/* Cliente register metric */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="metric_client_base">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Base de Clientes</span>
            <p className="text-lg font-black mt-2 font-mono text-slate-900">
              {customers.length} cadastrados
            </p>
          </div>
          <span className="text-[9px] text-emerald-600 font-bold mt-3 block">
            {customers.filter(c => c.status === 'active').length} fichas ativas
          </span>
        </div>

      </div>

      {/* TOP PIECES SELLING LIST */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3" id="top_selling_pieces_list">
        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-2 flex items-center gap-1">
          <ShoppingBag className="h-4 w-4 text-purple-600" />
          Top 5 Peças Mais Vendidas
        </span>
        
        {topSellingPieces.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2 text-center select-none">Nenhuma peça faturada ainda.</p>
        ) : (
          <div className="space-y-2.5">
            {topSellingPieces.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-1" id={`top_piece_row_${idx}`}>
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800 truncate max-w-[150px]">{p.name}</span>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">{p.qty} unidades vendidas</span>
                  <span className="font-extrabold text-slate-705 font-mono">
                    {p.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAYMENT METHODS METRICS */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block border-b border-slate-50 pb-2 flex items-center gap-1">
          <PieChart className="h-4 w-4 text-emerald-600" />
          Faturamento por Meio de Pagamento
        </span>

        {Object.keys(payMap).length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2 text-center">Nenhum meio faturado ainda.</p>
        ) : (
          <div className="space-y-3.5 pt-1" id="payment_preferences_deck">
            {Object.entries(payMap).map(([method, val]) => {
              const pct = (val / totalRevenue) * 100;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700">{translatePayment(method)}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  {/* Styled visual progress bar */}
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HEALTH OF STOCK LOW ALERTS */}
      <div className="bg-amber-50/50 p-4.5 border border-amber-100 rounded-2xl space-y-2.5" id="critical_stock_health">
        <span className="text-[10px] font-extrabold text-amber-950 uppercase tracking-widest block font-bold">Resumo Alerta de Estoque Baixo</span>
        {lowStockPieces.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold">✓ Todas as peças estão com níveis de estoque saudáveis.</p>
        ) : (
          <div className="space-y-1.5" id="low_stock_list_reports">
            <p className="text-[11px] text-amber-800 font-semibold mb-2">Existem {lowStockPieces.length} modelos de roupas com unidades no limite ou esgotando:</p>
            {lowStockPieces.slice(0, 3).map(p => (
              <div key={p.id} className="p-2.5 bg-white border border-amber-100 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{p.name} [{p.size}]</span>
                  <p className="text-[10px] text-slate-400">SKU: {p.sku} | Cor: {p.color}</p>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-250">
                  {p.stock} unidades restam
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
