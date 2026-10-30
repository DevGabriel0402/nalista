# Guia de Deploy: Vercel & Firebase Hosting

O projeto **Na Lista** está 100% pronto e configurado para deploy imediato no **Vercel** e no **Firebase Hosting**.

---

## 🚀 1. Deploy na Vercel (Recomendado - 1 Clique)

O arquivo [`vercel.json`](file:///c:/Users/gabri/Documents/Codex/2026-10-28/opa/outputs/na-lista/vercel.json) já está configurado com:
- Framework: `vite`
- Pasta de saída: `dist`
- Redirecionamento SPA (`/(.*)` -> `/index.html`)
- Cabeçalhos de segurança (X-Content-Type, X-Frame-Options, X-XSS-Protection)

### Opção A: Pelo GitHub / Dashboard da Vercel
1. Suba o projeto para seu repositório Git (GitHub, GitLab ou Bitbucket).
2. Acesse [vercel.com](https://vercel.com) e clique em **"Add New... -> Project"**.
3. Importe o repositório. A Vercel detectará automaticamente o Vite.
4. Clique em **Deploy**.

### Opção B: Pelo CLI da Vercel
```bash
# Instale a CLI globalmente se não tiver:
npm i -g vercel

# Faça o deploy:
vercel
```

---

## 🔥 2. Deploy no Firebase Hosting

O arquivo [`firebase.json`](file:///c:/Users/gabri/Documents/Codex/2026-10-28/opa/outputs/na-lista/firebase.json) já está configurado com regras de cache para assets estáticos e SPA rewrites.

### Passos:
1. Instale o Firebase CLI (caso não tenha):
```bash
npm install -g firebase-tools
```

2. Faça login no Firebase:
```bash
firebase login
```

3. Associe seu projeto do Firebase:
```bash
firebase init hosting
# Escolha seu projeto existente
# Quando perguntar o public directory, confirme: dist
# Configure as a single-page app (SPA)? Sim (Y)
```

4. Gere a build e faça o deploy:
```bash
npm run build
firebase deploy --only hosting
```

---

## 🔑 3. Variáveis de Ambiente do Firebase (Opcional)

Se você for conectar o Firestore/Auth para sincronização em nuvem:
1. Copie o arquivo `.env.example` para `.env`
2. Preencha as credenciais obtidas no Console do Firebase:
```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:000000000000000000
```
3. Se estiver usando na **Vercel**, adicione essas mesmas variáveis na aba **Settings -> Environment Variables** do seu projeto na Vercel.
