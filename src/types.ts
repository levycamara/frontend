/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type ProductCategory = string;

export type ProductStatus = 
  | 'disponível' 
  | 'reservado' 
  | 'vendido' 
  | 'em mala' 
  | 'devolvido' 
  | 'avariado' 
  | 'indisponível';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  size: string; // PP, P, M, G, GG, XG, único, etc
  color: string;
  brand?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  images: string[];
  description?: string;
  notes?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 
  | 'entrada_manual' 
  | 'venda' 
  | 'reserva' 
  | 'envio_mala' 
  | 'retorno_mala' 
  | 'devolução' 
  | 'ajuste' 
  | 'perda_avaria';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  type: StockMovementType;
  reason: string;
  user: string;
  date: string;
  notes?: string;
}

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  instagram: string;
  email?: string;
  cpf?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  notes?: string;
  stylePreferences?: string; // Estilos preferidos
  sizesUsed?: string; // Tamanhos comuns
  createdAt: string;
  status: CustomerStatus;
  totalSpent?: number;
  purchaseCount?: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  price: number; // Preço praticado na venda
  originalPrice: number; // Preço sugerido do produto
}

export type PaymentMethod = 
  | 'pix' 
  | 'dinheiro' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'link_pagamento' 
  | 'transferencia' 
  | 'outro';

export type PaymentStatus = 'pago' | 'pendente' | 'parcial' | 'cancelado';

export type DeliveryMethod = 
  | 'retirada' 
  | 'entrega_local' 
  | 'motoboy' 
  | 'correios' 
  | 'transportadora' 
  | 'mala_enviada';

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  customerWhatsapp?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number; // Desconto em valor absoluto
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  deliveryId?: string; // Id se houver entrega vinculada
  notes?: string;
  date: string;
  originatedFromSuitcaseId?: string; // Se a venda veio de uma mala
}

export type SuitcaseItemStatus = 
  | 'pending' // Ainda não decidido pela cliente
  | 'purchased' // Cliente comprou
  | 'returned' // Cliente devolveu
  | 'damaged' // Avariado
  | 'missing'; // Não retornou

export interface SuitcaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  status: SuitcaseItemStatus;
}

export type SuitcaseStatus = 
  | 'em_montagem' 
  | 'enviada' 
  | 'com_cliente' 
  | 'parcialmente_devolvida' 
  | 'finalizada' 
  | 'cancelada' 
  | 'atrasada';

export interface Suitcase {
  id: string;
  code: string; // SKU/Código curto da mala
  customerId: string;
  customerName: string;
  customerWhatsapp?: string;
  items: SuitcaseItem[];
  dateSent: string;
  dateReturnExpected: string;
  dateReturnActual?: string;
  status: SuitcaseStatus;
  notes?: string;
  responsible: string;
  deliveryId?: string;
}

export type DeliveryStatus = 
  | 'pendente' 
  | 'separando' 
  | 'enviado' 
  | 'entregue' 
  | 'cancelado' 
  | 'devolvido';

export interface Delivery {
  id: string;
  targetId: string; // ID da venda ou mala correspondente
  targetType: 'sale' | 'suitcase';
  customerName: string;
  customerWhatsapp?: string;
  address: string;
  type: DeliveryMethod;
  status: DeliveryStatus;
  trackingCode?: string;
  responsible: string;
  dateShipped?: string;
  dateDelivered?: string;
  notes?: string;
}

// Interface consolidada do Banco de Dados
export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  products: Product[];
  stockMovements: StockMovement[];
  customers: Customer[];
  sales: Sale[];
  suitcases: Suitcase[];
  deliveries: Delivery[];
}
