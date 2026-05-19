-- ============================================================
-- 014: Permitir que novos usuarios solicitem acesso
-- Data: 2026-05-18
-- ============================================================

CREATE POLICY "upa_insert_self" ON user_project_access
  FOR INSERT WITH CHECK (user_id = auth.uid());

