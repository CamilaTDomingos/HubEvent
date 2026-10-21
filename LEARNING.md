# LEARNING — O que foi construído no HubEvent, como e por quê

Documento de apoio para a escrita do TCC. Foi montado a partir dos **50 commits** da
branch (26/08/2026 a 15/10/2026), lendo as mensagens de commit, os arquivos alterados
e o código resultante. Complementa o `LEARNING_LOG.md` (diário pessoal) e o arquivo
`FERRAMENTAS_E_CONCEITOS.md` (explicação de cada ferramenta e conceito citado aqui).

> Convenção: **RFxx** é o requisito funcional do documento do TCC1 que o commit implementa.
> Os termos técnicos estão explicados em `FERRAMENTAS_E_CONCEITOS.md`.

---

## 1. Visão geral do sistema

O HubEvent é um sistema web de gerenciamento de eventos (casamentos, aniversários etc.).
O organizador cria um evento e gerencia **convidados, checklist, finanças, lista de
presentes e um site público** do evento. O convidado responde ao convite (RSVP) e
reserva presentes **sem precisar de conta**.

### Arquitetura em três partes

```
HubEvent/
├── frontend/   React + Vite (interface; fala direto com o Supabase nas telas logadas)
├── backend/    Node.js + Express (rotas públicas e IA; usa a chave de servidor)
└── database/   schema.sql, migrations/ e testes/ (PostgreSQL no Supabase)
```

| Camada | Tecnologia | Papel |
|---|---|---|
| Interface | React 19, Vite, React Router | Telas, rotas, estado local |
| Banco + Auth + Storage | Supabase (PostgreSQL) | Dados, login, fotos, regras de acesso (RLS) |
| Servidor | Node.js, Express 5 | Telas públicas, assistente de IA, operações que exigem privilégio |
| IA | Google Gemini (`@google/genai`) | Assistente de planejamento |

### Decisão arquitetural central: dois caminhos de acesso aos dados

1. **Telas logadas** → o navegador fala direto com o Supabase. A segurança vem do
   **RLS** (Row Level Security): o banco só devolve linhas do próprio usuário. Por isso
   o front nem filtra `organizador_id`; o banco já filtra.
2. **Telas públicas** (RSVP, site do evento) e **IA** → passam pelo **backend**, que usa a
   `service_role` key, que ignora o RLS. O backend devolve apenas o mínimo necessário.

**Por quê:** a chave `service_role` não pode existir no navegador (daria acesso total ao
banco). E uma política RLS pública do tipo `USING (true)` libera a tabela inteira, não um
registro. Esse erro foi cometido e corrigido (seção 3.6) e virou o princípio do projeto.

---

## 2. Linha do tempo resumida

| Data | Marco | Commits principais |
|---|---|---|
| 26–31/08 | Repositório, `.gitignore`, learning log, **modelagem do banco** (319 linhas de SQL) | `0453a9c`…`18bdb0a` |
| 05/09 | Scaffold Vite+React, conexão Supabase, telas de **login** e **cadastro** | `c6c095e`…`2d63d0e` |
| 09/09 | **React Router**, `AuthContext`, rota protegida, dashboard com dados reais, modal de criar evento | `2f3b609`…`207ca84` |
| 11/09 | Detalhe do evento com CRUD de convidados; **backend Node + RSVP público + correção de brecha de RLS** | `b55d413`, `1787075` |
| 15/09 | **Módulo financeiro** (orçamento, despesas, modal de confirmação) | `a8f2eba` |
| 22/09 | Gráfico donut animado (RF20); **construtor de landing page** (RF05) | `0625341`, `5e21d82` |
| 23/09 | `.env.example` e instruções de execução no README | `89640f5` |
| 30/09 | **Redesign** da interface (duas iterações), menu lateral, **lista de presentes**, site público, módulos do evento, troca de paleta | `bb288eb`…`1f7cf7f` |
| 01–02/10 | Edição de presentes, **SAC** (v1), **checklist** (CRUD, modal, categorias coloridas, edição) | `8739817`…`40facc2` |
| 06/10 | **Recuperação de senha** (RF08) | `e82e22a` |
| 07/10 | Dados saem do `localStorage` para o Supabase; **correções do Security/Performance Advisor** | `c3c621c`, `832aa9a` |
| 08/10 | Categorias de despesa (RF16); **fluxo de caixa** (RF21) | `50114c0`…`7cef6cf` |
| 14/10 | **Rateio** (RF03), **assistente de IA** (RF02/RF15), **RSVP + lista inteligente** (RF04) | `efe2321`, `281db05`, `62659ea` |
| 15/10 | **SAC** persistido no banco (RF22); consulta de migrações | `94b8d4e`, `6ab16cd` |

