/** Report Builder Types — Full Implementation */

export interface TocItem {
  id: string;
  num: string;
  title: string;
  level: 0 | 1 | 2;
  pageId: string;
  widgets: RBWidget[];
}

export type WidgetType = 'TEXT' | 'TABLE' | 'CHART_PIE' | 'CHART_BAR' | 'IMAGE' | 'SHAPE';

export interface RBWidget {
  id: string;
  type: WidgetType;
  serviceId: string;
  variableKey: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  isEditable?: boolean;
  content?: string;

  // Style overrides
  style?: {
    fontSize?: number;
    fontWeight?: string;
    textAlign?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    padding?: number;
  };

  // Chart rendering
  chartData?: { label: string; value: number; color: string }[];
  chartConfig?: {
    chartType: 'PIE' | 'BAR' | 'LINE';
    colors?: string[];
    showLegend?: boolean;
    showValues?: boolean;
    dataOverrides?: Record<string, number>;
  };

  // Table rendering
  tableColumns?: string[];
  tableRows?: Record<string, string>[];
  tableConfig?: {
    columns: string[];
    sortBy?: string;
    filterNucleoId?: string;
    maxRows?: number;
  };

  // Image rendering
  imageUrl?: string;
  imageConfig?: {
    src: string;
    objectFit: 'contain' | 'cover' | 'fill';
  };

  // AI Analysis
  aiAnalysis?: string;
  aiPosition?: 'above' | 'below';
  showAiBlock?: boolean;

  // Data Configuration (for configurable widgets)
  dataConfig?: WidgetDataConfig;
}

export type DataSourceType = 'SYSTEM' | 'MANUAL' | 'CALC';

export interface ManualDataRow {
  label: string;
  value: number;
  color: string;
}

export interface ManualTableRow {
  [key: string]: string;
}

export interface WidgetDataConfig {
  sourceType: DataSourceType;
  // System data binding
  systemServiceId?: string;
  systemVariableKey?: string;
  // Manual data entry (for charts)
  manualChartData?: ManualDataRow[];
  // Manual table data
  manualTableColumns?: string[];
  manualTableRows?: ManualTableRow[];
  // Chart options
  chartType?: 'PIE' | 'BAR' | 'LINE';
  showLegend?: boolean;
  showValues?: boolean;
  customColors?: string[];
  // Table options
  maxRows?: number;
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
  // Calc binding (uses calc fields from calc tab)
  calcFieldIds?: string[];
}

