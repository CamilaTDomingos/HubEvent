-- ============================================================
-- Categorias de despesa gerenciáveis (RF16)
-- Antes eram uma lista fixa no código. Agora cada usuário tem as
-- próprias (nome + cor), começando pelas 9 de sempre, e cada despesa
-- aponta para a categoria pelo id: renomear ou trocar a cor reflete
-- em todas as despesas; apagar deixa as despesas sem categoria.
-- Rodar uma vez no SQL Editor. Tudo numa transação.
-- ============================================================
BEGIN;

CREATE TABLE IF NOT EXISTS categoria_despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    nome VARCHAR(60) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_categoria_despesa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT chk_categoria_despesa_cor CHECK (cor ~ '^#[0-9a-fA-F]{6}$')
);

CREATE INDEX IF NOT EXISTS idx_categoria_despesa_usuario ON categoria_despesa(usuario_id);

-- A coluna de texto "categoria" fica como legado; o app passa a usar categoria_id.
ALTER TABLE despesa
    ADD COLUMN IF NOT EXISTS categoria_id UUID
    REFERENCES categoria_despesa(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_despesa_categoria ON despesa(categoria_id);

ALTER TABLE categoria_despesa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categoria_despesa_propria" ON categoria_despesa;
CREATE POLICY "categoria_despesa_propria" ON categoria_despesa
    FOR ALL USING ((select auth.uid()) = usuario_id)
    WITH CHECK ((select auth.uid()) = usuario_id);

-- Categorias iniciais de um usuário (as mesmas que eram fixas no código).
-- Só cria se ele ainda não tiver nenhuma.
CREATE OR REPLACE FUNCTION criar_categorias_despesa_padrao(p_usuario UUID)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
    INSERT INTO public.categoria_despesa (usuario_id, nome, cor)
    SELECT p_usuario, v.nome, v.cor
    FROM (VALUES
        ('Local e Cerimônia', '#1e6b7b'),
        ('Buffet e Bebidas', '#3b6fe8'),
        ('Decoração', '#e8a432'),
        ('Fotografia e Vídeo', '#8b5cf6'),
        ('Vestuário', '#e5484d'),
        ('Música e Entretenimento', '#06b6d4'),
        ('Convites e Papelaria', '#f97316'),
        ('Transporte', '#64748b'),
        ('Outros', '#9aa0ae')
    ) AS v(nome, cor)
    WHERE NOT EXISTS (SELECT 1 FROM public.categoria_despesa c WHERE c.usuario_id = p_usuario);
$$;

REVOKE EXECUTE ON FUNCTION criar_categorias_despesa_padrao(UUID) FROM PUBLIC, anon, authenticated;

-- Usuários que já existem ganham as categorias iniciais.
SELECT criar_categorias_despesa_padrao(id) FROM usuario;

-- Despesas com uma categoria em texto que não está entre as iniciais
-- ganham uma categoria com esse nome, em cinza.
INSERT INTO categoria_despesa (usuario_id, nome, cor)
SELECT DISTINCT e.organizador_id, d.categoria, '#c9ced8'
FROM despesa d JOIN evento e ON e.id = d.evento_id
WHERE d.categoria IS NOT NULL AND d.categoria <> ''
  AND NOT EXISTS (
      SELECT 1 FROM categoria_despesa c WHERE c.usuario_id = e.organizador_id AND c.nome = d.categoria
  );

-- Liga as despesas existentes à categoria do dono do evento.
UPDATE despesa d
SET categoria_id = c.id
FROM evento e, categoria_despesa c
WHERE e.id = d.evento_id
  AND c.usuario_id = e.organizador_id
  AND c.nome = d.categoria
  AND d.categoria_id IS NULL;

-- Cadastro novo: cria o usuário e as categorias iniciais de despesa.
CREATE OR REPLACE FUNCTION criar_usuario_apos_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.usuario (id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
    PERFORM public.criar_categorias_despesa_padrao(NEW.id);
    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION criar_usuario_apos_signup() FROM PUBLIC, anon, authenticated;

COMMIT;