---

## 3. O que foi feito, como e por quê (por módulo)

### 3.1 Setup e banco de dados

**O que:** instalação de Node/Git, `git init`, `.gitignore`, ligação com o repositório
remoto. Em seguida, o `database/schema.sql` com tipos enumerados e ~19 tabelas:
`usuario`, `evento`, `convidado`, `grupo_convidado`, `landing_page`, `lista_presentes`,
`reserva_presente`, `tarefa`, `categoria_tarefa`, `categoria_despesa`, `despesa`,
`parcela`, `participante_rateio`, `cota_despesa`, `pagamento_rateio`, `assistente_ia`,
`mensagem_chat`, `mensagem_sac`.

**Como:** SQL para PostgreSQL com:
- `ENUM`s (`status_evento`, `status_presenca`, `status_tarefa`…) para restringir valores;
- **triggers** para automatizar: `updated_at` automático; ao criar usuário no Auth,
  criar a linha em `usuario` (`criar_usuario_apos_signup`); ao criar evento, criar o
  organizador como participante do rateio e os grupos padrão de convidados;
- **RLS** em todas as tabelas, uma política por tabela ligando o dado ao `auth.uid()`;
- constraints `CHECK` (ex.: valor financeiro não negativo).

**Por quê:** colocar as regras no banco (e não só no front) garante integridade mesmo se
a interface for burlada. O trigger de signup evita que o front precise inserir o perfil
manualmente (e falhar no meio). Aprendizado do log: validação em **camadas** — HTML impede
digitar, JS impede enviar, `CHECK` impede gravar.

**Migrações:** cada mudança posterior virou um arquivo em `database/migrations/` com data
no nome (`2026-10-14_rateio.sql` etc.) **e** foi refletida no `schema.sql`, que fica como
retrato atual do banco. Há também `database/testes/` (scripts SQL que rodam no banco e
desfazem tudo) e `verificar_migracoes.sql` (confere quais migrações já foram aplicadas).

### 3.2 Frontend: base, autenticação e roteamento

**O que:** scaffold com Vite; `lib/supabaseClient.js` (ponto único de conexão); telas
**Login** e **Cadastro** (com validação: senha ≥ 8 caracteres, confirmação, termos);
React Router; `AuthContext`; `RotaProtegida`; recuperação de senha (`/recuperar-senha` e
`/redefinir-senha`).

**Como:**
- `signUp` com `options.data` (nome/sobrenome) → vira `raw_user_meta_data`, que o trigger
  do banco lê para criar a linha em `usuario`.
- `AuthContext` usa `getSession()` (sessão ao carregar) + `onAuthStateChange` (login/logout
  em tempo real, inclusive em outra aba) e expõe `useAuth()`.
- `RotaProtegida` redireciona para `/login` sem usuário.
- Recuperação de senha pelo Supabase Auth, com aviso de link expirado; exige liberar a
  *Redirect URL* no painel do Supabase (documentado no README).

**Por quê:**
- **Context API** evita *prop drilling* (passar o usuário por várias camadas).
- A rota protegida **não é segurança real** — é experiência de uso. A segurança de verdade
  é o RLS.
- O protótipo HTML/JS vanilla não pode ser colado no React (manipula o DOM manualmente);
  só o CSS foi reaproveitado, e o HTML foi reescrito em JSX (`class`→`className`,
  `for`→`htmlFor`).

**Dificuldade registrada:** `npm install` na pasta errada + `node_modules` inconsistente
causaram o erro `Cannot destructure property 'basename'` do React Router. Solução:
apagar tudo e reinstalar (fechando o VS Code por causa de arquivo travado no Windows).

### 3.3 Eventos: dashboard, listagem, criação e detalhe

