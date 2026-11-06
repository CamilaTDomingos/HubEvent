-- ============================================================
-- Quais migrações já estão aplicadas? Só leitura: não altera nada.
-- Rodar no SQL Editor; cada linha diz se o "sinal" da migração existe.
-- Rode as que vierem false na ordem da coluna "ordem".
-- ============================================================
WITH col AS (
  SELECT table_name || '.' || column_name AS c FROM information_schema.columns WHERE table_schema = 'public'
), tab AS (
  SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public'
)
SELECT * FROM (VALUES
  (1, '2026-10-02_categorias_tarefa',            EXISTS (SELECT 1 FROM tab WHERE t = 'categoria_tarefa')),
  (2, '2026-10-07_dados_do_navegador_para_o_banco', EXISTS (SELECT 1 FROM tab WHERE t = 'reserva_presente')),
  (3, '2026-10-07_correcoes_seguranca_desempenho', NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
                                                 AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'landing_page_publica_leitura')),
  (4, '2026-10-08_categorias_despesa',           EXISTS (SELECT 1 FROM col WHERE c = 'despesa.categoria_id')),
  (5, '2026-10-08_vencimento_despesa',           EXISTS (SELECT 1 FROM col WHERE c = 'despesa.vencimento')),
  (6, '2026-10-14_rateio',                       EXISTS (SELECT 1 FROM tab WHERE t = 'participante_rateio')),
  (7, '2026-10-14_assistente_ia',                EXISTS (SELECT 1 FROM col WHERE c = 'mensagem_chat.dados')),
  (8, '2026-10-14_rsvp_lista_inteligente',       EXISTS (SELECT 1 FROM tab WHERE t = 'grupo_convidado')),
  (9, '2026-10-15_sac',                          EXISTS (SELECT 1 FROM tab WHERE t = 'mensagem_sac'))
) AS v(ordem, migracao, aplicada)
ORDER BY ordem;