export interface RBPage {
  id: string;
  type: 'COVER' | 'BACK_COVER' | 'SUMMARY' | 'TOC' | 'CONTENT';
  tocItemId?: string;
  widgets: RBWidget[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  toc: TocItem[];
  pages: RBPage[];
  showCover: boolean;
  showBackCover: boolean;
  showResume: boolean;
  showToc: boolean;
  nucleo_id?: string;
  period?: { start: string; end: string };
}

export interface SidebarBlock {
  serviceId: string;
  label: string;
  icon: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  serviceId: string;
  variableKey: string;
  label: string;
  type: WidgetType;
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function recalcNumbers(toc: TocItem[]): TocItem[] {
  const c = [0, 0, 0];
  return toc.map(item => {
    c[item.level]++;
    if (item.level === 0) { c[1] = 0; c[2] = 0; }
    if (item.level === 1) { c[2] = 0; }
    const num = item.level === 0 ? `${c[0]}`
      : item.level === 1 ? `${c[0]}.${c[1]}`
      : `${c[0]}.${c[1]}.${c[2]}`;
    return { ...item, num };
  });
}

// ═══════════════════════════════════════════════════
// SIDEBAR BLOCKS — All 9 services + Generic Widgets
// ═══════════════════════════════════════════════════

export const SIDEBAR_BLOCKS: SidebarBlock[] = [
  {
    serviceId: 'INSCRICAO', label: 'Inscrição', icon: 'clipboard',
    items: [
      { id: 'ins_nome', serviceId: 'INSCRICAO', variableKey: 'nomeAluno', label: 'Nome do Aluno', type: 'TEXT' },
      { id: 'ins_nasc', serviceId: 'INSCRICAO', variableKey: 'dataNascimento', label: 'Data de Nascimento', type: 'TEXT' },
      { id: 'ins_resp', serviceId: 'INSCRICAO', variableKey: 'nomeResponsavel', label: 'Nome Responsável', type: 'TEXT' },
      { id: 'ins_escola', serviceId: 'INSCRICAO', variableKey: 'escolaTipo', label: 'Escola / Tipo', type: 'TEXT' },
      { id: 'ins_total', serviceId: 'INSCRICAO', variableKey: 'totalAlunos', label: 'Total de Alunos', type: 'TEXT' },
      { id: 'ins_rede', serviceId: 'INSCRICAO', variableKey: 'pctRede', label: '% Pública / Particular', type: 'CHART_PIE' },
      { id: 'ins_genero', serviceId: 'INSCRICAO', variableKey: 'pctGenero', label: '% Gênero (M/F)', type: 'CHART_PIE' },
      { id: 'ins_idade', serviceId: 'INSCRICAO', variableKey: 'distIdade', label: 'Distribuição por Idade', type: 'CHART_BAR' },
      { id: 'ins_ensino', serviceId: 'INSCRICAO', variableKey: 'distEnsino', label: 'Distribuição por Ensino', type: 'CHART_BAR' },
      { id: 'ins_tbl', serviceId: 'INSCRICAO', variableKey: 'tabelaInscritos', label: 'Tabela de Inscritos', type: 'TABLE' },
    ]
  },
  {
    serviceId: 'FREQUENCIA', label: 'Frequência', icon: 'bar-chart',
    items: [
      { id: 'freq_avg', serviceId: 'FREQUENCIA', variableKey: 'avgFreqPct', label: 'Média Geral Freq (%)', type: 'TEXT' },
      { id: 'freq_faltas', serviceId: 'FREQUENCIA', variableKey: 'avgFaltaPct', label: 'Média Geral Faltas (%)', type: 'TEXT' },
      { id: 'freq_dias', serviceId: 'FREQUENCIA', variableKey: 'totalDays', label: 'Total Dias de Aula', type: 'TEXT' },
      { id: 'freq_pizza', serviceId: 'FREQUENCIA', variableKey: 'freqVsFaltas', label: 'Freq vs Faltas', type: 'CHART_PIE' },
      { id: 'freq_mensal', serviceId: 'FREQUENCIA', variableKey: 'monthlyAgg', label: 'Frequência Mensal', type: 'CHART_BAR' },
      { id: 'freq_faltas_mensal', serviceId: 'FREQUENCIA', variableKey: 'faltasMensal', label: 'Faltas Mensais', type: 'CHART_BAR' },
      { id: 'freq_historico', serviceId: 'FREQUENCIA', variableKey: 'historicoFaltas', label: 'Histórico de Faltas', type: 'CHART_BAR' },
      { id: 'freq_resumo', serviceId: 'FREQUENCIA', variableKey: 'resumoGeral', label: 'Tabela Resumo Geral', type: 'TABLE' },
      { id: 'freq_matriculados', serviceId: 'FREQUENCIA', variableKey: 'enrolledStudents', label: 'Tabela Matriculados', type: 'TABLE' },
      { id: 'freq_mensal_tbl', serviceId: 'FREQUENCIA', variableKey: 'freqMensalTbl', label: 'Lista Frequência Mensal', type: 'TABLE' },
    ]
  },
  {
    serviceId: 'ASSIDUIDADE', label: 'Assiduidade / Aproveitamento', icon: 'trending-up',
    items: [
      { id: 'ass_notas1_pie', serviceId: 'ASSIDUIDADE', variableKey: 'dist1bimPie', label: 'Notas 1ºBim (Pizza)', type: 'CHART_PIE' },
      { id: 'ass_notas4_pie', serviceId: 'ASSIDUIDADE', variableKey: 'dist4bimPie', label: 'Notas 4ºBim (Pizza)', type: 'CHART_PIE' },
      { id: 'ass_notas1_bar', serviceId: 'ASSIDUIDADE', variableKey: 'dist1bimBar', label: 'Notas 1ºBim (Barras)', type: 'CHART_BAR' },
      { id: 'ass_notas4_bar', serviceId: 'ASSIDUIDADE', variableKey: 'dist4bimBar', label: 'Notas 4ºBim (Barras)', type: 'CHART_BAR' },
      { id: 'ass_status', serviceId: 'ASSIDUIDADE', variableKey: 'melhoraPiora', label: '% Melhora/Piora/Manteve', type: 'CHART_PIE' },
      { id: 'ass_tbl5', serviceId: 'ASSIDUIDADE', variableKey: 'tabela5', label: 'Tabela 5 - Médias', type: 'TABLE' },
      { id: 'ass_total', serviceId: 'ASSIDUIDADE', variableKey: 'totalBeneficiados', label: 'Total Beneficiados', type: 'TEXT' },
    ]
  },
  {
    serviceId: 'SOCIOECONOMICO', label: 'Socioeconômico', icon: 'users',
    items: [
      { id: 'soc_genero', serviceId: 'SOCIOECONOMICO', variableKey: 'genero', label: 'Distribuição Gênero', type: 'CHART_PIE' },
      { id: 'soc_raca', serviceId: 'SOCIOECONOMICO', variableKey: 'corRaca', label: 'Distribuição Cor/Raça', type: 'CHART_PIE' },
      { id: 'soc_renda', serviceId: 'SOCIOECONOMICO', variableKey: 'renda', label: 'Renda Familiar', type: 'CHART_BAR' },
      { id: 'soc_moradia', serviceId: 'SOCIOECONOMICO', variableKey: 'moradia', label: 'Tipo de Moradia', type: 'CHART_PIE' },
      { id: 'soc_area', serviceId: 'SOCIOECONOMICO', variableKey: 'area', label: 'Área Residência', type: 'CHART_PIE' },
      { id: 'soc_beneficio', serviceId: 'SOCIOECONOMICO', variableKey: 'beneficio', label: 'Benefício Social', type: 'CHART_PIE' },
      { id: 'soc_saude', serviceId: 'SOCIOECONOMICO', variableKey: 'saude', label: 'Sistema de Saúde', type: 'CHART_PIE' },
    ]
  },
  {
    serviceId: 'META_QUALITATIVA', label: 'Meta Qualitativa', icon: 'target',
    items: [
      { id: 'meta_tbl', serviceId: 'META_QUALITATIVA', variableKey: 'respostasAluno', label: 'Respostas por Aluno', type: 'TABLE' },
      { id: 'meta_consolidado', serviceId: 'META_QUALITATIVA', variableKey: 'consolidado', label: 'Consolidado Respostas', type: 'CHART_BAR' },
    ]
  },
  {
    serviceId: 'EVIDENCIAS', label: 'Evidências', icon: 'camera',
    items: [
      { id: 'ev_galeria', serviceId: 'EVIDENCIAS', variableKey: 'galeria', label: 'Galeria por Categoria', type: 'IMAGE' },
      { id: 'ev_contagem', serviceId: 'EVIDENCIAS', variableKey: 'contagem', label: 'Contagem por Tipo', type: 'CHART_BAR' },
      { id: 'ev_lista', serviceId: 'EVIDENCIAS', variableKey: 'listaEvidencias', label: 'Lista de Evidências', type: 'TABLE' },
    ]
  },
  {
    serviceId: 'PDLIE', label: 'PDLIE', icon: 'file-text',
    items: [
      { id: 'pdlie_cidade', serviceId: 'PDLIE', variableKey: 'cidadeEstado', label: 'Cidade/Estado', type: 'TEXT' },
      { id: 'pdlie_galeria', serviceId: 'PDLIE', variableKey: 'evidenciasDivulgacao', label: 'Evidências de Divulgação', type: 'IMAGE' },
      { id: 'pdlie_acoes', serviceId: 'PDLIE', variableKey: 'acoesDivulgacao', label: 'Ações de Divulgação', type: 'TABLE' },
    ]
  },
  {
    serviceId: 'NUCLEO', label: 'Núcleo', icon: 'building',
    items: [
      { id: 'nuc_info', serviceId: 'NUCLEO', variableKey: 'info', label: 'Nome / CNPJ / Endereço', type: 'TEXT' },
      { id: 'nuc_func', serviceId: 'NUCLEO', variableKey: 'funcionarios', label: 'Funcionários', type: 'TABLE' },
      { id: 'nuc_turmas', serviceId: 'NUCLEO', variableKey: 'turmas', label: 'Turmas', type: 'TABLE' },
      { id: 'nuc_inv', serviceId: 'NUCLEO', variableKey: 'inventario', label: 'Inventário (Bens)', type: 'TABLE' },
    ]
  },
  {
    serviceId: 'WIDGETS', label: 'Widgets', icon: 'puzzle',
    items: [
      { id: 'w_texto', serviceId: 'WIDGETS', variableKey: 'textoLivre', label: 'Bloco de Texto Livre', type: 'TEXT' },
      { id: 'w_imagem', serviceId: 'WIDGETS', variableKey: 'imagemLivre', label: 'Campo de Imagem', type: 'IMAGE' },
      { id: 'w_pizza', serviceId: 'WIDGETS', variableKey: 'graficoPizzaVazio', label: 'Gráfico Pizza (vazio)', type: 'CHART_PIE' },
      { id: 'w_colunas', serviceId: 'WIDGETS', variableKey: 'graficoColunasVazio', label: 'Gráfico Colunas (vazio)', type: 'CHART_BAR' },
      { id: 'w_tabela', serviceId: 'WIDGETS', variableKey: 'tabelaLivre', label: 'Tabela Livre', type: 'TABLE' },
      { id: 'w_capa', serviceId: 'WIDGETS', variableKey: 'capa', label: 'Capa (Wireframe)', type: 'SHAPE' },
      { id: 'w_contracapa', serviceId: 'WIDGETS', variableKey: 'contracapa', label: 'Contracapa (Wireframe)', type: 'SHAPE' },
    ]
  },
];

// ═══════════════════════════════════════════════════
// AVAILABLE DATA SOURCES for Widget Configurator
// ═══════════════════════════════════════════════════

export interface AvailableDataSource {
  serviceId: string;
  variableKey: string;
  label: string;
  category: string;
  dataType: 'chart' | 'table' | 'scalar';
}

export const AVAILABLE_DATA_SOURCES: AvailableDataSource[] = [
  // Inscrição
  { serviceId: 'INSCRICAO', variableKey: 'pctRede', label: '% Pública / Particular', category: 'Inscrição', dataType: 'chart' },
  { serviceId: 'INSCRICAO', variableKey: 'pctGenero', label: '% Gênero (M/F)', category: 'Inscrição', dataType: 'chart' },
  { serviceId: 'INSCRICAO', variableKey: 'distIdade', label: 'Distribuição por Idade', category: 'Inscrição', dataType: 'chart' },
  { serviceId: 'INSCRICAO', variableKey: 'distEnsino', label: 'Distribuição por Ensino', category: 'Inscrição', dataType: 'chart' },
  { serviceId: 'INSCRICAO', variableKey: 'tabelaInscritos', label: 'Tabela de Inscritos', category: 'Inscrição', dataType: 'table' },
  // Frequência
  { serviceId: 'FREQUENCIA', variableKey: 'freqVsFaltas', label: 'Freq vs Faltas', category: 'Frequência', dataType: 'chart' },
  { serviceId: 'FREQUENCIA', variableKey: 'monthlyAgg', label: 'Frequência Mensal', category: 'Frequência', dataType: 'chart' },
  { serviceId: 'FREQUENCIA', variableKey: 'faltasMensal', label: 'Faltas Mensais', category: 'Frequência', dataType: 'chart' },
  { serviceId: 'FREQUENCIA', variableKey: 'historicoFaltas', label: 'Histórico de Faltas', category: 'Frequência', dataType: 'chart' },
  { serviceId: 'FREQUENCIA', variableKey: 'resumoGeral', label: 'Tabela Resumo Geral', category: 'Frequência', dataType: 'table' },
  { serviceId: 'FREQUENCIA', variableKey: 'enrolledStudents', label: 'Tabela Matriculados', category: 'Frequência', dataType: 'table' },
  { serviceId: 'FREQUENCIA', variableKey: 'freqMensalTbl', label: 'Lista Frequência Mensal', category: 'Frequência', dataType: 'table' },
  // Assiduidade
  { serviceId: 'ASSIDUIDADE', variableKey: 'dist1bimPie', label: 'Notas 1ºBim', category: 'Assiduidade', dataType: 'chart' },
  { serviceId: 'ASSIDUIDADE', variableKey: 'dist4bimPie', label: 'Notas 4ºBim', category: 'Assiduidade', dataType: 'chart' },
  { serviceId: 'ASSIDUIDADE', variableKey: 'melhoraPiora', label: '% Melhora/Piora/Manteve', category: 'Assiduidade', dataType: 'chart' },
  { serviceId: 'ASSIDUIDADE', variableKey: 'tabela5', label: 'Tabela 5 - Médias', category: 'Assiduidade', dataType: 'table' },
  // Socioeconômico
  { serviceId: 'SOCIOECONOMICO', variableKey: 'genero', label: 'Distribuição Gênero', category: 'Socioeconômico', dataType: 'chart' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'corRaca', label: 'Distribuição Cor/Raça', category: 'Socioeconômico', dataType: 'chart' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'renda', label: 'Renda Familiar', category: 'Socioeconômico', dataType: 'chart' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'moradia', label: 'Tipo de Moradia', category: 'Socioeconômico', dataType: 'chart' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'area', label: 'Área Residência', category: 'Socioeconômico', dataType: 'chart' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'beneficio', label: 'Benefício Social', category: 'Socioeconômico', dataType: 'chart' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'saude', label: 'Sistema de Saúde', category: 'Socioeconômico', dataType: 'chart' },
  // Evidências
  { serviceId: 'EVIDENCIAS', variableKey: 'contagem', label: 'Contagem por Tipo', category: 'Evidências', dataType: 'chart' },
  { serviceId: 'EVIDENCIAS', variableKey: 'listaEvidencias', label: 'Lista de Evidências', category: 'Evidências', dataType: 'table' },
  // Núcleo
  { serviceId: 'NUCLEO', variableKey: 'funcionarios', label: 'Funcionários', category: 'Núcleo', dataType: 'table' },
  { serviceId: 'NUCLEO', variableKey: 'turmas', label: 'Turmas', category: 'Núcleo', dataType: 'table' },
  { serviceId: 'NUCLEO', variableKey: 'inventario', label: 'Inventário', category: 'Núcleo', dataType: 'table' },
];

export const CHART_COLORS = ['#4472c4','#ed7d31','#70ad47','#ffc000','#5b9bd5','#a5a5a5','#264478','#9b59b6','#e74c3c','#1abc9c','#f39c12','#2ecc71'];
