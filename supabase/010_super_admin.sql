-- ============================================================
-- 010: Criar Administrador Geral (Super Admin) com acesso a todos os núcleos
-- ============================================================
-- INSTRUÇÕES:
-- 1. Primeiro crie o usuário no Supabase Auth via Dashboard:
--    Email: admin.geral@formandocampeoes.org.br
--    Senha: FC@Admin2025!
--    (ou use a tela de cadastro do próprio app com perfil "Administrador")
--
-- 2. Depois execute este script para garantir acesso cross-project.
--    Ele cria registros em user_project_access para TODOS os projetos.
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_proj_id UUID;
  v_slug TEXT;
BEGIN
  -- Buscar o user_id do admin geral pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin.geral@formandocampeoes.org.br';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário admin.geral@formandocampeoes.org.br não encontrado no Auth. Cadastre-o primeiro via Dashboard ou pelo app.';
    RETURN;
  END IF;

  -- Inserir acesso como ADMIN em todos os projetos
  FOR v_proj_id, v_slug IN SELECT id, slug FROM projects LOOP
    IF NOT EXISTS (
      SELECT 1 FROM user_project_access 
      WHERE user_id = v_user_id AND project_id = v_proj_id
    ) THEN
      INSERT INTO user_project_access (user_id, project_id, nucleo_id, role, is_default)
      VALUES (v_user_id, v_proj_id, NULL, 'ADMIN', (v_slug = 'FORMANDO_CAMPEOES'));
      RAISE NOTICE 'Acesso criado para projeto: %', v_slug;
    ELSE
      -- Atualizar para ADMIN caso exista com outro role
      UPDATE user_project_access 
      SET role = 'ADMIN'
      WHERE user_id = v_user_id AND project_id = v_proj_id;
      RAISE NOTICE 'Acesso atualizado para ADMIN no projeto: %', v_slug;
    END IF;
  END LOOP;

  RAISE NOTICE 'Super Admin configurado com sucesso!';
END $$;

-- Adicionar COORDENADOR e SUPER_ADMIN ao CHECK constraint (se existir)
-- Nota: Se a coluna role não tem CHECK, isto é seguro e não faz nada
DO $$
BEGIN
  -- Tenta remover o CHECK existente e recriá-lo expandido
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_project_access_role_check' 
    AND table_name = 'user_project_access'
  ) THEN
    ALTER TABLE user_project_access DROP CONSTRAINT user_project_access_role_check;
    ALTER TABLE user_project_access ADD CONSTRAINT user_project_access_role_check 
      CHECK (role IN ('PROFESSOR', 'COORDENADOR', 'ADMIN', 'SUPER_ADMIN'));
    RAISE NOTICE 'CHECK constraint atualizado com novos roles.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'CHECK constraint não encontrado ou já correto, ignorando. Detalhes: %', SQLERRM;
END $$;

SELECT 'Script 010 executado. Registre o admin pelo app e execute novamente se necessário.' AS resultado;
