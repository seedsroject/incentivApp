-- Allow public inserts and updates for public forms

-- students
CREATE POLICY "students_public_insert" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_public_update" ON students FOR UPDATE USING (true) WITH CHECK (true);

-- pre_cadastros
CREATE POLICY "pre_cadastros_public_insert" ON pre_cadastros FOR INSERT WITH CHECK (true);
CREATE POLICY "pre_cadastros_public_update" ON pre_cadastros FOR UPDATE USING (true) WITH CHECK (true);

-- documents
CREATE POLICY "documents_public_insert" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_public_update" ON documents FOR UPDATE USING (true) WITH CHECK (true);

-- school_reports
CREATE POLICY "school_reports_public_insert" ON school_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "school_reports_public_update" ON school_reports FOR UPDATE USING (true) WITH CHECK (true);

-- socioeconomic_data
CREATE POLICY "socioeconomic_data_public_insert" ON socioeconomic_data FOR INSERT WITH CHECK (true);
CREATE POLICY "socioeconomic_data_public_update" ON socioeconomic_data FOR UPDATE USING (true) WITH CHECK (true);

-- student_declarations
CREATE POLICY "student_declarations_public_insert" ON student_declarations FOR INSERT WITH CHECK (true);
CREATE POLICY "student_declarations_public_update" ON student_declarations FOR UPDATE USING (true) WITH CHECK (true);

-- meta_qualitativa_responses
CREATE POLICY "meta_qualitativa_responses_public_insert" ON meta_qualitativa_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "meta_qualitativa_responses_public_update" ON meta_qualitativa_responses FOR UPDATE USING (true) WITH CHECK (true);
