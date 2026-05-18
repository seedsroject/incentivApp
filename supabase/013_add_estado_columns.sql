-- ============================================================
-- 013: Adicionar colunas de Estado para gestão de administradores regionais
-- Data: 2026-05-18
-- ============================================================

-- Adiciona a coluna 'estado' na tabela nucleos
ALTER TABLE nucleos 
ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

-- Atualiza alguns estados para os núcleos que já existem como default 'SP' caso a city indique algo
-- UPDATE nucleos SET estado = 'SP' WHERE estado IS NULL; -- Opcional, descomente para forçar todos como SP.

-- Adiciona a coluna 'estado_responsavel' na tabela user_project_access
-- Esta coluna será usada para Administradores que gerenciam uma região inteira em vez de um único núcleo
ALTER TABLE user_project_access 
ADD COLUMN IF NOT EXISTS estado_responsavel VARCHAR(2);

-- Comentários explicativos
COMMENT ON COLUMN nucleos.estado IS 'Sigla do Estado (UF) onde o núcleo está localizado';
COMMENT ON COLUMN user_project_access.estado_responsavel IS 'Sigla do Estado (UF) que o Administrador tem acesso (se null, ele é vinculado a um nucleo_id, ou é Super Admin)';
