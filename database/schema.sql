-- ============================================================
-- HUBEVENT - BANCO DE DADOS (v2 - com Auth + RLS)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_evento') THEN
        CREATE TYPE status_evento AS ENUM ('PLANEJAMENTO','CONFIRMADO','EM_ANDAMENTO','CONCLUIDO','CANCELADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_presenca') THEN
        CREATE TYPE status_presenca AS ENUM ('PENDENTE','CONFIRMADO','RECUSADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_tarefa') THEN
        CREATE TYPE status_tarefa AS ENUM ('PENDENTE','EM_ANDAMENTO','CONCLUIDA','CANCELADA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_mensagem') THEN
        CREATE TYPE tipo_mensagem AS ENUM ('USUARIO','IA','SISTEMA');
    END IF;
END
$$;

-- ============================================================
-- USUARIO (agora vinculado ao Supabase Auth, sem senha_hash)
-- ============================================================
CREATE TABLE usuario (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENTO
-- ============================================================
CREATE TABLE evento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizador_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    local VARCHAR(255),
    categoria VARCHAR(100),
    status status_evento NOT NULL DEFAULT 'PLANEJAMENTO',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_evento_organizador FOREIGN KEY (organizador_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT chk_evento_datas CHECK (data_fim >= data_inicio)
);

-- ============================================================
-- CONVIDADO
-- ============================================================
CREATE TABLE convidado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    status_presenca status_presenca NOT NULL DEFAULT 'PENDENTE',
    confirmado_em TIMESTAMPTZ,
    CONSTRAINT fk_convidado_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
);

-- ============================================================
-- LANDING PAGE
-- ============================================================
CREATE TABLE landing_page (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL UNIQUE,
    titulo VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    conteudo TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_landing_page_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
);

-- ============================================================
-- LISTA DE PRESENTES
-- ============================================================
CREATE TABLE lista_presentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    responsavel_por_id UUID,
    nome VARCHAR(255) NOT NULL,
    descricao VARCHAR(255),
    valor DECIMAL(10,2),
    loja VARCHAR(255),
    reservado BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_lista_presentes_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_presentes_responsavel FOREIGN KEY (responsavel_por_id) REFERENCES usuario(id) ON DELETE SET NULL,
    CONSTRAINT chk_lista_presentes_valor CHECK (valor IS NULL OR valor >= 0)
);

-- ============================================================
-- ASSISTENTE IA
-- ============================================================
CREATE TABLE assistente_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    configuracoes JSONB NOT NULL DEFAULT '{}'::JSONB,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_assistente_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
);

-- ============================================================
-- TAREFA
-- ============================================================
CREATE TABLE tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    prazo DATE,
    status status_tarefa NOT NULL DEFAULT 'PENDENTE',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tarefa_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE
);

-- ============================================================
-- DESPESA
-- ============================================================
CREATE TABLE despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100),
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_despesa_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT chk_despesa_valor CHECK (valor_total >= 0)
);

-- ============================================================
-- PARCELA
-- ============================================================
CREATE TABLE parcela (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    despesa_id UUID NOT NULL,
    numero INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    vencimento DATE NOT NULL,
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    pago_em TIMESTAMPTZ,
    CONSTRAINT fk_parcela_despesa FOREIGN KEY (despesa_id) REFERENCES despesa(id) ON DELETE CASCADE,
    CONSTRAINT chk_parcela_numero CHECK (numero > 0),
    CONSTRAINT chk_parcela_valor CHECK (valor >= 0)
);

-- ============================================================
-- MENSAGEM CHAT
-- ============================================================
CREATE TABLE mensagem_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistente_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    tipo tipo_mensagem NOT NULL,
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_mensagem_assistente FOREIGN KEY (assistente_id) REFERENCES assistente_ia(id) ON DELETE CASCADE,
    CONSTRAINT fk_mensagem_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_evento_organizador ON evento(organizador_id);
