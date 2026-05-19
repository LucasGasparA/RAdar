# RAdar — Gestão de Reclamações

Sistema interno da NextFit para gestão de reclamações do Reclame Aqui.

---

## Antes de rodar: configurar o Google OAuth

Você precisa criar credenciais no Google Cloud Console.

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use um existente)
3. Vá em **APIs e Serviços > Credenciais**
4. Clique em **Criar credenciais > ID do cliente OAuth**
5. Tipo: **Aplicativo da Web**
6. Em "URIs de redirecionamento autorizados", adicione:
   ```
   http://localhost:3001/auth/google/callback
   ```
7. Copie o **Client ID** e o **Client Secret**

---

## Setup

### 1. Banco de dados (Docker)

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend

# Copie o arquivo de exemplo e preencha suas credenciais
cp .env.example .env
# Edite o .env com seu GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET

npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Acessar

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Primeiro acesso

O **primeiro usuário** a fazer login vira **admin** automaticamente e já tem acesso liberado.

Os demais ficam com status "aguardando aprovação". O admin aprova em **Usuários** no menu lateral.

---

## Regras de acesso

- Só e-mails `@nextfit.com.br` são aceitos
- Login via Google
- Admin aprova manualmente cada usuário
- Admin pode revogar acesso e promover outros admins

---

## Estrutura

```
ra-nextfit/
├── docker-compose.yml      # PostgreSQL
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js         # Servidor principal
│       ├── db/index.js      # Banco + schema
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js      # Google OAuth
│           ├── complaints.js
│           └── admin.js
└── frontend/
    └── src/
        ├── contexts/AuthContext.jsx
        ├── components/
        │   ├── Layout.jsx
        │   └── ComplaintModal.jsx
        └── pages/
            ├── Login.jsx
            ├── Pending.jsx
            ├── Dashboard.jsx
            ├── Complaints.jsx
            └── Admin.jsx
```
