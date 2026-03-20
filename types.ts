
/**
 * FIRESTORE DATA MODELING (SCHEMA)
 */

export interface User {
  uid: string;
  nome: string;
  email: string;
  role: 'PROFESSOR' | 'MONITOR' | 'ADMIN';
  nucleo_id: string | null;
  nucleo_nome?: string;
}

export interface NucleoTurma {
  id: string;        // 'A', 'B', 'C', etc.
  nome: string;      // 'Turma A', 'Turma B'
  dias: string[];    // ['Segunda', 'Quarta', 'Sexta']
  horario: string;   // '07:00 - 09:00'
}

export interface Nucleo {
  id: string;
  nome: string;
  coordinates?: [number, number]; // [lat, lng]
  stockStatus?: 'LOW' | 'MEDIUM' | 'HIGH';
  stockDetails?: { item: string; qty: number; status: 'OK' | 'LOW' }[];

  // Novos campos para Gestão de RH/Funcionários (Aba Núcleos)
  address?: string; // Endereço completo
  phone?: string;
  email?: string;
  employees?: Employee[];

  // Campos para Contratos
  cnpj?: string;
  razaoSocial?: string;
  city?: string; // Para o Foro

  // Informações Gerais do Projeto
  dias_aulas?: string[];     // Ex: ['Segunda', 'Quarta', 'Sexta']
  horario_aulas?: string;    // Ex: '07:00 - 09:00'
  durabilidade?: string;     // Ex: '12 meses (Jan - Dez 2025)'
  dataInicio?: string;       // ISO date (YYYY-MM-DD) - Data de início do projeto
  dataTermino?: string;      // ISO date (YYYY-MM-DD) - Data de término do projeto
  turmas?: NucleoTurma[];    // Lista de turmas do núcleo

  // Bens e Inventário (Aba Inventário)
  bens?: NucleoBem[];
}

export interface NucleoBem {
  id: string;
  name: string;      // Ex: Bicicletas, Cones, Bolas
  quantity: number;  // Quantidade (ex: 10)
}

export interface Contract {
  id: string;
  startDate: string;
  endDate: string;
  type: 'CLT' | 'PJ' | 'BOLSISTA' | 'VOLUNTARIO' | 'MEI' | string;
  status: 'ATIVO' | 'EXPIRANDO' | 'ENCERRADO';
  documentUrl?: string; // URL do contrato PDF
  cnpj?: string; // Campo opcional para MEI
}

export interface Employee {
  id: string;
  name: string;
  role: 'COORDENADOR' | 'PROFESSOR' | 'MONITOR' | 'ADMINISTRATIVO' | 'PSICOLOGO' | 'ASSISTENTE_SOCIAL' | string;
  documentCpf: string;
  phone: string;
  email: string;
  address: string;
  civilStatus?: string; // Estado Civil
  rg?: string; // Registro Geral
  nationality?: string; // Nacionalidade
  profession?: string; // Profissão (pode diferir do role)

  // Dados Contratuais
  contract: Contract;

  // Documentos Pessoais
  documents?: {
    type: 'RG' | 'CPF' | 'COMPROVANTE_RESIDENCIA' | 'DIPLOMA' | 'OUTROS';
    url: string;
    uploadDate: string;
  }[];
}

export interface InventoryItem {
  id: string;
  name: string; // Ex: Kit Lanche, Camiseta, Garrafa
  quantity: number; // Quantidade Atual
  initialQuantity: number; // Quantidade Cadastrada (Base para o cálculo de 10%)
  unit: string; // Ex: Unid., Kit, Cx.
  minThreshold: number; // Para alerta de estoque baixo (manual)
  category: 'ALIMENTACAO' | 'VESTUARIO' | 'EQUIPAMENTO' | 'OUTROS';
}

export interface StudentDraft {
  id?: string;
  // Campos Pessoais (Ficha Pág 3)
  nome: string;
  data_nascimento: string;
  rg_cpf: string; // Unificado conforme PDF
  nome_responsavel: string;
  // Campos de Contato
  endereco: string; // Rua, nº, cidade, estado
  telefone: string;
  email_contato: string;
  // Campos Escolares
  escola_nome: string;
  escola_tipo: 'PUBLICA' | 'PARTICULAR' | '';

  // Novos campos para Relatórios 7 e 8
  n_sli?: string;
  nome_projeto?: string;
  proponente?: string;
  nome_responsavel_organizacao?: string; // Associação/Federação

  reportType?: 'REPORT_7' | 'REPORT_8'; // Identifica se é Beneficiado ou Escola
  nucleo_id?: string; // ID do núcleo onde o aluno está cadastrado
  turma_id?: string;  // ID da turma (ex: 'A', 'B') dentro do núcleo

  timestamp?: string; // Data de criação do registro no sistema
  data_assinatura?: string; // Data que consta na ficha (assinatura)
  fichaUrl?: string; // Evidência da ficha física (foto)
  assinatura?: string; // Base64 da assinatura digital

