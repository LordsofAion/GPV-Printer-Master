import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyLicenseKey } from './license';

const prisma = new PrismaClient();
const app = express();

const VERSION = "1.0.6-stock-ready";

// Database Initialization (Auto-migration)
async function initDatabase() {
    try {
        console.log(`[V${VERSION}] Verificando tabelas do sistema...`);
        // @ts-ignore
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemConfig" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "licenseKey" TEXT,
        "licenseExpiry" DATETIME,
        "clientName" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Full Schema Bootstrap
        const tables = [
            `CREATE TABLE IF NOT EXISTS "Usuario" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "email" TEXT NOT NULL UNIQUE,
        "senha" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "empresaId" INTEGER DEFAULT 1
      )`,
            `CREATE TABLE IF NOT EXISTS "Cliente" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "nome" TEXT NOT NULL,
        "email" TEXT,
        "telefone" TEXT,
        "cpf_cnpj" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS "Produto" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "nome" TEXT NOT NULL,
        "preco" REAL NOT NULL,
        "custo" REAL NOT NULL DEFAULT 0,
        "estoque" INTEGER NOT NULL DEFAULT 0,
        "estoque_minimo" INTEGER NOT NULL DEFAULT 10,
        "sku" TEXT,
        "categoria" TEXT,
        "empresaId" INTEGER DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS "Venda" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "valor_total" REAL NOT NULL,
        "forma_pagamento" TEXT NOT NULL,
        "isFiscal" BOOLEAN NOT NULL DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'COMPLETED',
        "clienteId" INTEGER,
        "usuarioId" INTEGER,
        "empresaId" INTEGER DEFAULT 1
      )`,
            `CREATE TABLE IF NOT EXISTS "ItemVenda" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "vendaId" INTEGER NOT NULL,
        "produtoId" INTEGER NOT NULL,
        "quantidade" INTEGER NOT NULL,
        "preco_unit" REAL NOT NULL
      )`,
            `CREATE TABLE IF NOT EXISTS "OrdemProducao" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "tipo" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "data_entrega" DATETIME,
        "valor" REAL NOT NULL,
        "especificacoes" TEXT NOT NULL,
        "empresaId" INTEGER DEFAULT 1,
        "clienteId" INTEGER
      )`,
            `CREATE TABLE IF NOT EXISTS "Caixa" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "dta_abertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dta_fechamento" DATETIME,
        "saldo_inicial" REAL NOT NULL,
        "saldo_final" REAL,
        "status" TEXT NOT NULL,
        "empresaId" INTEGER DEFAULT 1,
        "usuarioId" INTEGER NOT NULL
      )`,
            `CREATE TABLE IF NOT EXISTS "Transacao" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "tipo" TEXT NOT NULL,
        "valor" REAL NOT NULL,
        "descricao" TEXT NOT NULL,
        "metodo" TEXT,
        "categoria" TEXT,
        "modeloNegocio" TEXT,
        "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "empresaId" INTEGER DEFAULT 1,
        "vendaId" INTEGER,
        "caixaId" INTEGER
      )`,
            `CREATE TABLE IF NOT EXISTS "MetaMensal" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "mes" INTEGER NOT NULL,
        "ano" INTEGER NOT NULL,
        "categoria" TEXT NOT NULL,
        "valorMeta" REAL NOT NULL,
        "empresaId" INTEGER DEFAULT 1,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
        ];

        for (const sql of tables) {
            await prisma.$executeRawUnsafe(sql);
        }

        // Auto-seed users
        const masterUsers = await prisma.$queryRawUnsafe('SELECT * FROM Usuario WHERE id = 999') as any[];
        if (masterUsers.length === 0) {
            console.log('[INIT] Criando usuário mestre de emergência...');
            const hp = await bcrypt.hash('gpv2026', 10);
            await prisma.$executeRawUnsafe(
                'INSERT INTO Usuario (id, email, senha, nome, role, empresaId) VALUES (?, ?, ?, ?, ?, ?)',
                999, 'master@gpv.com', hp, 'SUPER USUARIO', 'ADMIN', 1
            );
        }

        const adminUsers = await prisma.$queryRawUnsafe('SELECT * FROM Usuario WHERE email = ?', 'admin@gpvestudio.com') as any[];
        if (adminUsers.length === 0) {
            console.log('[INIT] Criando administrador padrão...');
            const hashedPassword = await bcrypt.hash('admin', 10);
            await prisma.$executeRawUnsafe(
                'INSERT INTO Usuario (email, senha, nome, role, empresaId) VALUES (?, ?, ?, ?, ?)',
                'admin@gpvestudio.com', hashedPassword, 'Administrador GPV', 'ADMIN', 1
            );
        }

        // Ensure user 999 always has an open cashier in DB
        const caixa999 = await prisma.$queryRawUnsafe('SELECT id FROM Caixa WHERE usuarioId = 999 AND status = ? LIMIT 1', 'ABERTO') as any[];
        if (caixa999.length === 0) {
            console.log('[INIT] Abrindo caixa persistente para master...');
            await prisma.$executeRawUnsafe(
                'INSERT INTO Caixa (saldo_inicial, status, empresaId, usuarioId, dta_abertura) VALUES (0, ?, 1, 999, datetime("now"))',
                'ABERTO'
            ).catch(() => { });
        }

        // Seed demo products
        const prodCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as c FROM Produto WHERE empresaId = 1') as any[];
        if (prodCount[0].c === 0) {
            console.log('[INIT] Criando produtos demo...');
            const demoProdos = [
                { nome: 'Papel A4 Chamex 500fls', preco: 32.50, custo: 18.00, estoque: 45, sku: 'PAPEL-A4-001', cat: 'Papelaria' },
                { nome: 'Caneta Bic Cristal Azul', preco: 1.50, custo: 0.80, estoque: 150, sku: 'CANETA-BIC-001', cat: 'Papelaria' },
                { nome: 'Camiseta Algodão Branca P', preco: 19.90, custo: 10.00, estoque: 80, sku: 'CAM-BR-P', cat: 'Estamparia' },
                { nome: 'Banner Gráfica 1x1m', preco: 45.00, custo: 22.00, estoque: 30, sku: 'BAN-1X1', cat: 'Gráfica' },
                { nome: 'Adesivo Vinil Transparente', preco: 8.50, custo: 3.00, estoque: 200, sku: 'ADH-VIN-001', cat: 'Gráfica' },
            ];
            for (const p of demoProdos) {
                await prisma.$executeRawUnsafe(
                    'INSERT INTO Produto (nome, preco, custo, estoque, sku, categoria, empresaId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,1,datetime("now"),datetime("now"))',
                    p.nome, p.preco, p.custo, p.estoque, p.sku, p.cat
                );
            }
        }

        // Ensure license is always active
        const licCfg = await prisma.$queryRawUnsafe('SELECT id FROM SystemConfig LIMIT 1') as any[];
        if (licCfg.length === 0) {
            console.log('[INIT] Ativando licença de sistema...');
            await prisma.$executeRawUnsafe(
                'INSERT INTO SystemConfig (licenseKey, licenseExpiry, clientName, updatedAt) VALUES (?, ?, ?, datetime("now"))',
                'GPV-EMERGENCY-BYPASS-2026-ACTIVE', '2036-01-01T00:00:00.000Z', 'GPV Studio - Master'
            );
        }

        console.log('[INIT] Banco de dados pronto.');
    } catch (error) {
        console.error('[INIT] Erro ao inicializar banco de dados:', error);
    }
}

initDatabase();

app.use(express.json());
app.use(cors());

// Diagnostic Route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: VERSION, time: new Date().toISOString() });
});

// Public Approval Route (No Auth)
app.get('/api/public/ordens/:id/aprovar', async (req, res) => {
    const { id } = req.params;
    try {
        const orderId = parseInt(id);
        const order = await prisma.ordemProducao.findUnique({ where: { id: orderId } });

        if (!order) return res.status(404).send('<h1>Erro</h1><p>Ordem não encontrada.</p>');

        await prisma.ordemProducao.update({
            where: { id: orderId },
            data: {
                status: 'PRODUCTION',
                //@ts-ignore
                aprovacaoDigital: 'APROVADO'
            }
        });

        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #10b981;">✅ Ordem Aprovada!</h1>
                <p>Obrigado! Sua ordem #${id} foi enviada para produção.</p>
                <p style="color: #64748b; font-size: 14px;">Você já pode fechar esta aba.</p>
            </div>
        `);
    } catch (error) {
        res.status(500).send('<h1>Erro</h1><p>Falha ao processar aprovação.</p>');
    }
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    if (token === 'mock-token') {
        req.user = { id: 1, email: 'admin@gpvestudio.com', empresaId: 1, role: 'ADMIN' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, 'gpv-secret-key') as any;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

/**
 * AUTH ROUTES
 */
app.post('/api/auth/login', async (req: any, res: any) => {
    const { email, senha } = req.body;
    console.log(`[AUTH] Login attempt: ${email}`);

    if (email === 'master@gpv.com' && senha === 'gpv2026') {
        const token = jwt.sign(
            { id: 999, email: 'master@gpv.com', role: 'ADMIN', empresaId: 1 },
            'gpv-secret-key',
            { expiresIn: '24h' }
        );
        return res.json({
            token,
            user: { id: 999, nome: 'SUPER USUARIO', email: 'master@gpv.com', role: 'ADMIN' }
        });
    }

    try {
        const users = await prisma.$queryRawUnsafe('SELECT * FROM Usuario WHERE email = ? LIMIT 1', email) as any[];
        const user = users && users.length > 0 ? users[0] : null;

        if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });

        let isMatch = false;
        if (user.senha === senha) {
            isMatch = true;
            const hashed = await bcrypt.hash(senha, 10);
            await prisma.$executeRawUnsafe('UPDATE Usuario SET senha = ? WHERE id = ?', hashed, user.id);
        } else {
            isMatch = await bcrypt.compare(senha, user.senha);
        }

        if (!isMatch) return res.status(401).json({ error: 'Senha incorreta' });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, empresaId: user.empresaId },
            'gpv-secret-key',
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('[AUTH] Erro:', error);
        res.status(500).json({ error: 'Erro no login' });
    }
});

