const fs = require('fs');
const path = require('path');

const files = ['App.tsx', 'backend.ts', 'components/POS.tsx'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        try {
            // Lê como UTF-8 puro
            const text = fs.readFileSync(filePath, 'utf8');
            // Escreve de volta como UTF-8 padrão
            fs.writeFileSync(filePath, text, 'utf8');
            console.log(`SUCCESS: ${file} sanitized to UTF-8`);
        } catch (e) {
            console.error(`ERROR: ${file}`, e.message);
        }
    } else {
        console.log(`SKIP: ${file} not found`);
    }
});
