import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import bcrypt from 'bcryptjs';

async function main() {
    console.log('Seeding database...');

    const hashedPassword = await bcrypt.hash('admin', 10);

    // Create default admin user
    const user = await prisma.usuario.upsert({
        where: { email: 'admin@gpvestudio.com' },
        update: {},
        create: {
            email: 'admin@gpvestudio.com',
            senha: hashedPassword, // Hashed password
            nome: 'Administrador GPV',
            role: 'ADMIN',
            empresaId: 1
        }
    });
    console.log('User created:', user.email);

    // Check if products exist to avoid duplicates if run multiple times (without createMany skipDuplicates which is not supported in SQLite for all providers easily, actually createMany is supported but skipDuplicates is handy)
    // We'll just delete all first or use upsert loop.
    // Simple: Delete all products and recreate for dev
    await prisma.produto.deleteMany();

    // Create products
    await prisma.produto.createMany({
        data: [
            { nome: 'Papel A4 Chamex 500fls', preco: 32.50, estoque: 45, sku: '789123456001', categoria: 'Papelaria', empresaId: 1 },
            { nome: 'Caneta Bic Cristal Azul', preco: 1.50, estoque: 150, sku: '789123456002', categoria: 'Papelaria', empresaId: 1 },
            { nome: 'Camiseta Algodão Branca P', preco: 19.90, estoque: 80, sku: '789123456003', categoria: 'Estamparia', empresaId: 1 },
            { nome: 'Caneca Cerâmica Sublimação', preco: 14.20, estoque: 200, sku: '789123456004', categoria: 'Estamparia', empresaId: 1 },
        ]
    });

    console.log('Products seeded!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
