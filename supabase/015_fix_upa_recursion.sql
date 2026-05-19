-- ============================================================
-- 015: Corrige recursao infinita na RLS de user_project_access
-- Data: 2026-05-18
-- ============================================================

-- Cria função helper SECURITY DEFINER para evitar recursão
CREATE OR REPLACE FUNCTION get_admin_project_ids()
RETURNS SETOF UUID AS $$
  SELECT project_id FROM user_project_access
  WHERE user_id = auth.uid() AND role = 'ADMIN';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Substitui a política que causava recursão
DROP POLICY IF EXISTS "upa_admin_manage" ON user_project_access;

CREATE POLICY "upa_admin_manage" ON user_project_access
  FOR ALL USING (
    project_id IN (SELECT get_admin_project_ids())
  );
