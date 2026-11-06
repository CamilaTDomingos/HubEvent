-- ============================================================
-- Gestão de RSVP e Lista Inteligente (RF04)
-- * Grupos de convidados por evento (Família, Amigos, Trabalho…),
--   gerenciados na aba Convidados. Cada evento começa com três
--   grupos; apagar um grupo deixa os convidados sem grupo.
-- * Acompanhantes: o organizador define quantos cada convite
--   permite e o convidado informa quantos vão com ele. O banco
--   recusa passar do limite, mesmo que alguém burle a página.
-- * enviado_em: quando o link do convite foi enviado (marcado ao
--   copiar o link ou à mão). Quem já respondeu conta como enviado.
-- Convidados antigos ficam sem grupo, com 0 acompanhantes e sem
-- data de envio; nada muda para eles até o organizador editar.
-- Rodar uma vez no SQL Editor, depois de 2026-10-14_rateio.sql.
-- Tudo numa transação; pode ser rodado de novo sem efeito.
-- ============================================================
BEGIN;

-- ---------- Grupos ----------
CREATE TABLE IF NOT EXISTS grupo_convidado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    nome VARCHAR(60) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_grupo_convidado_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    -- Permite que o convidado aponte para (grupo, evento) e não aceite
    -- um grupo de outro evento.
    CONSTRAINT uq_grupo_convidado_evento UNIQUE (id, evento_id),
    CONSTRAINT chk_grupo_convidado_nome CHECK (btrim(nome) <> ''),
    CONSTRAINT chk_grupo_convidado_cor CHECK (cor ~ '^#[0-9a-fA-F]{6}$')
);

-- Também serve de índice para a chave estrangeira evento_id.
CREATE UNIQUE INDEX IF NOT EXISTS uq_grupo_convidado_nome ON grupo_convidado(evento_id, lower(nome));

ALTER TABLE grupo_convidado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grupo_convidado_organizador" ON grupo_convidado;
CREATE POLICY "grupo_convidado_organizador" ON grupo_convidado
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = grupo_convidado.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- ---------- Colunas novas do convidado ----------
ALTER TABLE convidado ADD COLUMN IF NOT EXISTS grupo_id UUID;
ALTER TABLE convidado ADD COLUMN IF NOT EXISTS acompanhantes_permitidos SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE convidado ADD COLUMN IF NOT EXISTS acompanhantes_confirmados SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE convidado ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;

-- Apagar o grupo zera só grupo_id (o evento_id do convidado continua).
ALTER TABLE convidado DROP CONSTRAINT IF EXISTS fk_convidado_grupo;
ALTER TABLE convidado ADD CONSTRAINT fk_convidado_grupo
    FOREIGN KEY (grupo_id, evento_id) REFERENCES grupo_convidado(id, evento_id) ON DELETE SET NULL (grupo_id);

CREATE INDEX IF NOT EXISTS idx_convidado_grupo ON convidado(grupo_id, evento_id);

ALTER TABLE convidado DROP CONSTRAINT IF EXISTS chk_convidado_acompanhantes_permitidos;
ALTER TABLE convidado ADD CONSTRAINT chk_convidado_acompanhantes_permitidos
    CHECK (acompanhantes_permitidos BETWEEN 0 AND 20);

-- Só quem confirmou leva acompanhantes, e nunca acima do permitido.
ALTER TABLE convidado DROP CONSTRAINT IF EXISTS chk_convidado_acompanhantes_confirmados;
ALTER TABLE convidado ADD CONSTRAINT chk_convidado_acompanhantes_confirmados
    CHECK (
        acompanhantes_confirmados BETWEEN 0 AND acompanhantes_permitidos
        AND (status_presenca = 'CONFIRMADO' OR acompanhantes_confirmados = 0)
    );

-- ---------- Grupos iniciais ----------
-- Evento novo começa com Família, Amigos e Trabalho.
CREATE OR REPLACE FUNCTION criar_grupos_evento_novo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.grupo_convidado (evento_id, nome, cor)
    VALUES (NEW.id, 'Família', '#d9468f'), (NEW.id, 'Amigos', '#3b6fe8'), (NEW.id, 'Trabalho', '#e8a432')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION criar_grupos_evento_novo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_evento_grupos_convidado ON evento;
CREATE TRIGGER trigger_evento_grupos_convidado
AFTER INSERT ON evento FOR EACH ROW EXECUTE FUNCTION criar_grupos_evento_novo();

-- Eventos que já existem ganham os mesmos grupos, se ainda não tiverem nenhum.
INSERT INTO grupo_convidado (evento_id, nome, cor)
SELECT e.id, v.nome, v.cor
FROM evento e
CROSS JOIN (VALUES ('Família', '#d9468f'), ('Amigos', '#3b6fe8'), ('Trabalho', '#e8a432')) AS v(nome, cor)
WHERE NOT EXISTS (SELECT 1 FROM grupo_convidado g WHERE g.evento_id = e.id);

COMMIT;
