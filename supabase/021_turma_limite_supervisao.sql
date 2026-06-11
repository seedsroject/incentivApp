-- ============================================================
-- 021 — Limite de alunos por turma + Turma selecionada +
--       Supervisão PNE
-- ============================================================

-- 1. Limite de alunos por turma na tabela nucleo_turmas
ALTER TABLE nucleo_turmas ADD COLUMN IF NOT EXISTS max_alunos INTEGER DEFAULT 30;

-- 2. Turma selecionada pelo aluno na inscrição
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_selecionada TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_nome TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS turma_horario TEXT;

-- 3. Supervisão PNE
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_necessita_supervisao BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_supervisor_nome TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_supervisor_cpf TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_supervisor_e_responsavel BOOLEAN DEFAULT FALSE;
