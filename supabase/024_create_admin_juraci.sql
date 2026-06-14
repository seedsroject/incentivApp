-- ============================================================
-- Script para configurar o usuário admin.juraci como ADMIN
-- em TODOS os projetos existentes.
--
-- PRÉ-REQUISITO: O usuário já deve existir no Supabase Auth.
--   Crie manualmente no painel: Authentication > Users > Add user
--
-- E-mail: admin.juraci@formandocampeoes.org.br
-- Senha:  535404TRI
-- ============================================================

-- 1. Inserir no profiles (se não existir)
--    A tabela profiles NÃO tem coluna 'role' — role fica em user_project_access
INSERT INTO profiles (id, email, nome)
SELECT 
  id, 
  email, 
  'Juraci (Admin Master)'
FROM auth.users
WHERE email = 'admin.juraci@formandocampeoes.org.br'
ON CONFLICT (id) DO UPDATE SET nome = 'Juraci (Admin Master)';

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
