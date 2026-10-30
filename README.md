# Na Lista 🛒 (React + Vite)

Aplicação web completa para lista de compras, conferência de notas fiscais e controle de despensa feita com **React 18** e **Vite**.

## Funcionalidades
- 📝 **Lista de Compras Interativa**: Adição instantânea com nome, quantidade, unidade (`un`, `kg`, `L`) e preço unitário. Checklist reativo com status de itens marcados.
- 🔐 **Autenticação**: Login, cadastro, recuperação de senha e acesso com Google usando Firebase Authentication.
- 🔎 **Ordenação da Lista**: Filtros por maior preço, menor preço, ordem alfabética e ordem de adição.
- 📱 **Mobile First com Dynamic Island**: Ilha dinâmica superior que exibe o total acumulado e botão de câmera rápido para scanner.
- 📸 **Scanner de Etiquetas OCR**: Reconhecimento de texto da etiqueta da prateleira usando Tesseract.js.
- 🧾 **Conferência de Notas Fiscais**: Leitura de QR Code, reconciliação de total e impostos com a lista, e importação de XML de NF-e / NFC-e.
- 📊 **Comparador de Preços**: Histórico visual entre compras dos mesmos itens exibindo variação percentual de subida ou descida.
- 📦 **Minha Despensa**: Envio automático dos produtos comprados para a despensa, com baixa de quantidade e aviso de vencimento de validade.
- 💾 **Backup & Restore**: Exportação e importação de arquivo `.json` compatível para segurança dos dados.

## Instalação e Execução

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Build de produção:
```bash
npm run build
```