**O que:** `Dashboard` (próximo evento em destaque, lista, resumo), página `Eventos`
(agenda por mês, busca e filtro por tipo), `ModalCriarEvento` (com **módulos do evento**:
Convidados, Financeiro e Checklist sempre ativos; Lista de presentes e Site opcionais),
`EventoDetalhe` com **abas** (Checklist, Convidados, Financeiro, Presentes, Site).

**Como:** hooks customizados (`useEventos`, `useConvidados`, `useTarefas`, `useDespesas`…)
que encapsulam as queries Supabase; `useEventos` expõe `recarregar` (com `useCallback`)
para a lista atualizar após criar um evento sem F5. As abas são só estado local (`useState`)
— não precisam de rota própria. Datas tratadas em `utils/datas.js` (inclui correção de bug
em que o vencimento das parcelas aparecia um dia antes).

**Por quê:** hook customizado = lógica reaproveitável sem duplicar queries; componente de
modal "controlado" por props (`aberto`, `aoFechar`, `aoCriar`) deixa o pai decidir a
visibilidade. `useCallback` evita loop infinito em `useEffect`.

### 3.4 Convidados, RSVP e Lista Inteligente (RF04)

**O que:**
- CRUD de convidados (modal, exclusão com `ModalConfirmacao`);
- **Grupos** por evento (Família, Amigos, Trabalho — criados por trigger), gerenciáveis;
- **Acompanhantes**: limite por convite definido pelo organizador; o convidado informa
  quantos levará;
- `enviado_em` (marcado ao copiar o link ou manualmente);
- Métricas: pessoas confirmadas (titular + acompanhantes), máximo possível, enviados/não
  enviados; busca por nome/e-mail;
- **Página pública de RSVP** `/rsvp/:convidadoId`, em formato de convite, com confete na
  cor da paleta ao confirmar; o convidado pode **alterar a resposta até o início do evento**.

**Como:** a página RSVP chama o **backend** (`GET/POST /api/rsvp/:convidadoId`) com
`fetch` puro, fora do `AuthContext`. O backend valida o limite de acompanhantes **com o
valor do banco** (não confia no que o navegador manda) e um `CHECK` no banco garante o
mesmo. Regras de negócio puras foram isoladas em `utils/convidados.js` e testadas
(`convidados.test.js`); a rota tem testes com Supabase simulado (`rsvp.routes.test.js`).

**Por quê:** o convidado não tem conta, então não há `auth.uid()` para o RLS usar. A
solução correta é o backend servir **só o convite daquele ID**, em vez de abrir a tabela.

### 3.5 Financeiro: orçamento, despesas, parcelas, gráficos e rateio

**O que:**
- Orçamento estimado (edição inline) e lançamento de despesas com categoria, valor,
  **parcelamento** e **despesa à vista com data de pagamento**;
- **Categorias de despesa** por usuário (nome + cor), geridas no Perfil (RF16); as 9
  categorias que eram fixas no código viraram linhas no banco;
- **Gráfico donut** de despesas por categoria (RF20) em SVG puro;
- **Contador animado** (`NumeroAnimado`) com `requestAnimationFrame` + easing;
- **Fluxo de caixa** (RF21): gráfico de linhas SVG com visão mensal e acumulado (com
  linha do orçamento), marcadores de "hoje" e "evento", tooltip por mouse **e teclado**,
  tabela oculta para leitor de tela;
- **Rateio dinâmico** (RF03): participantes do rateio, quem pagou, divisão **igual**,
  **por valores** ou **por porcentagens**, saldos e **lista simplificada de acertos**;
  "Quitado" grava em `pagamento_rateio` e pode ser desfeito.

**Como (pontos técnicos relevantes):**
- **Gráfico donut:** `stroke-dasharray` / `stroke-dashoffset` de um círculo SVG. Sem
  biblioteca de gráficos.
- **Dinheiro em centavos inteiros** (`utils/rateio.js`): `0,1 + 0,2 = 0,30000000000000004`
  em ponto flutuante. Em centavos inteiros a soma fecha. A divisão igual distribui a sobra
  (100 ÷ 3 = 34 + 33 + 33) e a divisão percentual usa o **método do maior resto**.
- **Parcelas:** vencimento 31/01 + 1 mês caía em 03/03; corrigido para parar no último dia
  do mês. A última parcela absorve a sobra do arredondamento, para a soma bater com o total.
