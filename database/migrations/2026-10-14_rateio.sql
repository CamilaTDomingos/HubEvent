-- ============================================================
-- Rateio dinâmico das despesas (RF03 - "Gap Financeiro")
-- Quem divide os custos do evento entra como participante (um nome
-- livre ou um convidado). O organizador é participante desde o início
-- e é o único que acessa o rateio: os participantes não têm login.
--
-- Cada despesa tem quem pagou (pago_por_id; NULL = o organizador) e
-- como ela se divide:
--   IGUAL      -> entre todos os participantes atuais. Entrou ou saiu
--                 alguém, as cotas mudam sozinhas (nada é gravado).
--   VALOR      -> valores fixos por participante, em cota_despesa.
--   PERCENTUAL -> porcentagens; cota_despesa guarda o valor já
--                 convertido em centavos e a porcentagem digitada.
-- A soma das cotas fecha com o valor da despesa: quem grava é a função
-- definir_rateio_despesa, que confere isso antes de salvar.
--
-- Os acertos entre participantes ("Ana pagou R$ 50 ao Bruno") ficam em
-- pagamento_rateio e entram no saldo de cada um.
--
-- Rodar uma vez no SQL Editor, depois de 2026-10-08_vencimento_despesa.sql.
-- Tudo numa transação; pode ser rodado de novo sem efeito.
-- ============================================================
BEGIN;

-- ---------- Participantes ----------
CREATE TABLE IF NOT EXISTS participante_rateio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    nome VARCHAR(80) NOT NULL,
    convidado_id UUID,
    organizador BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_participante_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_participante_convidado FOREIGN KEY (convidado_id) REFERENCES convidado(id) ON DELETE SET NULL,
    -- Permite que despesa e pagamento apontem para (participante, evento)
    -- e não aceitem um participante de outro evento.
    CONSTRAINT uq_participante_evento UNIQUE (id, evento_id),
    CONSTRAINT chk_participante_nome CHECK (btrim(nome) <> '')
);

CREATE INDEX IF NOT EXISTS idx_participante_evento ON participante_rateio(evento_id);
-- Um organizador por evento; um convidado entra no rateio uma vez só.
CREATE UNIQUE INDEX IF NOT EXISTS uq_participante_organizador ON participante_rateio(evento_id) WHERE organizador;
CREATE UNIQUE INDEX IF NOT EXISTS uq_participante_convidado ON participante_rateio(convidado_id);

-- ---------- Quem pagou e como divide ----------
ALTER TABLE despesa ADD COLUMN IF NOT EXISTS pago_por_id UUID;
ALTER TABLE despesa ADD COLUMN IF NOT EXISTS divisao VARCHAR(10) NOT NULL DEFAULT 'IGUAL';

ALTER TABLE despesa DROP CONSTRAINT IF EXISTS chk_despesa_divisao;
ALTER TABLE despesa ADD CONSTRAINT chk_despesa_divisao CHECK (divisao IN ('IGUAL', 'VALOR', 'PERCENTUAL'));

-- Sem ON DELETE: remover quem pagou alguma despesa é recusado. A checagem
-- fica para o fim do comando, então apagar o evento (que leva despesas e
-- participantes juntos) continua funcionando.
ALTER TABLE despesa DROP CONSTRAINT IF EXISTS fk_despesa_pago_por;
ALTER TABLE despesa ADD CONSTRAINT fk_despesa_pago_por
    FOREIGN KEY (pago_por_id, evento_id) REFERENCES participante_rateio(id, evento_id);

CREATE INDEX IF NOT EXISTS idx_despesa_pago_por ON despesa(pago_por_id, evento_id);

-- ---------- Cotas das divisões personalizadas ----------
CREATE TABLE IF NOT EXISTS cota_despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despesa_id UUID NOT NULL,
    participante_id UUID NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    percentual DECIMAL(5,2), -- só na divisão por porcentagem
    CONSTRAINT fk_cota_despesa FOREIGN KEY (despesa_id) REFERENCES despesa(id) ON DELETE CASCADE,
    CONSTRAINT fk_cota_participante FOREIGN KEY (participante_id) REFERENCES participante_rateio(id),
    CONSTRAINT uq_cota_despesa_participante UNIQUE (despesa_id, participante_id),
    CONSTRAINT chk_cota_valor CHECK (valor >= 0),
    CONSTRAINT chk_cota_percentual CHECK (percentual IS NULL OR percentual BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_cota_participante ON cota_despesa(participante_id);

-- ---------- Acertos quitados ----------
CREATE TABLE IF NOT EXISTS pagamento_rateio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    de_id UUID NOT NULL,
    para_id UUID NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    pago_em DATE NOT NULL DEFAULT CURRENT_DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pagamento_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagamento_de FOREIGN KEY (de_id, evento_id) REFERENCES participante_rateio(id, evento_id),
    CONSTRAINT fk_pagamento_para FOREIGN KEY (para_id, evento_id) REFERENCES participante_rateio(id, evento_id),
    CONSTRAINT chk_pagamento_valor CHECK (valor > 0),
    CONSTRAINT chk_pagamento_pessoas CHECK (de_id <> para_id)
);

