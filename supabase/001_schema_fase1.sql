-- ============================================================
-- FASE 1: FUNDAÇÃO — Schema completo do banco Supabase
-- Projeto: Formando Campeões (Multi-Tenant)
-- Data: 2026-05-16
-- ============================================================

-- 0. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PROJECTS — Tabela raiz (cada projeto esportivo)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  modalidade TEXT NOT NULL,
  proponente TEXT,
  logo_url TEXT,
  banner_url TEXT,
  cor_primaria TEXT DEFAULT '#002855',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: 3 projetos
INSERT INTO projects (slug, nome, modalidade, proponente, logo_url, banner_url, cor_primaria) VALUES
  ('FORMANDO_CAMPEOES', 'Escolinha de Triathlon - Formando Campeões', 'TRIATHLON',
   'Associação de Pais e Amigos da Natação Ituana', '/logo.png', '/header_full.png', '#002855'),
  ('DANIEL_DIAS', 'Nadando com Daniel Dias', 'NATACAO',
   'Instituto Daniel Dias', '/logo_Daniel_Dias.png', '/Banner_Relatorio_Daniel.png', '#1a365d'),
  ('FUTEBOL', 'Escolinha de Futebol', 'FUTEBOL',
   'Instituto Escolinha de Futebol', '/logo_futebol.png', '/Banner_relatorio_futebol.png', '#065f46')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. PROFILES — Usuários (vinculado ao auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Cria perfil automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Só cria se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END$$;

-- ============================================================
-- 3. NUCLEOS — Núcleos vinculados a projetos
-- ============================================================
CREATE TABLE IF NOT EXISTS nucleos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  coordinates POINT,
  address TEXT,
  phone TEXT,
  email TEXT,
  cnpj TEXT,
  razao_social TEXT,
  city TEXT,
  sli_number TEXT,
  dias_aulas TEXT[],
  horario_aulas TEXT,
  durabilidade TEXT,
  data_inicio DATE,
  data_termino DATE,
  stock_status TEXT CHECK (stock_status IN ('LOW','MEDIUM','HIGH')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nucleos_project ON nucleos (project_id);

CREATE TRIGGER trg_nucleos_updated_at
  BEFORE UPDATE ON nucleos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. USER_PROJECT_ACCESS — Vincula usuário a projeto com role
-- ============================================================
CREATE TABLE IF NOT EXISTS user_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN','COORDENADOR','PROFESSOR','MONITOR')),
  nucleo_id UUID REFERENCES nucleos(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- ============================================================
-- 5. NUCLEO_TURMAS — Turmas dentro de núcleos
-- ============================================================
CREATE TABLE IF NOT EXISTS nucleo_turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  dias TEXT[],
  horario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. EMPLOYEES — Funcionários dos núcleos
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  document_cpf TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  civil_status TEXT,
  rg TEXT,
  nationality TEXT,
  profession TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. CONTRACTS — Contratos de funcionários
-- ============================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  document_url TEXT,
  cnpj TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. EMPLOYEE_DOCUMENTS — Documentos de funcionários
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. STUDENTS — Tabela central de alunos
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  nucleo_id UUID REFERENCES nucleos(id),
  turma_id UUID REFERENCES nucleo_turmas(id),
  -- Pessoais
  nome TEXT NOT NULL,
  data_nascimento DATE,
  rg_cpf TEXT,
  nome_responsavel TEXT,
  -- Contato
  endereco TEXT,
  telefone TEXT,
  email_contato TEXT,
  -- Escolar
  escola_nome TEXT,
  escola_tipo TEXT CHECK (escola_tipo IN ('PUBLICA','PARTICULAR','')),
  -- Projeto
  n_sli TEXT,
  nome_projeto TEXT,
  proponente TEXT,
  nome_responsavel_organizacao TEXT,
  report_type TEXT CHECK (report_type IN ('REPORT_7','REPORT_8')),
  -- Status
  status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','INATIVO')),
  materiais_pendentes BOOLEAN DEFAULT FALSE,
  materiais_checklist JSONB,
  -- PNE
  portador_necessidade_especial BOOLEAN DEFAULT FALSE,
  laudo_url TEXT,
  -- Assinaturas
  ficha_url TEXT,
  assinatura TEXT,
  data_assinatura TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_project ON students (project_id);
CREATE INDEX IF NOT EXISTS idx_students_nucleo ON students (nucleo_id);

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. PRE_CADASTROS — Fila de espera
-- ============================================================
CREATE TABLE IF NOT EXISTS pre_cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  nucleo_id UUID REFERENCES nucleos(id),
  status TEXT DEFAULT 'AGUARDANDO' CHECK (status IN ('AGUARDANDO','APROVADO','DESCARTADO')),
  nome_aluno TEXT NOT NULL,
  data_nascimento DATE,
  raca TEXT,
  pcd TEXT,
  deficiencia_desc TEXT,
  laudo_url TEXT,
  rg TEXT,
  cpf TEXT,
  tipo_escola TEXT,
  bolsa_estudo TEXT,
  nome_escola TEXT,
  periodo_estudo TEXT,
  cursando TEXT,
  frequencia_atividade TEXT,
  nome_responsavel TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  local_moradia TEXT,
  tipo_imovel TEXT,
  qtd_pessoas_casa TEXT,
  renda_bruta TEXT,
  beneficio_gov TEXT,
  sistema_saude TEXT,
  vacinas_dia TEXT,
  altura TEXT,
  peso TEXT,
  sabe_nadar TEXT,
  sabe_pedalar TEXT,
  intuito TEXT,
  restricao_dias TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. DOCUMENTS — Upload de documentos (polimórfica)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  nucleo_id UUID REFERENCES nucleos(id),
  student_id UUID REFERENCES students(id),
  uploaded_by UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  metadata JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. SCHOOL_REPORTS — Boletins (OCR)
-- ============================================================
CREATE TABLE IF NOT EXISTS school_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  student_name TEXT NOT NULL,
  grade1 NUMERIC(4,2),
  attendance1 NUMERIC(5,2),
  grade2 NUMERIC(4,2),
  attendance2 NUMERIC(5,2),
  status TEXT,
  avaliacao TEXT,
  period_type TEXT,
  subjects JSONB,
  original_date TEXT,
  doc_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 13. EVIDENCES — Evidências fotográficas
-- ============================================================
CREATE TABLE IF NOT EXISTS evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  nucleo_id UUID REFERENCES nucleos(id),
  uploaded_by UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  evidence_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 14. SOCIOECONOMIC_DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS socioeconomic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  nucleo_id UUID REFERENCES nucleos(id),
  nome TEXT,
  genero TEXT,
  cor_raca TEXT,
  faixa_etaria TEXT,
  deficiencia TEXT,
  responsavel_transporte TEXT,
  meio_transporte TEXT,
  freq_atividade_anterior TEXT,
  matricula_escola TEXT,
  detalhe_escola_particular TEXT,
  escolaridade TEXT,
  periodo_estudo TEXT,
  area_residencia TEXT,
  tipo_moradia TEXT,
  num_pessoas_casa TEXT,
  renda_familiar TEXT,
  resp_nucleo_familiar TEXT,
  beneficio_social TEXT,
  tipo_beneficio TEXT,
  sistema_saude TEXT,
  acompanhamento_medico TEXT,
  vacinas_completas TEXT,
  peso TEXT,
  altura TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 15. STUDENT_DECLARATIONS — Declarações (uniformes, prontidão, viagem)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('UNIFORMES','PRONTIDAO','AUTORIZACAO_VIAGEM')),
  data JSONB NOT NULL,
  assinatura TEXT,
  data_assinatura TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 16. META_QUALITATIVA_RESPONSES
-- ============================================================
CREATE TABLE IF NOT EXISTS meta_qualitativa_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  nucleo_id UUID REFERENCES nucleos(id),
  respostas JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 17. INVENTORY_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  nucleo_id UUID REFERENCES nucleos(id),
  name TEXT NOT NULL,
  quantity INT DEFAULT 0,
  initial_quantity INT DEFAULT 0,
  unit TEXT DEFAULT 'Unid.',
  min_threshold INT DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 18. NUCLEO_BENS — Bens patrimoniais
-- ============================================================
CREATE TABLE IF NOT EXISTS nucleo_bens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucleo_id UUID NOT NULL REFERENCES nucleos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 19. REPORT_TEMPLATES — Templates de relatórios salvos
-- ============================================================
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  nucleo_id UUID REFERENCES nucleos(id),
  name TEXT NOT NULL,
  toc JSONB,
  pages JSONB,
  config JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 20. MATRICULA_OCR_DATA — Dados extraídos via OCR
-- ============================================================
CREATE TABLE IF NOT EXISTS matricula_ocr_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  document_id UUID REFERENCES documents(id),
  nome_aluno TEXT,
  data_nascimento TEXT,
  rg_cpf TEXT,
  nome_escola TEXT,
  tipo_escola TEXT,
  nivel_ensino TEXT,
  ano_serie TEXT,
  turno TEXT,
  turma TEXT,
  ano_letivo TEXT,
  nome_responsavel TEXT,
  cidade_estado TEXT,
  data_emissao TEXT,
  matricula_numero TEXT,
  situacao_aluno TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RLS: FUNÇÕES AUXILIARES
-- ============================================================

-- Retorna project_ids que o usuário pode acessar
CREATE OR REPLACE FUNCTION get_user_project_ids()
RETURNS SETOF UUID AS $$
  SELECT project_id FROM user_project_access
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Retorna nucleo_ids que o usuário pode acessar
CREATE OR REPLACE FUNCTION get_user_nucleo_ids()
RETURNS SETOF UUID AS $$
  SELECT nucleo_id FROM user_project_access
  WHERE user_id = auth.uid() AND nucleo_id IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS: HABILITAR EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nucleos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE nucleo_turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_cadastros ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE socioeconomic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_qualitativa_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nucleo_bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE matricula_ocr_data ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: PROJECTS (todos autenticados leem projetos ativos)
-- ============================================================
CREATE POLICY "projects_read" ON projects
  FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- RLS POLICIES: PROFILES
-- ============================================================
CREATE POLICY "profiles_own" ON profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "profiles_read_all" ON profiles
  FOR SELECT USING (TRUE);

-- ============================================================
-- RLS POLICIES: USER_PROJECT_ACCESS
-- ============================================================
CREATE POLICY "upa_own" ON user_project_access
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "upa_admin_manage" ON user_project_access
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM user_project_access
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================================
-- RLS POLICIES: NUCLEOS
-- ============================================================
CREATE POLICY "nucleos_by_project" ON nucleos
  FOR ALL USING (
    project_id IN (SELECT get_user_project_ids())
  );

-- ============================================================
-- RLS POLICIES: STUDENTS (duplo filtro)
-- ============================================================
CREATE POLICY "students_admin" ON students
  FOR ALL USING (
    project_id IN (
      SELECT project_id FROM user_project_access
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "students_staff" ON students
  FOR ALL USING (
    nucleo_id IN (
      SELECT nucleo_id FROM user_project_access
      WHERE user_id = auth.uid() AND role IN ('COORDENADOR','PROFESSOR')
    )
  );

CREATE POLICY "students_monitor_read" ON students
  FOR SELECT USING (
    nucleo_id IN (
      SELECT nucleo_id FROM user_project_access
      WHERE user_id = auth.uid() AND role = 'MONITOR'
    )
  );

-- ============================================================
-- RLS: DEMAIS TABELAS (padrão: acesso por projeto)
-- ============================================================

-- nucleo_turmas: acesso via núcleo
CREATE POLICY "turmas_access" ON nucleo_turmas
  FOR ALL USING (
    nucleo_id IN (
      SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- employees: acesso via núcleo
CREATE POLICY "employees_access" ON employees
  FOR ALL USING (
    nucleo_id IN (
      SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- contracts: acesso via employee → nucleo
CREATE POLICY "contracts_access" ON contracts
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN nucleos n ON e.nucleo_id = n.id
      WHERE n.project_id IN (SELECT get_user_project_ids())
    )
  );

-- employee_documents
CREATE POLICY "emp_docs_access" ON employee_documents
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN nucleos n ON e.nucleo_id = n.id
      WHERE n.project_id IN (SELECT get_user_project_ids())
    )
  );

-- pre_cadastros
CREATE POLICY "pre_cadastros_access" ON pre_cadastros
  FOR ALL USING (
    project_id IN (SELECT get_user_project_ids())
  );

-- documents
CREATE POLICY "documents_access" ON documents
  FOR ALL USING (
    project_id IN (SELECT get_user_project_ids())
  );

-- school_reports: via document
CREATE POLICY "school_reports_access" ON school_reports
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE project_id IN (SELECT get_user_project_ids())
    )
    OR student_id IN (
      SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- evidences
CREATE POLICY "evidences_access" ON evidences
  FOR ALL USING (
    project_id IN (SELECT get_user_project_ids())
  );

-- socioeconomic_data
CREATE POLICY "socio_access" ON socioeconomic_data
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids())
    )
    OR nucleo_id IN (
      SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- student_declarations
CREATE POLICY "declarations_access" ON student_declarations
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- meta_qualitativa_responses
CREATE POLICY "meta_qual_access" ON meta_qualitativa_responses
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids())
    )
    OR nucleo_id IN (
      SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- inventory_items
CREATE POLICY "inventory_access" ON inventory_items
  FOR ALL USING (
    project_id IN (SELECT get_user_project_ids())
  );

-- nucleo_bens
CREATE POLICY "bens_access" ON nucleo_bens
  FOR ALL USING (
    nucleo_id IN (
      SELECT id FROM nucleos WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- report_templates
CREATE POLICY "templates_access" ON report_templates
  FOR ALL USING (
    project_id IN (SELECT get_user_project_ids())
  );

-- matricula_ocr_data
CREATE POLICY "matricula_ocr_access" ON matricula_ocr_data
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE project_id IN (SELECT get_user_project_ids())
    )
    OR document_id IN (
      SELECT id FROM documents WHERE project_id IN (SELECT get_user_project_ids())
    )
  );

-- ============================================================
-- FIM DO SCHEMA FASE 1
-- ============================================================
