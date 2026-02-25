const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const cfg = await p.$queryRawUnsafe('SELECT * FROM SystemConfig LIMIT 5').catch(() => []);
    console.log('SystemConfig:', JSON.stringify(cfg));
    await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
