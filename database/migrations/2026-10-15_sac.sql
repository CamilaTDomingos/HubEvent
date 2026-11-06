-- ============================================================
-- SAC (RF22): mensagens enviadas pelo formulário da página /sac
-- * O usuário logado só cria e lê as próprias mensagens. Não há
--   UPDATE nem DELETE pela API: o status e a resposta são mudados
--   pela equipe no painel do Supabase (Table Editor), que ignora o RLS.
-- * Toda mensagem nasce ABERTA e sem resposta, mesmo que alguém
--   burle a página e mande outro valor.
-- * Limite contra envio repetido: uma mensagem por usuário a cada
--   60 segundos. O banco recusa, não só a página.
-- Rodar uma vez no SQL Editor, depois de 2026-10-14_rsvp_lista_inteligente.sql.
-- Tudo numa transação; pode ser rodado de novo sem efeito.
-- ============================================================
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_mensagem_sac') THEN
        CREATE TYPE status_mensagem_sac AS ENUM ('ABERTA','RESPONDIDA','FECHADA');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS mensagem_sac (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    assunto VARCHAR(120) NOT NULL,
    mensagem TEXT NOT NULL,
    status status_mensagem_sac NOT NULL DEFAULT 'ABERTA',
    resposta TEXT, -- preenchida pela equipe no painel; aparece em "Minhas solicitações"
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mensagem_sac_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT chk_mensagem_sac_nome CHECK (btrim(nome) <> ''),
    CONSTRAINT chk_mensagem_sac_email CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    CONSTRAINT chk_mensagem_sac_assunto CHECK (btrim(assunto) <> ''),
    CONSTRAINT chk_mensagem_sac_mensagem CHECK (btrim(mensagem) <> '' AND char_length(mensagem) <= 2000)
);

-- O histórico é lido por usuário, do mais novo para o mais antigo; o
-- índice também cobre a chave estrangeira usuario_id.
CREATE INDEX IF NOT EXISTS idx_mensagem_sac_usuario_criado ON mensagem_sac(usuario_id, criado_em DESC);

ALTER TABLE mensagem_sac ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagem_sac_ler" ON mensagem_sac;
CREATE POLICY "mensagem_sac_ler" ON mensagem_sac
    FOR SELECT USING ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "mensagem_sac_criar" ON mensagem_sac;
CREATE POLICY "mensagem_sac_criar" ON mensagem_sac
    FOR INSERT WITH CHECK (
        (select auth.uid()) = usuario_id AND status = 'ABERTA' AND resposta IS NULL
    );

-- ---------- Limite de envio ----------
-- criado_em é sempre a hora do servidor (senão uma data antiga burlaria
-- o limite). O lock por usuário impede que dois envios simultâneos
-- passem juntos pela verificação.
CREATE OR REPLACE FUNCTION limitar_envio_mensagem_sac()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.criado_em := NOW();
    PERFORM pg_advisory_xact_lock(hashtext('mensagem_sac:' || NEW.usuario_id::text));

    IF EXISTS (
        SELECT 1 FROM public.mensagem_sac
        WHERE usuario_id = NEW.usuario_id AND criado_em > NOW() - INTERVAL '60 seconds'
    ) THEN
        RAISE EXCEPTION 'Você acabou de enviar uma mensagem. Aguarde um minuto para enviar outra.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION limitar_envio_mensagem_sac() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trigger_mensagem_sac_limite ON mensagem_sac;
CREATE TRIGGER trigger_mensagem_sac_limite
BEFORE INSERT ON mensagem_sac FOR EACH ROW EXECUTE FUNCTION limitar_envio_mensagem_sac();

COMMIT;
