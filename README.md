# Na Lista

Aplicação web para planejar compras, acompanhar preços, conferir notas fiscais e controlar a despensa. O sistema foi desenvolvido com React e Vite, possui autenticação Firebase, funcionamento responsivo e estratégia offline-first.

## Visão geral

O Na Lista centraliza todo o ciclo da compra:

1. Criar uma lista com produtos, quantidades, unidades, categorias e preços.
2. Organizar os itens por corredor ou por ordem de preferência.
3. Usar o modo mercado para marcar os produtos durante a compra.
4. Conferir o total com a nota fiscal e seus tributos.
5. Finalizar a compra e enviar os itens automaticamente para a despensa.
6. Acompanhar histórico, consumo, validade e variação de preços.

## Funcionalidades

### Lista de compras

- Adição rápida de produtos.
- Quantidade com suporte a valores decimais.
- Unidades disponíveis: `un`, `kg` e `L`.
- Detecção automática de categoria pelo nome do produto.
- Categorias visuais para facilitar a organização por corredor.
- Marcação de itens concluídos.
- Edição de nome, quantidade, unidade, categoria e preço.
- Remoção individual de itens.
- Preço unitário e total calculado por produto.
- Indicador de itens sem preço.
- Total parcial enquanto existem preços pendentes.

### Ordenação dos itens

A lista pode ser organizada por:

- Ordem de adição.
- Maior preço total.
- Menor preço total.
- Ordem alfabética A-Z.
- Ordem alfabética Z-A.

Nos filtros de preço, o valor considerado é:

```text
quantidade × preço unitário
```

A ordenação funciona com a lista agrupada ou desagrupada.

### Orçamento

- Definição de uma meta de orçamento.
- Barra visual de utilização.
- Aviso de valor restante.
- Destaque quando o orçamento é ultrapassado.
- Indicador de percentual consumido no modo mercado.

### Modo mercado

- Interface otimizada para uso durante as compras.
- Contador de itens marcados.
- Barra de progresso da compra.
- Total parcial ou total final.
- Organização por categoria.
- Acesso rápido para sair do modo mercado.
- Conclusão da compra diretamente pelo modo mercado.

### Autenticação

A aplicação utiliza Firebase Authentication e oferece:

- Login com e-mail e senha.
- Cadastro de novos usuários.
- Login com Google.
- Recuperação de senha por e-mail.
- Mostrar e ocultar senha.
- Validação de confirmação de senha.
- Mensagens de erro traduzidas para português.
- Logout pelo menu lateral.
- Bloqueio do sistema até a autenticação ser concluída.

### Notas fiscais

- Leitura de QR Code da nota fiscal.
- Validação de links HTTP e HTTPS.
- Abertura da consulta oficial da nota.
- Importação de XML de NF-e/NFC-e.
- Extração de total da nota.
- Extração de tributos quando disponíveis.
- Exibição dos itens importados do XML.
- Comparação entre o total da lista e o total da nota.
- Exibição da diferença encontrada.

### Scanner de etiquetas

- Captura de imagem pela câmera do dispositivo.
- OCR com Tesseract.js.
- Leitura de nome e preço identificados na imagem.
- Revisão do texto reconhecido antes de usá-lo.
- Preenchimento dos campos da lista a partir da etiqueta.

### Histórico e comparação de preços

- Registro das compras concluídas.
- Data e estabelecimento da compra.
- Produtos comprados, quantidades e preços.
- Informação sobre nota fiscal conferida.
- Comparação automática entre as duas compras mais recentes.
- Percentual de aumento ou redução por produto.

### Despensa

- Entrada automática de produtos após concluir uma compra.
- Agrupamento de quantidades iguais sem validade definida.
- Controle de quantidade disponível.
- Baixa de produtos consumidos.
- Reposição de um produto diretamente na lista.
- Definição de data de validade.
- Aviso de produtos vencidos.
- Aviso de produtos próximos do vencimento.

### Backup e restauração

- Exportação de todos os dados para JSON.
- Importação de backup JSON.
- Validação dos itens importados.
- Confirmação antes de substituir os dados atuais.
- Backup sem dependência de servidor.

