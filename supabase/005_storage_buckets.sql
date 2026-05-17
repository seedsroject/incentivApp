-- ============================================================
-- 005: Configurar Supabase Storage Buckets + RLS Policies
-- Executar no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Criar buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 10485760, -- 10MB
   ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('evidences', 'evidences', false, 10485760,
   ARRAY['image/jpeg','image/png','image/webp']),
  ('signatures', 'signatures', false, 2097152, -- 2MB
   ARRAY['image/png','image/svg+xml']),
  ('laudos', 'laudos', false, 10485760,
   ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 2. RLS para bucket "documents"
-- Usuários autenticados podem fazer upload dentro do path do seu projeto
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

-- 3. RLS para bucket "evidences"
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

-- 4. RLS para bucket "signatures" (mesmo projeto)
CREATE POLICY "sig_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');

CREATE POLICY "sig_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

-- 5. RLS para bucket "laudos" (mesmo projeto)
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
