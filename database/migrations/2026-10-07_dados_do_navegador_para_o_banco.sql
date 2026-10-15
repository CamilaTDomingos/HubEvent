-- ============================================================
-- Dados que ficavam no navegador (localStorage) passam para o banco:
--   * módulos opcionais de cada evento (presentes / site);
--   * dados de recebimento por Pix do evento;
--   * detalhes da lista de presentes (quantidade, categoria, link, foto);
--   * reservas de presentes feitas pelos convidados no site.
-- Fotos dos presentes vão para o bucket público "presentes" do Storage.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================

-- EVENTO: módulos e Pix ----------------------------------------
-- Eventos que já existiam ficam com tudo ativo, como antes.
ALTER TABLE evento
    ADD COLUMN IF NOT EXISTS modulos JSONB NOT NULL DEFAULT '{"presentes": true, "site": true}'::jsonb,
    ADD COLUMN IF NOT EXISTS pix_chave VARCHAR(140),
    ADD COLUMN IF NOT EXISTS pix_nome VARCHAR(100),
    ADD COLUMN IF NOT EXISTS pix_cidade VARCHAR(100);

-- LISTA_PRESENTES: campos usados pela tela ----------------------
ALTER TABLE lista_presentes
    ADD COLUMN IF NOT EXISTS quantidade INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(60),
    ADD COLUMN IF NOT EXISTS link TEXT,
    ADD COLUMN IF NOT EXISTS imagem_url TEXT;

ALTER TABLE lista_presentes DROP CONSTRAINT IF EXISTS chk_lista_presentes_quantidade;
ALTER TABLE lista_presentes ADD CONSTRAINT chk_lista_presentes_quantidade CHECK (quantidade >= 1);

-- RESERVA_PRESENTE: uma linha por unidade reservada -------------
CREATE TABLE IF NOT EXISTS reserva_presente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presente_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    forma VARCHAR(10) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reserva_presente FOREIGN KEY (presente_id) REFERENCES lista_presentes(id) ON DELETE CASCADE,
    CONSTRAINT chk_reserva_forma CHECK (forma IN ('loja', 'pix', 'cartao'))
);

CREATE INDEX IF NOT EXISTS idx_reserva_presente_presente ON reserva_presente(presente_id);

ALTER TABLE reserva_presente ENABLE ROW LEVEL SECURITY;

-- O organizador vê (e pode desfazer) as reservas dos próprios eventos.
DROP POLICY IF EXISTS "reserva_presente_organizador" ON reserva_presente;
CREATE POLICY "reserva_presente_organizador" ON reserva_presente
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lista_presentes p JOIN evento e ON e.id = p.evento_id
            WHERE p.id = reserva_presente.presente_id AND e.organizador_id = auth.uid()
        )
    );

-- O site público passa pelo backend (service_role). As políticas abertas
-- antigas deixavam qualquer pessoa com a chave anon alterar qualquer presente.
DROP POLICY IF EXISTS "lista_presentes_publica_leitura" ON lista_presentes;
DROP POLICY IF EXISTS "lista_presentes_publica_reserva" ON lista_presentes;

-- Reserva atômica: trava o presente e só reserva se ainda houver unidade.
-- Dois convidados no mesmo instante não conseguem reservar a última unidade.
CREATE OR REPLACE FUNCTION reservar_presente(p_presente_id UUID, p_nome TEXT, p_forma TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_quantidade INTEGER;
    v_reservadas INTEGER;
BEGIN
    SELECT quantidade INTO v_quantidade FROM lista_presentes WHERE id = p_presente_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    SELECT COUNT(*) INTO v_reservadas FROM reserva_presente WHERE presente_id = p_presente_id;
    IF v_reservadas >= v_quantidade THEN
        RETURN FALSE;
    END IF;

    INSERT INTO reserva_presente (presente_id, nome, forma) VALUES (p_presente_id, p_nome, p_forma);
    RETURN TRUE;
END;
$$;

-- Só o backend chama a função.
REVOKE ALL ON FUNCTION reservar_presente(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION reservar_presente(UUID, TEXT, TEXT) TO service_role;

-- STORAGE: fotos dos presentes ----------------------------------
-- Caminho dos arquivos: <evento_id>/<arquivo>. Leitura pública (o site
-- mostra as fotos); escrita só para o organizador do evento da pasta.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('presentes', 'presentes', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "presentes_fotos_organizador" ON storage.objects;
CREATE POLICY "presentes_fotos_organizador" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'presentes'
        AND EXISTS (SELECT 1 FROM public.evento e WHERE e.id::text = (storage.foldername(name))[1] AND e.organizador_id = auth.uid())
    )
    WITH CHECK (
        bucket_id = 'presentes'
        AND EXISTS (SELECT 1 FROM public.evento e WHERE e.id::text = (storage.foldername(name))[1] AND e.organizador_id = auth.uid())
    );
