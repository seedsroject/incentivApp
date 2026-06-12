-- ============================================================
-- 022 — Fix RLS para nucleo_turmas INSERT/UPDATE/DELETE
--       + garantir max_alunos + colunas de supervisão PNE
-- ============================================================

-- 1. Adicionar max_alunos (caso não exista)
ALTER TABLE nucleo_turmas ADD COLUMN IF NOT EXISTS max_alunos INTEGER;

-- 2. Colunas de supervisão no students (caso não existam)
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_selecionada TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_nome TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_horario TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_necessita_supervisao BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_supervisor_nome TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_supervisor_cpf TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_supervisor_e_responsavel BOOLEAN DEFAULT FALSE;

-- 3. Dropar TODAS as policies de nucleo_turmas (antigas e novas)
DROP POLICY IF EXISTS "turmas_access" ON nucleo_turmas;
DROP POLICY IF EXISTS "turmas_select" ON nucleo_turmas;
DROP POLICY IF EXISTS "turmas_insert" ON nucleo_turmas;
DROP POLICY IF EXISTS "turmas_update" ON nucleo_turmas;
DROP POLICY IF EXISTS "turmas_delete" ON nucleo_turmas;

-- 4. Recriar policies separadas
CREATE POLICY "turmas_select" ON nucleo_turmas
  FOR SELECT USING (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

CREATE POLICY "turmas_insert" ON nucleo_turmas
  FOR INSERT WITH CHECK (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

CREATE POLICY "turmas_update" ON nucleo_turmas
  FOR UPDATE USING (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

CREATE POLICY "turmas_delete" ON nucleo_turmas
  FOR DELETE USING (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );
