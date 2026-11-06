-- ============================================================
-- Assistente de IA de planejamento (RF02 / RF15)
-- O chat de cada evento fica em mensagem_chat, ligado ao assistente_ia
-- do evento (um por evento, criado pelo backend na primeira conversa).
--
-- mensagem_chat.dados guarda o que a IA devolve de forma estruturada,
-- além do texto: hoje, as tarefas sugeridas e quais delas o organizador
-- já levou para o checklist. Exemplo:
--   {"tarefas": [{"titulo": "Reservar o salão", "prazo": "2026-11-01", ...}],
--    "adicionadas": [0, 2]}
--
-- evento.orcamento_estimado já é usado pela aba Financeiro, mas não
-- estava no schema.sql; o ADD COLUMN IF NOT EXISTS não faz nada onde a
-- coluna já existe.
--
-- Rodar uma vez no SQL Editor, depois de 2026-10-14_rateio.sql.
-- Tudo numa transação; pode ser rodado de novo sem efeito.
-- ============================================================
BEGIN;

ALTER TABLE evento ADD COLUMN IF NOT EXISTS orcamento_estimado DECIMAL(10,2);

ALTER TABLE mensagem_chat ADD COLUMN IF NOT EXISTS dados JSONB;

-- O histórico é lido por assistente em ordem de criação. O índice novo
-- também cobre a chave estrangeira, então o antigo fica redundante.
CREATE INDEX IF NOT EXISTS idx_mensagem_assistente_criado ON mensagem_chat(assistente_id, criado_em);
DROP INDEX IF EXISTS idx_mensagem_assistente;

COMMIT;
