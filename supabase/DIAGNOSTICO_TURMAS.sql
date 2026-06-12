-- ============================================================
-- DIAGNÓSTICO: TURMAS + FIX RLS
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Verificar se nucleo_turmas existe e suas colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nucleo_turmas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar RLS policies de nucleo_turmas
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'nucleo_turmas';

-- 3. Verificar se existe a coluna max_alunos
SELECT column_name FROM information_schema.columns
WHERE table_name = 'nucleo_turmas' AND column_name = 'max_alunos';

-- 4. Contar turmas existentes
SELECT count(*) as total_turmas FROM nucleo_turmas;

-- 5. Ver turmas com nome do núcleo
SELECT t.id, t.nucleo_id, t.nome, t.dias, t.horario, t.max_alunos, n.nome as nucleo_nome
FROM nucleo_turmas t
JOIN nucleos n ON n.id = t.nucleo_id
ORDER BY n.nome, t.nome;