- **Função SQL `definir_rateio_despesa`:** grava as cotas **numa transação** e recusa a
  divisão que não fecha com o valor (soma ≠ total, porcentagem ≠ 100, pagador de outro
  evento). Roda com `SET search_path = ''` e com as permissões de quem chama (RLS vale).
- Testes unitários dos cálculos com o runner nativo do Node (`node --test`).

**Por quê:** a validação do rateio está **no banco** porque é a última barreira — qualquer
cliente (inclusive um front adulterado) passa por ela. Bibliotecas de gráfico seriam
exagero para dois gráficos simples e aumentariam o *bundle*. A animação só existe onde
responde a dado real, para não virar decoração.

### 3.6 Segurança: a brecha do RLS e as correções posteriores

Este é o aprendizado mais forte do projeto e rende uma seção própria no TCC.

1. **Brecha (`1787075`):** para o RSVP público, haviam sido criadas políticas
   `SELECT/UPDATE` com `USING (true)` em `convidado`, expondo os convidados de **todos os
   eventos**. Foram **removidas**, e o acesso passou pelo backend.
2. **Presentes (`c3c621c`):** removidas políticas que deixavam a chave `anon` ler e alterar
   presentes; leitura/reserva pública passou pelo backend.
3. **Advisor do Supabase (`832aa9a`):** o *Security/Performance Advisor* apontou:
   - funções `SECURITY DEFINER` expostas à API → `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated`
     e `search_path` fixo (previne sequestro de `search_path`);
   - leitura pública de `landing_page` removida (site público usa o backend);
   - políticas RLS reescritas com `(select auth.uid())`, que o Postgres avalia **uma vez
     por consulta** em vez de uma vez por linha (ganho de desempenho);
   - índice em chave estrangeira sem índice (`lista_presentes.responsavel_por_id`);
   - função `handle_new_user` duplicada e sem uso removida.
4. **Teste de permissões:** `teste_presentes_e_permissoes.sql` roda no banco e **desfaz
   tudo** ao final.

### 3.7 Lista de presentes e site público do evento (RF05)

**O que:**
- **Construtor de landing page** (`SiteEvento`): painel de configuração à esquerda e
  **preview ao vivo** à direita (cor do tema, textos, recursos ligáveis);
- **Aba Lista de presentes** (gestão): cadastro com foto, categoria, link da loja,
  quantidade, valor; edição; ver quem reservou e como; chave Pix;
- **Site público** `/site/:slug` servido pelo backend (`GET /api/site/:slug`): o convidado
  escolhe um presente e reserva por **compra na loja**, **Pix** ou cartão (checkout ainda
  **simulado**);
- **Pix "copia e cola"** (`utils/pix.js`): gera o BR Code estático do Banco Central com
  valor, sem gateway de pagamento;
- Fotos no **Supabase Storage** (bucket público `presentes`, até 5 MB, jpeg/png/webp;
  escrita só pelo organizador da pasta do evento); fotos HEIC do iPhone recebem aviso
  explicando como enviar em JPG.

**Como (decisões):**
- Configurações flexíveis da landing page ficam como **JSON dentro da coluna `conteudo`**
  (TEXT), evitando migrações a cada ajuste; trade-off: o banco não valida nem filtra o
  conteúdo interno.
- `gerarSlug()` normaliza com `normalize('NFD')` para remover acentos.
- Upsert manual com `.maybeSingle()` (retorna `null` sem erro quando não existe).
- BR Code: campos TLV (id + tamanho + valor) e **CRC16-CCITT** calculado à mão.
- **Fase 1 – `localStorage`:** presentes, módulos e Pix começaram no navegador
  (`lib/armazemLocal.js`) como protótipo, enquanto o banco não tinha as colunas.
  **Fase 2 – Supabase (`c3c621c`):** colunas `evento.modulos`, `evento.pix_*`, e em
  `lista_presentes` (`quantidade`, `categoria`, `link`, `imagem_url`), nova tabela
  `reserva_presente`; `lib/importarDadosLocais.js` **importa uma única vez** o que já
  estava no navegador.
- **Função `reservar_presente`:** trava a linha do presente (`SELECT … FOR UPDATE`),
  conta as reservas e só insere se ainda houver unidade — evita **condição de corrida**
  (dois convidados reservando o último item ao mesmo tempo). Só `service_role` executa.

