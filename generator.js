const jwt = require('jsonwebtoken');

// A MESMA CHAVE SECRETA DEFINIDA NO LICENSE.TS
const LICENSE_SECRET = 'GPV_MASTER_LICENSE_KEY_2026_SECURE_HASH_XY99';

const generateLicense = (clientName, daysValid) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysValid);

    const payload = {
        client: clientName,
        expiry: expiryDate.toISOString()
    };

    // Assina o token (sem expiração no JWT em si para podermos controlar a mensagem de erro, 
    // ou usamos a data gravada no payload para validação explicita na logica)
    const token = jwt.sign(payload, LICENSE_SECRET);

    console.log('\n================================================');
    console.log(`🛡️  GERADOR DE LICENÇAS GPV PRINT MANAGER`);
    console.log(`👤  CLIENTE: ${clientName}`);
    console.log(`📅  VALIDADE: ${daysValid} dias`);
    console.log(`vencimento: ${expiryDate.toLocaleString()}`);
    console.log('------------------------------------------------');
    console.log('CHAVE DE ATIVAÇÃO (COPIE TUDO ABAIXO):');
    console.log('');
    console.log(token);
    console.log('');
    console.log('================================================\n');
};

// Captura argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length < 2) {
    console.log('USO: node generator.js "Nome do Cliente" [dias]');
    console.log('Exemplo: node generator.js "Grafica Silva" 30');
} else {
    const client = args[0];
    const days = parseInt(args[1]);
    generateLicense(client, days);
}
