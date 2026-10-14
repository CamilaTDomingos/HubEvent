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
    modulos JSONB NOT NULL DEFAULT '{"presentes": true, "site": true}'::jsonb,
    pix_chave VARCHAR(140),
    pix_nome VARCHAR(100),
    pix_cidade VARCHAR(100),
    orcamento_estimado DECIMAL(10,2),
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
    quantidade INTEGER NOT NULL DEFAULT 1,
    categoria VARCHAR(60),
    link TEXT,
    imagem_url TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_lista_presentes_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_lista_presentes_responsavel FOREIGN KEY (responsavel_por_id) REFERENCES usuario(id) ON DELETE SET NULL,
    CONSTRAINT chk_lista_presentes_valor CHECK (valor IS NULL OR valor >= 0),
    CONSTRAINT chk_lista_presentes_quantidade CHECK (quantidade >= 1)
);

-- Uma linha por unidade reservada pelos convidados no site.
CREATE TABLE reserva_presente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presente_id UUID NOT NULL,
    nome VARCHAR(100) NOT NULL,
    forma VARCHAR(10) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reserva_presente FOREIGN KEY (presente_id) REFERENCES lista_presentes(id) ON DELETE CASCADE,
    CONSTRAINT chk_reserva_forma CHECK (forma IN ('loja', 'pix', 'cartao'))
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
-- CATEGORIA DE TAREFA (criada por cada usuário, com cor própria)
-- ============================================================
CREATE TABLE categoria_tarefa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    nome VARCHAR(60) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_categoria_tarefa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT chk_categoria_tarefa_cor CHECK (cor ~ '^#[0-9a-fA-F]{6}$')
);

-- ============================================================
-- CATEGORIA DE DESPESA (por usuário; começa com as 9 iniciais)
-- ============================================================
CREATE TABLE categoria_despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL DEFAULT auth.uid(),
    nome VARCHAR(60) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_categoria_despesa_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT chk_categoria_despesa_cor CHECK (cor ~ '^#[0-9a-fA-F]{6}$')
);

-- ============================================================
-- PARTICIPANTE DO RATEIO (RF03). Só o organizador gerencia; os
-- participantes não têm login. O organizador entra sozinho (trigger).
-- ============================================================
CREATE TABLE participante_rateio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    nome VARCHAR(80) NOT NULL,
    convidado_id UUID,
    organizador BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_participante_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_participante_convidado FOREIGN KEY (convidado_id) REFERENCES convidado(id) ON DELETE SET NULL,
    CONSTRAINT uq_participante_evento UNIQUE (id, evento_id),
    CONSTRAINT chk_participante_nome CHECK (btrim(nome) <> '')
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
    categoria_id UUID,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_tarefa_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_tarefa_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_tarefa(id) ON DELETE SET NULL
);

