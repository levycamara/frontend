import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { readDb, writeDb, addStockMovement, getSupabaseStatus } from "./server/db";
import { DatabaseSchema, Category, Product, Customer, Sale, Suitcase, Delivery, StockMovement, User } from "./src/types";

const app = express();
const PORT = 3000;

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -------------------------------------------------------------
// SECURE REST API ENDPOINTS
// -------------------------------------------------------------

// Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }
  
  // Retorna sem a senha por segurança
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Supabase Connection Status Endpoint
app.get("/api/supabase/status", (req, res) => {
  res.json(getSupabaseStatus());
});

// Full DB State (for easy sync / status backups)
app.get("/api/db/export", (req, res) => {
  const db = readDb();
  res.json(db);
});

app.post("/api/db/import", (req, res) => {
  const newDb = req.body;
  if (!newDb.users || !newDb.products || !newDb.customers) {
    return res.status(400).json({ error: "Estrutura do banco de dados inválida para importação" });
  }
  writeDb(newDb);
  res.json({ success: true, message: "Banco de dados importado com sucesso!" });
});

app.post("/api/db/reset", (req, res) => {
  // Apaga o db.json para recriar a partir do seed
  const DB_FILE = path.join(process.cwd(), 'db.json');
  try {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    const freshDb = readDb();
    res.json({ success: true, db: freshDb });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear DB for production
app.post("/api/db/clear", (req, res) => {
  try {
    const db = readDb();
    const cleanDb: DatabaseSchema = {
      users: (db.users && db.users.length > 0 ? db.users : [
        {
          id: '1',
          name: 'Ana Claudia (Admin)',
          email: 'admin@loja.com',
          password: 'admin',
          role: 'admin' as const
        },
        {
          id: '2',
          name: 'Carla Souza (Operadora)',
          email: 'operador@loja.com',
          password: '123',
          role: 'operator' as const
        }
      ]) as User[],
      categories: (db.categories && db.categories.length > 0 ? db.categories : []) as Category[],
      products: [] as Product[],
      stockMovements: [] as StockMovement[],
      customers: [] as Customer[],
      sales: [] as Sale[],
      suitcases: [] as Suitcase[],
      deliveries: [] as Delivery[]
    };
    writeDb(cleanDb);
    res.json({ success: true, db: cleanDb, message: "Todos os dados de teste foram limpos com sucesso!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Categories CRUD
app.get("/api/categories", (req, res) => {
  const db = readDb();
  res.json(db.categories || []);
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome da categoria é obrigatório." });
  }

  const db = readDb();
  if (!db.categories) {
    db.categories = [];
  }

  // Check if name already exists
  const exists = db.categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Já existe uma categoria com esse nome." });
  }

  const slug = name.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  const newCategory = {
    id: 'cat_' + Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    slug
  };

  db.categories.push(newCategory);
  writeDb(db);
  res.status(201).json(newCategory);
});

app.put("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome da categoria é obrigatório." });
  }

  const db = readDb();
  if (!db.categories) {
    db.categories = [];
  }

  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Categoria não encontrada." });
  }

  // Check unique name for other categories
  const exists = db.categories.some(c => c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Já existe uma outra categoria com esse nome." });
  }

  const oldName = db.categories[idx].name;
  const newName = name.trim();

  const slug = newName.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  // Cascade update to products using this category
  db.products = db.products.map(p => {
    if (p.category === oldName) {
      return { ...p, category: newName };
    }
    return p;
  });

  db.categories[idx] = {
    ...db.categories[idx],
    name: newName,
    slug
  };

  writeDb(db);
  res.json(db.categories[idx]);
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.categories) db.categories = [];

  const idx = db.categories.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Categoria não encontrada." });
  }

  const categoryToDelete = db.categories[idx];

  // Prevent deleting if products are in this category
  const countProducts = db.products.filter(p => p.category === categoryToDelete.name).length;
  if (countProducts > 0) {
    return res.status(400).json({ error: `Não é possível excluir esta categoria pois ela possui ${countProducts} produto(s) associado(s).` });
  }

  db.categories.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: "Categoria removida com sucesso!" });
});

