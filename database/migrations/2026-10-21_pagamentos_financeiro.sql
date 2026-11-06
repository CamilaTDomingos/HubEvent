-- ============================================================
-- Pagamentos do financeiro
-- Toda despesa passa a ter seus pagamentos na tabela parcela:
-- à vista vira um pagamento único, parcelado pode ter entrada.
-- Cada pagamento guarda quem pagou.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================

-- Colunas que já existiam no banco, mas faltavam no schema.sql.
ALTER TABLE despesa ADD COLUMN IF NOT EXISTS parcelado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE despesa ADD COLUMN IF NOT EXISTS vencimento DATE;

ALTER TABLE parcela ADD COLUMN IF NOT EXISTS entrada BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS pago_por VARCHAR(120);

-- Despesas à vista antigas ganham o seu pagamento único.
INSERT INTO parcela (despesa_id, numero, valor, vencimento, pago, pago_em)
SELECT d.id, 1, d.valor_total, COALESCE(d.vencimento, d.criado_em::date), d.pago,
       CASE WHEN d.pago THEN d.criado_em END
FROM despesa d
WHERE NOT EXISTS (SELECT 1 FROM parcela p WHERE p.despesa_id = d.id);