-- ============================================================
-- DESPESA
-- ============================================================
CREATE TABLE despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100), -- legado: o app usa categoria_id
    categoria_id UUID,
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    parcelado BOOLEAN NOT NULL DEFAULT FALSE,
    vencimento DATE, -- data do pagamento da despesa à vista; parcelada usa a tabela parcela
    pago_por_id UUID, -- participante que pagou; NULL = o organizador
    divisao VARCHAR(10) NOT NULL DEFAULT 'IGUAL', -- IGUAL entre todos, ou VALOR/PERCENTUAL em cota_despesa
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_despesa_evento FOREIGN KEY (evento_id) REFERENCES evento(id) ON DELETE CASCADE,
    CONSTRAINT fk_despesa_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_despesa(id) ON DELETE SET NULL,
    CONSTRAINT fk_despesa_pago_por FOREIGN KEY (pago_por_id, evento_id) REFERENCES participante_rateio(id, evento_id),
    CONSTRAINT chk_despesa_valor CHECK (valor_total >= 0),
    CONSTRAINT chk_despesa_vencimento CHECK (parcelado OR vencimento IS NOT NULL),
    CONSTRAINT chk_despesa_divisao CHECK (divisao IN ('IGUAL', 'VALOR', 'PERCENTUAL'))
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
-- COTA DA DESPESA: parte de cada participante quando a divisão é
-- personalizada (VALOR ou PERCENTUAL). A soma fecha com valor_total;
-- quem grava é a função definir_rateio_despesa.
-- ============================================================
CREATE TABLE cota_despesa (
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

-- ============================================================
-- PAGAMENTO DO RATEIO: acerto quitado entre dois participantes
-- ============================================================
CREATE TABLE pagamento_rateio (
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

-- ============================================================
-- MENSAGEM CHAT
-- ============================================================
CREATE TABLE mensagem_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assistente_id UUID NOT NULL,
    usuario_id UUID NOT NULL,
    tipo tipo_mensagem NOT NULL,
    conteudo TEXT NOT NULL,
    dados JSONB, -- resposta estruturada da IA (tarefas sugeridas e quais já foram ao checklist)
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
CREATE INDEX idx_tarefa_categoria ON tarefa(categoria_id);
CREATE INDEX idx_categoria_tarefa_usuario ON categoria_tarefa(usuario_id);
CREATE INDEX idx_despesa_evento ON despesa(evento_id);
CREATE INDEX idx_despesa_categoria ON despesa(categoria_id);
CREATE INDEX idx_categoria_despesa_usuario ON categoria_despesa(usuario_id);
CREATE INDEX idx_parcela_despesa ON parcela(despesa_id);
CREATE INDEX idx_despesa_pago_por ON despesa(pago_por_id, evento_id);
CREATE INDEX idx_participante_evento ON participante_rateio(evento_id);
CREATE UNIQUE INDEX uq_participante_organizador ON participante_rateio(evento_id) WHERE organizador;
CREATE UNIQUE INDEX uq_participante_convidado ON participante_rateio(convidado_id);
CREATE INDEX idx_cota_participante ON cota_despesa(participante_id);
CREATE INDEX idx_pagamento_evento ON pagamento_rateio(evento_id);
CREATE INDEX idx_pagamento_de ON pagamento_rateio(de_id, evento_id);
CREATE INDEX idx_pagamento_para ON pagamento_rateio(para_id, evento_id);
CREATE INDEX idx_lista_presentes_evento ON lista_presentes(evento_id);
CREATE INDEX idx_lista_presentes_responsavel ON lista_presentes(responsavel_por_id);
CREATE INDEX idx_reserva_presente_presente ON reserva_presente(presente_id);
CREATE INDEX idx_mensagem_assistente_criado ON mensagem_chat(assistente_id, criado_em);
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
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER trigger_evento_atualizado_em
BEFORE UPDATE ON evento FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

CREATE TRIGGER trigger_landing_page_atualizado_em
BEFORE UPDATE ON landing_page FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

-- ============================================================
-- ORGANIZADOR COMO PARTICIPANTE DO RATEIO (evento novo)
-- ============================================================
CREATE OR REPLACE FUNCTION criar_participante_organizador()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.participante_rateio (evento_id, nome, organizador)
    SELECT NEW.id, left(COALESCE(NULLIF(btrim(u.nome), ''), 'Organizador'), 80), TRUE
    FROM public.usuario u
    WHERE u.id = NEW.organizador_id
    ON CONFLICT (evento_id) WHERE organizador DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

REVOKE EXECUTE ON FUNCTION criar_participante_organizador() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trigger_evento_participante_organizador
AFTER INSERT ON evento FOR EACH ROW EXECUTE FUNCTION criar_participante_organizador();

-- ============================================================
-- CATEGORIAS DE DESPESA INICIAIS de um usuário (só se ele não tiver nenhuma)
-- ============================================================
CREATE OR REPLACE FUNCTION criar_categorias_despesa_padrao(p_usuario UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE sql SET search_path = '';

REVOKE EXECUTE ON FUNCTION criar_categorias_despesa_padrao(UUID) FROM PUBLIC, anon, authenticated;

-- ============================================================
-- FUNÇÃO AUXILIAR: cria linha em "usuario" (e as categorias de despesa
-- iniciais) toda vez que alguém se cadastra via Supabase Auth
-- ============================================================
CREATE OR REPLACE FUNCTION criar_usuario_apos_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuario (id, nome, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);
    PERFORM public.criar_categorias_despesa_padrao(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Só o trigger chama a função; pela API (/rest/v1/rpc) ela fica fechada.
REVOKE EXECUTE ON FUNCTION criar_usuario_apos_signup() FROM PUBLIC, anon, authenticated;

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
ALTER TABLE categoria_tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE categoria_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE participante_rateio ENABLE ROW LEVEL SECURITY;
ALTER TABLE cota_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamento_rateio ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagem_chat ENABLE ROW LEVEL SECURITY;

-- USUARIO: só vê/edita o próprio perfil
CREATE POLICY "usuario_proprio" ON usuario
    FOR ALL USING ((select auth.uid()) = id);

-- EVENTO: só o organizador acessa
CREATE POLICY "evento_do_organizador" ON evento
    FOR ALL USING ((select auth.uid()) = organizador_id);

-- CONVIDADO: só o organizador. O RSVP público passa pelo backend (service_role).
CREATE POLICY "convidado_organizador_gerencia" ON convidado
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = convidado.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- LANDING_PAGE: só o organizador. O site público lê pelo backend (service_role).
CREATE POLICY "landing_page_organizador" ON landing_page
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = landing_page.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- LISTA_PRESENTES: organizador gerencia; o site público lê e reserva
-- pelo backend (service_role), nunca direto com a chave anon.
CREATE POLICY "lista_presentes_organizador" ON lista_presentes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = lista_presentes.evento_id AND evento.organizador_id = (select auth.uid()))
    );

ALTER TABLE reserva_presente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reserva_presente_organizador" ON reserva_presente
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lista_presentes p JOIN evento e ON e.id = p.evento_id
            WHERE p.id = reserva_presente.presente_id AND e.organizador_id = (select auth.uid())
        )
    );