// Products CRUD
app.get("/api/products", (req, res) => {
  const db = readDb();
  res.json(db.products);
});

app.post("/api/products", (req, res) => {
  const productData = req.body as Product;
  const db = readDb();
  const operatorName = req.headers["x-operator-name"] as string || "Administrador";

  if (!productData.name || !productData.category || !productData.price) {
    return res.status(400).json({ error: "Nome, categoria e preço de venda são campos obrigatórios." });
  }

  // Se tiver de criar variações (tamanhos múltiplos), tratamos isso se o cliente enviar um array de tamanhos
  const sizes = req.body.bulkSizes as string[]; // ex: ['P', 'M', 'G']
  const productsToSave: Product[] = [];

  if (sizes && sizes.length > 0) {
    // Cadastro em massa por variação de tamanho
    sizes.forEach((sz, idx) => {
      const shortCat = productData.category.substring(0, 4).toUpperCase();
      const randomSku = Math.floor(1000 + Math.random() * 9000);
      const generatedSku = `PECA-${shortCat}-${randomSku}-${sz}`;
      
      const newProduct: Product = {
        ...productData,
        id: `p_${Math.random().toString(36).substring(2, 9)}_${idx}`,
        sku: generatedSku,
        size: sz,
        stock: productData.stock, // Cada variação herda esse estoque inicial
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.products.push(newProduct);
      productsToSave.push(newProduct);

      // Registrar movimento inicial de estoque para cada peça
      db.stockMovements.push({
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        productId: newProduct.id,
        productName: newProduct.name,
        qty: newProduct.stock,
        type: 'entrada_manual',
        reason: 'Cadastro Inicial de Variação',
        user: operatorName,
        date: new Date().toISOString()
      });
    });
    
    writeDb(db);
    return res.json({ bulk: true, products: productsToSave });
  }

  // Cadastro de produto único tradicional
  const idx = db.products.findIndex(p => p.id === productData.id);
  if (idx > -1) {
    // Registrar diferença de estoque como movimento se mudou manualmente
    const oldProduct = db.products[idx];
    const diff = productData.stock - oldProduct.stock;
    if (diff !== 0) {
      db.stockMovements.push({
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        productId: oldProduct.id,
        productName: productData.name,
        qty: Math.abs(diff),
        type: diff > 0 ? 'entrada_manual' : 'ajuste',
        reason: 'Ajuste manual de estoque na edição de produto',
        user: operatorName,
        date: new Date().toISOString()
      });
    }

    db.products[idx] = {
      ...productData,
      updatedAt: new Date().toISOString()
    };
    writeDb(db);
    res.json(db.products[idx]);
  } else {
    // Gerar SKU automático
    if (!productData.sku) {
      const shortCat = productData.category.substring(0, 4).toUpperCase();
      const randomSku = Math.floor(1000 + Math.random() * 9000);
      productData.sku = `PECA-${shortCat}-${randomSku}`;
    }
    
    const newProduct: Product = {
      ...productData,
      id: productData.id || `p_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.products.push(newProduct);
    
    // Movimento inicial de estoque
    db.stockMovements.push({
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      productId: newProduct.id,
      productName: newProduct.name,
      qty: newProduct.stock,
      type: 'entrada_manual',
      reason: 'Cadastro de Produto',
      user: operatorName,
      date: new Date().toISOString()
    });

    writeDb(db);
    res.json(newProduct);
  }
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  // Arquivar produto - marcar como indisponivel por softdelete
  const productIdx = db.products.findIndex(p => p.id === id);
  if (productIdx > -1) {
    db.products[productIdx].status = 'indisponível';
    db.products[productIdx].stock = 0;
    db.products[productIdx].updatedAt = new Date().toISOString();
    
    // Movimento de zeramento
    db.stockMovements.push({
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      productId: id,
      productName: db.products[productIdx].name,
      qty: 0,
      type: 'ajuste',
      reason: 'Produto arquivado / excluído',
      user: 'Administrador',
      date: new Date().toISOString()
    });

    writeDb(db);
    res.json({ success: true, message: "Produto arquivado!" });
  } else {
    res.status(404).json({ error: "Produto não encontrado." });
  }
});

// Stock Movements
app.get("/api/products/:id/movements", (req, res) => {
  const db = readDb();
  const filterMvt = db.stockMovements.filter(m => m.productId === req.params.id);
  res.json(filterMvt);
});

app.post("/api/stock/move", (req, res) => {
  const { productId, qty, type, reason, user, notes } = req.body;
  if (!productId || !qty || !type) {
    return res.status(400).json({ error: "productId, qty e type são campos obrigatórios." });
  }
  
  const db = readDb();
  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Produto não encontrado." });
  }

  const mov = addStockMovement({
    productId,
    productName: product.name,
    qty: Number(qty),
    type,
    reason: reason || "Movimentação manual",
    user: user || "Administrador",
    notes
  });

  res.json(mov);
});


// Customers CRUD
app.get("/api/customers", (req, res) => {
  const db = readDb();
  
  // Calcular totalSpent dinâmico para os clientes
  const customersWithTotals = db.customers.map(c => {
    const clientSales = db.sales.filter(s => s.customerId === c.id && s.paymentStatus === 'pago');
    const totalSpent = clientSales.reduce((acc, curr) => acc + curr.total, 0);
    const purchaseCount = clientSales.length;
    return {
      ...c,
      totalSpent,
      purchaseCount
    };
  });
  
  res.json(customersWithTotals);
});

app.post("/api/customers", (req, res) => {
  const customerData = req.body as Customer;
  const db = readDb();

  if (!customerData.name || !customerData.whatsapp) {
    return res.status(400).json({ error: "Nome e WhatsApp são obrigatórios." });
  }

  const idx = db.customers.findIndex(c => c.id === customerData.id);
  if (idx > -1) {
    db.customers[idx] = {
      ...customerData,
      status: customerData.status || 'active'
    };
    writeDb(db);
    res.json(db.customers[idx]);
  } else {
    const newCustomer: Customer = {
      ...customerData,
      id: customerData.id || `c_${Math.random().toString(36).substring(2, 9)}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    db.customers.push(newCustomer);
    writeDb(db);
    res.json(newCustomer);
  }
});

app.delete("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const idx = db.customers.findIndex(c => c.id === id);
  if (idx > -1) {
    db.customers[idx].status = 'inactive';
    writeDb(db);
    res.json({ success: true, message: "Cliente inativado com sucesso!" });
  } else {
    res.status(404).json({ error: "Cliente não encontrado" });
  }
});


// Sales / Checkout
app.get("/api/sales", (req, res) => {
  const db = readDb();
  res.json(db.sales);
});

app.post("/api/sales", (req, res) => {
  const { 
    customerId, 
    customerName, 
    customerWhatsapp,
    items, 
    subtotal, 
    discount, 
    total, 
    paymentMethod, 
    paymentStatus, 
    deliveryMethod, 
    notes,
    originatedFromSuitcaseId 
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "É necessário adicionar pelo menos um produto." });
  }

  const db = readDb();
  const operatorName = req.headers["x-operator-name"] as string || "Administrador";

  // Verificar e garantir cadastro rápido de cliente se enviado apenas nome/whatsapp sem ID
  let resolvedCustomerId = customerId;
  let resolvedCustomerName = customerName;
  let resolvedWhatsapp = customerWhatsapp;

  if (!resolvedCustomerId || resolvedCustomerId === 'novo') {
    // Cadastrar cliente de forma rápida
    const newCustId = `c_${Math.random().toString(36).substring(2, 9)}`;
    const newCust: Customer = {
      id: newCustId,
      name: customerName || "Cliente Consumidor",
      whatsapp: customerWhatsapp || "(00) 90000-0000",
      instagram: "@",
      address: "Retirada",
      neighborhood: "",
      city: "",
      state: "",
      cep: "",
      status: 'active',
      createdAt: new Date().toISOString()
    };
    db.customers.push(newCust);
    resolvedCustomerId = newCustId;
    resolvedCustomerName = newCust.name;
    resolvedWhatsapp = newCust.whatsapp;
  } else {
    const existingCust = db.customers.find(c => c.id === resolvedCustomerId);
    if (existingCust) {
      resolvedCustomerName = existingCust.name;
      resolvedWhatsapp = existingCust.whatsapp;
    }
  }

  // Prevenir venda de produto sem estoque suficiente
  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(404).json({ error: `Produto ${item.productName} não encontrado.` });
    }
    // Se o item não tem estoque disponível E NÃO vem de uma mala consignada (já descontada do estoque ativo)
    if (prod.stock < item.qty && !originatedFromSuitcaseId) {
      return res.status(400).json({ error: `Estoque insuficiente para ${prod.name}. Disponível: ${prod.stock}` });
    }
  }

  // Baixar estoque real dos produtos comprados (somente se não vier de mala, já que o envio da mala já removeu do estoque disponível)
  items.forEach((item: any) => {
    if (!originatedFromSuitcaseId) {
      const prod = db.products.find(p => p.id === item.productId)!;
      prod.stock = Math.max(0, prod.stock - item.qty);
      if (prod.stock === 0) {
        prod.status = 'vendido';
      }
      prod.updatedAt = new Date().toISOString();

      // Registrar movimento de estoque da venda
      db.stockMovements.push({
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        productId: item.productId,
        productName: item.productName,
        qty: item.qty,
        type: 'venda',
        reason: `Venda Direta`,
        user: operatorName,
        date: new Date().toISOString()
      });
    } else {
      // Se veio de mala: mudamos o status do produto da mala para vendido
      // (pois o estoque já havia sido diminuído no envio e o item estava no estado "em mala")
      const prod = db.products.find(p => p.id === item.productId)!;
      prod.status = 'vendido';
      prod.updatedAt = new Date().toISOString();

      // Registrar movimento de estoque correspondente a compra saindo definitivamente da mala
      db.stockMovements.push({
        id: 'mov_' + Math.random().toString(36).substring(2, 9),
        productId: item.productId,
        productName: item.productName,
        qty: item.qty,
        type: 'venda',
        reason: `Mala comprada: ${originatedFromSuitcaseId}`,
        user: operatorName,
        date: new Date().toISOString()
      });
    }
  });

  // Criar Registro de Entrega se não for Retirada imediata
  let deliveryId = undefined;
  if (deliveryMethod !== 'retirada') {
    const cust = db.customers.find(c => c.id === resolvedCustomerId);
    const fullAddr = cust ? `${cust.address}, Bairro: ${cust.neighborhood}, CEP: ${cust.cep} - ${cust.city}/${cust.state}` : "Pegar endereço com cliente";
    
    const newDelivery: Delivery = {
      id: `d_${Math.random().toString(36).substring(2, 9)}`,
      targetId: '', // Será atualizado após criar a venda
      targetType: 'sale',
      customerName: resolvedCustomerName,
      customerWhatsapp: resolvedWhatsapp,
      address: fullAddr,
      type: deliveryMethod,
      status: 'pendente',
      responsible: 'Carlos Motoboy',
      notes: notes || ''
    };
    db.deliveries.push(newDelivery);
    deliveryId = newDelivery.id;
  }

  // Criar a Venda
  const newSale: Sale = {
    id: `s_${Math.random().toString(36).substring(2, 9)}`,
    customerId: resolvedCustomerId,
    customerName: resolvedCustomerName,
    customerWhatsapp: resolvedWhatsapp,
    items,
    subtotal: Number(subtotal),
    discount: Number(discount || 0),
    total: Number(total),
    paymentMethod,
    paymentStatus,
    deliveryMethod,
    deliveryId,
    notes,
    date: new Date().toISOString(),
    originatedFromSuitcaseId
  };

  db.sales.push(newSale);

  // Se criamos uma entrega, vincular o ID da venda nela
  if (deliveryId) {
    const delivery = db.deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      delivery.targetId = newSale.id;
    }
  }

  writeDb(db);
  res.json(newSale);
});


