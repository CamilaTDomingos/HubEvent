-- ============================================================
-- Correções apontadas pelo Security/Performance Advisor do Supabase.
-- Rodar uma vez no SQL Editor. Tudo roda numa transação: se algo
-- falhar, nada é aplicado.
-- ============================================================
BEGIN;

-- ---------- SEGURANÇA: funções ----------

-- search_path fixo: impede que um objeto com o mesmo nome em outro schema
-- seja usado no lugar do esperado.
ALTER FUNCTION public.atualizar_data_modificacao() SET search_path = '';

-- A função do cadastro roda como dono (SECURITY DEFINER). Ela só deve ser
-- disparada pelo trigger em auth.users, nunca chamada pela API
-- (/rest/v1/rpc/criar_usuario_apos_signup). O trigger continua funcionando.
ALTER FUNCTION public.criar_usuario_apos_signup() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.criar_usuario_apos_signup() FROM PUBLIC, anon, authenticated;

-- Cópia antiga da mesma função, sem trigger usando: só abria uma rota na API.
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ---------- SEGURANÇA: leitura pública desnecessária ----------

-- O site público lê a landing page pelo backend (service_role). Com a chave
-- anon, qualquer pessoa conseguia listar todos os sites publicados.
DROP POLICY IF EXISTS "landing_page_publica_leitura" ON landing_page;

-- ---------- DESEMPENHO: auth.uid() avaliado uma vez por consulta ----------
-- (select auth.uid()) vira um valor fixo na consulta; auth.uid() sozinho é
-- recalculado a cada linha.

DROP POLICY IF EXISTS "usuario_proprio" ON usuario;
CREATE POLICY "usuario_proprio" ON usuario
    FOR ALL USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "evento_do_organizador" ON evento;
CREATE POLICY "evento_do_organizador" ON evento
    FOR ALL USING ((select auth.uid()) = organizador_id);

DROP POLICY IF EXISTS "convidado_organizador_gerencia" ON convidado;
CREATE POLICY "convidado_organizador_gerencia" ON convidado
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = convidado.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "landing_page_organizador" ON landing_page;
CREATE POLICY "landing_page_organizador" ON landing_page
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = landing_page.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "lista_presentes_organizador" ON lista_presentes;
CREATE POLICY "lista_presentes_organizador" ON lista_presentes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = lista_presentes.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "reserva_presente_organizador" ON reserva_presente;
CREATE POLICY "reserva_presente_organizador" ON reserva_presente
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM lista_presentes p JOIN evento e ON e.id = p.evento_id
            WHERE p.id = reserva_presente.presente_id AND e.organizador_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "assistente_ia_organizador" ON assistente_ia;
CREATE POLICY "assistente_ia_organizador" ON assistente_ia
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = assistente_ia.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "tarefa_organizador" ON tarefa;
CREATE POLICY "tarefa_organizador" ON tarefa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = tarefa.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "categoria_tarefa_propria" ON categoria_tarefa;
CREATE POLICY "categoria_tarefa_propria" ON categoria_tarefa
    FOR ALL USING ((select auth.uid()) = usuario_id)
    WITH CHECK ((select auth.uid()) = usuario_id);

DROP POLICY IF EXISTS "despesa_organizador" ON despesa;
CREATE POLICY "despesa_organizador" ON despesa
    FOR ALL USING (
        EXISTS (SELECT 1 FROM evento WHERE evento.id = despesa.evento_id AND evento.organizador_id = (select auth.uid()))
    );

DROP POLICY IF EXISTS "parcela_organizador" ON parcela;
CREATE POLICY "parcela_organizador" ON parcela
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM despesa JOIN evento ON evento.id = despesa.evento_id
            WHERE despesa.id = parcela.despesa_id AND evento.organizador_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "mensagem_chat_organizador" ON mensagem_chat;
CREATE POLICY "mensagem_chat_organizador" ON mensagem_chat
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM assistente_ia JOIN evento ON evento.id = assistente_ia.evento_id
            WHERE assistente_ia.id = mensagem_chat.assistente_id AND evento.organizador_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "presentes_fotos_organizador" ON storage.objects;
CREATE POLICY "presentes_fotos_organizador" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'presentes'
        AND EXISTS (SELECT 1 FROM public.evento e WHERE e.id::text = (storage.foldername(name))[1] AND e.organizador_id = (select auth.uid()))
    )
    WITH CHECK (
        bucket_id = 'presentes'
        AND EXISTS (SELECT 1 FROM public.evento e WHERE e.id::text = (storage.foldername(name))[1] AND e.organizador_id = (select auth.uid()))
    );

-- ---------- DESEMPENHO: índice da chave estrangeira sem índice ----------
CREATE INDEX IF NOT EXISTS idx_lista_presentes_responsavel ON lista_presentes(responsavel_por_id);

COMMIT;