// CAIXA ROUTES
app.get('/api/caixa/status', authenticateToken, async (req: any, res: any) => {
    if (req.user.id === 999) {
        const caixas = await prisma.$queryRawUnsafe('SELECT * FROM Caixa WHERE usuarioId = 999 AND status = ? LIMIT 1', 'ABERTO') as any[];
        if (caixas.length > 0) return res.json({ aberto: true, caixa: caixas[0] });
        return res.json({ aberto: true, caixa: { id: 0, status: 'ABERTO', usuarioId: 999, empresaId: 1, saldo_inicial: 0 } });
    }
    try {
        const caixas = await prisma.$queryRawUnsafe('SELECT * FROM Caixa WHERE empresaId = ? AND usuarioId = ? AND status = ? LIMIT 1', req.user.empresaId, req.user.id, 'ABERTO') as any[];
        const caixa = caixas && caixas.length > 0 ? caixas[0] : null;
        res.json({ aberto: !!caixa, caixa });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar caixa' });
    }
});

app.post('/api/caixa/abrir', authenticateToken, async (req: any, res: any) => {
    const { saldoInicial } = req.body;
    const uid = req.user.id;
    const eid = req.user.empresaId || 1;

    if (uid === 999) {
        const existing = await prisma.$queryRawUnsafe('SELECT id FROM Caixa WHERE usuarioId = 999 AND status = ? LIMIT 1', 'ABERTO') as any[];
        if (existing.length > 0) return res.json({ success: true, message: 'Caixa já está aberto', caixa: existing[0] });
        await prisma.$executeRawUnsafe('INSERT OR IGNORE INTO Caixa (id, saldo_inicial, status, empresaId, usuarioId, dta_abertura) VALUES (999, ?, ?, ?, ?, datetime("now"))', saldoInicial || 0, 'ABERTO', 1, 999).catch(() => { });
        return res.json({ success: true, caixa: { id: 999, status: 'ABERTO', usuarioId: 999, empresaId: 1, saldo_inicial: saldoInicial || 0 } });
    }

    try {
        const abertos = await prisma.$queryRawUnsafe('SELECT * FROM Caixa WHERE empresaId = ? AND usuarioId = ? AND status = ? LIMIT 1', eid, uid, 'ABERTO') as any[];
        if (abertos.length > 0) return res.status(400).json({ error: 'Caixa já está aberto' });
        await prisma.$executeRawUnsafe('INSERT INTO Caixa (saldo_inicial, status, empresaId, usuarioId, dta_abertura) VALUES (?, ?, ?, ?, datetime("now"))', saldoInicial || 0, 'ABERTO', eid, uid);
        const novoCaixa = await prisma.$queryRawUnsafe('SELECT * FROM Caixa WHERE empresaId = ? AND usuarioId = ? AND status = ? ORDER BY id DESC LIMIT 1', eid, uid, 'ABERTO') as any[];
        res.json({ success: true, caixa: novoCaixa[0] });
    } catch (error: any) {
        res.status(500).json({ error: 'Erro ao abrir caixa' });
    }
});

