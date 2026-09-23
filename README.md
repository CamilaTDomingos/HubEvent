# HubEvent
Sistema de Gerenciamento de Eventos - Trabalho de Conclusão do Curso de Sistemas de Informação

## Estrutura do projeto

```
HubEvent/
├── backend/    API Node.js (Express) — rotas públicas que precisam de privilégio de servidor (ex: RSVP)
├── frontend/   Aplicação React (Vite)
└── database/   schema.sql do banco (Supabase / PostgreSQL)
```

O frontend fala direto com o Supabase para as telas autenticadas (protegidas por RLS).
Telas públicas, como a confirmação de presença (`/rsvp/:convidadoId`), passam pelo
backend, que usa a `service_role` key e expõe apenas os dados necessários.

## Pré-requisitos

- [Node.js](https://nodejs.org/) **20.19+ ou 22.12+** (exigência do Vite 8)
- Um projeto no [Supabase](https://supabase.com/) com o `database/schema.sql` aplicado

## Como rodar localmente

### 1. Banco de dados

No painel do Supabase, abra o **SQL Editor** e execute o conteúdo de `database/schema.sql`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # no Windows (PowerShell): Copy-Item .env.example .env
```

Preencha o `backend/.env` com a URL e a **service_role** key do Supabase
(Project Settings → API) e rode:

```bash
npm run dev
```

O servidor sobe em `http://localhost:3001`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env      # no Windows (PowerShell): Copy-Item .env.example .env
```

Preencha o `frontend/.env` com a URL e a **anon** key do Supabase e rode:

```bash
npm run dev
```

A aplicação abre em `http://localhost:5173`.

> O Vite só lê o `.env` ao iniciar. Se alterar alguma variável, pare e rode `npm run dev` de novo.

## Variáveis de ambiente

| Arquivo | Variável | Descrição |
|---|---|---|
| `backend/.env` | `SUPABASE_URL` | URL do projeto Supabase |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | Chave `service_role` — ignora RLS, **uso exclusivo do backend** |
| `backend/.env` | `PORT` | Porta da API (padrão `3001`) |
| `frontend/.env` | `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `frontend/.env` | `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` |
| `frontend/.env` | `VITE_API_URL` | Endereço do backend (ex: `http://localhost:3001`) |

Os arquivos `.env` estão no `.gitignore` e nunca devem ir para o repositório.

## Problemas comuns

| Erro | Causa | Solução |
|---|---|---|
| `Cannot find package 'express'` | Dependências do backend não instaladas | `npm install` dentro de `backend/` |
| `'vite' não é reconhecido como um comando` | Dependências do frontend não instaladas | `npm install` dentro de `frontend/` |
| `supabaseUrl is required` | `.env` ausente ou com nome de variável errado | Criar o `.env` a partir do `.env.example` |
| Tela de RSVP chama `undefined/api/rsvp/...` | `VITE_API_URL` não definido | Definir no `frontend/.env` e reiniciar o Vite |
