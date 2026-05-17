-- ============================================================
-- EXECUTAR NO SUPABASE DASHBOARD → SQL EDITOR
-- Cola tudo de uma vez e clica "Run"
-- ============================================================

-- ============================================================
-- PARTE 1: UNIQUE constraint para declarações (upsert)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_student_declarations_type'
  ) THEN
    ALTER TABLE student_declarations
      ADD CONSTRAINT uq_student_declarations_type
      UNIQUE (student_id, type);
  END IF;
END$$;

-- ============================================================
-- PARTE 2: Storage Buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 10485760,
   ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('evidences', 'evidences', false, 10485760,
   ARRAY['image/jpeg','image/png','image/webp']),
  ('signatures', 'signatures', false, 2097152,
   ARRAY['image/png','image/svg+xml']),
  ('laudos', 'laudos', false, 10485760,
   ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PARTE 3: RLS Policies para Storage
-- ============================================================

-- Documents: upload + leitura por projeto
CREATE POLICY "docs_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE id IN (SELECT get_user_project_ids())
  ));

CREATE POLICY "docs_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE id IN (SELECT get_user_project_ids())
  ));

CREATE POLICY "docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND owner_id = auth.uid()::text);

-- Evidences: upload + leitura por projeto
CREATE POLICY "evidence_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidences' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE id IN (SELECT get_user_project_ids())
  ));

CREATE POLICY "evidence_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'evidences' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE id IN (SELECT get_user_project_ids())
  ));

-- Signatures: qualquer autenticado pode upload/leitura
CREATE POLICY "sig_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "sig_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

-- Laudos: upload + leitura por projeto
CREATE POLICY "laudos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'laudos' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE id IN (SELECT get_user_project_ids())
  ));

CREATE POLICY "laudos_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'laudos' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE id IN (SELECT get_user_project_ids())
  ));
