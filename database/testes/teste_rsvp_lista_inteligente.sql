-- ============================================================
-- Teste dos grupos e acompanhantes de convidados (RF04), no banco real.
-- Rodar no SQL Editor DEPOIS de 2026-10-14_rsvp_lista_inteligente.sql.
-- Não altera nada: o bloco termina com um erro proposital, que desfaz
-- tudo o que ele gravou. O resultado aparece na mensagem de erro, uma
-- linha por verificação. Precisa de pelo menos dois organizadores com
-- eventos.
-- ============================================================
DO $$
DECLARE
  u1 uuid; e1 uuid; u2 uuid; e2 uuid; e3 uuid; g1 uuid; g2 uuid; c uuid; r text := ''; n int;
BEGIN
  SELECT organizador_id, id INTO u1, e1 FROM evento ORDER BY criado_em LIMIT 1;
  SELECT organizador_id, id INTO u2, e2 FROM evento WHERE organizador_id <> u1 LIMIT 1;

  -- Organizador do evento
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  INSERT INTO evento (organizador_id, nome, data_inicio, data_fim)
  VALUES (u1, 'TESTE', now() + interval '10 days', now() + interval '10 days') RETURNING id INTO e3;
  SELECT count(*) INTO n FROM grupo_convidado WHERE evento_id = e3;
  r := r || CASE WHEN n = 3 THEN 'ok  ' ELSE 'FALHA ' END || 'evento novo começa com 3 grupos' || E'\n';

  INSERT INTO grupo_convidado (evento_id, nome, cor) VALUES (e1, 'TESTE grupo', '#123456') RETURNING id INTO g1;
  r := r || 'ok  organizador cria grupo no próprio evento' || E'\n';
  BEGIN
    INSERT INTO grupo_convidado (evento_id, nome, cor) VALUES (e1, 'teste GRUPO', '#654321');
    r := r || 'FALHA aceitou dois grupos com o mesmo nome no evento' || E'\n';
  EXCEPTION WHEN unique_violation THEN r := r || 'ok  nome de grupo repetido é recusado' || E'\n'; END;
  BEGIN
    INSERT INTO grupo_convidado (evento_id, nome, cor) VALUES (e2, 'INVASOR', '#123456');
    r := r || 'FALHA organizador criou grupo em evento alheio' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'ok  organizador NÃO cria grupo em evento alheio' || E'\n'; END;

  INSERT INTO convidado (evento_id, nome, grupo_id, acompanhantes_permitidos)
  VALUES (e1, 'TESTE convidado', g1, 2) RETURNING id INTO c;
  r := r || 'ok  convidado com grupo e 2 acompanhantes permitidos' || E'\n';

  SELECT id INTO g2 FROM grupo_convidado WHERE evento_id = e3 LIMIT 1;
  BEGIN
    UPDATE convidado SET grupo_id = g2 WHERE id = c;
    r := r || 'FALHA convidado aceitou grupo de outro evento' || E'\n';
  EXCEPTION WHEN foreign_key_violation THEN r := r || 'ok  grupo de outro evento é recusado' || E'\n'; END;

  BEGIN
    UPDATE convidado SET acompanhantes_confirmados = 1 WHERE id = c;
    r := r || 'FALHA pendente ficou com acompanhante' || E'\n';
  EXCEPTION WHEN check_violation THEN r := r || 'ok  pendente não leva acompanhantes' || E'\n'; END;
  BEGIN
    UPDATE convidado SET status_presenca = 'CONFIRMADO', acompanhantes_confirmados = 3 WHERE id = c;
    r := r || 'FALHA aceitou acompanhantes acima do limite' || E'\n';
  EXCEPTION WHEN check_violation THEN r := r || 'ok  acompanhantes acima do limite são recusados' || E'\n'; END;
  UPDATE convidado SET status_presenca = 'CONFIRMADO', acompanhantes_confirmados = 2 WHERE id = c;
  r := r || 'ok  confirmado com 2 acompanhantes (no limite)' || E'\n';

  EXECUTE 'RESET ROLE';

  -- Outro organizador
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM grupo_convidado WHERE evento_id = e1;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'outro organizador não vê os grupos' || E'\n';
  UPDATE grupo_convidado SET nome = 'HACK' WHERE id = g1;
  GET DIAGNOSTICS n = ROW_COUNT;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'outro organizador não altera os grupos' || E'\n';
  EXECUTE 'RESET ROLE';

  -- Visitante sem login
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO n FROM grupo_convidado;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'anon não lê grupos' || E'\n';
  EXECUTE 'RESET ROLE';

  DELETE FROM grupo_convidado WHERE id = g1;
  SELECT count(*) INTO n FROM convidado WHERE id = c AND grupo_id IS NULL AND evento_id = e1;
  r := r || CASE WHEN n = 1 THEN 'ok  ' ELSE 'FALHA ' END || 'apagar o grupo deixa o convidado sem grupo (e no evento)' || E'\n';

  RAISE EXCEPTION E'RESULTADO DO TESTE (nada foi gravado)\n%', r;
END $$;