// Suitcases (Malas Consignadas)
app.get("/api/suitcases", (req, res) => {
  const db = readDb();
  res.json(db.suitcases);
});

app.post("/api/suitcases", (req, res) => {
  const { 
    customerId, 
    items, 
    dateSent, 
    dateReturnExpected, 
    notes, 
    responsible, 
    deliveryMethod 
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Mala vazia. Adicione peças à mala." });
  }

  const db = readDb();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) {
    return res.status(404).json({ error: "Cliente não encontrado." });
  }

  // Verificar estoque disponível para todos os itens da mala
  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId);
    if (!prod) {
      return res.status(404).json({ error: `Produto ${item.productName} não encontrado.` });
    }
    if (prod.stock < 1) {
      return res.status(400).json({ error: `Produto sem estoque para mala: ${prod.name}` });
    }
  }

  // Modificar produtos para status 'em mala' e diminuir o estoque disponível
  items.forEach((item: any) => {
    const prod = db.products.find(p => p.id === item.productId)!;
    prod.stock = Math.max(0, prod.stock - 1); // Remove uma peça do ativo
    prod.status = 'em mala';
    prod.updatedAt = new Date().toISOString();

    // Registrar movimentação de estoque
    db.stockMovements.push({
      id: 'mov_' + Math.random().toString(36).substring(2, 9),
      productId: item.productId,
      productName: item.productName,
      qty: 1,
      type: 'envio_mala',
      reason: `Envio para mala`,
      user: responsible || "Operadora",
      date: new Date().toISOString()
    });
  });

  // Criar Registro de Entrega se método for envio externo
  let deliveryId = undefined;
  if (deliveryMethod && deliveryMethod !== 'retirada') {
    const newDelivery: Delivery = {
      id: `d_${Math.random().toString(36).substring(2, 9)}`,
      targetId: '', // Será atualizado após cadastrar a mala
      targetType: 'suitcase',
      customerName: customer.name,
      customerWhatsapp: customer.whatsapp,
      address: `${customer.address}, ${customer.neighborhood} - ${customer.city}/${customer.state}`,
      type: deliveryMethod,
      status: 'pendente',
      responsible: 'Guilherme Motorista',
      notes: notes || 'Entregar mala com cabides e limpa.'
    };
    db.deliveries.push(newDelivery);
    deliveryId = newDelivery.id;
  }

  const codeShort = `MALA-${Math.floor(1000 + Math.random() * 9000)}`;

  const newSuitcase: Suitcase = {
    id: `m_${Math.random().toString(36).substring(2, 9)}`,
    code: codeShort,
    customerId,
    customerName: customer.name,
    customerWhatsapp: customer.whatsapp,
    items: items.map((it: any) => ({
      id: `mi_${Math.random().toString(36).substring(2, 9)}`,
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      size: it.size,
      color: it.color,
      price: it.price,
      status: 'pending' // Inicialmente pendente decisão
    })),
    dateSent: dateSent || new Date().toISOString(),
    dateReturnExpected: dateReturnExpected || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    status: 'enviada',
    notes,
    responsible: responsible || "Operadora",
    deliveryId
  };

  db.suitcases.push(newSuitcase);

  if (deliveryId) {
    const delivery = db.deliveries.find(d => d.id === deliveryId);
    if (delivery) {
      delivery.targetId = newSuitcase.id;
    }
  }

  writeDb(db);
  res.json(newSuitcase);
});

