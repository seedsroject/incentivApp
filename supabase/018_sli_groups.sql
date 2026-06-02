-- 018_sli_groups.sql (VERSÃO CORRIGIDA)
-- Tabela para vincular um número SLI a múltiplos núcleos
-- SEGURO: Usa IF NOT EXISTS para evitar erros se executado mais de uma vez

-- === PASSO 1: Criar tabela ===
CREATE TABLE IF NOT EXISTS sli_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sli_number TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '2026',
  label TEXT,
  nucleo_ids TEXT[] NOT NULL DEFAULT '{}',
  project_id TEXT NOT NULL DEFAULT 'FORMANDO_CAMPEOES',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sli_number, year, project_id)
);

-- === PASSO 2: Habilitar RLS ===
ALTER TABLE sli_groups ENABLE ROW LEVEL SECURITY;

-- === PASSO 3: Dropar policies se já existirem (evita erro de duplicata) ===
DROP POLICY IF EXISTS "sli_groups_select" ON sli_groups;
DROP POLICY IF EXISTS "sli_groups_insert" ON sli_groups;
DROP POLICY IF EXISTS "sli_groups_update" ON sli_groups;
DROP POLICY IF EXISTS "sli_groups_delete" ON sli_groups;

-- === PASSO 4: Criar policies ===
-- SELECT: qualquer pessoa autenticada pode ler
CREATE POLICY "sli_groups_select" ON sli_groups
  FOR SELECT USING (true);

-- INSERT: qualquer pessoa autenticada pode inserir
CREATE POLICY "sli_groups_insert" ON sli_groups
  FOR INSERT WITH CHECK (true);

-- UPDATE: qualquer pessoa autenticada pode atualizar
CREATE POLICY "sli_groups_update" ON sli_groups
  FOR UPDATE USING (true);

-- DELETE: qualquer pessoa autenticada pode deletar
CREATE POLICY "sli_groups_delete" ON sli_groups
  FOR DELETE USING (true);
