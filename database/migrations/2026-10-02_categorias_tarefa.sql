-- ============================================================
-- Categorias de tarefa do checklist
-- Cada usuário cria as próprias categorias (nome + cor) e pode
-- associar uma delas a cada tarefa.
-- Rodar uma vez no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS categoria_tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    nome VARCHAR(60) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_categoria_tarefa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT chk_categoria_tarefa_cor CHECK (cor ~ '^#[0-9a-fA-F]{6}$')
);

-- Apagar uma categoria não apaga as tarefas: elas só ficam sem categoria.
ALTER TABLE tarefa
    ADD COLUMN IF NOT EXISTS categoria_id UUID
    REFERENCES categoria_tarefa(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categoria_tarefa_usuario ON categoria_tarefa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefa_categoria ON tarefa(categoria_id);

ALTER TABLE categoria_tarefa ENABLE ROW LEVEL SECURITY;

-- Só o dono vê e altera as próprias categorias.
DROP POLICY IF EXISTS "categoria_tarefa_propria" ON categoria_tarefa;
CREATE POLICY "categoria_tarefa_propria" ON categoria_tarefa
    FOR ALL USING (auth.uid() = usuario_id)
    WITH CHECK (auth.uid() = usuario_id);