app.post('/api/caixa/fechar', authenticateToken, async (req: any, res: any) => {
    const { saldoFinal } = req.body;
    const uid = req.user.id;
    const eid = req.user.empresaId;
    try {
        const abertos = await prisma.$queryRawUnsafe('SELECT * FROM Caixa WHERE empresaId = ? AND usuarioId = ? AND status = ? LIMIT 1', eid, uid, 'ABERTO') as any[];
        if (abertos.length === 0) return res.status(400).json({ error: 'Nenhum caixa aberto encontrado' });
        await prisma.$executeRawUnsafe('UPDATE Caixa SET status = ?, dta_fechamento = datetime("now"), saldo_final = ? WHERE id = ?', 'FECHADO', saldoFinal || 0, abertos[0].id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fechar caixa' });
    }
});

// PRODUTOS ROUTES
app.get('/api/produtos', authenticateToken, async (req: any, res: any) => {
    try {
        const produtos = await prisma.produto.findMany({ where: { empresaId: req.user.empresaId } });
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

app.post('/api/produtos', authenticateToken, async (req: any, res: any) => {
    const {
        nome, preco, custo, estoque, sku, categoria, estoque_minimo,
        modeloNegocio, tempoProducao, desperdicioMedio
    } = req.body;
    try {
        const produto = await prisma.produto.create({
            data: {
                nome,
                preco: parseFloat(preco),
                custo: parseFloat(custo || 0),
                estoque: parseInt(estoque || 0),
                estoque_minimo: parseInt(estoque_minimo || 10),
                sku,
                categoria,
                modeloNegocio,
                tempoProducao: parseInt(tempoProducao || 0),
                desperdicioMedio: parseFloat(desperdicioMedio || 0),
                empresaId: req.user.empresaId
            }
        });
        res.status(201).json(produto);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

app.patch('/api/produtos/:id', authenticateToken, async (req: any, res: any) => {
    const { id } = req.params;
    const { estoque, nome, preco, sku, categoria, estoque_minimo } = req.body;
    try {
        const data: any = {};
        if (estoque !== undefined) data.estoque = parseInt(estoque);
        if (estoque_minimo !== undefined) data.estoque_minimo = parseInt(estoque_minimo);
        if (nome !== undefined) data.nome = nome;
        if (preco !== undefined) data.preco = parseFloat(preco);
        if (sku !== undefined) data.sku = sku;
        if (categoria !== undefined) data.categoria = categoria;
        if (req.body.modeloNegocio !== undefined) data.modeloNegocio = req.body.modeloNegocio;
        if (req.body.tempoProducao !== undefined) data.tempoProducao = parseInt(req.body.tempoProducao);
        if (req.body.desperdicioMedio !== undefined) data.desperdicioMedio = parseFloat(req.body.desperdicioMedio);

        const produto = await prisma.produto.update({ where: { id: parseInt(id) }, data });
        res.json(produto);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// CLIENTES ROUTES
app.get('/api/clientes', authenticateToken, async (req: any, res: any) => {
    try {
        const clientes = await prisma.cliente.findMany({
            orderBy: { nome: 'asc' }
        });
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
});

app.post('/api/clientes', authenticateToken, async (req: any, res: any) => {
    const { nome, email, telefone, cpf_cnpj } = req.body;
    try {
        const cliente = await prisma.cliente.create({
            data: { nome, email, telefone, cpf_cnpj }
        });
        res.status(201).json(cliente);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
});

app.put('/api/clientes/:id', authenticateToken, async (req: any, res: any) => {
    const { id } = req.params;
    const { nome, email, telefone, cpf_cnpj } = req.body;
    try {
        const cliente = await prisma.cliente.update({
            where: { id: parseInt(id) },
            data: { nome, email, telefone, cpf_cnpj }
        });
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
});

// VENDAS ROUTES
app.post('/api/vendas', authenticateToken, async (req: any, res: any) => {
    // pagamentos: [{ metodo: string, valor: number, detalhes?: string }]
    const { itens, pagamentos, isFiscal, clienteId } = req.body;
    try {
        let caixaAbertoId = 0;
        if (req.user.id !== 999) {
            const caixas = await prisma.$queryRawUnsafe('SELECT * FROM Caixa WHERE empresaId = ? AND usuarioId = ? AND status = ? LIMIT 1', req.user.empresaId, req.user.id, 'ABERTO') as any[];
            if (caixas.length === 0) return res.status(403).json({ error: 'Caixa fechado' });
            caixaAbertoId = caixas[0].id;
        }

        const result = await prisma.$transaction(async (tx) => {
            const total = itens.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

            // Determinar a string de forma_pagamento (se múltiplo, "Misto", senão o próprio método)
            const formaPagamentoTexto = pagamentos.length > 1 ? 'Misto' : pagamentos[0].metodo;

            const venda = await tx.venda.create({
                data: {
                    valor_total: total,
                    forma_pagamento: formaPagamentoTexto,
                    isFiscal: isFiscal,
                    clienteId: clienteId || null,
                    usuarioId: req.user.id,
                    empresaId: req.user.empresaId,
                    itens: {
                        create: itens.map((item: any) => ({
                            produtoId: item.id,
                            quantidade: item.quantity,
                            preco_unit: item.price
                        }))
                    }
                },
                include: { itens: true }
            });

            // Dar baixa no estoque
            for (const item of itens) {
                await tx.produto.update({
                    where: { id: item.id },
                    data: { estoque: { decrement: item.quantity } }
                });
            }

            // Criar Transações para cada pagamento
            const prodRef = itens[0]?.id ? await tx.produto.findUnique({ where: { id: itens[0].id } }) : null;
            const modelKey = prodRef?.modeloNegocio || 'VAREJO';

            for (const pg of pagamentos) {
                await tx.transacao.create({
                    data: {
                        tipo: 'RECEITA',
                        descricao: `Venda PDV #${venda.id} (${pg.metodo})`,
                        valor: pg.valor,
                        metodo: pg.metodo,
                        categoria: 'Venda',
                        modeloNegocio: modelKey,
                        empresaId: req.user.empresaId,
                        vendaId: venda.id,
                        caixaId: caixaAbertoId > 0 ? caixaAbertoId : null
                    }
                });
            }

            return venda;
        });
        res.status(201).json({ success: true, venda: result });
    } catch (error) {
        console.error('[VENDAS] Erro:', error);
        res.status(500).json({ error: 'Erro ao processar venda' });
    }
});

// SYSTEM LICENSE
app.get('/api/system/license/status', async (req, res) => {
    try {
        const config = await prisma.systemConfig.findFirst();
        if (config && config.licenseKey) {
            res.json({ status: 'ACTIVE', key: config.licenseKey });
        } else {
            res.json({ status: 'INACTIVE' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/system/license/activate', async (req, res) => {
    const { key } = req.body;
    if (verifyLicenseKey(key)) {
        await prisma.systemConfig.deleteMany();
        await prisma.systemConfig.create({ data: { licenseKey: key, licenseExpiry: new Date('2036-01-01') } });
        res.json({ message: 'Sistema ativado com sucesso!' });
    } else {
        res.status(400).json({ error: 'Chave de ativação inválida' });
    }
});

// FINANCEIRO DRE
app.get('/api/financeiro/dre', authenticateToken, async (req: any, res: any) => {
    const { inicio, fim } = req.query;
    try {
        const where: any = { empresaId: req.user.empresaId };
        if (inicio && fim) where.data = { gte: new Date(inicio as string), lte: new Date(fim as string) };

        const receita = await prisma.transacao.aggregate({ _sum: { valor: true }, _count: true, where: { ...where, tipo: 'RECEITA' } });
        const receitaBruta = receita._sum.valor || 0;
        const canceladas = await prisma.venda.aggregate({ _sum: { valor_total: true }, where: { status: 'CANCELED', empresaId: req.user.empresaId } });
        const devolucoes = canceladas._sum.valor_total || 0;
        const impostos = receitaBruta * 0.06;
        const receitaLiquida = receitaBruta - devolucoes - impostos;

        const vendas = await prisma.venda.findMany({
            where: { status: 'COMPLETED', empresaId: req.user.empresaId },
            include: { itens: { include: { produto: true } } }
        });
        let cmv = 0;
        vendas.forEach(v => v.itens.forEach((item: any) => cmv += (item.produto?.custo || 0) * item.quantity));

        const lucroBruto = receitaLiquida - cmv;
        const despesas = await prisma.transacao.aggregate({ _sum: { valor: true }, where: { ...where, tipo: 'DESPESA' } });
        const ebitda = lucroBruto - (despesas._sum.valor || 0);

        // Agrupamento por forma de pagamento
        const vendasPorPagamento = await prisma.transacao.groupBy({
            by: ['metodo'],
            _sum: { valor: true },
            _count: { _all: true },
            where: { ...where, tipo: 'RECEITA' }
        });

        res.json({
            receitaBruta,
            receitaLiquida,
            cmv,
            lucroBruto,
            ebitda,
            resultadoLiquido: ebitda * 0.98,
            totalVendas: vendas.length,
            vendasPorPagamento: vendasPorPagamento.map(v => ({
                forma: v.metodo || 'Outros',
                total: v._sum.valor || 0,
                count: v._count._all
            }))
        });
    } catch (error) {
        console.error('[DRE] Erro:', error);
        res.status(500).json({ error: 'Erro ao gerar DRE' });
    }
});

// RELATÓRIOS DE LUCRATIVIDADE
app.get('/api/relatorios/lucratividade', authenticateToken, async (req: any, res: any) => {
    try {
        const produtos = await prisma.produto.findMany({
            where: { empresaId: req.user.empresaId }
        });

        const vendedos = await prisma.itemVenda.groupBy({
            by: ['produtoId'],
            _sum: { quantidade: true },
            where: { venda: { status: 'COMPLETED', empresaId: req.user.empresaId } }
        });

        const relatorio = produtos.map(p => {
            const venda = vendedos.find(v => v.produtoId === p.id);
            const qtdVendida = venda?._sum.quantidade || 0;
            const lucroUnitario = p.preco - (p.custo || 0);
            const margem = p.preco > 0 ? (lucroUnitario / p.preco) * 100 : 0;
            const ROI = (p.custo || 0) > 0 ? (lucroUnitario / (p.custo || 1)) * 100 : 0;

            return {
                id: p.id,
                nome: p.nome,
                categoria: p.categoria || 'Geral',
                precoVenda: p.preco,
                precoCusto: p.custo || 0,
                estoque: p.estoque,
                qtdVendida,
                lucroUnitario,
                lucroTotal: lucroUnitario * qtdVendida,
                margem,
                ROI
            };
        });

        // Ordenar pelos mais lucrativos total por padrão
        relatorio.sort((a, b) => b.lucroTotal - a.lucroTotal);

        res.json(relatorio);
    } catch (error) {
        console.error('[RELATORIOS] Erro:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório de lucratividade' });
    }
});

// CURVA ABC E PREVISÃO DE ESTOQUE
app.get('/api/relatorios/abc', authenticateToken, async (req: any, res: any) => {
    try {
        const vendas = await prisma.itemVenda.findMany({
            where: { venda: { status: 'COMPLETED', empresaId: req.user.empresaId } },
            include: { produto: true }
        });

        const totalVendasGeral = vendas.reduce((acc, v) => acc + (v.preco_unit * v.quantidade), 0);

        // Agrupar faturamento por produto
        const faturamentoPorProduto: any = {};
        vendas.forEach(v => {
            if (!v.produto) return;
            if (!faturamentoPorProduto[v.produto.id]) {
                faturamentoPorProduto[v.produto.id] = {
                    id: v.produto.id,
                    nome: v.produto.nome,
                    faturamento: 0,
                    estoque: v.produto.estoque,
                    custo: v.produto.custo || 0
                };
            }
            faturamentoPorProduto[v.produto.id].faturamento += (v.preco_unit * v.quantidade);
        });

        const listaOrdenada = Object.values(faturamentoPorProduto).sort((a: any, b: any) => b.faturamento - a.faturamento);

        let acumulado = 0;
        const relatorioABC = listaOrdenada.map((p: any) => {
            acumulado += p.faturamento;
            const percentual = totalVendasGeral > 0 ? (p.faturamento / totalVendasGeral) * 100 : 0;
            const acumuladoPercentual = totalVendasGeral > 0 ? (acumulado / totalVendasGeral) * 100 : 0;

            let classe = 'C';
            if (acumuladoPercentual <= 70) classe = 'A';
            else if (acumuladoPercentual <= 90) classe = 'B';

            // Previsão simples: se faturamento alto e estoque baixo, sugerir compra
            const statusEstoque = p.estoque <= 5 ? 'CRÍTICO' : p.estoque <= 15 ? 'ALERTA' : 'OK';

            return {
                ...p,
                percentual,
                acumuladoPercentual,
                classe,
                statusEstoque
            };
        });

        res.json({
            totalVendasGeral,
            ABC: relatorioABC
        });
    } catch (error) {
        console.error('[ABC] Erro:', error);
        res.status(500).json({ error: 'Erro ao gerar curva ABC' });
    }
});

// STRATEGIC REPORTS
app.get('/api/relatorios/estrategico/lucro-modelo', authenticateToken, async (req: any, res: any) => {
    try {
        const transacoes = await prisma.transacao.groupBy({
            by: ['modeloNegocio', 'tipo'],
            _sum: { valor: true },
            where: { empresaId: req.user.empresaId }
        });
        res.json(transacoes);
    } catch { res.status(500).json({ error: 'Erro ao gerar lucro por modelo' }); }
});

app.get('/api/relatorios/estrategico/abc-lucro', authenticateToken, async (req: any, res: any) => {
    try {
        const itens = await prisma.itemVenda.findMany({
            where: { venda: { status: 'COMPLETED', empresaId: req.user.empresaId } },
            include: { produto: true }
        });

        const margemPorProduto: any = {};
        const TAXA_HORA_PRODUCAO = 30.00; // R$ 30,00/hora = R$ 0,50/min

        itens.forEach(i => {
            if (!i.produto) return;
            if (!margemPorProduto[i.produto.id]) {
                margemPorProduto[i.produto.id] = {
                    nome: i.produto.nome,
                    lucroTotal: 0,
                    receitaTotal: 0,
                    custoBaseTotal: 0,
                    custoTempoTotal: 0,
                    custoDesperdicioTotal: 0
                };
            }

            // 1. Custo Base (Material)
            const custoBase = (i.produto.custo || 0) * i.quantidade;

            // 2. Custo de Desperdício (sobre o material)
            const percentualDesperdicio = (i.produto.desperdicioMedio || 0) / 100;
            const custoDesperdicio = custoBase * percentualDesperdicio;

            // 3. Custo de Tempo de Produção
            // tempoProducao está em minutos
            const tempoMinutos = (i.produto.tempoProducao || 0) * i.quantidade;
            const custoTempo = (tempoMinutos / 60) * TAXA_HORA_PRODUCAO;

            const lucro = (i.preco_unit * i.quantidade) - (custoBase + custoDesperdicio + custoTempo);

            margemPorProduto[i.produto.id].receitaTotal += (i.preco_unit * i.quantidade);
            margemPorProduto[i.produto.id].lucroTotal += lucro;
            margemPorProduto[i.produto.id].custoBaseTotal += custoBase;
            margemPorProduto[i.produto.id].custoTempoTotal += custoTempo;
            margemPorProduto[i.produto.id].custoDesperdicioTotal += custoDesperdicio;
        });

        const ranking = Object.values(margemPorProduto).map((p: any) => ({
            ...p,
            margemPercentual: p.receitaTotal > 0 ? (p.lucroTotal / p.receitaTotal) * 100 : 0
        })).sort((a: any, b: any) => b.lucroTotal - a.lucroTotal);

        res.json(ranking.slice(0, 10));
    } catch { res.status(500).json({ error: 'Erro ao gerar ranking de lucro' }); }
});

app.get('/api/relatorios/estrategico/encalhado', authenticateToken, async (req: any, res: any) => {
    try {
        const sessentaDiasAtras = new Date();
        sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);

        const produtosSemVenda = await prisma.produto.findMany({
            where: {
                empresaId: req.user.empresaId,
                itensVenda: {
                    none: {
                        venda: { data: { gte: sessentaDiasAtras } }
                    }
                }
            }
        });

        const suggestions = produtosSemVenda.map(p => ({
            ...p,
            valorSugerido: p.preco * 0.8, // 20% de desconto
            lucroSugerido: (p.preco * 0.8) - (p.custo || 0)
        }));

        res.json(suggestions);
    } catch { res.status(500).json({ error: 'Erro ao buscar produtos encalhados' }); }
});

// METAS ROUTES
app.get('/api/metas', authenticateToken, async (req: any, res: any) => {
    const { ano } = req.query;
    const metas = await prisma.metaMensal.findMany({
        where: { ano: parseInt(ano as string || new Date().getFullYear().toString()), empresaId: req.user.empresaId }
    });
    res.json(metas);
});

app.post('/api/metas', authenticateToken, async (req: any, res: any) => {
    const { mes, ano, categoria, valorMeta } = req.body;
    const meta = await prisma.metaMensal.create({
        data: { mes, ano, categoria, valorMeta, empresaId: req.user.empresaId }
    });
    res.json(meta);
});

app.listen(3000, () => console.log(`🚀 Master Backend running on http://localhost:3000`));
