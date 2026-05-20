-- ═══════════════════════════════════════════════════════════════
-- 016: Espelha estado_responsavel na tabela profiles para lookup pré-login
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS estado_responsavel VARCHAR(2);

COMMENT ON COLUMN profiles.estado_responsavel IS 'Espelho do estado_responsavel de user_project_access para permitir lookup pré-login (tabela profiles é acessível anonimamente)';

-- Backfill: copiar estado_responsavel de user_project_access para profiles
UPDATE profiles p
SET estado_responsavel = upa.estado_responsavel
FROM user_project_access upa
WHERE p.id = upa.user_id
  AND upa.estado_responsavel IS NOT NULL
  AND p.estado_responsavel IS NULL;
