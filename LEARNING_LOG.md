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

## 2026-08-31 — Tela de Login

**O que fiz:**
- Recebi um protótipo HTML/CSS estático de referência visual do projeto
- Extraí o CSS relevante (variáveis de cor, .btn, .field, .auth-*) e 
separei em index.css (global) e Login.css (específico da tela)
- Traduzi o HTML da tela de login pra JSX, plugando a lógica real de 
autenticação (useState + supabase.auth.signInWithPassword)

**O que aprendi:**
- Um protótipo HTML/JS "vanilla" (sem framework) não pode ser colado 
direto num componente React — ele manipula o DOM manualmente 
(document.getElementById, innerHTML), o que conflita com como o React 
controla a árvore de elementos. Só o CSS é reaproveitável diretamente.
- `class` em HTML vira `className` em JSX (palavra reservada em JS)
- Onclick="funcao()" do protótipo estático não tem equivalente direto — 
navegação de verdade em React vem de uma biblioteca de rotas (React 
Router), ainda não configurada
- Testar com credencial inválida é uma forma rápida de confirmar que o 
formulário está de fato chamando a API, não só renderizando bonito

---

## 2026-08-31 — Tela de Cadastro

**O que fiz:**
- Criei Cadastro.jsx com supabase.auth.signUp(), incluindo validação de 
senha (mínimo 8 caracteres, confirmação igual) e checkbox de termos
- Passei nome/sobrenome via options.data no signUp, pro trigger 
criar_usuario_apos_signup() conseguir ler esses valores em 
raw_user_meta_data
- Testei cadastro real: usuário apareceu em Authentication > Users e 
a linha correspondente foi criada automaticamente em usuario

**Dificuldade encontrada:**
- Email de confirmação não abre no celular — o Site URL configurado no 
Supabase provavelmente aponta pra localhost, que só existe no computador 
rodando o servidor de dev

**O que aprendi:**
- Dados extras (nome, sobrenome) passados no signUp precisam ir dentro de 
options.data, não como campos soltos — é isso que popula 
raw_user_meta_data, que o trigger do banco lê
- Por padrão, Supabase Auth exige confirmação de email antes de permitir 
login — por isso é preciso uma tela de "sucesso" após signUp, e não redirect 
direto pro dashboard
- for= em HTML vira htmlFor= em JSX (mesma lógica de class/className)

---
## 2026-09-09 — Configurando React Router (com percalços)

**O que fiz:**
- Instalei react-router-dom
- Configurei BrowserRouter + Routes + Route no App.jsx para /login e /cadastro
- Troquei os links <a> soltos por <Link> do react-router-dom em Login.jsx 
e Cadastro.jsx

**Dificuldades encontradas:**
- Rodei `npm install` sem querer na pasta raiz (TCC) em vez de dentro de 
frontend — isso criou um package.json/node_modules soltos na raiz, fora 
da estrutura do projeto. Precisei apagar os dois manualmente.
- Depois disso, a tela ficou em branco com erro no console: 
"Cannot destructure property 'basename' of... as it is null" — o <Link> 
estava quebrando mesmo com o App.jsx correto.
- Ao tentar apagar node_modules pra reinstalar do zero, o Windows recusou 
apagar um arquivo binário (.node) de uma dependência (@rolldown), porque 
algum processo ainda o mantinha aberto (provavelmente o servidor do Vite 
ou o próprio VS Code segurando o arquivo).
- Resolvido fechando o VS Code completamente (não só o terminal), 
reabrindo, e refazendo a limpeza + reinstalação.

**O que aprendi:**
- Rodar comandos npm na pasta errada não dá erro claro sempre — às vezes 
"funciona" tecnicamente (instala em outro lugar), só que fica invisível 
pro projeto que você realmente quer rodar. Sempre confirmar com `pwd` 
antes de instalar algo.
- node_modules duplicado ou com versões inconsistentes de uma mesma 
biblioteca pode causar erros difíceis de diagnosticar (ex: hook do React 
retornando null sem motivo aparente) — apagar tudo e reinstalar do zero 
é uma solução legítima e comum, não um "gambiarra".
- No Windows, arquivos binários dentro de node_modules podem ficar 
"travados" por processos ainda rodando em segundo plano — fechar o editor 
por completo geralmente libera o arquivo.

---