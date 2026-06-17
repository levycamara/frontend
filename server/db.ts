import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { DatabaseSchema, User, Category, Product, StockMovement, Customer, Sale, Suitcase, Delivery } from '../src/types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Vestido', slug: 'vestido' },
  { id: 'cat-2', name: 'Blusa', slug: 'blusa' },
  { id: 'cat-3', name: 'Calça', slug: 'calca' },
  { id: 'cat-4', name: 'Saia', slug: 'saia' },
  { id: 'cat-5', name: 'Conjunto', slug: 'conjunto' },
  { id: 'cat-6', name: 'Acessório', slug: 'acessorio' },
  { id: 'cat-7', name: 'Sapato', slug: 'sapato' },
  { id: 'cat-8', name: 'Bolsa', slug: 'bolsa' },
  { id: 'cat-9', name: 'Outro', slug: 'outro' }
];

// Carregar variáveis do .env
dotenv.config();

const DB_FILE = path.join(process.cwd(), 'db.json');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.error('Falha ao inicializar o cliente Supabase:', err);
  }
}

// Senhas em texto claro para este protótipo administrativo para facilitar a manutenção e testes diretos.
const DEFAULT_USERS: any[] = [
  {
    id: '1',
    name: 'Ana Claudia (Admin)',
    email: 'admin@loja.com',
    password: 'admin',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Carla Souza (Operadora)',
    email: 'operador@loja.com',
    password: '123',
    role: 'operator'
  }
];

