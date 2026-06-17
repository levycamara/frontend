/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, MessageSquare, RefreshCw, Send, Sparkles, Check, HelpCircle, Package, ArrowRight } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../types';

interface DeliveriesProps {
  deliveries: Delivery[];
  onRefresh: () => void;
}

export default function Deliveries({ deliveries, onRefresh }: DeliveriesProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateDeliveryStatus = async (id: string, newStatus: DeliveryStatus) => {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/deliveries/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        onRefresh();
      } else {
        alert('Erro ao atualizar status da entrega.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusColor = (st: DeliveryStatus) => {
    switch (st) {
      case 'pendente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'separando': return 'bg-blue-105 text-blue-900 border-blue-200';
      case 'enviado': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'entregue': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const translateMethod = (m: string) => {
    switch (m) {
      case 'motoboy': return 'Motoboy Express';
      case 'entrega_local': return 'Motorista / Entrega Local';
      case 'correios': return 'Correios PAC/Sedex';
      case 'transportadora': return 'Transportadora';
      case 'mala_enviada': return 'Mala Física';
      default: return m;
    }
  };

  // Filtrar apenas ativas (não canceladas ou entregues, para manter a tela limpa e focada no celular do lojista)
  const pendingDeliveries = deliveries.filter(d => d.status !== 'cancelado' && d.status !== 'devolvido');

  return (
    <div className="space-y-4 pb-20 font-sans" id="deliveries_view">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm" id="deliveries_header">
        <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#e11d48]" />
          Logística de Entregas
        </h1>
        <p className="text-xs text-slate-400 font-semibold font-medium">Controle o andamento dos despachos para as clientes</p>
      </div>

      {/* DELIVERIES DECK */}
      <div className="space-y-3" id="deliveries_deck">
        {pendingDeliveries.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-250 flex flex-col items-center justify-center space-y-3">
            <Package className="h-10 w-10 text-slate-350" />
            <div>
              <p className="text-sm font-bold text-slate-800">Sem entregas pendentes</p>
              <p className="text-xs text-slate-500 mt-1">Todas as vendas e malas despachadas estão entregues ou canceladas!</p>
            </div>
          </div>
        ) : (
          pendingDeliveries.map(d => (
            <div 
              key={d.id}
              className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3"
              id={`delivery_card_${d.id}`}
            >
              {/* Header card state */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase font-bold text-rose-500 tracking-wider bg-rose-50 px-2 py-0.5 rounded">
                    {d.targetType === 'sale' ? 'Venda realizada' : 'Envio de Mala'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{d.customerName}</h3>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusColor(d.status)}`}>
                  {d.status}
                </span>
              </div>

              {/* Endereco robust */}
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50 space-y-1">
                <p className="font-semibold text-slate-800">Endereço de Destino:</p>
                <p className="leading-relaxed text-slate-550 select-all">{d.address}</p>
              </div>

              {/* Servicos transportes info */}
              <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-3">
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-400">Modalidade</p>
                  <p className="text-slate-800 font-bold mt-0.5">{translateMethod(d.type)}</p>
                </div>
                {d.customerWhatsapp && (
                  <a 
                    href={`https://wa.me/55${d.customerWhatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 py-1 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-800 rounded-xl flex items-center justify-center gap-1 font-bold text-[10px]"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Enviar WhatsApp
                  </a>
                )}
              </div>

              {/* Status workflow togglers for Phone */}
              <div className="bg-slate-50/50 p-2 rounded-xl flex gap-1.5 items-center justify-between text-xs font-semibold">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest pl-1 font-bold">Avançar Status:</span>
                
                <div className="flex gap-1">
                  {d.status === 'pendente' && (
                    <button
                      onClick={() => updateDeliveryStatus(d.id, 'separando')}
                      className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                    >
                      Anotar: Separando
                    </button>
                  )}
                  {d.status === 'separando' && (
                    <button
                      onClick={() => updateDeliveryStatus(d.id, 'enviado')}
                      className="px-2.5 py-1.5 bg-[#e11d48] text-white rounded-lg text-[10px] font-bold"
                    >
                      Anotar: Enviado
                    </button>
                  )}
                  {d.status === 'enviado' && (
                    <button
                      onClick={() => updateDeliveryStatus(d.id, 'entregue')}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Entregue!
                    </button>
                  )}
                  {d.status === 'entregue' && (
                    <span className="text-emerald-700 text-[10px] font-bold pr-2 flex items-center gap-0.5">
                      ✓ Entrega Concluída
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
