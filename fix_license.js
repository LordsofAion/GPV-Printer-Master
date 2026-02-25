const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const BYPASS_KEY = 'GPV-EMERGENCY-BYPASS-2026-ACTIVE';
    const EXPIRY = '2036-01-01T00:00:00.000Z';

    // Check current state
    const existing = await p.$queryRawUnsafe('SELECT * FROM SystemConfig LIMIT 1').catch(() => []);
    console.log('Antes:', JSON.stringify(existing));

    if (existing.length === 0) {
        // Insert new
        await p.$executeRawUnsafe(
            'INSERT INTO SystemConfig (licenseKey, licenseExpiry, clientName, updatedAt) VALUES (?, ?, ?, datetime("now"))',
            BYPASS_KEY, EXPIRY, 'GPV Studio - Licença Master'
        );
        console.log('[OK] Licença inserida!');
    } else {
        // Update existing
        await p.$executeRawUnsafe(
            'UPDATE SystemConfig SET licenseKey = ?, licenseExpiry = ?, clientName = ?, updatedAt = datetime("now") WHERE id = ?',
            BYPASS_KEY, EXPIRY, 'GPV Studio - Licença Master', existing[0].id
        );
        console.log('[OK] Licença atualizada!');
    }

    const after = await p.$queryRawUnsafe('SELECT * FROM SystemConfig LIMIT 1');
    console.log('Depois:', JSON.stringify(after));
    await p.$disconnect();
}

main().catch(e => { console.error('[ERRO]', e); process.exit(1); });