  // Campos de Necessidade Especial
  portador_necessidade_especial?: boolean; // Indica se o aluno é PNE
  laudo_url?: string; // Base64 ou URL do laudo médico

  // Gestão de Inscrição e Materiais
  status?: 'ATIVO' | 'INATIVO';
  materiais_pendentes?: boolean;
  materiais_checklist?: { id: string; name: string; returned: boolean }[];

  // Declaração de Recebimento de Uniformes
  declaracao_uniformes?: DeclaracaoUniformes;

  // Questionário de Prontidão para Atividade Física (ANEXO I)
  declaracao_prontidao?: DeclaracaoProntidao;

  // Documentos Escolares e Formulários Adicionais
  questionario_quantitativo?: { url: string; timestamp: string };   // Questionário Quantitativo (arquivo)
  pesquisa_socioeconomica?: { url: string; timestamp: string };      // Pesquisa Socioeconômica (arquivo)
  boletim_escolar?: { url: string; timestamp: string; parcial?: boolean }; // Boletim Escolar (parcial = só 1 bimestre)
}

export type EvidenceType = 'ACESSIBILIDADE' | 'DIVULGACAO' | 'MATERIAIS' | 'MATERIAIS_CONSUMO' | 'UNIFORMES' | 'HOSPEDAGEM' | 'OUTROS';

export interface DeclaracaoUniformes {
  assinatura: string;
  data_assinatura: string;
  itens_recebidos: string[];
  cpf_responsavel?: string;
  timestamp: string;
}

export interface DeclaracaoProntidao {
  assinatura: string;
  data_assinatura: string;
  // Respostas: chave = número da pergunta, valor = 'SIM' | 'NAO'
  respostas: Record<number, 'SIM' | 'NAO'>;
  timestamp: string;
}

export interface EvidenceLog {
  id: string;
  timestamp: string;
  type: EvidenceType; // Categoria conforme PDF
  description: string;
  imageUrl?: string;
  user_id?: string;
}

export type DocumentType = 'DECLARACAO_MATRICULA' | 'BOLETIM' | 'RELATORIO_ASSIDUIDADE' | 'LISTA_FREQUENCIA' | 'PESQUISA_META' | 'INDICADORES_SAUDE' | 'RELATORIO_SOCIAL' | 'OCORRENCIA_DISCIPLINAR';

export interface SchoolReportItem {
  id: string;
  fileName: string;
  studentName: string;
  grade1: number; // Aproveitamento 01
  attendance1: number; // Assiduidade 01 (%)
  grade2: number; // Aproveitamento 02
  attendance2: number; // Assiduidade 02 (%)
  status: 'MELHORA' | 'PIORA' | 'MANTEVE';
  avaliacao?: 'Bom' | 'Regular' | 'Insatisfatório' | 'Péssimo'; // Avaliação baseada na nota final
  periodType?: 'PARCIAL' | 'FINAL'; // Classificação do boletim via OCR
  subjects?: SubjectGrade[]; // Novo campo para extração detalhada de disciplinas e faltas
  originalDate?: string;
  docTitle?: string;
}

// Nova interface para o detalhamento de notas
export interface SubjectGrade {
  discipline: string;
  b1: number | null; // Nota 1º Bimestre
  b2: number | null; // Nota 2º Bimestre
  b3: number | null; // Nota 3º Bimestre
  b4: number | null; // Nota 4º Bimestre
  f1?: number | null; // Faltas 1º Bimestre
  f2?: number | null; // Faltas 2º Bimestre
  f3?: number | null; // Faltas 3º Bimestre
  f4?: number | null; // Faltas 4º Bimestre
}

export interface AttendanceReportItem {
  id: string;
  fileName: string;
  studentName: string;
  // Campos atualizados para corresponder ao layout solicitado (Item 4)
  grade1: number; // Aproveitamento Escolar 01
  attendance1: number; // Assiduidade Escolar 01
  grade2: number; // Aproveitamento Escolar 02
  attendance2: number; // Assiduidade Escolar 02
  status: 'MELHORA' | 'PIORA' | 'MANTEVE';
  avaliacao?: 'Bom' | 'Regular' | 'Insatisfatório' | 'Péssimo'; // Avaliação baseada na nota final
  periodType?: 'PARCIAL' | 'FINAL'; // Classificação do boletim via OCR
  // Novo campo para a tabela detalhada
  subjects?: SubjectGrade[];
  originalDate?: string;
  docTitle?: string;
}

export interface FrequencyListItem {
  id: string;
  fileName: string;
  studentName: string;
  month: string;
  totalPresences: number;
}

