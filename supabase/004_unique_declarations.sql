-- ============================================================
-- 004: Adicionar UNIQUE constraint para student_declarations
-- Permite UPSERT (uma declaração por tipo por aluno)
-- ============================================================

ALTER TABLE student_declarations
  ADD CONSTRAINT uq_student_declarations_type
  UNIQUE (student_id, type);