CREATE INDEX idx_evento_data_inicio ON evento(data_inicio);
CREATE INDEX idx_convidado_evento ON convidado(evento_id);
CREATE INDEX idx_tarefa_evento ON tarefa(evento_id);
CREATE INDEX idx_despesa_evento ON despesa(evento_id);
CREATE INDEX idx_parcela_despesa ON parcela(despesa_id);
CREATE INDEX idx_lista_presentes_evento ON lista_presentes(evento_id);
CREATE INDEX idx_mensagem_assistente ON mensagem_chat(assistente_id);
CREATE INDEX idx_mensagem_usuario ON mensagem_chat(usuario_id);

-- ============================================================
-- TRIGGERS (updated_at automático)
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evento_atualizado_em
BEFORE UPDATE ON evento FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

CREATE TRIGGER trigger_landing_page_atualizado_em
BEFORE UPDATE ON landing_page FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

-- ============================================================
-- FUNÇÃO AUXILIAR: cria linha em "usuario" automaticamente
-- toda vez que alguém se cadastra via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION criar_usuario_apos_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuario (id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION criar_usuario_apos_signup();

-- ============================================================
-- RLS - HABILITA EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE convidado ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_presentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistente_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagem_chat ENABLE ROW LEVEL SECURITY;

-- USUARIO: só vê/edita o próprio perfil
CREATE POLICY "usuario_proprio" ON usuario
    FOR ALL USING (auth.uid() = id);

-- EVENTO: só o organizador acessa
CREATE POLICY "evento_do_organizador" ON evento
    FOR ALL USING (auth.uid() = organizador_id);

-- CONVIDADO: organizador gerencia; QUALQUER PESSOA (sem login) pode
-- ler e confirmar presença via link público -- necessário pro RSVP funcionar
CREATE POLICY "convidado_organizador_gerencia" ON convidado
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = convidado.evento_id AND evento.organizador_id = auth.uid())
    );

CREATE POLICY "convidado_publico_confirma_presenca" ON convidado
    FOR SELECT USING (true);

CREATE POLICY "convidado_publico_atualiza_rsvp" ON convidado
    FOR UPDATE USING (true);

-- LANDING_PAGE: organizador gerencia; qualquer um pode ler se estiver ativa (página pública)
CREATE POLICY "landing_page_organizador" ON landing_page
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = landing_page.evento_id AND evento.organizador_id = auth.uid())
    );

CREATE POLICY "landing_page_publica_leitura" ON landing_page
    FOR SELECT USING (ativa = true);

-- LISTA_PRESENTES: organizador gerencia; público pode ler e reservar
CREATE POLICY "lista_presentes_organizador" ON lista_presentes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = lista_presentes.evento_id AND evento.organizador_id = auth.uid())
    );

CREATE POLICY "lista_presentes_publica_leitura" ON lista_presentes
    FOR SELECT USING (true);

CREATE POLICY "lista_presentes_publica_reserva" ON lista_presentes
    FOR UPDATE USING (true);

-- ASSISTENTE_IA: só o organizador do evento
CREATE POLICY "assistente_ia_organizador" ON assistente_ia
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = assistente_ia.evento_id AND evento.organizador_id = auth.uid())
    );

-- TAREFA: só o organizador do evento
CREATE POLICY "tarefa_organizador" ON tarefa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = tarefa.evento_id AND evento.organizador_id = auth.uid())
    );

-- DESPESA: só o organizador do evento
CREATE POLICY "despesa_organizador" ON despesa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = despesa.evento_id AND evento.organizador_id = auth.uid())
    );

-- PARCELA: só o organizador (via despesa -> evento)
CREATE POLICY "parcela_organizador" ON parcela
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM despesa
            JOIN evento ON evento.id = despesa.evento_id
            WHERE despesa.id = parcela.despesa_id AND evento.organizador_id = auth.uid()
        )
    );

-- MENSAGEM_CHAT: só o organizador do evento vinculado ao assistente
CREATE POLICY "mensagem_chat_organizador" ON mensagem_chat
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assistente_ia
            JOIN evento ON evento.id = assistente_ia.evento_id
            WHERE assistente_ia.id = mensagem_chat.assistente_id AND evento.organizador_id = auth.uid()
        )
    );

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================