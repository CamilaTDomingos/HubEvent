-- ============================================================
-- Teste de permissões e da reserva de presentes, no banco real.
-- Rodar no SQL Editor DEPOIS das migrações. Não altera nada: o bloco
-- termina com um erro proposital, que desfaz tudo o que ele gravou.
-- O resultado aparece na mensagem de erro, uma linha por verificação.
-- Precisa de pelo menos dois organizadores com eventos.
-- ============================================================
DO $$
DECLARE
  u1 uuid; e1 uuid; u2 uuid; e2 uuid; p uuid; r text := ''; n int; ok boolean;
BEGIN
  SELECT organizador_id, id INTO u1, e1 FROM evento ORDER BY criado_em LIMIT 1;
  SELECT organizador_id, id INTO u2, e2 FROM evento WHERE organizador_id <> u1 LIMIT 1;

  -- Organizador do evento
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO lista_presentes (evento_id, nome, quantidade, valor) VALUES (e1, 'TESTE', 2, 10) RETURNING id INTO p;
  r := r || 'ok  organizador cadastra presente no próprio evento' || E'\n';
  BEGIN
    INSERT INTO lista_presentes (evento_id, nome) VALUES (e2, 'INVASOR');
    r := r || 'FALHA organizador cadastrou presente em evento alheio' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'ok  organizador NÃO cadastra em evento alheio' || E'\n'; END;
  UPDATE evento SET modulos = '{"presentes":true,"site":false}', pix_chave = 'teste@pix' WHERE id = e1;
  GET DIAGNOSTICS n = ROW_COUNT;
  r := r || CASE WHEN n = 1 THEN 'ok  ' ELSE 'FALHA ' END || 'organizador salva módulos e Pix' || E'\n';
  BEGIN
    PERFORM reservar_presente(p, 'X', 'pix');
    r := r || 'FALHA organizador conseguiu chamar reservar_presente direto' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'ok  reservar_presente fechado para usuários logados' || E'\n'; END;
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('presentes', e1 || '/teste.jpg', u1);
    r := r || 'ok  organizador envia foto na pasta do próprio evento' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'FALHA organizador não conseguiu enviar foto: ' || sqlerrm || E'\n'; END;
  BEGIN
    INSERT INTO storage.objects (bucket_id, name, owner) VALUES ('presentes', e2 || '/teste.jpg', u1);
    r := r || 'FALHA organizador enviou foto na pasta de evento alheio' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'ok  organizador NÃO envia foto em evento alheio' || E'\n'; END;
  EXECUTE 'RESET ROLE';

  -- Backend (service_role)
  EXECUTE 'SET LOCAL ROLE service_role';
  SELECT reservar_presente(p, 'Ana', 'pix') INTO ok;
  r := r || CASE WHEN ok THEN 'ok  ' ELSE 'FALHA ' END || 'reserva 1 de 2' || E'\n';
  SELECT reservar_presente(p, 'Bia', 'loja') INTO ok;
  r := r || CASE WHEN ok THEN 'ok  ' ELSE 'FALHA ' END || 'reserva 2 de 2' || E'\n';
  SELECT reservar_presente(p, 'Caio', 'cartao') INTO ok;
  r := r || CASE WHEN NOT ok THEN 'ok  ' ELSE 'FALHA ' END || 'reserva 3 de 2 é recusada' || E'\n';
  BEGIN
    PERFORM reservar_presente(p, 'Duda', 'boleto');
    r := r || 'FALHA aceitou forma de pagamento inválida' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'ok  forma de pagamento inválida é recusada' || E'\n'; END;
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM reserva_presente WHERE presente_id = p;
  r := r || CASE WHEN n = 2 THEN 'ok  ' ELSE 'FALHA ' END || 'organizador vê as 2 reservas (viu ' || n || ')' || E'\n';
  EXECUTE 'RESET ROLE';

  -- Outro organizador
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  SELECT count(*) INTO n FROM reserva_presente WHERE presente_id = p;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'outro organizador não vê as reservas' || E'\n';
  SELECT count(*) INTO n FROM lista_presentes WHERE id = p;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'outro organizador não vê o presente' || E'\n';
  EXECUTE 'RESET ROLE';

  -- Visitante sem login (chave anon)
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  EXECUTE 'SET LOCAL ROLE anon';
  SELECT count(*) INTO n FROM lista_presentes;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'anon não lê presentes' || E'\n';
  UPDATE lista_presentes SET nome = 'HACK' WHERE id = p;
  GET DIAGNOSTICS n = ROW_COUNT;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'anon não altera presentes' || E'\n';
  SELECT count(*) INTO n FROM reserva_presente;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'anon não lê reservas' || E'\n';
  SELECT count(*) INTO n FROM landing_page;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'anon não lista landing pages' || E'\n';
  SELECT count(*) INTO n FROM evento;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'anon não lê eventos (nem chave Pix)' || E'\n';
  BEGIN
    PERFORM reservar_presente(p, 'X', 'pix');
    r := r || 'FALHA anon conseguiu chamar reservar_presente' || E'\n';
  EXCEPTION WHEN others THEN r := r || 'ok  anon não chama reservar_presente' || E'\n'; END;
  BEGIN
    PERFORM criar_usuario_apos_signup();
    r := r || 'FALHA anon conseguiu chamar criar_usuario_apos_signup' || E'\n';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'ok  anon não chama criar_usuario_apos_signup' || E'\n';
            WHEN others THEN r := r || 'FALHA criar_usuario_apos_signup ainda executável por anon (' || sqlerrm || ')' || E'\n'; END;
  EXECUTE 'RESET ROLE';

  DELETE FROM lista_presentes WHERE id = p;
  SELECT count(*) INTO n FROM reserva_presente WHERE presente_id = p;
  r := r || CASE WHEN n = 0 THEN 'ok  ' ELSE 'FALHA ' END || 'apagar o presente apaga as reservas' || E'\n';

  RAISE EXCEPTION E'RESULTADO DO TESTE (nada foi gravado)\n%', r;
END $$;
