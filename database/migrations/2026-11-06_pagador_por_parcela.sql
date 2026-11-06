-- ============================================================
-- Quem pagou passa a ser registrado em cada parcela
-- Antes o rateio creditava a despesa inteira a um único pagador
-- (despesa.pago_por_id). Agora cada parcela paga guarda o participante
-- que a pagou, e só o que já foi pago entra no saldo do rateio.
--
-- Rodar uma vez no SQL Editor, depois de 2026-10-14_rateio.sql e
-- 2026-10-21_pagamentos_financeiro.sql. Pode ser rodado de novo.
-- ============================================================
BEGIN;

ALTER TABLE parcela ADD COLUMN IF NOT EXISTS pago_por_id UUID;
-- Paga por alguém de fora do rateio (ex.: pais da noiva): fica só o nome em pago_por
-- e a parcela não entra no saldo de ninguém.
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS pago_externo BOOLEAN NOT NULL DEFAULT FALSE;

-- FALSE: pagamento que não precisa ser rateado (fica fora do saldo de todos).
ALTER TABLE parcela ADD COLUMN IF NOT EXISTS ratear BOOLEAN NOT NULL DEFAULT TRUE;

-- Sem ON DELETE: remover quem pagou uma parcela é recusado.
ALTER TABLE parcela DROP CONSTRAINT IF EXISTS fk_parcela_pago_por;
ALTER TABLE parcela ADD CONSTRAINT fk_parcela_pago_por
    FOREIGN KEY (pago_por_id) REFERENCES participante_rateio(id);

CREATE INDEX IF NOT EXISTS idx_parcela_pago_por ON parcela(pago_por_id);

-- Parcelas já pagas herdam o pagador da despesa (NULL continua sendo o organizador).
UPDATE parcela p
SET pago_por_id = d.pago_por_id
FROM despesa d
WHERE d.id = p.despesa_id
  AND p.pago
  AND p.pago_por_id IS NULL
  AND d.pago_por_id IS NOT NULL;

-- O nome em texto acompanha, para o extrato mostrar "Pago por ...".
UPDATE parcela p
SET pago_por = pr.nome
FROM participante_rateio pr
WHERE pr.id = p.pago_por_id
  AND p.pago_por IS NULL;

COMMIT;
