-- ============================================================
-- Script para configurar o usuário admin_juraci como ADMIN
-- em TODOS os projetos existentes.
--
-- PRÉ-REQUISITO: O usuário já deve existir no Supabase Auth.
--   Se ainda não foi criado, use o script Node abaixo ou
--   crie manualmente no painel do Supabase (Authentication > Users > Add user).
--
-- E-mail: admin.juraci@formandocampeoes.org.br
-- Senha:  535404TRI
-- ============================================================

-- 1. Inserir no profiles (se não existir)
INSERT INTO profiles (id, email, nome, role)
SELECT 
  id, 
  email, 
  'Juraci (Admin Master)',
  'ADMIN'
FROM auth.users
WHERE email = 'admin.juraci@formandocampeoes.org.br'
ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', nome = 'Juraci (Admin Master)';

-- 2. Dar acesso ADMIN a TODOS os projetos
INSERT INTO user_project_access (user_id, project_id, role, is_default)
SELECT 
  u.id,
  p.id,
  'ADMIN',
  (p.slug = 'FORMANDO_CAMPEOES') -- Default = primeiro projeto
FROM auth.users u
CROSS JOIN projects p
WHERE u.email = 'admin.juraci@formandocampeoes.org.br'
ON CONFLICT (user_id, project_id) DO UPDATE SET role = 'ADMIN';
