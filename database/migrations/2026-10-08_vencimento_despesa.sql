-- ============================================================
-- Data de pagamento da despesa à vista (RF21 - fluxo de caixa)
-- Parcelas já têm vencimento; a despesa à vista não tinha data
-- nenhuma além de criado_em, então o fluxo de caixa não sabia em
-- que mês o dinheiro sai. Agora ela guarda essa data em vencimento.
-- As despesas à vista que já existem recebem o dia em que foram
-- lançadas (melhor aproximação disponível; dá para corrigir depois).
-- Rodar uma vez no SQL Editor, depois de 2026-10-08_categorias_despesa.sql.
-- Tudo numa transação.
-- ============================================================
BEGIN;

-- parcelado já existe no banco em produção, mas faltava no schema.sql.
ALTER TABLE despesa ADD COLUMN IF NOT EXISTS parcelado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE despesa ADD COLUMN IF NOT EXISTS vencimento DATE;

UPDATE despesa
SET vencimento = (criado_em AT TIME ZONE 'America/Sao_Paulo')::date
WHERE NOT parcelado AND vencimento IS NULL;

-- Despesa à vista sempre tem data; parcelada usa as datas das parcelas.
ALTER TABLE despesa DROP CONSTRAINT IF EXISTS chk_despesa_vencimento;
ALTER TABLE despesa ADD CONSTRAINT chk_despesa_vencimento CHECK (parcelado OR vencimento IS NOT NULL);

COMMIT;