const INITIAL_PRODUCTS: any[] = [
  {
    id: 'p1',
    name: 'Vestido Midi Linho Sophia',
    sku: 'PECA-VEST-001',
    category: 'vestido',
    size: 'M',
    color: 'Terracota',
    brand: 'Amíssima',
    cost: 120.00,
    price: 259.90,
    stock: 8,
    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Vestido midi em linho puro com botões frontais decorativos e lastex nas costas para ajuste perfeito.',
    notes: 'Sucesso de vendas no direct do Instagram.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p2',
    name: 'Blusa Crepe Alcinha Chiara',
    sku: 'PECA-BLUS-002',
    category: 'blusa',
    size: 'P',
    color: 'Off-White',
    brand: 'Carol Modas',
    cost: 45.00,
    price: 99.90,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1548624149-f7b31603045f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Blusa delicada de crepe com alças finas reguláveis. Com detalhe no decote em V.',
    notes: 'Ótima peça para compor com blazer.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p3',
    name: 'Calça Pantalona Alfaiataria Maitê',
    sku: 'PECA-CALC-003',
    category: 'calça',
    size: 'G',
    color: 'Verde Oliva',
    brand: 'Nossa Marca',
    cost: 95.00,
    price: 198.00,
    stock: 5,
    images: ['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Calça pantalona em crepe de alfaiataria texturizado, cintura alta com passantes largos.',
    notes: 'Combina muito bem com a blusa Chiara.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p4',
    name: 'Saia Plissada Cetim Helena',
    sku: 'PECA-SAIA-004',
    category: 'saia',
    size: 'M',
    color: 'Preto',
    brand: 'Amíssima',
    cost: 70.00,
    price: 159.90,
    stock: 3,
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Saia plissada em cetim com brilho sofisticado e elástico confortável no cós.',
    notes: 'Peça queridinha do outono.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p5',
    name: 'Conjunto Tweed Cropped e Saia Valentina',
    sku: 'PECA-CONJ-005',
    category: 'conjunto',
    size: 'P',
    color: 'Mescla Rosa/Branco',
    brand: 'Nossa Marca',
    cost: 150.00,
    price: 320.00,
    stock: 4,
    images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Conjunto tweed exclusivo composto por cropped de manga curta e saia curta de botões perolados.',
    notes: 'Edição limitada.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p6',
    name: 'Brinco Argola Banhada Ouro',
    sku: 'PECA-ACES-006',
    category: 'acessório',
    size: 'único',
    color: 'Dourado',
    cost: 15.00,
    price: 45.00,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Argola média banhada a ouro 18k com fecho italiano, super leve e hipoalergênica.',
    notes: 'Perfeita para saídas rápidas e vendas casadas no PDV.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p7',
    name: 'Mule Bico Fino Couro Lavínia',
    sku: 'PECA-SAPA-007',
    category: 'sapato',
    size: '37',
    color: 'Nude',
    brand: 'Schutz',
    cost: 110.00,
    price: 249.00,
    stock: 2,
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Mule em couro legítimo bico fino com aplicação de tachas delicadas na borda.',
    notes: 'Super confortável.',
    status: 'disponível',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'p8',
    name: 'Bolsa Baguete Alça Corrente Luiza',
    sku: 'PECA-BOLS-008',
    category: 'bolsa',
    size: 'único',
    color: 'Caramelo',
    brand: 'Nossa Marca',
    cost: 80.00,
    price: 189.90,
    stock: 3,
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'],
    description: 'Bolsa baguete estruturada em couro sintético premium com duas opções de alça.',
    notes: 'Sucesso absoluto nos reels.',
    status: 'disponível',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Mariana Medeiros',
    whatsapp: '(11) 98765-4321',
    instagram: '@mari_medeiros',
    email: 'mariana.medeiros@gmail.com',
    cpf: '123.456.789-00',
    address: 'Alameda Lorena, 1420 - Apto 51',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    cep: '01424-002',
    stylePreferences: 'Romântica, elegante, tons pastel',
    sizesUsed: 'M, Vestidos 38',
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c2',
    name: 'Beatriz Vasconcellos',
    whatsapp: '(21) 99988-7766',
    instagram: '@bia_vascon',
    email: 'beatriz.v@outlook.com',
    cpf: '234.567.890-11',
    address: 'Avenida Atlântica, 2300 - Bloco B',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    cep: '22021-001',
    stylePreferences: 'Casual chique, linho, alfaiataria, mule',
    sizesUsed: 'G, Calça 40',
    status: 'active',
    createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'c3',
    name: 'Gabriela Pinheiro',
    whatsapp: '(31) 98877-6655',
    instagram: '@gabi_pinheiro',
    email: 'gabi.pinheiro@yahoo.com.br',
    cpf: '345.678.901-22',
    address: 'Rua Sergipe, 890 - Bloco 1',
    neighborhood: 'Savassi',
    city: 'Belo Horizonte',
    state: 'MG',
    cep: '30130-171',
    stylePreferences: 'Despojada, croppeds, vestidos fluidos',
    sizesUsed: 'P, PP',
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_SALES: Sale[] = [
  {
    id: 's1',
    customerId: 'c1',
    customerName: 'Mariana Medeiros',
    customerWhatsapp: '(11) 98765-4321',
    items: [
      {
        id: 'si1',
        productId: 'p1',
        productName: 'Vestido Midi Linho Sophia',
        sku: 'PECA-VEST-001',
        qty: 1,
        price: 259.90,
        originalPrice: 259.90
      },
      {
        id: 'si2',
        productId: 'p6',
        productName: 'Brinco Argola Banhada Ouro',
        sku: 'PECA-ACES-006',
        qty: 1,
        price: 45.00,
        originalPrice: 45.00
      }
    ],
    subtotal: 304.90,
    discount: 24.90,
    total: 280.00,
    paymentMethod: 'pix',
    paymentStatus: 'pago',
    deliveryMethod: 'motoboy',
    deliveryId: 'd1',
    notes: 'Entregar de tarde após as 14h.',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_SUITCASES: Suitcase[] = [
  {
    id: 'm1',
    code: 'MALA-4902',
    customerId: 'c2',
    customerName: 'Beatriz Vasconcellos',
    customerWhatsapp: '(21) 99988-7766',
    items: [
      {
        id: 'mi1',
        productId: 'p1',
        productName: 'Vestido Midi Linho Sophia',
        sku: 'PECA-VEST-001',
        size: 'M',
        color: 'Terracota',
        price: 259.90,
        status: 'pending'
      },
      {
        id: 'mi2',
        productId: 'p3',
        productName: 'Calça Pantalona Alfaiataria Maitê',
        sku: 'PECA-CALC-003',
        size: 'G',
        color: 'Verde Oliva',
        price: 198.00,
        status: 'purchased'
      },
      {
        id: 'mi3',
        productId: 'p7',
        productName: 'Mule Bico Fino Couro Lavínia',
        sku: 'PECA-SAPA-007',
        size: '37',
        color: 'Nude',
        price: 249.00,
        status: 'returned'
      }
    ],
    dateSent: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    dateReturnExpected: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    dateReturnActual: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: 'com_cliente',
    notes: 'Queria experimentar o vestido para uma festa e a calça para trabalhar.',
    responsible: 'Ana Claudia',
    deliveryId: 'd2'
  }
];

const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: 'd1',
    targetId: 's1',
    targetType: 'sale',
    customerName: 'Mariana Medeiros',
    customerWhatsapp: '(11) 98765-4321',
    address: 'Alameda Lorena, 1420 - Apto 51 - Jardins, São Paulo - SP',
    type: 'motoboy',
    status: 'entregue',
    responsible: 'Carlos Motoboy',
    dateShipped: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    dateDelivered: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    notes: 'Cobrou taxa fixa de R$ 15.'
  },
  {
    id: 'd2',
    targetId: 'm1',
    targetType: 'suitcase',
    customerName: 'Beatriz Vasconcellos',
    customerWhatsapp: '(21) 99988-7766',
    address: 'Avenida Atlântica, 2300 - Bloco B - Copacabana, Rio de Janeiro - RJ',
    type: 'entrega_local',
    status: 'enviado',
    responsible: 'Guilherme Motorista',
    dateShipped: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    notes: 'Entregar mala higienizada.'
  }
];

function getInitialDb(): DatabaseSchema {
  // Inicialização de movimentos de estoque baseada nos produtos e nas vendas existentes
  const stockMovements: StockMovement[] = [];
  
  // Entradas iniciais para todos os produtos
  INITIAL_PRODUCTS.forEach(p => {
    // Digamos que o estoque atual em INITIAL_PRODUCTS é o que restou das entradas iniciais de estoque
    const initialQty = p.stock + (p.id === 'p1' ? 1 : 0) + (p.id === 'p3' ? 1 : 0); // Compensar peças vendidas/consignadas
    stockMovements.push({
      id: `mov_init_${p.id}`,
      productId: p.id,
      productName: p.name,
      qty: initialQty,
      type: 'entrada_manual',
      reason: 'Cadastro Inicial de Estoque',
      user: 'Ana Claudia',
      date: p.createdAt,
      notes: 'Estoque de abertura da loja.'
    });
  });

  // Movimentos decorrentes da Venda S1 (produto p1 e p6 diminuiram estoque em 1)
  stockMovements.push({
    id: 'mov_sale_s1_p1',
    productId: 'p1',
    productName: 'Vestido Midi Linho Sophia',
    qty: 1,
    type: 'venda',
    reason: 'Venda s1',
    user: 'Ana Claudia',
    date: INITIAL_SALES[0].date,
    notes: 'Venda direta realizada para Mariana Medeiros.'
  });

  stockMovements.push({
    id: 'mov_sale_s1_p6',
    productId: 'p6',
    productName: 'Brinco Argola Banhada Ouro',
    qty: 1,
    type: 'venda',
    reason: 'Venda s1',
    user: 'Ana Claudia',
    date: INITIAL_SALES[0].date
  });

  // Movimentos decorrentes da Mala M1
  // p1, p3 e p7 foram para mala
  stockMovements.push({
    id: 'mov_suit_m1_p1',
    productId: 'p1',
    productName: 'Vestido Midi Linho Sophia',
    qty: 1,
    type: 'envio_mala',
    reason: 'Mala MALA-4902',
    user: 'Ana Claudia',
    date: INITIAL_SUITCASES[0].dateSent
  });
  stockMovements.push({
    id: 'mov_suit_m1_p3',
    productId: 'p3',
    productName: 'Calça Pantalona Alfaiataria Maitê',
    qty: 1,
    type: 'envio_mala',
    reason: 'Mala MALA-4902',
    user: 'Ana Claudia',
    date: INITIAL_SUITCASES[0].dateSent
  });
  stockMovements.push({
    id: 'mov_suit_m1_p7',
    productId: 'p7',
    productName: 'Mule Bico Fino Couro Lavínia',
    qty: 1,
    type: 'envio_mala',
    reason: 'Mala MALA-4902',
    user: 'Ana Claudia',
    date: INITIAL_SUITCASES[0].dateSent
  });

  // Beatriz Vasconcellos comprou a calça Maitê (p3) de dentro da mala
  stockMovements.push({
    id: 'mov_suit_purch_p3',
    productId: 'p3',
    productName: 'Calça Pantalona Alfaiataria Maitê',
    qty: 1,
    type: 'venda',
    reason: 'Venda originada da Mala MALA-4902',
    user: 'Ana Claudia',
    date: INITIAL_SUITCASES[0].dateReturnActual || ''
  });

  // Beatriz Vasconcellos devolveu o mule Lavinia (p7)
  stockMovements.push({
    id: 'mov_suit_ret_p7',
    productId: 'p7',
    productName: 'Mule Bico Fino Couro Lavínia',
    qty: 1,
    type: 'retorno_mala',
    reason: 'Retorno da Mala MALA-4902',
    user: 'Ana Claudia',
    date: INITIAL_SUITCASES[0].dateReturnActual || ''
  });

  return {
    users: DEFAULT_USERS,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    stockMovements: stockMovements,
    customers: INITIAL_CUSTOMERS,
    sales: INITIAL_SALES,
    suitcases: INITIAL_SUITCASES,
    deliveries: INITIAL_DELIVERIES
  };
}

let cacheDb: DatabaseSchema | null = null;
let supabaseStatusMsg: string = "Inativo. Configure as chaves de segredo no painel do AI Studio.";
let tableInitialized: boolean = false;

// Tenta carregar os dados do Supabase em segundo plano
async function syncFromSupabase() {
  if (!supabase) return;
  try {
    supabaseStatusMsg = "Conectando ao Supabase...";
    const { data, error } = await supabase
      .from('closet_data')
      .select('data')
      .eq('id', 'default_store')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Tabela existe, mas registro está em branco: inicializar com dados locais
        console.log('Supabase conectado! Tabela encontrada vazia. Inicializando dados iniciais...');
        const initial = readDbLocal();
        const { error: insertError } = await supabase
          .from('closet_data')
          .insert([{ id: 'default_store', data: initial }]);

        if (insertError) {
          console.error('Erro ao inicializar registro no Supabase:', insertError);
          supabaseStatusMsg = `Erro de inserção inicial: ${insertError.message}`;
        } else {
          cacheDb = initial;
          tableInitialized = true;
          supabaseStatusMsg = "Conector Ativo • Base Sincronizada";
        }
      } else {
        console.error('Erro ao ler tabela closet_data do Supabase:', error);
        supabaseStatusMsg = "Tabela 'closet_data' ausente. Crie-a no SQL Editor.";
      }
      return;
    }

    if (data && data.data) {
      console.log('Dados sincronizados com sucesso do Supabase!');
      const loaded = data.data as DatabaseSchema;
      if (!loaded.categories) {
        loaded.categories = INITIAL_CATEGORIES;
      }
      cacheDb = loaded;
      tableInitialized = true;
      supabaseStatusMsg = "Conector Ativo • Nuvem Sincronizada";
      // Salva localmente como cache offline de redundância
      fs.writeFileSync(DB_FILE, JSON.stringify(cacheDb, null, 2), 'utf-8');
    }
  } catch (err: any) {
    console.error('Exceção ao sincronizar com o Supabase:', err);
    supabaseStatusMsg = `Falha de conexão: ${err.message || err}`;
  }
}

// Salva no Supabase de forma assíncrona tolerante a falhas
async function syncToSupabase(data: DatabaseSchema) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('closet_data')
      .upsert({ id: 'default_store', data, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Erro ao gravar dados no Supabase:', error);
      supabaseStatusMsg = `Erro ao salvar: ${error.message}`;
    } else {
      tableInitialized = true;
      supabaseStatusMsg = "Conector Ativo • Nuvem Sincronizada";
    }
  } catch (err: any) {
    console.error('Erro de sincronização remota:', err);
  }
}