-- ASSISTENTE_IA: só o organizador do evento
CREATE POLICY "assistente_ia_organizador" ON assistente_ia
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = assistente_ia.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- TAREFA: só o organizador do evento
CREATE POLICY "tarefa_organizador" ON tarefa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = tarefa.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- CATEGORIA_TAREFA: só o dono
CREATE POLICY "categoria_tarefa_propria" ON categoria_tarefa
    FOR ALL USING ((select auth.uid()) = usuario_id)
    WITH CHECK ((select auth.uid()) = usuario_id);

-- CATEGORIA_DESPESA: só o dono
CREATE POLICY "categoria_despesa_propria" ON categoria_despesa
    FOR ALL USING ((select auth.uid()) = usuario_id)
    WITH CHECK ((select auth.uid()) = usuario_id);

-- DESPESA: só o organizador do evento
CREATE POLICY "despesa_organizador" ON despesa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = despesa.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- PARCELA: só o organizador (via despesa -> evento)
CREATE POLICY "parcela_organizador" ON parcela
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM despesa
            JOIN evento ON evento.id = despesa.evento_id
            WHERE despesa.id = parcela.despesa_id AND evento.organizador_id = (select auth.uid())
        )
    );

-- PARTICIPANTE_RATEIO: só o organizador do evento; o participante
-- organizador não pode ser apagado (o cascade do evento ignora RLS).
CREATE POLICY "participante_rateio_ler" ON participante_rateio
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

CREATE POLICY "participante_rateio_criar" ON participante_rateio
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

CREATE POLICY "participante_rateio_editar" ON participante_rateio
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    ) WITH CHECK (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

CREATE POLICY "participante_rateio_remover" ON participante_rateio
    FOR DELETE USING (
        NOT organizador
        AND EXISTS (SELECT 1 FROM evento WHERE evento.id = participante_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- COTA_DESPESA: só o organizador, e só com participante do mesmo evento da despesa
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

-- PAGAMENTO_RATEIO: só o organizador do evento
CREATE POLICY "pagamento_rateio_organizador" ON pagamento_rateio
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = pagamento_rateio.evento_id AND evento.organizador_id = (select auth.uid()))
    );

-- MENSAGEM_CHAT: só o organizador do evento vinculado ao assistente
CREATE POLICY "mensagem_chat_organizador" ON mensagem_chat
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assistente_ia
            JOIN evento ON evento.id = assistente_ia.evento_id
            WHERE assistente_ia.id = mensagem_chat.assistente_id AND evento.organizador_id = (select auth.uid())
        )
    );

-- ============================================================
-- RATEIO (RF03): grava quem pagou e a divisão de uma despesa
-- ============================================================
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

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================

-- ============================================================
-- RESERVA DE PRESENTES E FOTOS
-- A função reservar_presente e o bucket "presentes" do Storage estão em
-- database/migrations/2026-10-07_dados_do_navegador_para_o_banco.sql
-- ============================================================