### Interface e acessibilidade

- Layout responsivo para desktop e celular.
- Navegação lateral no desktop.
- Navegação inferior no celular.
- Modo claro e modo escuro.
- Modais com fechamento controlado por botões internos.
- Feedback visual por mensagens toast.
- Feedback tátil quando suportado pelo dispositivo.
- Componentes e botões com rótulos acessíveis.

## Tecnologias

- [React 18](https://react.dev/)
- [Vite](https://vite.dev/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Vercel](https://vercel.com/)
- [Tesseract.js](https://github.com/naptha/tesseract.js)
- [jsQR](https://github.com/cozmo/jsQR)
- [React Icons](https://react-icons.github.io/react-icons/)

## Requisitos

- Node.js 18 ou superior.
- npm.
- Um projeto Firebase para habilitar autenticação e sincronização.
- Navegador moderno com suporte a módulos JavaScript.
- Permissão de câmera para OCR e leitura de QR Code.

## Instalação

Clone o repositório e entre na pasta:

```bash
git clone https://github.com/DevGabriel0402/nalista.git
cd nalista
```

Instale as dependências:

```bash
npm install
```

## Configuração do Firebase

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Preencha o `.env` com as credenciais do seu aplicativo web Firebase:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:000000000000000000
```

No Firebase Console, ative:

1. **Authentication > Sign-in method > E-mail/senha**.
2. **Authentication > Sign-in method > Google**.
3. **Authentication > Settings > Authorized domains**.
4. Adicione `localhost` para desenvolvimento.
5. Adicione o domínio de produção usado pela Vercel ou Firebase Hosting.

O sistema inicia mesmo sem as variáveis do Firebase, mas nesse caso a autenticação e a sincronização em nuvem ficam indisponíveis.

## Desenvolvimento

Inicie o servidor local:

```bash
npm run dev
```

Depois abra o endereço exibido pelo Vite, normalmente:

```text
http://localhost:5173
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a build de produção em `dist/` |
| `npm run preview` | Serve localmente a build de produção |

## Build e validação

Gere a build:

```bash
npm run build
```

Teste a build localmente:

```bash
npm run preview
```

O projeto usa Vite e não possui uma suíte de testes automatizados configurada atualmente. A validação principal disponível é o build de produção.

## Arquitetura do projeto

```text
src/
├── App.jsx
├── components/
│   ├── AuthPage.jsx
│   ├── DataPages.jsx
│   ├── MarketMode.jsx
│   ├── Modals.jsx
│   ├── Navigation.jsx
│   └── ShoppingList.jsx
├── hooks/
│   ├── useAppState.js
│   └── useAuth.js
├── firebase.js
├── useSync.js
├── utils.js
├── icons.js
├── main.jsx
└── style.css
```

### Responsabilidades principais

- `App.jsx`: composição das telas e passagem de propriedades.
- `components/AuthPage.jsx`: login, cadastro, Google e recuperação de senha.
- `components/ShoppingList.jsx`: formulário e visualização da lista.
- `components/MarketMode.jsx`: experiência de compra no mercado.
- `components/DataPages.jsx`: histórico, preços e despensa.
- `components/Navigation.jsx`: navegação desktop, mobile e logout.
- `components/Modals.jsx`: edição, diálogos, notas fiscais e scanner.
- `hooks/useAuth.js`: sessão e operações do Firebase Authentication.
- `hooks/useAppState.js`: estado, cálculos e ações da aplicação.
- `firebase.js`: inicialização condicional do Firebase.
- `useSync.js`: persistência local e sincronização com Firestore.
- `utils.js`: moeda, categorias, detecção e feedback tátil.
- `style.css`: tema, responsividade e estilos globais.

## Persistência e sincronização

O sistema segue uma estratégia offline-first:

1. O estado é carregado rapidamente do `localStorage`.
2. Cada alteração é salva localmente.
3. Quando o Firebase está configurado, o estado também é enviado ao Firestore.
4. O Firestore pode entregar atualizações remotas por `onSnapshot`.
5. A escrita na nuvem utiliza debounce para reduzir chamadas.
6. O Firebase IndexedDB é usado como cache offline quando disponível.

A chave local principal é:

```text
nalista-v1
```

O estado inclui:

- `items`
- `history`
- `pantry`
- `budget`
- `date`
- `market`
- `note`

### Segurança do Firestore

O arquivo atual [`firestore.rules`](./firestore.rules) usa um identificador de dispositivo e permite leitura/escrita no documento correspondente. Essa configuração é adequada para protótipos e sincronização baseada em dispositivo, mas não deve ser considerada uma política de segurança forte para dados sensíveis.

Para produção com dados privados por usuário, recomenda-se evoluir as regras para exigir autenticação Firebase e associar os documentos ao `request.auth.uid`.

## Deploy na Vercel

O projeto possui [`vercel.json`](./vercel.json) configurado para:

- Framework Vite.
- Saída em `dist`.
- Reescrita SPA para `index.html`.
- Cabeçalhos básicos de segurança.

### Pelo painel

1. Importe o repositório na Vercel.
2. Confirme o framework Vite.
3. Configure as variáveis `VITE_FIREBASE_*`.
4. Faça o deploy.
5. Adicione o domínio da Vercel aos domínios autorizados do Firebase Authentication.

### Pelo CLI

```bash
npm install -g vercel
vercel
```

## Deploy no Firebase Hosting

Instale a CLI:

```bash
npm install -g firebase-tools
```

Faça login:

```bash
firebase login
```

Gere a build:

```bash
npm run build
```

Faça o deploy:

```bash
firebase deploy --only hosting
```

O [`firebase.json`](./firebase.json) já aponta o Hosting para `dist/` e configura o fallback SPA.

## Estrutura do Firestore

O código de sincronização utiliza um documento por identificador de dispositivo:

```text
/users/{deviceId}
```

O documento contém o estado da aplicação e o campo interno `_updatedAt`, usado para comparar atualizações locais e remotas.

## Boas práticas para contribuição

1. Crie uma branch para cada alteração.
2. Mantenha componentes visuais separados por responsabilidade.
3. Centralize regras e estado compartilhado nos hooks.
4. Não envie arquivos `.env` ou credenciais.
5. Execute `npm run build` antes de abrir um pull request.
6. Atualize este README quando alterar configuração ou fluxo de deploy.

## Arquivos importantes

- [`package.json`](./package.json): scripts e dependências.
- [`.env.example`](./.env.example): variáveis necessárias do Firebase.
- [`firebase.js`](./src/firebase.js): configuração do Firebase.
- [`useAuth.js`](./src/hooks/useAuth.js): autenticação.
- [`useSync.js`](./src/useSync.js): sincronização local e remota.
- [`firestore.rules`](./firestore.rules): regras atuais do Firestore.
- [`firebase.json`](./firebase.json): Hosting e Firestore.
- [`vercel.json`](./vercel.json): configuração da Vercel.
- [`DEPLOY.md`](./DEPLOY.md): guia complementar de publicação.

## Solução de problemas

### A tela de login informa que o Firebase não foi configurado

Verifique se o arquivo `.env` existe, contém todas as variáveis `VITE_FIREBASE_*` e reinicie o servidor Vite após alterá-lo.

### O login com Google não abre

Verifique se:

- O provedor Google está habilitado no Firebase.
- O domínio atual está em **Authorized domains**.
- O navegador não bloqueou pop-ups.

### A sincronização aparece como offline

Confirme as credenciais do Firebase, a conexão com a internet e as regras do Firestore. O sistema continua usando o `localStorage` mesmo sem sincronização.

### O scanner não funciona

Verifique se o navegador possui permissão de câmera. OCR e QR Code dependem de uma imagem nítida e, em muitos navegadores, de contexto seguro HTTPS.

## Licença

Este projeto é mantido por [DevGabriel0402](https://github.com/DevGabriel0402). Consulte o repositório para informações adicionais de uso e distribuição.