function readDbLocal(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading local DB fallback', error);
    return getInitialDb();
  }
}

export function getSupabaseStatus() {
  return {
    configured: !!supabase,
    status: supabase ? "Instanciado" : "Desconectado",
    message: supabaseStatusMsg,
    sql: `CREATE TABLE IF NOT EXISTS closet_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`
  };
}

export function readDb(): DatabaseSchema {
  if (cacheDb) {
    if (!cacheDb.categories) {
      cacheDb.categories = INITIAL_CATEGORIES;
    }
    return cacheDb;
  }

  // Sincronização inicial de cache em memória
  const localData = readDbLocal();
  cacheDb = localData;

  if (!cacheDb.categories) {
    cacheDb.categories = INITIAL_CATEGORIES;
  }

  // Se o Supabase estiver carregado, dispara sincronização de rede em segundo plano
  if (supabase) {
    syncFromSupabase();
  }

  return cacheDb;
}

export function writeDb(data: DatabaseSchema): void {
  cacheDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB cache', error);
  }

  if (supabase) {
    syncToSupabase(data);
  }
}

// Utilitários de manipulação segura para API endpoints
export function getProducts() {
  return readDb().products;
}

export function saveProduct(product: Product) {
  const db = readDb();
  const idx = db.products.findIndex(p => p.id === product.id);
  if (idx > -1) {
    db.products[idx] = { ...product, updatedAt: new Date().toISOString() };
  } else {
    db.products.push({
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  writeDb(db);
  return product;
}

export function addStockMovement(movement: Omit<StockMovement, 'id' | 'date'>) {
  const db = readDb();
  const newMovement: StockMovement = {
    ...movement,
    id: 'mov_' + Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString()
  };
  
  db.stockMovements.push(newMovement);
  
  // Atualizar estoque real do produto correspondente
  const product = db.products.find(p => p.id === movement.productId);
  if (product) {
    if (
      movement.type === 'entrada_manual' ||
      movement.type === 'retorno_mala' ||
      movement.type === 'devolução' ||
      movement.type === 'ajuste'
    ) {
      product.stock += movement.qty;
    } else if (
      movement.type === 'venda' ||
      movement.type === 'reserva' ||
      movement.type === 'envio_mala' ||
      movement.type === 'perda_avaria'
    ) {
      product.stock = Math.max(0, product.stock - movement.qty);
    }
    
    // Atualiza o status apropriadamente do produto dependendo de seu estoque ou eventos
    if (product.stock === 0) {
      if (movement.type === 'perda_avaria') {
        product.status = 'avariado';
      } else if (movement.type === 'venda') {
        product.status = 'vendido';
      } else {
        product.status = 'indisponível';
      }
    } else {
      product.status = 'disponível';
    }
    
    product.updatedAt = new Date().toISOString();
  }
  
  writeDb(db);
  return newMovement;
}
