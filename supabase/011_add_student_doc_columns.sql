-- ============================================================
-- 011: Adicionar colunas de documentos direto na tabela students
-- Para persistência e reload de boletim escolar e declaração de matrícula
-- Data: 2026-05-18
-- ============================================================

-- Boletim Escolar (JSONB com url, timestamp, grade1, attendance1, etc.)
ALTER TABLE students ADD COLUMN IF NOT EXISTS boletim_escolar JSONB;

-- Declaração de Matrícula (JSONB com url, imageUrl, timestamp, ocrData, etc.)
ALTER TABLE students ADD COLUMN IF NOT EXISTS declaracao_matricula JSONB;

-- Comentários para documentação
COMMENT ON COLUMN students.boletim_escolar IS 'Dados do boletim escolar: {url, timestamp, grade1, attendance1, grade2, attendance2, subjects[], status, avaliacao}';
COMMENT ON COLUMN students.declaracao_matricula IS 'Dados da declaração de matrícula: {url, imageUrl, timestamp, dataRegistro, ocrData}';
