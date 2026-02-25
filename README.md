# GPV Print Manager 🚀
**Gestão de Alta Performance para Gráficas, Estamparia e Papelarias**

---

## 👨‍💻 Desenvolvedor & Autor
**Gilcimar Martins**  
Desenvolvedor Full Stack especializado em soluções operacionais de alta eficiência.

### 🏢 Empresa
**Gweb Soluções**  
Transformando processos em resultados através da tecnologia.  
🌐 [gwebsitesoluções.com.br](https://gwebsitesoluções.com.br)

---

## 📋 Sobre o Projeto
O **GPV Print Manager** é um sistema desktop robusto e moderno, projetado para centralizar todas as operações de uma empresa do ramo gráfico e estamparia. Com uma interface premium, fluida e focada em experiência do usuário (UX), o sistema elimina a complexidade do dia a dia.

### 🛠️ Funcionalidades Principais

#### 🛒 PDV Express (Ponto de Venda)
- Interface de caixa ultra-rápida.
- Suporte a múltiplos métodos de pagamento (Dinheiro, PIX, Cartão).
- Cálculo automático de troco e monitor de venda em tempo real.
- Emissão de recibos térmicos profissionais.

#### 🤝 CRM Integrado (Gestão de Clientes)
- Cadastro rápido de clientes diretamente no fluxo de venda ou OS.
- Histórico de pedidos vinculado ao perfil do cliente.
- Envio automático de recibos e notificações via **WhatsApp**.

#### 🎨 Módulo de Gráfica & Estamparia
- Controle total de Ordens de Serviço (OS).
- Especificações detalhadas (substrato, cores, acabamentos).
- Acompanhamento de status de produção (Aguardando, Criação, Impressão, Pronto).
- Notificação instantânea ao cliente quando o pedido está pronto.

#### 📊 Gestão Financeira & Relatórios
- Painel DRE mensal detalhado.
- Relatórios de lucratividade por produto (Margem, ROI).
- Análise de Curva ABC (identificação dos produtos mais vendidos/lucrativos).
- Fluxo de caixa com abertura e fechamento blindados.

#### 📦 Controle de Estoque
- Alertas de estoque mínimo.
- Baixa automática de insumos ao realizar vendas.
- Gestão por categoria e SKU.

---

## 💻 Tecnologias Utilizadas
- **Core**: Electron (Desktop Nativo)
- **Frontend**: React.js & Vite
- **Estilo**: Vanilla CSS (Modern Design / Glassmorphism)
- **Ícones**: Lucide React
- **Backend**: Node.js & Express
- **Banco de Dados**: SQLite (Local & Seguro)
- **ORM**: Prisma
- **Bundler**: Esbuild & Electron-Builder

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- NPM ou Yarn

### Instalação
1. Clone o repositório ou extraia os arquivos.
2. No diretório raiz, instale as dependências:
   ```bash
   npm install
   ```
3. Gere o banco de dados e o cliente Prisma:
   ```bash
   npx prisma generate
   ```

### Desenvolvimento
Para rodar o sistema em modo de desenvolvimento (Frontend + Backend + Electron):
```bash
# Terminal 1 (Frontend)
npm run dev:frontend

# Terminal 2 (Backend)
npm run dev:backend

# Terminal 3 (Electron)
npm run electron:dev
```

### Geração de Executável (Build)
Para gerar a versão final para Windows (.exe e .zip):
```bash
npm run dist
```

---

## 🛡️ Licença e Contato
Este software é propriedade da **Gweb Soluções**. Para suporte, parcerias ou novas ativações, acesse o nosso site oficial.

**GPV Print Manager - 2026**  
*Desenvolvido com ❤️ por Gilcimar Martins.*
