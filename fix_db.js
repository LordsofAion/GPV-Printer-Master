const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
    // 1. Check if user 999 exists
    const existing = await p.$queryRawUnsafe('SELECT id FROM Usuario WHERE id = 999');

    if (existing.length === 0) {
        console.log('[FIX] Criando usuário master 999...');
        const hash = await bcrypt.hash('gpv2026', 10);
        await p.$executeRawUnsafe(
            'INSERT INTO Usuario (id, email, senha, nome, role, empresaId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
            999, 'master@gpv.com', hash, 'SUPER USUARIO', 'ADMIN', 1
        );
        console.log('[FIX] Usuário 999 criado!');
    } else {
        console.log('[OK] Usuário 999 já existe.');
    }

    // 2. Verify products exist
    const prods = await p.produto.findMany({ where: { empresaId: 1 } });
    console.log('[INFO] Produtos com empresaId=1:', prods.length);

    if (prods.length === 0) {
        console.log('[FIX] Nenhum produto encontrado. Criando produtos demo...');
        await p.$executeRawUnsafe(`INSERT OR IGNORE INTO Produto (nome, preco, custo, estoque, sku, categoria, empresaId, createdAt, updatedAt) VALUES ('Papel A4 Chamex 500fls', 32.50, 18.00, 45, 'PAPEL-A4-001', 'Papelaria', 1, datetime('now'), datetime('now'))`);
        await p.$executeRawUnsafe(`INSERT OR IGNORE INTO Produto (nome, preco, custo, estoque, sku, categoria, empresaId, createdAt, updatedAt) VALUES ('Caneta Bic Cristal Azul', 1.50, 0.80, 150, 'CANETA-BIC-001', 'Papelaria', 1, datetime('now'), datetime('now'))`);
        await p.$executeRawUnsafe(`INSERT OR IGNORE INTO Produto (nome, preco, custo, estoque, sku, categoria, empresaId, createdAt, updatedAt) VALUES ('Camiseta Algodão Branca P', 19.90, 10.00, 80, 'CAM-BR-P', 'Estamparia', 1, datetime('now'), datetime('now'))`);
        await p.$executeRawUnsafe(`INSERT OR IGNORE INTO Produto (nome, preco, custo, estoque, sku, categoria, empresaId, createdAt, updatedAt) VALUES ('Banner Gráfica 1x1m', 45.00, 22.00, 30, 'BAN-1X1', 'Gráfica', 1, datetime('now'), datetime('now'))`);
        await p.$executeRawUnsafe(`INSERT OR IGNORE INTO Produto (nome, preco, custo, estoque, sku, categoria, empresaId, createdAt, updatedAt) VALUES ('Adesivo Vinil Transparente', 8.50, 3.00, 200, 'ADH-VIN-001', 'Gráfica', 1, datetime('now'), datetime('now'))`);
        console.log('[FIX] Produtos demo criados.');
    }

    // 3. Open a cashier for user 999
    const caixaAberto = await p.$queryRawUnsafe('SELECT id FROM Caixa WHERE usuarioId = 999 AND status = "ABERTO" LIMIT 1');
    if (caixaAberto.length === 0) {
        console.log('[FIX] Abrindo caixa para usuário 999...');
        await p.$executeRawUnsafe(
            'INSERT INTO Caixa (saldo_inicial, status, empresaId, usuarioId, dta_abertura) VALUES (?, ?, ?, ?, datetime("now"))',
            0, 'ABERTO', 1, 999
        );
        console.log('[FIX] Caixa aberto!');
    } else {
        console.log('[OK] Caixa já está aberto para user 999.');
    }

    const prodsFinal = await p.produto.findMany({ where: { empresaId: 1 } });
    console.log('[FINAL] Total de produtos:', prodsFinal.length);

    const usersFinal = await p.$queryRawUnsafe('SELECT id, email, role FROM Usuario');
    console.log('[FINAL] Usuários:', JSON.stringify(usersFinal));

    await p.$disconnect();
    console.log('[DONE] Banco corrigido!');
}

main().catch(e => { console.error('[ERROR]', e); process.exit(1); });
