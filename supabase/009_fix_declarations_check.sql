-- ============================================================
-- 009: Fix student_declarations CHECK constraint and add public DELETE policy
-- ============================================================

-- 1. Atualizar registros antigos que usam 'VIAGEM' para 'AUTORIZACAO_VIAGEM'
UPDATE student_declarations SET type = 'AUTORIZACAO_VIAGEM' WHERE type = 'VIAGEM';

-- 2. Adicionar políticas públicas de DELETE para formulários públicos (upsert = delete + insert)
-- Verifica se as políticas já existem antes de criar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'student_declarations_public_delete' AND tablename = 'student_declarations') THEN
    CREATE POLICY "student_declarations_public_delete" ON student_declarations FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents_public_delete' AND tablename = 'documents') THEN
    CREATE POLICY "documents_public_delete" ON documents FOR DELETE USING (true);
  END IF;

  -- Garantir que as políticas de INSERT público existam
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'student_declarations_public_insert' AND tablename = 'student_declarations') THEN
    CREATE POLICY "student_declarations_public_insert" ON student_declarations FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'student_declarations_public_update' AND tablename = 'student_declarations') THEN
    CREATE POLICY "student_declarations_public_update" ON student_declarations FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'students_public_insert' AND tablename = 'students') THEN
    CREATE POLICY "students_public_insert" ON students FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'students_public_update' AND tablename = 'students') THEN
    CREATE POLICY "students_public_update" ON students FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents_public_insert' AND tablename = 'documents') THEN
    CREATE POLICY "documents_public_insert" ON documents FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents_public_update' AND tablename = 'documents') THEN
    CREATE POLICY "documents_public_update" ON documents FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'Script 009 executado com sucesso!' AS resultado;