### 3.8 Checklist de tarefas

**O que:** aba Checklist (primeira aba): tarefas na tabela `tarefa`, prazo opcional,
concluir/remover, filtros (pendentes, atrasadas, concluídas), barra de progresso;
criação e **edição pelo mesmo modal** (`ModalTarefa`); concluídas separadas num card
abaixo; **categorias coloridas** por usuário (`categoria_tarefa`, `SeletorCor`,
`SeloCategoria`) geridas no Perfil.

**Por quê:** reaproveitamento — o mesmo modal e o mesmo `GerenciarCategorias` servem a
criação/edição e, depois, às categorias de despesa e aos grupos de convidados (o painel
foi generalizado). Menos código, comportamento consistente.

### 3.9 Assistente de IA (RF02 / RF15)

**O que:** chat flutuante no detalhe do evento, com atalhos (sugerir checklist, montar
cronograma, estimar comida e bebida, listar fornecedores, redigir convite). A IA devolve
**texto + tarefas sugeridas**; o organizador adiciona ao checklist com um clique. A
conversa fica salva por evento em `mensagem_chat`.

**Como (backend):** `POST /api/assistente/:eventoId/mensagens`
1. `middlewares/exigirLogin.js` valida o token do Supabase Auth (`auth.getUser`);
2. confere que o usuário é o **organizador** do evento;
3. `services/limiteUso.js` aplica **limite por usuário** (5/min, 50/dia, configurável);
4. `services/contextoEvento.js` monta um resumo **apenas agregado**;
5. `services/gemini.js` chama o modelo com `systemInstruction`, `responseMimeType:
   'application/json'` e `responseJsonSchema` (**saída estruturada**), `temperature 0.6`
   e *timeout* por `AbortSignal`;
6. `normalizarResposta` **valida o que a IA devolveu** (datas, tamanhos, limite de 15
   tarefas), em vez de confiar no JSON.

**Por quê:**
- A chave do Gemini fica **só no backend**.
- **LGPD / privacidade:** nome e e-mail de convidados nunca saem do banco; a IA recebe
  contagens, totais e títulos de tarefas.
- **Saída estruturada em JSON** permite transformar a resposta em tarefas clicáveis, o que
  texto livre não permitiria com segurança.
- O limite protege a cota gratuita; fica em memória (zera no restart, não escala para
  várias instâncias — suficiente para o TCC, e isso está dito no código).
- Erros tratados com mensagens claras: sem chave, chave inválida, limite do Gemini,
  *timeout*, modelo inexistente, resposta vazia/bloqueada; o chat tem "Tentar de novo".
- **Testabilidade:** `definirClienteGemini` permite injetar um cliente simulado; os
  testes da rota (`assistente.routes.test.js`) rodam sem rede e sem chave.
- Migração `2026-10-14_assistente_ia.sql`: `mensagem_chat.dados` (jsonb), índice
  `(assistente_id, criado_em)` e a coluna `evento.orcamento_estimado`, que o app já usava
  mas **faltava no schema** (divergência schema × banco corrigida).

### 3.10 SAC (RF22)

**O que:** página `/sac` com FAQ em *accordion*, canais de contato e formulário.
**Versão 1** (01/10): só front, dados fictícios. **Versão 2** (15/10): tabela
`mensagem_sac` (status `ABERTA/RESPONDIDA/FECHADA`, resposta da equipe), seção
"Minhas solicitações" e validação (obrigatórios, tamanho máximo, e-mail).

**Como/Por quê:** RLS permite ao usuário apenas **criar** (sempre `ABERTA`, sem resposta
pré-preenchida) e **ler as próprias**; não há `UPDATE`/`DELETE` pela API, então ele não
consegue se autorresponder. Um **trigger** limita a uma mensagem por minuto
(anti-spam, no banco). A validação foi extraída para `utils/sac.js` e testada.

### 3.11 Design e experiência de uso

Houve **três iterações visuais**, todas registradas nos commits:
1. `bb288eb` — identidade "editorial" experimental (paleta papel/tinta/tomate, formas por
   tipo de evento, confete, paralaxe);
2. `cf6dbe4` — **reversão** para uma direção elegante e leve (verde esmeralda, Inter +
   Lora, ícones de traço fino, animações discretas), evoluindo a identidade original;
3. `b5bcfc3`/`1f7cf7f`/`1a9918e`/`10ad8bc` — **menu lateral flutuante** (vira barra
   inferior no celular), cor principal para **azul petróleo** (`#1e6b7b`), conteúdo até
   1600 px, fundo bege `#f8f4ef`.

Detalhes técnicos: **tokens de cor em variáveis CSS** (trocar a cor principal mexeu em
poucas linhas), CSS por tela (`Dashboard.css`, `Rsvp.css`…), `ModalConfirmacao`
renderizado em **portal** (`createPortal`) para não ficar atrás de contêineres
`sticky`, e correção de `animation-fill-mode` que deixava um `transform` residual
deslocando modais (um `transform` cria um novo contexto para elementos `fixed`).

---

## 4. Testes e qualidade

| Tipo | Onde | Como roda |
|---|---|---|
| Unitários (front) | `utils/rateio.test.js`, `convidados.test.js`, `sac.test.js` | `npm test` em `frontend/` (`node --test`) |
| Rotas (back) | `rsvp.routes.test.js`, `assistente.routes.test.js` (Supabase e Gemini simulados) | `npm test` em `backend/` |
| Banco | `database/testes/*.sql` | SQL Editor do Supabase; desfaz tudo ao final |
| Estática | ESLint (`eslint-plugin-react-hooks`, `react-refresh`) | `npm run lint` |
| Conferência | `verificar_migracoes.sql` | lista quais migrações estão aplicadas |

Os testes se concentram em **regra de negócio** (dinheiro, limites, validações) e
**segurança** (permissões), não em aparência.

---

## 5. Principais lições aprendidas (para a conclusão do TCC)

1. **Segurança nasce no banco.** RLS bem desenhado dispensa filtros no front; `USING (true)`
   é uma das armadilhas mais caras. Acesso público exige um intermediário (backend) que
   exponha só um registro.
2. **Segredos têm lugar certo.** `service_role` e chave do Gemini só no backend; `.env` no
   `.gitignore`; `.env.example` documenta sem expor.
3. **Dinheiro nunca em ponto flutuante.** Centavos inteiros + método do maior resto.
4. **Validar em camadas** (HTML, JS, banco) e **nunca confiar na saída de uma IA**:
   validar e normalizar o JSON.
5. **Concorrência existe:** reserva de presente exige trava de linha na função SQL.
6. **Protótipo em `localStorage` é válido** para validar a interface, desde que se migre
   para o banco e se importem os dados já criados.
7. **Migrações versionadas + `schema.sql` atualizado + script de verificação** evitam a
   divergência entre código e banco (aconteceu com `orcamento_estimado` e `parcelado`).
8. **Reutilizar componentes** (modal de tarefa, gerenciador de categorias, modal de
   confirmação) reduz código e inconsistência.
9. **Reverter uma direção de design é normal** quando ela não serve ao produto.
10. **Acessibilidade conta:** tooltip por teclado, tabela oculta para leitor de tela.

---

## 6. Limitações conhecidas (honestidade para o TCC)

- **Checkout por cartão é simulado**; só o Pix copia-e-cola e a compra na loja são reais.
- **Limite de uso da IA em memória** (não persiste nem escala horizontalmente).
- **Sem painel administrativo para o SAC:** a resposta da equipe seria gravada direto no
  banco.
- O front de RSVP depende de `VITE_API_URL`; não há deploy configurado nos commits.
- O backend usa `cors()` aberto — adequado em desenvolvimento, deve ser restringido em
  produção.
- A criação de eventos com "módulos" desligáveis foi adiada no início (não havia coluna
  no banco) e só entrou depois, junto com `evento.modulos`.

---

## 7. Observação sobre autoria (importante para o TCC)

Os commits a partir de **23/09/2026** trazem o trailer `Co-Authored-By: Claude`, ou seja,
foram feitos com **assistência de IA generativa**. Os commits anteriores e o
`LEARNING_LOG.md` refletem seu processo manual. Verifique a política da sua instituição
sobre uso de IA e **declare o uso na metodologia** do trabalho. Além disso, você precisa
conseguir explicar cada trecho descrito aqui diante da banca — use este documento e o de
ferramentas como roteiro de estudo, não como substituto dele.
