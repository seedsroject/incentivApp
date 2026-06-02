-- ═══════════════════════════════════════════════════════
-- DIAGNÓSTICO DO BANCO DE DADOS
-- Cole e execute este SQL no SQL Editor do Supabase
-- para verificar o estado atual do banco
-- ═══════════════════════════════════════════════════════

-- 1. Verificar se a tabela profiles existe e tem as colunas necessárias
SELECT 
  'profiles' AS tabela,
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar RLS policies da tabela profiles
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Verificar RLS policies da tabela user_project_access
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'user_project_access';

-- 4. Verificar RLS policies da tabela projects
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'projects';

-- 5. Verificar se a tabela sli_groups existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'sli_groups' 
    AND table_schema = 'public'
) AS sli_groups_exists;

-- 6. Verificar se as functions SECURITY DEFINER existem
SELECT 
  proname AS function_name,
  prosecdef AS is_security_definer
FROM pg_proc 
WHERE proname IN ('get_user_project_ids', 'get_user_nucleo_ids', 'is_admin_of_project', 'is_admin_email')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Contar registros nas tabelas principais
SELECT 'profiles' AS tabela, COUNT(*) AS total FROM profiles
UNION ALL
SELECT 'user_project_access', COUNT(*) FROM user_project_access
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'nucleos', COUNT(*) FROM nucleos;
