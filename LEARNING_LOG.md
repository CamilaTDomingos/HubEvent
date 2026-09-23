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
## 2026-09-09 — Sessão de autenticação e rota protegida

**O que fiz:**
- Criei AuthContext.jsx usando createContext/useContext para compartilhar 
o estado "usuário logado" com qualquer componente da árvore
- Usei supabase.auth.getSession() (checa sessão ao carregar) e 
onAuthStateChange (reage a login/logout em tempo real)
- Criei RotaProtegida.jsx, que redireciona pra /login se não houver 
usuário logado
- Criei Dashboard.jsx provisório e fiz o login redirecionar pra lá com 
useNavigate

**O que aprendi:**
- Context API do React serve pra evitar "prop drilling" (passar dado por 
várias camadas de componente manualmente) — qualquer tela dentro do 
AuthProvider acessa o usuário logado via useAuth(), sem precisar receber 
isso como prop
- getSession() sozinho não é suficiente — sem o listener 
onAuthStateChange, a aplicação não saberia quando o usuário desloga ou 
loga em outra aba
- Uma "rota protegida" no React não é uma proteção de segurança real 
(isso já está garantido pelo RLS no banco) — é uma proteção de 
experiência de uso, pra não mostrar tela vazia/quebrada pra quem não 
está autenticado

---
## 2026-09-09 — Dashboard com dados reais + hook customizado

**O que fiz:**
- Criei o hook useEventos.js, que busca os eventos do usuário logado 
via supabase.from('evento').select('*')
- Montei o layout completo do Dashboard (Sidebar + topbar + hero banner 
+ grid de eventos), usando CSS extraído do protótipo
- Testei inserindo um evento manualmente pelo Table Editor do Supabase, 
e confirmei que ele apareceu corretamente no Dashboard

**O que aprendi:**
- Um "hook customizado" é só uma função que começa com "use" e agrupa 
lógica reaproveitável (aqui, buscar eventos) — outras telas podem chamar 
useEventos() sem duplicar a query
- Não precisei filtrar organizador_id = usuario.id manualmente na query 
— o RLS já filtra isso no banco antes mesmo do dado chegar no front. 
Isso confirma na prática o motivo de configurar RLS corretamente antes 
de conectar o front.
- useEffect com array de dependência vazio ([]) roda a busca uma única 
vez, quando o componente monta pela primeira vez

---

## 2026-09-09 — Modal de criar evento + CRUD completo

**O que fiz:**
- Criei ModalCriarEvento.jsx, controlado por props (aberto, aoFechar, 
aoCriar) em vez de gerenciar sua própria visibilidade
- Simplifiquei o modal do protótipo, removendo o "func-grid" (módulos 
opcionais liga/desliga) porque essa informação não existe como coluna 
na tabela evento e não é um RF Essencial do TCC1 — guardado como ideia 
de melhoria futura
- Atualizei useEventos.js para expor uma função recarregar (usando 
useCallback), permitindo que o Dashboard atualize a lista sem dar F5 
depois de criar um evento
- Testei o fluxo completo: criar evento pelo modal → lista atualiza 
automaticamente

**O que aprendi:**
- Um componente pode ser "controlado" pelo pai via props (aberto, 
aoFechar, aoCriar) em vez de guardar seu próprio estado de visibilidade 
— isso deixa quem usa o modal decidir quando abrir/fechar
- useCallback evita que uma função seja recriada a cada renderização; 
sem isso, um useEffect que depende dela entraria em loop infinito
- Nem toda ideia do protótipo visual precisa virar feature imediatamente 
— dá pra registrar como melhoria futura e seguir com o essencial primeiro, 
sem travar o progresso

---

## 2026-09-09 — Backend Node + RSVP público (correção de segurança)

**O que fiz:**
- Identifiquei uma falha na RLS de `convidado`: a política pública de 
SELECT/UPDATE liberava acesso a QUALQUER linha da tabela, não só ao 
convidado do link específico — expondo dados de todos os eventos de 
todos os usuários
- Removi essas políticas públicas do banco
- Criei o backend Node (Express), com cliente Supabase usando a 
SERVICE_ROLE_KEY (que ignora RLS) só nesse ambiente, nunca no front
- Criei os endpoints GET e POST /api/rsvp/:convidadoId, que buscam e 
atualizam o convite de forma controlada pelo servidor
- Criei a tela pública /rsvp/:convidadoId no React, que usa fetch() puro 
para chamar o backend — não importa o cliente Supabase, nem depende do 
AuthContext (funciona sem login)
- Adicionei checagem de status_presenca para não permitir responder de 
novo após já ter confirmado/recusado

**O que aprendi:**
- RLS com `USING (true)` libera a tabela inteira, não só um registro — 
"acesso público" precisa ser desenhado com cuidado sobre o que 
exatamente fica exposto
- service_role key ignora RLS por completo; por isso só pode existir no 
backend, nunca em código que roda no navegador
- Uma tela pública não deve usar o cliente Supabase direto nem estar 
dentro de RotaProtegida — ela é estruturalmente diferente de uma tela 
autenticada, mesmo estando no mesmo projeto React
- select('...', 'tabela:coluna_fk (campos)') do Supabase faz join 
automático via foreign key numa única query
- Corrigir uma decisão de arquitetura errada logo que percebida evita 
que ela vire dívida técnica esquecida mais pra frente

