Learning Log — HubEvent
Registro do meu processo de aprendizado construindo o projeto, sessão por sessão.

---

2026-08-31 — Setup do ambiente
O que fiz:
Instalei Node.js (LTS) e Git do zero na máquina
Criei a pasta do projeto (TCC) e abri no VS Code
Inicializei o repositório com git init
Criei o .gitignore (node_modules, .env, .env.local, dist, .DS_Store)
Conectei o repositório local ao remoto já existente no GitHub
Fiz o primeiro push

Dificuldade encontrada:
- Ao dar push, o GitHub rejeitou porque o repositório remoto já tinha um 
commit (README) que não existia localmente — históricos divergentes.

**O que aprendi:**
- git commit só grava no histórico local; nada vai pro GitHub até rodar 
git push.
- Quando remoto e local têm commits diferentes desde o início, é preciso 
git pull origin main --allow-unrelated-histories antes de conseguir 
dar push.
- O Git abre um editor (Vim, por padrão) pra escrever mensagem de merge. 
Pra sair salvando: Esc → :wq → Enter.

**Por que o .gitignore importa:**
- node_modules/ é gerado automaticamente e é pesado — não deve ir pro 
repositório.
- .env` guarda chaves/senhas — se for versionado, fica exposto publicamente 
no GitHub.

---
## 2026-08-31 — Conexão Frontend ↔ Supabase

**O que fiz:**
- Instalei @supabase/supabase-js no frontend
- Peguei Project URL e Publishable Key no painel do Supabase (nomes novos 
das antigas "URL" e "anon key")
- Criei .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- Criei src/lib/supabaseClient.js, o ponto único de conexão com o banco
- Testei fazendo um SELECT na tabela evento direto do App.jsx, via console

**Dificuldade encontrada:**
- Vite só lê .env.local quando o servidor inicia — precisei reiniciar 
com Ctrl+C e npm run dev de novo depois de criar o arquivo
- Rodei npm run dev na pasta errada (raiz do projeto em vez de frontend) 
e recebi erro ENOENT

**O que aprendi:**
- import.meta.env.VITE_X é como o Vite expõe variáveis de ambiente pro 
código do navegador — só funciona com esse prefixo VITE_
- A resposta de uma chamada assíncrona (como select do Supabase) não 
aparece na tela por padrão — precisa de console.log e abrir o DevTools 
(F12) pra ver
- Um select bem-sucedido retornando array vazio confirma que RLS e 
conexão estão OK; array vazio ≠ erro, só significa "sem dados ainda"

---