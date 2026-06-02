-- 018_sli_groups.sql
-- Tabela para vincular um número SLI a múltiplos núcleos

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

-- RLS: permitir leitura e escrita para usuários autenticados
ALTER TABLE sli_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sli_groups_select" ON sli_groups
  FOR SELECT USING (true);

CREATE POLICY "sli_groups_insert" ON sli_groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sli_groups_update" ON sli_groups
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sli_groups_delete" ON sli_groups
  FOR DELETE USING (auth.role() = 'authenticated');