---

## 2026-09-09 — Módulo Financeiro + refinamentos de UX

**O que fiz:**
- Adicionei coluna orcamento_estimado na tabela evento (ALTER TABLE)
- Criei useDespesas.js seguindo o mesmo padrão de useConvidados.js
- Adicionei sistema de abas (Convidados/Financeiro) na tela de detalhe 
do evento, controlado por estado local (useState), sem precisar de 
rotas separadas
- Implementei edição inline do orçamento (clique no valor vira um 
formulário no lugar, sem modal)
- Implementei lançamento de despesas com categoria pré-definida (select) 
e validação contra valores negativos, em duas camadas: HTML (min="0") e 
JS (if valor < 0)
- Criei ModalConfirmacao.jsx, componente reutilizável para qualquer 
ação destrutiva, substituindo window.confirm() nativo (que exibia 
"localhost diz" de forma não customizável)
- Adicionei exclusão de despesas e convidados usando esse modal

**O que aprendi:**
- window.confirm() é uma API nativa do navegador — não é estilizável, 
sempre mostra a origem (domínio) da página. Modal customizado resolve 
isso.
- Um mesmo componente de modal pode ser genérico o suficiente pra 
servir múltiplos contextos (excluir despesa OU convidado), guardando só 
"o que fazer" num estado (ex: { tipo, id }) e decidindo a mensagem/ação 
no momento de renderizar
- Validação de dado sensível (valor financeiro) deve existir em mais de 
uma camada: o HTML impede a digitação, o JS impede o envio, e o banco 
(constraint CHECK) impede a gravação mesmo se as duas primeiras 
camadas falharem
- Abas dentro de uma mesma tela não precisam de rota própria — só 
estado local decidindo o que renderizar

---

## 2026-09-22 — Repaginação visual do Financeiro (gráfico + animações)

**O que fiz:**
- Criei GraficoDespesas.jsx: donut chart em SVG puro (sem biblioteca 
externa), usando o truque de stroke-dasharray/strokeDashoffset para 
desenhar fatias proporcionais aos gastos por categoria
- Criei NumeroAnimado.jsx: contador que anima de 0 até o valor real 
usando requestAnimationFrame e uma curva de easing (desaceleração)
- Animei a barra de progresso do orçamento com transition no CSS
- Isso implementa o RF20 (Gráficos de Pizza - Distribuição), que estava 
documentado como Desejável no TCC1 e nunca tinha sido construído

**O que aprendi:**
- Um círculo SVG pode virar gráfico de pizza/donut manipulando 
stroke-dasharray (quanto de traço vs. vazio) e strokeDashoffset (de onde 
começa a desenhar) — não precisa de biblioteca de gráficos para casos 
simples
- requestAnimationFrame é a forma correta de animar via JS, sincronizada 
com a taxa de atualização da tela — diferente de setInterval
- Motion/animação deve responder a algo real acontecendo (dado 
carregando, ação do usuário), não ser decoração espalhada em vários 
elementos sem motivo — isso deixa a interface mais profissional sem 
parecer genérica
- const não permite reatribuição (+=); variáveis que acumulam valor ao 
longo de um loop precisam ser declaradas com let

---

## 2026-09-22 — Construtor de Landing Page (RF05)

**O que fiz:**
- Decidimos guardar configurações flexíveis (cor do tema, recursos 
ativos, mensagem) como JSON dentro da coluna conteudo (TEXT) já 
existente, em vez de criar colunas separadas — reduz migrações futuras
- Criei useLandingPage.js com lógica de "upsert manual": busca a 
landing page do evento, e no salvar() decide entre INSERT (se não 
existir ainda) ou UPDATE (se já existir)
- Criei gerarSlug(), que transforma o título em URL amigável, tratando 
acentos com normalize('NFD') antes de remover caracteres especiais
- Montei SiteEvento.jsx com layout de duas colunas: painel de 
configuração à esquerda, preview ao vivo à direita, que reage 
instantaneamente a cada mudança (cor, texto, toggles)

**O que aprendi:**
- .maybeSingle() no Supabase retorna null sem erro quando não encontra 
registro, diferente de .single() que gera erro — útil para dados que 
podem ainda não existir (ex: evento novo sem landing page criada ainda)
- Guardar JSON em uma coluna TEXT é uma escolha válida quando o dado é 
estruturalmente flexível e não precisa ser filtrado/consultado 
diretamente pelo banco (WHERE em campo dentro do JSON) — o trade-off é 
menos rigidez de schema em troca de menos garantias do banco sobre o 
formato interno
- Preview "ao vivo" no React é só renderizar os mesmos estados 
(useState) em dois lugares da tela ao mesmo tempo — não tem mágica, o 
painel de controle e o preview compartilham as mesmas variáveis

---