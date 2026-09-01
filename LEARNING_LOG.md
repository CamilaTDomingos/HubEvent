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