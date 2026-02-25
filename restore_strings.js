const fs = require('fs');
const path = require('path');

const files = ['App.tsx', 'backend.ts', 'components/POS.tsx', 'components/Inventory.tsx', 'components/Finance.tsx', 'components/Settings.tsx'];

const map = {
    'Ativao': 'Ativação',
    'Necessria': 'Necessária',
    'Licena': 'Licença',
    'Inativa': 'Inativa',
    'conexo': 'conexão',
    'atenticao': 'autenticação',
    'usurios': 'usuários',
    'usurio': 'usuário',
    'padro': 'padrão',
    'Configuraes': 'Configurações',
    'Grfica': 'Gráfica',
    'Estamparia': 'Estamparia',
    'Produo': 'Produção',
    'Informaes': 'Informações',
    'Vendas': 'Vendas',
    'Relatrios': 'Relatórios',
    'Saldo Inicial': 'Saldo Inicial',
    'Saldo Final': 'Saldo Final',
    'Caixa Aberto': 'Caixa Aberto',
    'Caixa Fechado': 'Caixa Fechado',
    'Venda Realizada': 'Venda Realizada',
    'Preo': 'Preço',
    'Observao': 'Observação',
    '': 'í',
    '': 'ã',
    '': 'ç'
};

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let text = fs.readFileSync(filePath, 'utf8');
        let fixed = text;

        // Fix the triple/double corrupted sequences found in grep/view
        // e.g. "Licena" often appears with placeholders
        for (const [key, value] of Object.entries(map)) {
            fixed = fixed.split(key).join(value);
        }

        // Common corrupted characters in this specific project
        fixed = fixed.replace(/\ufffd/g, (match) => {
            // This is the replacement character showing up in UTF-8 reads of Latin1
            return ''; // or try to guess, but better to use specific maps
        });

        // Re-fix specific patterns seen in view_file
        fixed = fixed.split('Licena').join('Licença');
        fixed = fixed.split('Ativao').join('Ativação');
        fixed = fixed.split('usurio').join('usuário');
        fixed = fixed.split('padro').join('padrão');
        fixed = fixed.split('Grfica').join('Gráfica');

        if (fixed !== text) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`FIXED strings in: ${file}`);
        } else {
            console.log(`NO CHANGES in: ${file}`);
        }
    }
});