export interface SocioeconomicData {
  nome: string;
  genero: string;
  cor_raca: string;
  faixa_etaria: string;
  deficiencia: string;
  responsavel_transporte: string;
  meio_transporte: string;
  freq_atividade_anterior: string;
  matricula_escola: string;
  detalhe_escola_particular: string; // Se aplicável
  escolaridade: string;
  periodo_estudo: string;
  area_residencia: string;
  tipo_moradia: string;
  num_pessoas_casa: string;
  renda_familiar: string;
  resp_nucleo_familiar: string;
  beneficio_social: string; // Sim/Não
  tipo_beneficio: string;
  sistema_saude: string;
  acompanhamento_medico: string; // Não ou Especificar
  vacinas_completas: string; // Sim/Não
  peso: string;
  altura: string;
}

export interface PreCadastroData {
  id: string;
  timestamp: string;
  nucleo_id?: string;
  status: 'AGUARDANDO' | 'APROVADO' | 'DESCARTADO';

  // I. Identificação
  nome_aluno: string;
  data_nascimento: string;
  raca: string;
  pcd: string; // Sim / Não
  deficiencia_desc: string;
  laudo_url?: string; // Armazena a URL/Base64 do laudo médico anexado
  rg: string;
  cpf: string;

  // II. Escolar
  tipo_escola: string;
  bolsa_estudo: string;
  nome_escola: string;
  periodo_estudo: string;
  cursando: string;
  frequencia_atividade: string;

  // III. Responsável
  nome_responsavel: string;
  telefone: string;
  email: string;
  endereco: string; // Fundamental para cálculo de núcleo próximo
  local_moradia: string;
  tipo_imovel: string;
  qtd_pessoas_casa: string;
  renda_bruta: string;
  beneficio_gov: string; // Sim / Não

  // IV. Saúde
  sistema_saude: string;
  vacinas_dia: string; // Sim / Não
  altura: string;
  peso: string;
  sabe_nadar: string; // Sim / Não
  sabe_pedalar: string; // Sim / Não

  // V. Finalização
  intuito: string;
  restricao_dias: string;
}

export interface DocumentLog {
  id: string;
  timestamp: string;
  type: DocumentType;
  title: string;
  description?: string;
  fileUrl?: string; // Foto ou PDF
  metaData?: any; // Para armazenar JSON do formulário digital ou dados de boletim/assiduidade
}

export enum AppView {
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',

  // Serviços
  FEATURE_OCR = 'FEATURE_OCR', // 1. Ficha
  FEATURE_DOC_UPLOAD = 'FEATURE_DOC_UPLOAD', // 2, 3, 4, 5
  FEATURE_META_QUALITATIVA = 'FEATURE_META_QUALITATIVA', // 6. Pesquisa Meta
  FEATURE_SOCIOECONOMIC = 'FEATURE_SOCIOECONOMIC', // Novo: Indicadores Socioeconômicos
  FEATURE_SERVICO_SOCIAL = 'FEATURE_SERVICO_SOCIAL', // Serviço Social
  FEATURE_EVIDENCE = 'FEATURE_EVIDENCE', // 9, 10, 11
  FEATURE_INVENTORY = 'FEATURE_INVENTORY', // Novo: Controle de Estoque
  FEATURE_PRE_CADASTRO = 'FEATURE_PRE_CADASTRO', // Novo: Pré-cadastro e Fila de Espera

  REPORT = 'REPORT', // 7, 8 (Gerados automaticamente)
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD', // Novo Dashboard Admin
  DEV_ENVIRONMENT = 'DEV_ENVIRONMENT', // Ambiente de Desenvolvimento
  PDF_BUILDER_VIEW = 'PDF_BUILDER_VIEW', // Nova tela para visualizar o PDF final

  // Visualização Externa (Pai)
  PUBLIC_FORM = 'PUBLIC_FORM'
}

// --- PDF BUILDER TYPES ---
export type PDFItemType = 'IMAGE' | 'EVIDENCE_CARD' | 'TABLE_BOLETIM' | 'TABLE_ATTENDANCE' | 'TABLE_ATTENDANCE_DETAILED' | 'TABLE_STUDENTS' | 'TEXT_NOTE' | 'STUDENT_CARD' | 'META_QUALITATIVA_ITEM' | 'SOCIOECONOMIC_CARD' | 'TABLE_REPORT_7' | 'TABLE_REPORT_8' | 'NUCLEO_INVENTORY_TABLE' | 'STUDENTS_BY_NUCLEO_TABLE' | 'CROSS_REFERENCE_TABLE';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  textAlign: 'left' | 'right' | 'center' | 'justify';
  lineHeight: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor?: string;
}

export interface PDFItem {
  id: string;
  type: PDFItemType;
  data: any; // Dados flexíveis. Para TEXT_NOTE: { text: string, style: TextStyle }
  title?: string;
  // Propriedades para posicionamento livre (Editor Visual)
  x?: number; // Posição X em pixels (ou %)
  y?: number; // Posição Y em pixels (ou %)
  width?: number; // Largura em pixels
  height?: number; // Altura em pixels
  zIndex?: number;
}

export interface PDFPage {
  id: string;
  items: PDFItem[];
  pageNumber?: number;
}

export interface Asset {
  id: string;
  url: string;
  name: string;
}
