-- ============================================================
-- 020 — Novos campos para Ficha de Inscrição
-- Adiciona campos expandidos de PNE (descrição + medicação)
-- e dados de contato de emergência
-- ============================================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_descricao TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pne_medicacao_suporte TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS contato_emergencia_nome TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS contato_emergencia_email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS contato_emergencia_endereco TEXT;