// Fechar / Resolver Mala Consignada (item por item)
app.post("/api/suitcases/:id/close", (req, res) => {
  const { id } = req.params;
  const { itemsDecisions, discount, paymentMethod, notes, responsible } = req.body;
  // itemsDecisions: { [itemId]: 'purchased' | 'returned' | 'damaged' | 'missing' }

  const db = readDb();
  const suitcase = db.suitcases.find(m => m.id === id);
  if (!suitcase) {
    return res.status(404).json({ error: "Mala não encontrada." });
  }

  const purchasedItems: any[] = [];
  const operatorName = responsible || "Administrador";

  // Processar decisões
  suitcase.items.forEach(item => {
    const decision = itemsDecisions[item.id];
    if (decision) {
      item.status = decision;
      
      const prod = db.products.find(p => p.id === item.productId);
      
      if (decision === 'purchased') {
        // Vai acumular para criar a venda automática
        purchasedItems.push({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          qty: 1,
          price: item.price,
          originalPrice: item.price
        });
        
        // Produto é definitivamente vendido - o estoque físico já foi baixado na ida da mala
        if (prod) {
          prod.status = 'vendido';
          prod.updatedAt = new Date().toISOString();
        }
        
        // Movimento de venda
        db.stockMovements.push({
          id: 'mov_' + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productName: item.productName,
          qty: 1,
          type: 'venda',
          reason: `Venda via mala ${suitcase.code}`,
          user: operatorName,
          date: new Date().toISOString()
        });
      } 
      else if (decision === 'returned') {
        // Retorna o item ao estoque disponível
        if (prod) {
          prod.stock += 1;
          prod.status = 'disponível';
          prod.updatedAt = new Date().toISOString();
        }

        // Movimento de retorno
        db.stockMovements.push({
          id: 'mov_' + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productName: item.productName,
          qty: 1,
          type: 'retorno_mala',
          reason: `Retorno da mala ${suitcase.code}`,
          user: operatorName,
          date: new Date().toISOString()
        });
      }
      else if (decision === 'damaged') {
        // Fica avariado - não retorna ao estoque disponível
        if (prod) {
          prod.status = 'avariado';
          prod.updatedAt = new Date().toISOString();
        }

        db.stockMovements.push({
          id: 'mov_' + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productName: item.productName,
          qty: 1,
          type: 'perda_avaria',
          reason: `Peça avariada na mala ${suitcase.code}`,
          user: operatorName,
          date: new Date().toISOString()
        });
      }
      else if (decision === 'missing') {
        // Não retornou
        if (prod) {
          prod.status = 'indisponível';
          prod.updatedAt = new Date().toISOString();
        }

        db.stockMovements.push({
          id: 'mov_' + Math.random().toString(36).substring(2, 9),
          productId: item.productId,
          productName: item.productName,
          qty: 1,
          type: 'perda_avaria',
          reason: `Peça não retornou da mala ${suitcase.code}`,
          user: operatorName,
          date: new Date().toISOString()
        });
      }
    }
  });

  // Criar venda automática se houver itens comprados
  let autoSale: Sale | null = null;
  if (purchasedItems.length > 0) {
    const subtotal = purchasedItems.reduce((acc, curr) => acc + curr.price, 0);
    const total = Math.max(0, subtotal - Number(discount || 0));

    autoSale = {
      id: `s_${Math.random().toString(36).substring(2, 9)}`,
      customerId: suitcase.customerId,
      customerName: suitcase.customerName,
      customerWhatsapp: suitcase.customerWhatsapp,
      items: purchasedItems,
      subtotal,
      discount: Number(discount || 0),
      total,
      paymentMethod: paymentMethod || 'pix',
      paymentStatus: 'pago',
      deliveryMethod: 'mala_enviada',
      notes: `Venda gerada no fechamento da mala Consignada ${suitcase.code}.`,
      date: new Date().toISOString(),
      originatedFromSuitcaseId: suitcase.id
    };

    db.sales.push(autoSale);
  }

  // Atualizar status final da mala
  suitcase.status = 'finalizada';
  suitcase.dateReturnActual = new Date().toISOString();
  if (notes) {
    suitcase.notes = (suitcase.notes ? suitcase.notes + "\n" : "") + "Fechamento: " + notes;
  }

  writeDb(db);
  res.json({ suitcase, sale: autoSale });
});


// Deliveries
app.get("/api/deliveries", (req, res) => {
  const db = readDb();
  res.json(db.deliveries);
});

app.post("/api/deliveries/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, trackingCode, dateShipped, dateDelivered } = req.body;

  const db = readDb();
  const delivery = db.deliveries.find(d => d.id === id);
  if (!delivery) {
    return res.status(404).json({ error: "Entrega não encontrada." });
  }

  delivery.status = status;
  if (trackingCode !== undefined) delivery.trackingCode = trackingCode;
  if (dateShipped) delivery.dateShipped = dateShipped;
  if (dateDelivered) delivery.dateDelivered = dateDelivered;

  writeDb(db);
  res.json(delivery);
});


// -------------------------------------------------------------
// VITE MIDDLEWARE SETUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Criar o arquivo de dados síncronos se não existir
readDb();

startServer();
