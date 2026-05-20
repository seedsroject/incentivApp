-- ═══════════════════════════════════════════════════════════════
-- 016: Espelha estado_responsavel na tabela profiles para lookup pré-login
--      + Popular campo estado dos núcleos a partir do nome/endereço
-- ═══════════════════════════════════════════════════════════════

-- === PARTE 1: profiles.estado_responsavel ===
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

-- === PARTE 2: Popular estado dos núcleos ===
-- Extrair UF do final do nome (ex: "Horizonte - CE" → "CE")
UPDATE nucleos 
SET estado = UPPER(TRIM(SUBSTRING(nome FROM '[\s\-–]+([A-Za-z]{2})\s*$')))
WHERE estado IS NULL
  AND nome ~ '[\s\-–]+[A-Za-z]{2}\s*$';

-- Extrair UF do final do address (ex: "Rua X, 123 - PR" → "PR")
UPDATE nucleos 
SET estado = UPPER(TRIM(SUBSTRING(address FROM '[\s\-–]+([A-Za-z]{2})\s*$')))
WHERE estado IS NULL
  AND address IS NOT NULL
  AND address ~ '[\s\-–]+[A-Za-z]{2}\s*$';

-- Extrair UF do final da city (ex: "Curitiba - PR" → "PR")
UPDATE nucleos 
SET estado = UPPER(TRIM(SUBSTRING(city FROM '[\s\-–]+([A-Za-z]{2})\s*$')))
WHERE estado IS NULL
  AND city IS NOT NULL
  AND city ~ '[\s\-–]+[A-Za-z]{2}\s*$';

-- === VERIFICAÇÃO ===
-- SELECT id, nome, estado, address, city FROM nucleos ORDER BY nome;
-- Se algum núcleo ainda estiver com estado NULL após executar,
-- atualize manualmente:
-- UPDATE nucleos SET estado = 'PR' WHERE id = 'xxx';
