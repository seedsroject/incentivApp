/**
 * Supabase Data Service — Camada de acesso ao banco Supabase.
 * Substitui o localStorage com queries tipadas por projeto/núcleo.
 */
import { supabase } from './supabaseClient';
import type { ProjectId } from '../types';

// ============================================================
// TYPES — Mapeamento Supabase → Frontend
// ============================================================

export interface SupabaseProject {
  id: string;
  slug: ProjectId;
  nome: string;
  modalidade: string;
  proponente: string | null;
  logo_url: string | null;
  banner_url: string | null;
  cor_primaria: string;
  is_active: boolean;
}

export interface SupabaseNucleo {
  id: string;
  project_id: string;
  nome: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  cnpj: string | null;
  razao_social: string | null;
  city: string | null;
  sli_number: string | null;
  dias_aulas: string[] | null;
  horario_aulas: string | null;
  durabilidade: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  stock_status: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  coordinates: string | null; // PostGIS POINT string
}

export interface SupabaseStudent {
  id: string;
  project_id: string;
  nucleo_id: string | null;
  turma_id: string | null;
  nome: string;
  data_nascimento: string | null;
  rg_cpf: string | null;
  nome_responsavel: string | null;
  endereco: string | null;
  telefone: string | null;
  email_contato: string | null;
  escola_nome: string | null;
  escola_tipo: string | null;
  n_sli: string | null;
  nome_projeto: string | null;
  proponente: string | null;
  nome_responsavel_organizacao: string | null;
  report_type: string | null;
  status: string;
  materiais_pendentes: boolean;
  materiais_checklist: any;
  portador_necessidade_especial: boolean;
  laudo_url: string | null;
  ficha_url: string | null;
  assinatura: string | null;
  data_assinatura: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PROJECTS
// ============================================================

/** Lista todos os projetos ativos */
export async function fetchProjects(): Promise<SupabaseProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_active', true)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar projetos:', error);
    return [];
  }
  return data || [];
}

/** Busca um projeto por slug */
export async function fetchProjectBySlug(slug: ProjectId): Promise<SupabaseProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Erro ao buscar projeto:', error);
    return null;
  }
  return data;
}

// ============================================================
// NUCLEOS
// ============================================================

/** Lista núcleos de um projeto */
export async function fetchNucleosByProject(projectId: string): Promise<SupabaseNucleo[]> {
  const { data, error } = await supabase
    .from('nucleos')
    .select('*')
    .eq('project_id', projectId)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar núcleos:', error);
    return [];
  }
  return data || [];
}

/** Busca um núcleo por ID */
export async function fetchNucleoById(nucleoId: string): Promise<SupabaseNucleo | null> {
  const { data, error } = await supabase
    .from('nucleos')
    .select('*')
    .eq('id', nucleoId)
    .single();

  if (error) {
    console.error('Erro ao buscar núcleo:', error);
    return null;
  }
  return data;
}

/** Atualiza um núcleo */
export async function updateNucleo(nucleoId: string, updates: Partial<SupabaseNucleo>) {
  const { data, error } = await supabase
    .from('nucleos')
    .update(updates)
    .eq('id', nucleoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// STUDENTS
// ============================================================

/** Lista alunos de um projeto */
export async function fetchStudentsByProject(projectId: string): Promise<SupabaseStudent[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('project_id', projectId)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar alunos:', error);
    return [];
  }
  return data || [];
}

/** Lista alunos de um núcleo específico */
export async function fetchStudentsByNucleo(nucleoId: string): Promise<SupabaseStudent[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('nucleo_id', nucleoId)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar alunos do núcleo:', error);
    return [];
  }
  return data || [];
}

/** Cria um novo aluno */
export async function createStudent(student: Omit<SupabaseStudent, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Atualiza um aluno */
export async function updateStudent(studentId: string, updates: Partial<SupabaseStudent>) {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', studentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Remove um aluno */
export async function deleteStudent(studentId: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  if (error) throw error;
}

// ============================================================
// PRE-CADASTROS (Fila de Espera)
// ============================================================

export async function fetchPreCadastrosByProject(projectId: string) {
  const { data, error } = await supabase
    .from('pre_cadastros')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar pré-cadastros:', error);
    return [];
  }
  return data || [];
}

export async function createPreCadastro(preCadastro: any) {
  const { data, error } = await supabase
    .from('pre_cadastros')
    .insert(preCadastro)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePreCadastroStatus(id: string, status: 'AGUARDANDO' | 'APROVADO' | 'DESCARTADO') {
  const { data, error } = await supabase
    .from('pre_cadastros')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function fetchDocumentsByProject(projectId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar documentos:', error);
    return [];
  }
  return data || [];
}

export async function createDocument(doc: any) {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// EVIDENCES
// ============================================================

export async function fetchEvidencesByProject(projectId: string) {
  const { data, error } = await supabase
    .from('evidences')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar evidências:', error);
    return [];
  }
  return data || [];
}

export async function createEvidence(evidence: any) {
  const { data, error } = await supabase
    .from('evidences')
    .insert(evidence)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// EMPLOYEES & CONTRACTS
// ============================================================

export async function fetchEmployeesByNucleo(nucleoId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('*, contracts(*)')
    .eq('nucleo_id', nucleoId)
    .order('name');

  if (error) {
    console.error('Erro ao buscar funcionários:', error);
    return [];
  }
  return data || [];
}

export async function createEmployee(employee: any) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(employeeId: string, updates: any) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', employeeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// INVENTORY
// ============================================================

export async function fetchInventoryByProject(projectId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('project_id', projectId)
    .order('name');

  if (error) {
    console.error('Erro ao buscar inventário:', error);
    return [];
  }
  return data || [];
}

export async function upsertInventoryItem(item: any) {
  const { data, error } = await supabase
    .from('inventory_items')
    .upsert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// AUTH — Login / Signup / Session
// ============================================================

/** Login com email + senha */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Cadastro de novo usuário */
export async function signUp(email: string, password: string, nome: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome } },
  });
  if (error) throw error;
  return data;
}

/** Logout */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Sessão atual */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/** Buscar acesso do usuário a projetos */
export async function fetchUserProjectAccess(userId: string) {
  const { data, error } = await supabase
    .from('user_project_access')
    .select('*, projects(*), nucleos(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar acesso do usuário:', error);
    return [];
  }
  return data || [];
}

/** Verificar se o usuário tem acesso a um projeto específico */
export async function checkUserProjectAccess(userId: string, projectSlug: ProjectId) {
  const { data, error } = await supabase
    .from('user_project_access')
    .select('*, projects!inner(*)')
    .eq('user_id', userId)
    .eq('projects.slug', projectSlug)
    .single();

  if (error) return null;
  return data;
}
