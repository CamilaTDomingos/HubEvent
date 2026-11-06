# Ferramentas e conceitos usados no HubEvent

Glossário de apoio ao TCC. Para cada item: **o que é**, **onde aparece no projeto** e
**por que foi escolhido**. Complementa o `LEARNING.md`.

---

## A. Ferramentas e tecnologias

### Node.js
Ambiente que executa JavaScript fora do navegador. Usado no backend e para rodar as
ferramentas de build/testes. O Vite 8 exige Node **20.19+ ou 22.12+**.
**Por quê:** mesma linguagem (JavaScript) no front e no back.

### npm / `package.json` / `package-lock.json`
Gerenciador de pacotes. `package.json` lista dependências e scripts (`dev`, `build`,
`test`, `lint`); `package-lock.json` trava as versões exatas.
**Atenção (aprendido):** rodar `npm install` na pasta errada cria `node_modules` solto.

### Git e GitHub
Controle de versão e hospedagem do repositório. Mensagens de commit seguem *Conventional
Commits* no começo (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`), depois
passaram a ser descritivas.
`.gitignore` impede o envio de `node_modules/`, `.env` (segredos) e `dist/`.

### React 19
Biblioteca para construir interfaces com **componentes** e **estado**. JSX mistura HTML e
JavaScript (`class`→`className`, `for`→`htmlFor`).
**Por quê:** ecossistema grande, componentes reaproveitáveis, estado reativo (a tela
atualiza quando o dado muda).

### Vite 8
Ferramenta de build e servidor de desenvolvimento (recarrega a página ao salvar).
Expõe variáveis de ambiente do front só com prefixo `VITE_` (`import.meta.env.VITE_X`) e
só as lê **ao iniciar** o servidor.
**Por quê:** muito mais rápido que Create React App, que está descontinuado.

### React Router (`react-router-dom` 7)
Navegação entre telas sem recarregar a página. `BrowserRouter`, `Routes`, `Route`,
`Link`, `useNavigate`, `useParams` (lê `:slug` e `:convidadoId` da URL).

### ESLint (+ `react-hooks`, `react-refresh`)
Analisador estático. O plugin de *hooks* detecta erros como dependência faltando em
`useEffect`.

### Supabase
Plataforma *backend-as-a-service* sobre PostgreSQL. No projeto fornece:
- **Banco PostgreSQL** (tabelas, funções, triggers);
- **Auth** (cadastro, login, confirmação por e-mail, recuperação de senha);
- **Storage** (fotos dos presentes);
- **API automática** (PostgREST) acessada via `@supabase/supabase-js`;
- **Advisors** (relatórios de segurança/desempenho) e **SQL Editor**.

**Chaves:**
| Chave | Onde usar | Poder |
|---|---|---|
| `anon` / publishable | Frontend | Limitado pelo RLS |
| `service_role` | **Somente backend** | Ignora o RLS — acesso total |

### PostgreSQL
Banco relacional. Recursos usados: `ENUM`, `JSONB`, `CHECK`, chaves estrangeiras,
índices, **triggers**, **funções PL/pgSQL**, **RLS**, transações.

### Express 5 + `cors` + `dotenv` + `nodemon`
- **Express:** framework HTTP do backend (rotas `/api/rsvp`, `/api/site`, `/api/assistente`).
- **cors:** permite que o front (outra origem/porta) chame a API.
- **dotenv:** carrega `.env` em `process.env`.
- **nodemon:** reinicia o servidor ao salvar (`npm run dev`).

### Google Gemini e `@google/genai`
Modelo de IA generativa do Google e seu SDK oficial. Usado no assistente de
planejamento, com o alias `gemini-flash-latest` (modelo Flash estável mais recente;
configurável por `GEMINI_MODEL`).
**Por quê:** possui camada gratuita, suficiente para um TCC.

### `node:test` (runner de testes nativo do Node)
`node --test` executa arquivos `*.test.js` sem instalar Jest/Vitest.
**Por quê:** zero dependências extras para testar funções puras e rotas.

### SVG puro
Os gráficos (donut, linhas do fluxo de caixa) e os ícones (`Icone.jsx`, traço fino) são
SVG escritos à mão, sem biblioteca de gráficos.
**Por quê:** controle total, acessibilidade, sem peso extra no *bundle*.

### CSS com variáveis (*custom properties*)
`--em`, `--em-hover` etc. concentram as cores; trocar de verde para azul petróleo exigiu
mexer em poucas linhas. Fontes: Inter e Lora.

### Pix e BR Code
Padrão do Banco Central para pagamento instantâneo. O "copia e cola" é uma string no
formato EMV (campos id+tamanho+valor) terminada por **CRC16-CCITT**. Gerada em
`utils/pix.js` sem intermediário de pagamento.

---

## B. Conceitos de banco de dados e segurança

### RLS — Row Level Security
Regras no próprio banco que decidem **quais linhas** cada usuário vê ou altera.
Exemplo: `evento_do_organizador` só libera linhas com `organizador_id = auth.uid()`.
`USING` filtra leitura/alteração existente; `WITH CHECK` valida o que será gravado.
**Armadilha vivida:** `USING (true)` libera a tabela inteira.

### `auth.uid()` e `(select auth.uid())`
Retorna o ID do usuário autenticado. Escrever `(select auth.uid())` faz o Postgres
avaliar **uma vez por consulta** (otimização recomendada pelo Performance Advisor).

### `service_role` key
Chave que ignora RLS. Vazar essa chave equivale a entregar o banco. Por isso só existe
em `backend/.env`.

### Trigger
Função executada automaticamente em evento do banco (`INSERT`, `UPDATE`). Usos:
`updated_at` automático, criar perfil após signup, criar grupos/participante após criar
evento, limitar mensagens do SAC a uma por minuto.

### `SECURITY DEFINER`, `search_path` e `REVOKE EXECUTE`
- `SECURITY DEFINER`: a função roda com o poder de quem a criou (usada nos triggers).
- `SET search_path`: fixa onde o Postgres procura tabelas, impedindo que um atacante
  crie objetos homônimos para sequestrar a função.
- `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated`: tira a função da API pública.

### Migração (*migration*)
Arquivo SQL datado que leva o banco de um estado ao seguinte
(`database/migrations/`). O `schema.sql` guarda o estado atual consolidado. Usa
`IF NOT EXISTS` / `DROP … IF EXISTS` para poder ser reexecutada.

### Constraint `CHECK`
Regra de validação gravada na tabela (valor ≥ 0, acompanhantes ≤ limite). Última camada
de defesa depois de HTML e JavaScript.

### Transação e `SELECT … FOR UPDATE`
Transação: conjunto de operações que ocorrem **todas ou nenhuma**. `FOR UPDATE` trava a
linha até o fim da transação, evitando **condição de corrida** (ex.: dois convidados
reservando o último presente).

### `JSONB` e coluna `TEXT` com JSON
`JSONB` guarda JSON consultável (usado em `mensagem_chat.dados`, `evento.modulos`). JSON
em `TEXT` (landing page) dá flexibilidade, mas sem validação pelo banco.

### Supabase Storage
Armazenamento de arquivos com *buckets* e políticas próprias. Bucket `presentes`:
leitura pública, limite de 5 MB, apenas jpeg/png/webp, escrita só pelo organizador da
pasta `<evento_id>/`.

### Índice
Estrutura que acelera consultas. Chaves estrangeiras sem índice pioram `JOIN`/`DELETE`;
o Advisor apontou uma, corrigida.

### LGPD
Lei Geral de Proteção de Dados. No assistente de IA, aplicada pela **minimização**: a IA
só recebe dados agregados, nunca nome ou e-mail de convidados.

---

## C. Conceitos de React e front-end

| Conceito | Para que serve | Onde aparece |
|---|---|---|
| `useState` | Estado local do componente | Abas, formulários, modais |
| `useEffect` | Efeito colateral (buscar dados ao montar) | Hooks `useEventos` etc. |
| `useCallback` | Mantém a mesma função entre renderizações; evita loop em `useEffect` | `recarregar` |
| **Hook customizado** | Função `useX` que agrupa lógica reutilizável | `useConvidados`, `useRateio`… |
| **Context API** | Compartilha dado sem *prop drilling* | `AuthContext` |
| **Componente controlado por props** | O pai decide quando abrir/fechar | `ModalCriarEvento` |
| **Rota protegida** | Redireciona quem não está logado (conforto, não segurança) | `RotaProtegida` |
| **Portal** (`createPortal`) | Renderiza fora da hierarquia DOM para escapar de `sticky`/`overflow` | `ModalConfirmacao` |
| `requestAnimationFrame` | Animação sincronizada com a tela | `NumeroAnimado` |
| **Easing** | Curva de aceleração/desaceleração da animação | contador animado |
| **Preview ao vivo** | Dois lugares renderizam o mesmo estado | construtor de site |
| **Upsert manual** | Decide entre `INSERT` e `UPDATE` | `useLandingPage` |
| `.single()` vs `.maybeSingle()` | O segundo devolve `null` sem erro se não achar | landing page |
| **Join no Supabase** | `select('*, tabela:coluna_fk (campos)')` em uma query | RSVP, despesas |
| **Skeleton / estado de carregamento** | Placeholder enquanto carrega | `EsqueletoPresentes`, `Carregando` |
| **Acessibilidade (a11y)** | Navegação por teclado, tabela oculta para leitor de tela | `GraficoFluxoCaixa` |
| **Responsivo** | Menu lateral vira barra inferior no celular | `MenuLateral` |

---

## D. Conceitos de backend e arquitetura

### API REST
Rotas HTTP com verbo e recurso: `GET /api/rsvp/:id`, `POST /api/assistente/:eventoId/mensagens`.

### Middleware
Função que roda antes da rota. `exigirLogin` lê `Authorization: Bearer <token>`, valida
no Supabase Auth e preenche `req.usuario`.

### Autenticação vs autorização
- **Autenticação:** quem é você (token válido).
- **Autorização:** o que você pode fazer (ser o organizador **daquele** evento).
A rota do assistente faz as duas.

### Rate limiting (limite de uso)
Restringe quantas requisições cada usuário faz (5/min, 50/dia). Implementação simples em
memória (`Map`).

### Timeout e `AbortSignal`
Cancela a chamada à IA se demorar mais que `GEMINI_TIMEOUT_MS` (30 s).

### Saída estruturada (*structured output*)
Forçar a IA a responder num **JSON Schema** (`responseJsonSchema`). Facilita transformar
a resposta em dados (tarefas) — mas o backend ainda **valida** o resultado.

### Prompt de sistema (`systemInstruction`)
Instruções fixas que definem o papel e as regras do assistente, separadas da pergunta do
usuário.

### Injeção de dependência para testes
`definirClienteGemini()` troca o cliente real por um simulado (*mock*), permitindo testar
sem internet nem chave.

### Mock (simulação)
Objeto falso que imita Supabase ou Gemini nos testes, para testar a lógica isoladamente.

### Variáveis de ambiente e `.env.example`
Configuração e segredos fora do código. O `.env.example` lista os nomes sem os valores.

### Slug
Parte amigável da URL gerada do título (`casamento-ana-e-joao`). Remove acentos com
`normalize('NFD')` e caracteres especiais.

### Idempotência / importação única
`importarDadosLocais.js` migra dados do `localStorage` para o banco **uma única vez**,
marcando que já foi feito.

---

## E. Conceitos de regra de negócio e cálculo

### Dinheiro em centavos inteiros
Em ponto flutuante, `0.1 + 0.2 = 0.30000000000000004`. Convertendo para centavos
(inteiros), as somas fecham exatamente.

### Método do maior resto
Algoritmo para distribuir arredondamentos: cada um recebe a parte inteira e os centavos
que sobram vão para quem tem a maior fração. Garante que a soma bate com o total.

### Rateio
Divisão de uma despesa entre participantes: **igual**, por **valores** ou por
**porcentagens**. Calcula-se o saldo de cada um (pagou − sua parte) e uma **lista
simplificada de acertos** (quem paga quem, com o mínimo de transferências).

### Fluxo de caixa
Saídas por mês (parcelas no mês do vencimento; à vista na data de pagamento) e acumulado
comparado ao orçamento.

### RSVP e lista inteligente
RSVP = confirmação de presença. A "lista inteligente" conta **pessoas** (titular +
acompanhantes), não só convites, e informa o máximo possível — base para estimar buffet e
bebidas.

### Parcelamento com último dia do mês
Somar 1 mês a 31/01 não pode resultar em 03/03; a data é limitada ao último dia do mês
seguinte. A última parcela absorve a sobra do arredondamento.

---

## F. Mapa rápido: requisito → o que foi usado

| Requisito | Principais ferramentas/conceitos |
|---|---|
| Login / cadastro / recuperação de senha (RF08) | Supabase Auth, React Router, `AuthContext`, Redirect URL |
| Eventos e checklist | Hooks, RLS, modais controlados, categorias coloridas |
| RSVP e lista inteligente (RF04) | Express, `service_role`, `CHECK`, triggers, testes de rota |
| Landing page (RF05) | JSON em `TEXT`, slug, preview ao vivo |
| Financeiro, gráficos (RF20, RF21) | SVG, `requestAnimationFrame`, `stroke-dasharray` |
| Rateio (RF03) | Centavos, maior resto, função PL/pgSQL transacional, `node:test` |
| Categorias de despesa (RF16) | Tabela por usuário, migração com carga inicial |
| Assistente de IA (RF02/RF15) | Gemini, saída estruturada, middleware, rate limit, LGPD |
| SAC (RF22) | RLS só-insert/leitura, trigger anti-spam, validação |
| Presentes e Pix | Storage, `FOR UPDATE`, BR Code/CRC16 |
