-- ============================================================
-- 012: Adicionar status na tabela de acesso para aprovação de usuários
-- Data: 2026-05-18
-- ============================================================

-- Adiciona a coluna status com valor padrão 'PENDENTE'
ALTER TABLE user_project_access 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDENTE' 
CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO'));

-- Atualiza os acessos existentes para 'APROVADO' para não bloquear os usuários atuais
UPDATE user_project_access SET status = 'APROVADO' WHERE status = 'PENDENTE';

-- Comentários
COMMENT ON COLUMN user_project_access.status IS 'Status da solicitação de acesso (PENDENTE, APROVADO, REJEITADO)';