CREATE INDEX IF NOT EXISTS idx_pagamento_evento ON pagamento_rateio(evento_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_de ON pagamento_rateio(de_id, evento_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_para ON pagamento_rateio(para_id, evento_id);

-- ---------- RLS: só o organizador do evento ----------
ALTER TABLE participante_rateio ENABLE ROW LEVEL SECURITY;
ALTER TABLE cota_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamento_rateio ENABLE ROW LEVEL SECURITY;

-- Políticas separadas por comando: o organizador não pode ser apagado.
-- (Apagar o evento leva o organizador junto; o cascade ignora RLS.)
DROP POLICY IF EXISTS "participante_rateio_ler" ON participante_rateio;
CREATE POLICY "participante_rateio_ler" ON participante_rateio
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "participante_rateio_criar" ON participante_rateio;
CREATE POLICY "participante_rateio_criar" ON participante_rateio
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "participante_rateio_editar" ON participante_rateio;
CREATE POLICY "participante_rateio_editar" ON participante_rateio
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "participante_rateio_remover" ON participante_rateio;
CREATE POLICY "participante_rateio_remover" ON participante_rateio
    FOR DELETE USING (
        NOT organizador
        AND EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- A cota só aceita participante do mesmo evento da despesa.
DROP POLICY IF EXISTS "cota_despesa_organizador" ON cota_despesa;
CREATE POLICY "cota_despesa_organizador" ON cota_despesa
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM despesa
            JOIN evento ON evento.id = despesa.evento_id
            JOIN participante_rateio p ON p.evento_id = despesa.evento_id
            WHERE despesa.id = cota_despesa.despesa_id
              AND p.id = cota_despesa.participante_id
              AND evento.organizador_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "pagamento_rateio_organizador" ON pagamento_rateio;
CREATE POLICY "pagamento_rateio_organizador" ON pagamento_rateio
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = pagamento_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- ---------- Organizador como participante ----------
-- Evento novo: o organizador entra no rateio com o nome do perfil.
CREATE OR REPLACE FUNCTION criar_participante_organizador()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.participante_rateio (evento_id, nome, organizador)
    SELECT NEW.id, left(COALESCE(NULLIF(btrim(u.nome), ''), 'Organizador'), 80), TRUE
    FROM public.usuario u
    WHERE u.id = NEW.organizador_id
    ON CONFLICT (evento_id) WHERE organizador DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION criar_participante_organizador() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_evento_participante_organizador ON evento;
CREATE TRIGGER trigger_evento_participante_organizador
AFTER INSERT ON evento FOR EACH ROW EXECUTE FUNCTION criar_participante_organizador();

-- Eventos que já existem ganham o organizador como participante.
INSERT INTO participante_rateio (evento_id, nome, organizador)
SELECT e.id, left(COALESCE(NULLIF(btrim(u.nome), ''), 'Organizador'), 80), TRUE
FROM evento e
JOIN usuario u ON u.id = e.organizador_id
ON CONFLICT (evento_id) WHERE organizador DO NOTHING;

-- ---------- Gravar quem pagou e a divisão de uma vez ----------
-- Troca as cotas da despesa numa transação só e recusa uma divisão que
-- não fecha com o valor. Roda com as permissões de quem chama (RLS vale).
-- p_cotas: [{"participante_id": "...", "valor": 12.34, "percentual": 33.33}]
CREATE OR REPLACE FUNCTION definir_rateio_despesa(
    p_despesa UUID,
    p_pago_por UUID,
    p_divisao VARCHAR,
    p_cotas JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_evento UUID;
    v_total DECIMAL(10,2);
    v_soma DECIMAL(14,2);
    v_soma_percentual DECIMAL(8,2);
BEGIN
    SELECT evento_id, valor_total INTO v_evento, v_total
    FROM public.despesa WHERE id = p_despesa
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Despesa não encontrada.' USING ERRCODE = 'P0002';
    END IF;

    IF p_divisao IS NULL OR p_divisao NOT IN ('IGUAL', 'VALOR', 'PERCENTUAL') THEN
        RAISE EXCEPTION 'Divisão inválida: %.', p_divisao USING ERRCODE = '22023';
    END IF;

    IF p_pago_por IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.participante_rateio WHERE id = p_pago_por AND evento_id = v_evento
    ) THEN
        RAISE EXCEPTION 'Quem pagou não participa do rateio deste evento.' USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.cota_despesa WHERE despesa_id = p_despesa;

    IF p_divisao <> 'IGUAL' THEN
        IF jsonb_typeof(p_cotas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_cotas) = 0 THEN
            RAISE EXCEPTION 'Informe a parte de cada participante.' USING ERRCODE = '22023';
        END IF;

        -- A política de cota_despesa barra participante de outro evento.
        INSERT INTO public.cota_despesa (despesa_id, participante_id, valor, percentual)
        SELECT p_despesa,
               (c->>'participante_id')::UUID,
               (c->>'valor')::DECIMAL(10,2),
               CASE WHEN p_divisao = 'PERCENTUAL' THEN (c->>'percentual')::DECIMAL(5,2) END
        FROM jsonb_array_elements(p_cotas) AS c;

        SELECT SUM(valor), SUM(percentual) INTO v_soma, v_soma_percentual
        FROM public.cota_despesa WHERE despesa_id = p_despesa;

        IF v_soma <> v_total THEN
            RAISE EXCEPTION 'As partes somam R$ %, mas a despesa é de R$ %.', v_soma, v_total USING ERRCODE = '22023';
        END IF;

        IF p_divisao = 'PERCENTUAL' AND v_soma_percentual IS DISTINCT FROM 100 THEN
            RAISE EXCEPTION 'As porcentagens somam % e precisam fechar 100.', v_soma_percentual USING ERRCODE = '22023';
        END IF;
    END IF;

    UPDATE public.despesa
    SET pago_por_id = p_pago_por, divisao = p_divisao
    WHERE id = p_despesa;
END;
$$;

REVOKE EXECUTE ON FUNCTION definir_rateio_despesa(UUID, UUID, VARCHAR, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION definir_rateio_despesa(UUID, UUID, VARCHAR, JSONB) TO authenticated;

COMMIT;
