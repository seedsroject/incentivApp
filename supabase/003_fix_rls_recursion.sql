-- ============================================================
-- FIX v2: Eliminar TODA recursão em RLS
-- Estratégia: Todas as policies de TODAS as tabelas usam
-- APENAS as functions SECURITY DEFINER (que bypassam RLS)
-- para consultar user_project_access.
-- A tabela user_project_access usa ONLY auth.uid() direto.
-- ============================================================

-- ============================================================
-- STEP 1: Dropar TODAS as policies existentes
-- ============================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- ============================================================
-- STEP 2: Recriar functions SECURITY DEFINER
-- (Estas IGNORAM RLS ao executar, eliminando recursão)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS SETOF UUID AS $$
  SELECT project_id FROM public.user_project_access
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_nucleo_ids()
RETURNS SETOF UUID AS $$
  SELECT nucleo_id FROM public.user_project_access
  WHERE user_id = auth.uid() AND nucleo_id IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se user é ADMIN em algum projeto
CREATE OR REPLACE FUNCTION is_admin_of_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_project_access
    WHERE user_id = auth.uid() AND project_id = p_project_id AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 3: Policies para USER_PROJECT_ACCESS
-- (NUNCA usa functions que consultam a si mesma)
-- ============================================================
CREATE POLICY "upa_select_own" ON user_project_access
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "upa_insert" ON user_project_access
  FOR INSERT WITH CHECK (
    is_admin_of_project(project_id)
  );

CREATE POLICY "upa_update" ON user_project_access
  FOR UPDATE USING (
    is_admin_of_project(project_id)
  );

CREATE POLICY "upa_delete" ON user_project_access
  FOR DELETE USING (
    is_admin_of_project(project_id)
  );

-- ============================================================
-- STEP 4: Policies para PROJECTS
-- ============================================================
CREATE POLICY "projects_read" ON projects
  FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- STEP 5: Policies para PROFILES
-- ============================================================
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- STEP 6: Policies para NUCLEOS
-- ============================================================
CREATE POLICY "nucleos_access" ON nucleos
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 7: Policies para STUDENTS
-- ============================================================
CREATE POLICY "students_access" ON students
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 8: Policies para NUCLEO_TURMAS
-- ============================================================
CREATE POLICY "turmas_access" ON nucleo_turmas
  FOR ALL USING (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 9: Policies para EMPLOYEES
-- ============================================================
CREATE POLICY "employees_access" ON employees
  FOR ALL USING (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 10: Policies para CONTRACTS
-- ============================================================
CREATE POLICY "contracts_access" ON contracts
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN nucleos n ON e.nucleo_id = n.id
      WHERE n.project_id IN (SELECT get_user_project_ids())
    )
  );

-- ============================================================
-- STEP 11: Policies para EMPLOYEE_DOCUMENTS
-- ============================================================
CREATE POLICY "emp_docs_access" ON employee_documents
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN nucleos n ON e.nucleo_id = n.id
      WHERE n.project_id IN (SELECT get_user_project_ids())
    )
  );

-- ============================================================
-- STEP 12: Policies para PRE_CADASTROS
-- ============================================================
CREATE POLICY "pre_cadastros_access" ON pre_cadastros
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 13: Policies para DOCUMENTS
-- ============================================================
CREATE POLICY "documents_access" ON documents
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 14: Policies para SCHOOL_REPORTS
-- ============================================================
CREATE POLICY "school_reports_access" ON school_reports
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 15: Policies para EVIDENCES
-- ============================================================
CREATE POLICY "evidences_access" ON evidences
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 16: Policies para SOCIOECONOMIC_DATA
-- ============================================================
CREATE POLICY "socio_access" ON socioeconomic_data
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 17: Policies para STUDENT_DECLARATIONS
-- ============================================================
CREATE POLICY "declarations_access" ON student_declarations
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 18: Policies para META_QUALITATIVA_RESPONSES
-- ============================================================
CREATE POLICY "meta_qual_access" ON meta_qualitativa_responses
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids()))
    OR nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 19: Policies para INVENTORY_ITEMS
-- ============================================================
CREATE POLICY "inventory_access" ON inventory_items
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 20: Policies para NUCLEO_BENS
-- ============================================================
CREATE POLICY "bens_access" ON nucleo_bens
  FOR ALL USING (
    nucleo_id IN (SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- STEP 21: Policies para REPORT_TEMPLATES
-- ============================================================
CREATE POLICY "templates_access" ON report_templates
  FOR ALL USING (project_id IN (SELECT get_user_project_ids()));

-- ============================================================
-- STEP 22: Policies para MATRICULA_OCR_DATA
-- ============================================================
CREATE POLICY "matricula_ocr_access" ON matricula_ocr_data
  FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids()))
  );

-- ============================================================
-- FIM DO FIX v2
-- ============================================================
