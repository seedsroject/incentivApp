
import React, { useState, useEffect, useMemo } from 'react';
import { User, Nucleo, AppView, StudentDraft, EvidenceLog, DocumentLog, DocumentType, EvidenceType, InventoryItem, ProjectId } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { CameraOCR } from './components/CameraOCR';
import { EvidenceUpload } from './components/EvidenceUpload';
import { DocumentUpload } from './components/DocumentUpload';
import { MetaQualitativa } from './components/MetaQualitativa';
import AmbienteDesenvolvimento from './components/AmbienteDesenvolvimento';
import { Logo } from './components/Logo';
import { PDFBuilderProvider } from './components/PDFBuilderContext';
import { PDFBuilderSidebar, PDFBuilderPreview } from './components/PDFBuilderSidebar';
import { PublicFormView } from './components/PublicFormView';
import { SocioeconomicForm } from './components/SocioeconomicForm';
import { InventoryControl } from './components/InventoryControl';
import { AdminDashboard } from './components/AdminDashboard';
import { PreCadastroDashboard, MOCK_PRE_CADASTRO } from './components/PreCadastroDashboard';
import { ServicoSocialDashboard } from './components/ServicoSocialDashboard';
import { CrossReferenceView } from './components/CrossReferenceView';
import { FrequencyReportBuilder } from './components/FrequencyReportBuilder';
import { PDLIEReportBuilder } from './components/PDLIEReportBuilder';
import { PreCadastroData } from './types';
import { ReportPreview } from './components/ReportPreview';


// --- MOCK DATA SERVICES ---
const generateStockDetails = (status: 'LOW' | 'MEDIUM' | 'HIGH') => {
  const items = [
    { name: 'Kits Lanche', base: 50 },
    { name: 'Camisetas', base: 20 },
    { name: 'Bolas', base: 10 },
    { name: 'Coletes', base: 15 }
  ];

  return items.map(item => {
    let factor = 1;
    let itemStatus: 'OK' | 'LOW' = 'OK';

    if (status === 'LOW') factor = 0.2;
    if (status === 'MEDIUM') factor = 0.5;

    // Add some random variation
    const qty = Math.floor(item.base * factor * (0.8 + Math.random() * 0.4));

    if (qty < item.base * 0.3) itemStatus = 'LOW';

    return { item: item.name, qty, status: itemStatus };
  });
};

// --- MOCK EMPLOYEES GENERATOR ---
const generateMockEmployees = (nucleoId: string, nucleoName: string): any[] => {
  return [
    {
      id: `emp_${nucleoId}_1`,
      name: 'João da Silva Santos',
      role: 'PROFESSOR',
      documentCpf: '123.456.789-00',
      phone: '(11) 99999-8888',
      email: `joao.${nucleoId}@esporte.gov.br`,
      address: 'Rua Exemplo, 123, Centro',
      contract: {
        id: `ctr_${nucleoId}_1`,
        startDate: '2025-01-10',
        endDate: '2026-01-10',
        type: 'BOLSISTA',
        status: 'ATIVO',
        documentUrl: '#'
      },
      documents: [
        { type: 'RG', url: '#', uploadDate: '2025-01-05' },
        { type: 'DIPLOMA', url: '#', uploadDate: '2025-01-05' }
      ]
    },
    {
      id: `emp_${nucleoId}_2`,
      name: 'Maria Oliveira',
      role: 'MONITOR',
      documentCpf: '987.654.321-11',
      phone: '(11) 98888-7777',
      email: `maria.${nucleoId}@esporte.gov.br`,
      address: 'Av. Principal, 500, Bairro Novo',
      contract: {
        id: `ctr_${nucleoId}_2`,
        startDate: '2025-02-01',
        endDate: '2025-08-01',
        type: 'VOLUNTARIO',
        status: 'ATIVO',
        documentUrl: '#'
      }
    }
  ];
};

const MOCK_NUCLEOS: Nucleo[] = [
  { id: 'nuc_ilheus', nome: 'Ilhéus | BA - CEEP do Chocolate – Av. Antônio Carlos Magalhães, nº 755, Ilhéus - BA', coordinates: [-14.788889, -39.048333], stockStatus: 'HIGH' },
  { id: 'nuc_aquiraz', nome: 'Aquiraz | CE - Sec. de Esporte – Av. Airton Sena, Vila da Prata, Aquiraz - CE', coordinates: [-3.9186, -38.3925], stockStatus: 'MEDIUM' },
  { id: 'nuc_aracati', nome: 'Aracati | CE - Colégio EEFTI Prof Onélio Porto – Rua Padre Pachêco, 147, Aracati - CE', coordinates: [-4.5617, -37.7697], stockStatus: 'LOW' },
  { id: 'nuc_cascavel', nome: 'Cascavel | CE - Centro Comunitário do Coqueiro – Sítio Coqueiro, S/N, Guanacés, Cascavel - CE', coordinates: [-4.1283, -38.2417], stockStatus: 'HIGH' },
  { id: 'nuc_caucaia', nome: 'Caucaia | CE - Centro Municipal de Formação e Avaliação (Av. Juaci Sampaio Pontes, s/n), Caucaia - CE', coordinates: [-3.7375, -38.6533], stockStatus: 'MEDIUM' },
  { id: 'nuc_fortaleza', nome: 'Atitude Atletas - Bairro Pirambu (Praia de Pirambu), Fortaleza - CE', coordinates: [-3.715, -38.56], stockStatus: 'LOW' },
  { id: 'nuc_horizonte', nome: 'Horizonte | CE - Rua Moreira da Silva, nº 90 (Rua 13), Diadema, Horizonte - CE', coordinates: [-4.1, -38.4833], stockStatus: 'HIGH' },
  { id: 'nuc_maracanau', nome: 'Maracanaú | CE - Instituto Lucimário Caitano – Av. Central, 120, Novo Oriente, Maracanaú - CE', coordinates: [-3.8744, -38.6256], stockStatus: 'MEDIUM' },
  { id: 'nuc_pecem', nome: 'Pecém | CE - Rua Professor José Denilson, São Gonçalo do Amarante - CE', coordinates: [-3.5433, -38.8258], stockStatus: 'LOW' },
  { id: 'nuc_ceilandia', nome: 'Ceilândia | DF - C.O.P. Parque da Vaquejada – QNP 21, AE, Sol Nascente, Ceilândia - DF', coordinates: [-15.8203, -48.1158], stockStatus: 'HIGH' },
  { id: 'nuc_vila_velha', nome: 'Vila Velha | ES - UMEF Vila Olímpica – Rua Almirante Tamandaré, nº 1, Soteco, Vila Velha - ES', coordinates: [-20.3297, -40.2925], stockStatus: 'MEDIUM' },
  { id: 'nuc_vitoria', nome: 'Vitória | ES - Clube ACS – Rua Alvin Borges da Silva, nº 42, Jardim Camburi, Vitória - ES', coordinates: [-20.2589, -40.2844], stockStatus: 'LOW' },
  { id: 'nuc_goiania', nome: 'Goiânia | GO - Praça de Esporte Pedro Ludovico – Rua 1015, Setor Pedro Ludovico, Goiânia - GO', coordinates: [-16.7, -49.25], stockStatus: 'HIGH' },
  { id: 'nuc_parauapebas', nome: 'Parauapebas | PA - Usina da Paz – Avenida D, Quadra, nº 101, Jardim Tropical, Parauapebas - PA', coordinates: [-6.0667, -49.9], stockStatus: 'MEDIUM' },
  { id: 'nuc_camaragibe', nome: 'Camaragibe | PE - CT Pr1me – Av. Dr. Belmino Correia, nº 144, Novo do Carmelo, Camaragibe - PE', coordinates: [-8.0208, -34.9786], stockStatus: 'LOW' },
  { id: 'nuc_cpm_curitiba', nome: 'CPM | PR (Colégio da Polícia Militar) - Rua José Ferreira Pinheiro, nº 349, Bairro Portão, Curitiba - PR', coordinates: [-25.4667, -49.2889], stockStatus: 'HIGH' },
  { id: 'nuc_bairro_novo', nome: 'Bairro Novo - Rua Marcolina Caetana Chaves, nº 150, Curitiba - PR', coordinates: [-25.5532, -49.2743], stockStatus: 'MEDIUM' },
  { id: 'nuc_boa_vista', nome: 'Boa Vista - Rua Joaquim da Costa Ribeiro, nº 319, Curitiba - PR', coordinates: [-25.385, -49.2319], stockStatus: 'LOW' },
  { id: 'nuc_boqueirao', nome: 'Boqueirão - Rua Pastor Antonio Polito, nº 2200, Curitiba - PR', coordinates: [-25.5008, -49.2392], stockStatus: 'HIGH' },
  { id: 'nuc_cajuru', nome: 'Cajuru - Rua João Henrique Hoffman, nº 125, Curitiba - PR', coordinates: [-25.4611, -49.2133], stockStatus: 'MEDIUM' },
  { id: 'nuc_cic', nome: 'CIC (Cidade Industrial) - Rua Hilda Cadilhe de Oliveira, s/n, Curitiba - PR', coordinates: [-25.4925, -49.3333], stockStatus: 'LOW' },
  { id: 'nuc_oswaldo_cruz', nome: 'Oswaldo Cruz - Praça Oswaldo Cruz (Rua Brigadeiro Franco, s/n°), Curitiba - PR', coordinates: [-25.4386, -49.2783], stockStatus: 'HIGH' },
  { id: 'nuc_santa_felicidade', nome: 'Santa Felicidade - Rua Daniel Cesario Pereira, nº 681, Curitiba - PR', coordinates: [-25.4053, -49.3283], stockStatus: 'MEDIUM' },
  { id: 'nuc_tatuquara', nome: 'Tatuquara - Rua Evelázio Augusto Bley, nº 151, Curitiba - PR', coordinates: [-25.5683, -49.3242], stockStatus: 'LOW' },
  { id: 'nuc_matinhos', nome: 'Matinhos | PR - UFPR Litoral – Rua Jaguariaíva, nº 512, Matinhos - PR', coordinates: [-25.8175, -48.5428], stockStatus: 'HIGH' },
  { id: 'nuc_paranagua', nome: 'Paranaguá | PR - Complexo Olímpico Nereu Gouvêa – Rua Um, Ponta do Caju, Paranaguá - PR', coordinates: [-25.5203, -48.5092], stockStatus: 'MEDIUM' },
  { id: 'nuc_sjp', nome: 'São José dos Pinhais | PR - Centro da Juventude – Rua Leôncio Corrêa, nº 311, Roseira, S.J. Pinhais - PR', coordinates: [-25.5347, -49.2064], stockStatus: 'LOW' },
  { id: 'nuc_joinville', nome: 'Joinville | SC - Univille – Rua Paulo Malschitzki, nº 10, Joinville - SC', coordinates: [-26.3031, -48.8489], stockStatus: 'HIGH' },
  { id: 'nuc_laranjeiras', nome: 'Laranjeiras | SE - Clube Rec. Antônio Carlos Franco – Rua Propriá, 182, Centro, Laranjeiras - SE', coordinates: [-10.8061, -37.1722], stockStatus: 'MEDIUM' },
  { id: 'nuc_campinas', nome: 'Campinas | SP - Lagoa Taquaral – Av. Dr. Heitor Penteado, 1671, Campinas - SP', coordinates: [-22.8681, -47.0506], stockStatus: 'LOW' },
  { id: 'nuc_itu', nome: 'Itu | SP - C. Aquático Fiori Marcello Amantéa – Praça Washington Luiz, s/nº, Itu - SP', coordinates: [-23.2667, -47.3], stockStatus: 'HIGH' },
  { id: 'nuc_jundiai', nome: 'Jundiaí | SP - CECE Dr. Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', coordinates: [-23.1864, -46.8842], stockStatus: 'MEDIUM' },
  { id: 'nuc_ribeirao', nome: 'Ribeirão Preto | SP - Ginásio Cava do Bosque – Rua Camilo de Mattos, nº 627, Rib. Preto - SP', coordinates: [-21.1775, -47.8103], stockStatus: 'LOW' },
].map(n => ({
  ...n,
  project: 'FORMANDO_CAMPEOES' as const,
  stockDetails: generateStockDetails(n.stockStatus as any),
  address: n.nome.split(' - ')[1] || 'Endereço não cadastrado',
  phone: '(00) 3333-4444',
  email: `contato.${n.id}@esporte.gov.br`,
  employees: generateMockEmployees(n.id, n.nome)
})) as Nucleo[];

// --- NÚCLEOS DANIEL DIAS ---
const DANIEL_DIAS_NUCLEOS: Nucleo[] = [
  { id: 'dd_cic', nome: 'CEL Bairro CIC – Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4925, -49.3450], stockStatus: 'HIGH' },
  { id: 'dd_boa_vista', nome: 'CEL Boa Vista – Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.3850, -49.2319], stockStatus: 'MEDIUM' },
  { id: 'dd_boqueirao', nome: 'CEL Boqueirão – Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.5008, -49.2392], stockStatus: 'HIGH' },
  { id: 'dd_osvaldo_cruz', nome: 'CEL Osvaldo Cruz – Rua Cel. Dulcídio, 950, Centro, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4386, -49.2783], stockStatus: 'MEDIUM' },
  { id: 'dd_cajuru', nome: 'CEL Cajuru – Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4611, -49.2133], stockStatus: 'HIGH' },
  { id: 'dd_santa_felicidade', nome: 'CEL Santa Felicidade – Via Vêneto, 1431, Santa Felicidade, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4053, -49.3283], stockStatus: 'MEDIUM' },
  { id: 'dd_gente_bairro_novo', nome: 'Clube da Gente Bairro Novo – Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.5532, -49.2743], stockStatus: 'LOW' },
  { id: 'dd_gente_cic', nome: 'Clube da Gente CIC – Rua Emílio Romani, s/n, CIC, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.5100, -49.3500], stockStatus: 'HIGH' },
  { id: 'dd_valinhos_juventude', nome: 'Praça da Juventude – Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP', project: 'DANIEL_DIAS', coordinates: [-22.9708, -46.9958], stockStatus: 'MEDIUM' },
  { id: 'dd_valinhos_nardini', nome: 'Parque Monsenhor Nardini – Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP', project: 'DANIEL_DIAS', coordinates: [-22.9650, -47.0050], stockStatus: 'HIGH' },
  { id: 'dd_atibaia_ciem2', nome: 'CIEM 2 – Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP', project: 'DANIEL_DIAS', coordinates: [-23.1170, -46.5530], stockStatus: 'MEDIUM' },
  { id: 'dd_atibaia_ciem3', nome: 'CIEM 3 – Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP', project: 'DANIEL_DIAS', coordinates: [-23.1250, -46.5650], stockStatus: 'LOW' },
  { id: 'dd_atibaia_elefantao', nome: 'Piscina do Elefantão – Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP', project: 'DANIEL_DIAS', coordinates: [-23.1170, -46.5500], stockStatus: 'HIGH' },
  { id: 'dd_ponta_grossa_arena', nome: 'Arena Multiuso – Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR', project: 'DANIEL_DIAS', coordinates: [-25.0950, -50.1619], stockStatus: 'MEDIUM' },
  { id: 'dd_ponta_grossa_cecon', nome: 'CECON (Idoso) – Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR', project: 'DANIEL_DIAS', coordinates: [-25.0900, -50.1700], stockStatus: 'LOW' },
  { id: 'dd_hortolandia', nome: 'Complexo Nelson Cancian – Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP', project: 'DANIEL_DIAS', coordinates: [-22.8600, -47.2200], stockStatus: 'HIGH' },
  { id: 'dd_jundiai', nome: 'CECE Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', project: 'DANIEL_DIAS', coordinates: [-23.1864, -46.8842], stockStatus: 'MEDIUM' },
  { id: 'dd_limeira', nome: 'Piscina Alberto Savoi – Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP', project: 'DANIEL_DIAS', coordinates: [-22.5650, -47.4017], stockStatus: 'LOW' },
  { id: 'dd_extrema', nome: 'Parque de Eventos – Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG', project: 'DANIEL_DIAS', coordinates: [-22.8550, -46.3178], stockStatus: 'HIGH' },
  { id: 'dd_pindoretama', nome: 'Ginásio Poliesportivo – Centro da Cidade, Pindoretama - CE', project: 'DANIEL_DIAS', coordinates: [-4.0142, -38.3050], stockStatus: 'MEDIUM' },
  { id: 'dd_pacajus', nome: 'Estádio/Ginásio Municipal – Rua Tabelião José de Lima, s/n, Pacajus - CE', project: 'DANIEL_DIAS', coordinates: [-4.1722, -38.4617], stockStatus: 'LOW' },
  { id: 'dd_canaa', nome: 'Polo de Natação Municipal – Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA', project: 'DANIEL_DIAS', coordinates: [-6.4967, -49.8783], stockStatus: 'HIGH' },
  { id: 'dd_belo_jardim', nome: 'SESC Belo Jardim (Parceria) – Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE', project: 'DANIEL_DIAS', coordinates: [-8.3361, -36.4244], stockStatus: 'MEDIUM' },
].map(n => ({
  ...n,
  stockDetails: generateStockDetails(n.stockStatus as any),
  address: n.nome.split('–')[1]?.trim() || 'Endereço não cadastrado',
  phone: '(00) 3333-4444',
  email: `contato.${n.id}@danieldias.org.br`,
  employees: generateMockEmployees(n.id, n.nome)
})) as Nucleo[];

const ALL_NUCLEOS = [...MOCK_NUCLEOS, ...DANIEL_DIAS_NUCLEOS];

const MOCK_USER: User = {
  uid: 'usr_123456',
  nome: 'Carlos Ferreira',
  email: 'carlos.ed@esporte.gov.br',
  role: 'PROFESSOR',
  nucleo_id: null,
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'item_1', name: 'Kit Lanche Padrão', quantity: 50, initialQuantity: 50, unit: 'Kit', minThreshold: 5, category: 'ALIMENTACAO' },
  { id: 'item_2', name: 'Camiseta Projeto', quantity: 15, initialQuantity: 20, unit: 'Unid.', minThreshold: 2, category: 'VESTUARIO' }
];

const AppContent: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [students, setStudents] = useState<StudentDraft[]>(() => {
    const saved = localStorage.getItem('students_v2');
    if (saved) {
      const parsed = JSON.parse(saved) as StudentDraft[];
      // Garante que todos os alunos tenham um id e um status padrão
      return parsed.map(s => ({
        ...s,
        id: s.id || `std_${Math.random().toString(36).substr(2, 9)}`,
        status: s.status || 'ATIVO'
      }));
    }
    return [
      {
        id: 'std_001',
        nome: 'João Silva Oliveira',
        data_nascimento: '2010-05-15',
        rg_cpf: '123.456.789-00',
        nome_responsavel: 'Maria Silva',
        endereco: 'Rua das Flores, 123, Bairro Centro, São Paulo - SP',
        telefone: '(11) 98765-4321',
        email_contato: 'maria.silva@email.com',
        escola_nome: 'Escola Estadual Monteiro Lobato',
        escola_tipo: 'PUBLICA',
        n_sli: 'SLI-2023-0001',
        nome_projeto: 'Formando Campeões',
        proponente: 'Instituto Vida Ativa',
        nome_responsavel_organizacao: 'Carlos Eduardo',
        nucleo_id: 'nuc_ilheus',
        timestamp: new Date().toISOString()
      },
      {
        id: 'std_002',
        nome: 'Ana Clara Souza',
        data_nascimento: '2011-08-22',
        rg_cpf: '987.654.321-11',
        nome_responsavel: 'Fernanda Souza',
        endereco: 'Av. Brasil, 456, Bairro Novo, Rio de Janeiro - RJ',
        telefone: '(21) 99999-8888',
        email_contato: 'fernanda.souza@email.com',
        escola_nome: 'Colégio Santa Cruz',
        escola_tipo: 'PARTICULAR',
        n_sli: 'SLI-2023-0002',
        nome_projeto: 'Formando Campeões',
        proponente: 'Instituto Vida Ativa',
        nome_responsavel_organizacao: 'Carlos Eduardo',
        nucleo_id: 'nuc_ilheus', // Same logic
        timestamp: new Date().toISOString()
      },
      {
        id: 'std_003',
        nome: 'Pedro Henrique Martins',
        data_nascimento: '2012-01-10',
        rg_cpf: '456.789.123-22',
        nome_responsavel: 'Ricardo Martins',
        endereco: 'Praça da Matriz, S/N, Centro, Fortaleza - CE',
        telefone: '(85) 97777-6666',
        email_contato: 'ricardo.martins@email.com',
        escola_nome: 'EMEF Paulo Freire',
        escola_tipo: 'PUBLICA',
        n_sli: 'SLI-2023-0003',
        nome_projeto: 'Formando Campeões',
        proponente: 'Instituto Vida Ativa',
        nome_responsavel_organizacao: 'Carlos Eduardo',
        nucleo_id: 'nuc_joinville',
        timestamp: new Date().toISOString()
      }
    ];
  });
  const [preCadastros, setPreCadastros] = useState<PreCadastroData[]>(() => {
    const saved = localStorage.getItem('preCadastros');
    if (saved) return JSON.parse(saved);
    return MOCK_PRE_CADASTRO;
  }); // Fila de espera
  const [nucleos, setNucleos] = useState<Nucleo[]>(ALL_NUCLEOS);
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectId>('FORMANDO_CAMPEOES');

  // --- PROJECT-SCOPED DATA ---
  const filteredNucleos = useMemo(() => nucleos.filter(n => n.project === activeProject), [nucleos, activeProject]);
  const projectStudents = useMemo(() => students.filter(s => !s.projectId || s.projectId === activeProject), [students, activeProject]);
  const projectPreCadastros = useMemo(() => preCadastros.filter(p => !p.projectId || p.projectId === activeProject), [preCadastros, activeProject]);

  // Navigation Params
  const [navParams, setNavParams] = useState<any>({});

  // Data State
  const [collectedEvidence, setCollectedEvidence] = useState<EvidenceLog[]>([]);

  // Initialize with some mock BOLETIM data to demonstrate the history view
  const [collectedDocuments, setCollectedDocuments] = useState<DocumentLog[]>(() => {
    const savedDocs = localStorage.getItem('collectedDocuments');
    if (savedDocs) return JSON.parse(savedDocs);
    return [
      {
        id: 'mock_bol_1',
        timestamp: new Date().toISOString(),
        type: 'BOLETIM',
        title: 'Boletim Upload Externo - João Silva (Mock)',
        fileUrl: '#',
        description: 'Envio via link público',
        metaData: {
          studentName: 'João Silva Oliveira',
          grade1: 8.5,
          attendance1: 95,
          grade2: 9.0,
          attendance2: 98,
          periodType: 'PARCIAL',
          status: 'MELHORA'
        }
      },
      {
        id: 'mock_bol_2',
        timestamp: new Date().toISOString(),
        type: 'BOLETIM',
        title: 'Lote Interno - Ana Souza (Mock)',
        fileUrl: '#',
        description: 'Processamento Lote Interno',
        metaData: {
          reports: [{
            id: 'rpt_1',
            fileName: 'Lote Interno',
            studentName: 'Ana Clara Souza',
            grade1: 7.0,
            attendance1: 85,
            grade2: 6.5,
            attendance2: 80,
            periodType: 'FINAL',
            status: 'PIORA'
          }]
        }
      },
      {
        id: 'mock_ocorrencia_1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'OCORRENCIA_DISCIPLINAR',
        title: 'Ocorrência - Brigou na quadra',
        fileUrl: '#',
        description: 'Registro do Professor',
        metaData: {
          studentName: 'João Silva Oliveira'
        }
      },
      {
        id: 'mock_social_1',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        type: 'RELATORIO_SOCIAL',
        title: 'Relatório Social',
        fileUrl: '#',
        description: 'Atendimento',
        metaData: {
          studentName: 'João Silva Oliveira',
          reportText: 'O aluno relatou problemas em casa, estamos acompanhando. Agendada reunião com os responsáveis na próxima quarta.'
        }
      }
    ];
  });

  // Force inject cohesive mock suite if missing from localStorage
  useEffect(() => {
    // 1. Inject Students
    setStudents(prev => {
      let needsUpdate = false;
      const updated = [...prev];
      const SIG = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M10 40 C30 10, 50 55, 80 30 C100 15, 120 50, 160 35 C175 28, 185 38, 195 32" stroke="black" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`);
      const SIG2 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M8 45 Q40 5 70 38 Q100 60 130 25 Q155 8 195 30" stroke="black" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`);
      const SIG3 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M5 35 L25 15 L45 45 L65 20 L85 42 L110 18 L135 38 L160 22 L185 36" stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
      const mocks = [
        { id: 'std_001', nome: 'Lucas Almeida Santos', data_nascimento: '2010-05-14', rg_cpf: '11.222.333-4', nome_responsavel: 'Maria Almeida Santos', endereco: 'Rua das Flores, 12, Joaquim Romão, Ilhéus - BA, 45600-000', telefone: '(73) 99999-1111', email_contato: 'maria.almeida@email.com', escola_nome: 'Escola Estadual Carlos Marighella', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,0,10).toISOString(), status: 'ATIVO', data_assinatura: '10/01/2024', assinatura: SIG, reportType: 'REPORT_7', declaracao_uniformes: { itens_recebidos: ['Camiseta', 'Shorts', 'Touca'], assinatura: SIG, data_assinatura: '10/01/2024', nome_responsavel: 'Maria Almeida Santos', cpf_responsavel: '111.222.333-44' } as any },
        { id: 'std_002', nome: 'Ana Beatriz Oliveira', data_nascimento: '2011-08-22', rg_cpf: '22.333.444-5', nome_responsavel: 'Fernanda Oliveira', endereco: 'Av. Soares Lopes, 350, Centro, Ilhéus - BA, 45650-000', telefone: '(73) 98888-2222', email_contato: 'fernanda.oliveira@email.com', escola_nome: 'Colégio Batista de Ilhéus', escola_tipo: 'PARTICULAR', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,0,12).toISOString(), status: 'ATIVO', data_assinatura: '12/01/2024', assinatura: SIG2, reportType: 'REPORT_7', declaracao_uniformes: { itens_recebidos: ['Camiseta', 'Shorts', 'Óculos'], assinatura: SIG2, data_assinatura: '12/01/2024', nome_responsavel: 'Fernanda Oliveira', cpf_responsavel: '222.333.444-55' } as any },
        { id: 'std_003', nome: 'Pedro Henrique Costa', data_nascimento: '2012-03-07', rg_cpf: '33.444.555-6', nome_responsavel: 'Ricardo Costa', endereco: 'Rua Jorge Amado, 88, Pontal, Ilhéus - BA, 45654-000', telefone: '(73) 97777-3333', email_contato: 'ricardo.costa@email.com', escola_nome: 'EMEF Padre Casimiro Bekx', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,0,15).toISOString(), status: 'ATIVO', data_assinatura: '15/01/2024', assinatura: SIG3, reportType: 'REPORT_7' },
        { id: 'std_004', nome: 'Camila Ferreira Bahia', data_nascimento: '2010-11-30', rg_cpf: '44.555.666-7', nome_responsavel: 'Juliana Ferreira', endereco: 'Rua Governador Mário Pessoa, 210, São Domingos, Ilhéus - BA, 45655-000', telefone: '(73) 96666-4444', email_contato: 'juliana.ferreira@email.com', escola_nome: 'Escola Estadual Rotary', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,1,5).toISOString(), status: 'ATIVO', data_assinatura: '05/02/2024', assinatura: SIG, reportType: 'REPORT_7', declaracao_uniformes: { itens_recebidos: ['Camiseta', 'Touca', 'Squeeze'], assinatura: SIG, data_assinatura: '05/02/2024', nome_responsavel: 'Juliana Ferreira', cpf_responsavel: '444.555.666-77' } as any },
        { id: 'std_005', nome: 'Rafael Torres Neto', data_nascimento: '2013-06-18', rg_cpf: '55.666.777-8', nome_responsavel: 'Paulo Torres', endereco: 'Av. Conquistadores, 450, Salobrinho, Ilhéus - BA, 45658-000', telefone: '(73) 95555-5555', email_contato: 'paulo.torres@email.com', escola_nome: 'EMEF Urbano Portela Melo', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,1,8).toISOString(), status: 'ATIVO', data_assinatura: '08/02/2024', assinatura: SIG2, reportType: 'REPORT_7' },
        { id: 'std_006', nome: 'Isabela Nascimento Lima', data_nascimento: '2011-12-25', rg_cpf: '66.777.888-9', nome_responsavel: 'Cláudia Nascimento', endereco: 'Rua Theodomiro Sarro, 31, Malhado, Ilhéus - BA, 45652-000', telefone: '(73) 94444-6666', email_contato: 'claudia.nasc@email.com', escola_nome: 'Colégio Maria Auxiliadora', escola_tipo: 'PARTICULAR', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,2,1).toISOString(), status: 'ATIVO', data_assinatura: '01/03/2024', assinatura: SIG3, reportType: 'REPORT_7', declaracao_uniformes: { itens_recebidos: ['Camiseta', 'Shorts'], assinatura: SIG3, data_assinatura: '01/03/2024', nome_responsavel: 'Cláudia Nascimento', cpf_responsavel: '666.777.888-99' } as any },
        { id: 'std_007', nome: 'Gabriel Souza Araujo', data_nascimento: '2012-09-04', rg_cpf: '77.888.999-0', nome_responsavel: 'Marcos Souza', endereco: 'Rua Barão do Rio Branco, 75, Unhão da Vitória, Ilhéus - BA, 45651-000', telefone: '(73) 93333-7777', email_contato: 'marcos.souza@email.com', escola_nome: 'Escola Estadual Dom Pedro II', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,2,10).toISOString(), status: 'ATIVO', data_assinatura: '10/03/2024', assinatura: SIG, reportType: 'REPORT_7' },
        { id: 'std_008', nome: 'Larissa Pereira Matos', data_nascimento: '2010-02-14', rg_cpf: '88.999.000-1', nome_responsavel: 'Sandra Pereira', endereco: 'Rua XV de Novembro, 200, Centro, Ilhéus - BA, 45650-000', telefone: '(73) 92222-8888', email_contato: 'sandra.pereira@email.com', escola_nome: 'EMEF Glauco de Mattos Ramos', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,3,2).toISOString(), status: 'ATIVO', data_assinatura: '02/04/2024', assinatura: SIG2, reportType: 'REPORT_7', declaracao_uniformes: { itens_recebidos: ['Camiseta', 'Shorts', 'Touca', 'Óculos'], assinatura: SIG2, data_assinatura: '02/04/2024', nome_responsavel: 'Sandra Pereira', cpf_responsavel: '888.999.000-11' } as any },
        { id: 'std_009', nome: 'Diego Campos Ribeiro', data_nascimento: '2013-07-19', rg_cpf: '99.000.111-2', nome_responsavel: 'Adriana Campos', endereco: 'Av. Antônio Carlos Magalhães, 580, Ilhéus - BA, 45650-000', telefone: '(73) 91111-9999', email_contato: 'adriana.campos@email.com', escola_nome: 'Escola Estadual Luiz Régis Pacheco', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,3,15).toISOString(), status: 'ATIVO', data_assinatura: '15/04/2024', assinatura: SIG3, reportType: 'REPORT_7' },
        { id: 'std_010', nome: 'Vitória Helena Ramos', data_nascimento: '2011-04-03', rg_cpf: '10.111.222-3', nome_responsavel: 'Roberto Ramos', endereco: 'Rua Eustáquio Bastos, 43, Banco da Vitória, Ilhéus - BA, 45653-000', telefone: '(73) 90000-0001', email_contato: 'roberto.ramos@email.com', escola_nome: 'EMEF Olímpio Rebelo Mangabeira', escola_tipo: 'PUBLICA', n_sli: '2201254', nome_projeto: 'Escolinha de Triathlon', proponente: 'Associação de Pais e Amigos da Natação Ituana', nome_responsavel_organizacao: 'Carlos Eduardo Pereira', nucleo_id: 'nuc_ilheus', timestamp: new Date(2024,4,1).toISOString(), status: 'ATIVO', data_assinatura: '01/05/2024', assinatura: SIG, reportType: 'REPORT_7', declaracao_uniformes: { itens_recebidos: ['Camiseta', 'Shorts', 'Squeeze'], assinatura: SIG, data_assinatura: '01/05/2024', nome_responsavel: 'Roberto Ramos', cpf_responsavel: '100.111.222-33' } as any },
      ];
      mocks.forEach(m => {
        if (!updated.some(s => s.id === m.id)) { updated.push(m as any); needsUpdate = true; }
      });
      return needsUpdate ? updated : prev;
    });

    // 2. Inject PreCadastros
    setPreCadastros(prev => {
      let needsUpdate = false;
      const updated = [...prev];
      MOCK_PRE_CADASTRO.forEach(m => {
        if (!updated.some(p => p.id === m.id)) { updated.push(m); needsUpdate = true; }
      });
      return needsUpdate ? updated : prev;
    });

    // 3. Inject Documents (Serviço Social Alerts & History)
    setCollectedDocuments(prev => {
      let needsUpdate = false;
      const updated = [...prev];
      if (!updated.some(d => d.id === 'mock_ocorrencia_1')) {
        updated.push({
          id: 'mock_ocorrencia_1',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          type: 'OCORRENCIA_DISCIPLINAR',
          title: 'Ocorrência - Brigou na quadra',
          fileUrl: '#',
          description: 'Registro do Professor',
          metaData: { studentName: 'João Silva Oliveira' }
        });
        needsUpdate = true;
      }
      if (!updated.some(d => d.id === 'mock_social_1')) {
        updated.push({
          id: 'mock_social_1',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          type: 'RELATORIO_SOCIAL',
          title: 'Relatório Social',
          fileUrl: '#',
          description: 'Atendimento',
          metaData: {
            studentName: 'João Silva Oliveira',
            text: 'O aluno relatou problemas em casa, estamos acompanhando. Agendada reunião com os responsáveis na próxima quarta.'
          }
        });
        needsUpdate = true;
      }
      return needsUpdate ? updated : prev;
    });
  }, []);

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  // --- PROJECT-SCOPED DOCUMENTS / EVIDENCE / INVENTORY ---
  const projectDocuments = useMemo(() => collectedDocuments.filter(d => !d.projectId || d.projectId === activeProject), [collectedDocuments, activeProject]);
  const projectEvidence = useMemo(() => collectedEvidence.filter(e => !e.projectId || e.projectId === activeProject), [collectedEvidence, activeProject]);

  // --- PROJECT ASSETS HELPER ---
  const projectAssets = useMemo(() => ({
    logo: activeProject === 'DANIEL_DIAS' ? '/logo_Daniel_Dias.png' : '/logo.png',
    header: activeProject === 'DANIEL_DIAS' ? '/Banner_Relatorio_Daniel.png' : '/header_full.png',
    name: activeProject === 'DANIEL_DIAS' ? 'Nadando com Daniel Dias' : 'Formando Campeões',
  }), [activeProject]);

  const [loginNucleoId, setLoginNucleoId] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('professor@teste.com');
  const [loginPassword, setLoginPassword] = useState<string>('123456');

  // Persist and Sync Students
  useEffect(() => {
    localStorage.setItem('students_v2', JSON.stringify(students));
  }, [students]);

  // Persist and Sync PreCadastros across tabs
  useEffect(() => {
    localStorage.setItem('preCadastros', JSON.stringify(preCadastros));
  }, [preCadastros]);

  // Persist and Sync Documents across tabs (Crucial for external uploads)
  useEffect(() => {
    const savedDocs = localStorage.getItem('collectedDocuments');
    if (savedDocs && collectedDocuments.length === 0) {
      setCollectedDocuments(JSON.parse(savedDocs));
    } else if (collectedDocuments.length > 0) {
      localStorage.setItem('collectedDocuments', JSON.stringify(collectedDocuments));
    }
  }, [collectedDocuments]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'preCadastros' && e.newValue) {
        setPreCadastros(JSON.parse(e.newValue));
      }
      if (e.key === 'collectedDocuments' && e.newValue) {
        setCollectedDocuments(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Efeito para tratar Link Externo (Pai) - Captura de Hash e Query de forma robusta
  useEffect(() => {
    const handleRouting = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashContent = window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashContent);

      const token = searchParams.get('token') || hashParams.get('token');
      const service = searchParams.get('service') || hashParams.get('service');
      const studentId = searchParams.get('studentId') || hashParams.get('studentId');

      if (token && service) {
        console.log("Rota pública detectada:", { token, service, studentId });
        setView(AppView.PUBLIC_FORM);
        setNavParams({ token, service, studentId });
      }
    };

    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('popstate', handleRouting);
    return () => {
      window.removeEventListener('hashchange', handleRouting);
      window.removeEventListener('popstate', handleRouting);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNucleoId) {
      alert("Por favor, identifique o seu Núcleo de atuação.");
      return;
    }
    if (!loginEmail || !loginPassword) {
      alert("Por favor, preencha o e-mail e senha.");
      return;
    }

    let role = 'PROFESSOR';
    if (loginEmail === 'admin@teste.com' && loginPassword === '123456') {
      role = 'ADMIN';
    } else if (loginEmail === 'professor@teste.com' && loginPassword === '123456') {
      role = 'PROFESSOR';
    } else {
      alert("Credenciais inválidas. Use professor@teste.com ou admin@teste.com com a senha 123456 para testar.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const selectedNucleoObj = nucleos.find(n => n.id === loginNucleoId);
      setUser({
        ...MOCK_USER,
        email: loginEmail,
        role: role as any,
        nucleo_id: loginNucleoId,
        nucleo_nome: selectedNucleoObj?.nome,
        projectId: activeProject
      });

      // REDIRECT LOGIC BASED ON ROLE
      if (selectedNucleoObj && loginNucleoId) {
        if (role === 'ADMIN') {
          setView(AppView.ADMIN_DASHBOARD);
        } else {
          setView(AppView.DASHBOARD);
        }
      }
      setLoading(false);
    }, 800);
  };

  const handleDemoAccess = () => {
    const demoNucleo = filteredNucleos[0] || nucleos[0];
    setUser({
      uid: 'demo_user',
      nome: 'Administrador Demo',
      email: 'admin@demo.com',
      role: 'ADMIN', // Set as ADMIN
      nucleo_id: demoNucleo.id,
      nucleo_nome: demoNucleo.nome,
      projectId: activeProject
    });
    setView(AppView.ADMIN_DASHBOARD); // Direct to Admin Dashboard
  };

  const handleLogout = () => {
    setUser(null);
    setLoginNucleoId('');
    setStudents([]);
    setCollectedEvidence([]);
    setCollectedDocuments([]);
    setInventory(INITIAL_INVENTORY);
    setNavParams({});
    setView(AppView.LOGIN);
  };

  const navigateTo = (view: AppView, params?: any) => {
    if (params) setNavParams(params);
    setView(view);
  };

  // --- Data Handlers ---
  const handleSaveStudent = (data: StudentDraft) => {
    setStudents(prev => {
      const existingIndex = prev.findIndex(s => s.id === data.id);
      if (existingIndex >= 0) {
        const updatedStudents = [...prev];
        updatedStudents[existingIndex] = {
          ...data,
          timestamp: new Date().toISOString()
        };
        return updatedStudents;
      }
      
      const newStudent: StudentDraft = {
        ...data,
        id: data.id || `std_${Math.random().toString(36).substr(2, 9)}`,
        status: data.status || 'ATIVO',
        timestamp: new Date().toISOString()
      };
      return [...prev, newStudent];
    });
  };

  const handleSaveEvidence = (data: EvidenceLog) => {
    setCollectedEvidence(prev => [...prev, data]);
  };

  const handleSaveDocument = (data: DocumentLog) => {
    // LÓGICA DE BAIXA DE ESTOQUE AUTOMÁTICA
    if (data.type === 'LISTA_FREQUENCIA' && data.metaData?.inventoryDeduction) {
      const { itemId, amount } = data.metaData.inventoryDeduction;
      setInventory(prev => prev.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(0, item.quantity - amount);
          return { ...item, quantity: newQty };
        }
        return item;
      }));
      alert(`Estoque atualizado: -${amount} unidades.`);
    }

    setCollectedDocuments(prev => [...prev, data]);
  };

  const handleUpdateInventory = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleAddItemToInventory = (newItem: InventoryItem) => {
    setInventory(prev => [...prev, newItem]);
  };

  // --- Register State ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'PROFESSOR' | 'ADMIN'>('PROFESSOR');
  const [regNucleo, setRegNucleo] = useState('');

  const handleDischargeStudent = (studentId: string, nucleoId: string) => {
    // 1. Remove student
    setStudents(prev => prev.filter(s => s.id !== studentId));

    // 2. Auto-notification for waiting list
    const candidate = preCadastros.find(c => c.nucleo_id === nucleoId && c.status === 'AGUARDANDO');
    if (candidate) {
      alert(`✅ BAIXA REALIZADA com sucesso.\n\n🔔 NOTIFICAÇÃO AUTOMÁTICA:\nO candidato "${candidate.nome_aluno}" da Fila de Espera do núcleo sugerido foi notificado via E-mail/WhatsApp sobre a disponibilidade desta vaga.`);
      setPreCadastros(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'APROVADO' } : c));
    } else {
      alert(`✅ BAIXA REALIZADA com sucesso.\n\nℹ️ Não há nenhum candidato na Fila de Espera aguardando para este núcleo no momento.`);
    }
  };

  const handleInactivateStudent = (studentIdOrNome: string, checklist: { id: string; name: string; returned: boolean }[], replacementCandidateId?: string, replacementName?: string) => {
    const hasPending = checklist.some(c => !c.returned);

    // Find the old student's name to use for renaming attendance records
    let oldStudentName: string | undefined;
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
          oldStudentName = s.nome;
          return {
            ...s,
            status: 'INATIVO' as const,
            materiais_pendentes: hasPending,
            materiais_checklist: checklist
          };
        }
        return s;
      });
      return updated;
    });

    // Transfer attendance records to the replacement student
    if (replacementCandidateId && replacementName) {
      // Wait for the students state update to resolve the oldStudentName
      // We find the name directly from the current list
      const targetStudent = students.find(s => s.id === studentIdOrNome || s.nome === studentIdOrNome);
      const nameToReplace = targetStudent?.nome || studentIdOrNome;

      setCollectedDocuments(prev => prev.map(doc => {
        if (doc.type === 'LISTA_FREQUENCIA' && doc.metaData?.present && Array.isArray(doc.metaData.present)) {
          const updatedPresent = doc.metaData.present.map((name: string) =>
            name === nameToReplace ? replacementName : name
          );
          return { ...doc, metaData: { ...doc.metaData, present: updatedPresent } };
        }
        return doc;
      }));

      // Mark replacement candidate as APPROVED in the waiting list
      setPreCadastros(prev => prev.map(c =>
        c.id === replacementCandidateId ? { ...c, status: 'APROVADO' } : c
      ));

      alert(`✅ BAIXA REALIZADA\n\n🔄 TRANSFER\u00caNCIA DE FREQU\u00caNCIA:\nTodas as presen\u00e7as de "${nameToReplace}" foram transferidas para "${replacementName}".\n\n🔔 O candidato foi notificado da vaga.`);
    }
  };


  const handleReactivateStudent = (studentIdOrNome: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return {
          ...s,
          status: 'ATIVO'
        };
      }
      return s;
    }));
  };

  const handleSaveDeclaracao = (studentIdOrNome: string, declaracao: import('./types').DeclaracaoUniformes) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, declaracao_uniformes: declaracao };
      }
      return s;
    }));
  };

  const handleSaveDeclaracaoProntidao = (studentIdOrNome: string, declaracao: import('./types').DeclaracaoProntidao) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, declaracao_prontidao: declaracao };
      }
      return s;
    }));
  };

  // --- RENDER LOGIC ---

  if (view === AppView.PUBLIC_FORM) {
    return (
      <PublicFormView
        serviceId={navParams.service}
        studentId={navParams.studentId}
        onSave={(data) => {
          if (navParams.service === 'ficha') handleSaveStudent(data);
          if (navParams.service === 'meta') handleSaveDocument(data);
          if (navParams.service === 'socio') handleSaveDocument(data);
          if (navParams.service === 'boletim') handleSaveDocument(data);
          if (navParams.service === 'declaracao') {
            // A assinatura já foi salva diretamente no localStorage pelo PublicFormView
            // Aqui apenas sincronizamos com o estado React
            const sId = navParams.studentId;
            if (sId && data?.declaracao) {
              setStudents(prev => prev.map(s =>
                (s.id === sId || s.nome === sId)
                  ? { ...s, declaracao_uniformes: data.declaracao }
                  : s
              ));
            }
          }
          if (navParams.service === 'precadastro') {
            setPreCadastros(prev => [...prev, data]);
          }
        }}
      />
    );
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regNucleo) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Simulação de Cadastro
      const selectedNucleoObj = nucleos.find(n => n.id === regNucleo);
      setUser({
        uid: `usr_${Date.now()}`,
        nome: regName,
        email: regEmail,
        role: regRole,
        nucleo_id: regNucleo,
        nucleo_nome: selectedNucleoObj?.nome,
        projectId: activeProject
      });
      setView(AppView.DASHBOARD);
      setLoading(false);
      alert(`Cadastro realizado com sucesso! Bem-vindo(a), ${regName}.`);
    }, 1500);
  };

  if (view === AppView.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-2 sm:p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">

          <div className="p-6 sm:p-8">
            {/* Logo Carousel - Seletor de Projeto */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-full flex items-center justify-center gap-3 mb-2">
                <button
                  onClick={() => { setActiveProject('FORMANDO_CAMPEOES'); setLoginNucleoId(''); setRegNucleo(''); }}
                  className={`p-1.5 rounded-full transition-all ${activeProject === 'FORMANDO_CAMPEOES' ? 'opacity-30 cursor-default' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                  disabled={activeProject === 'FORMANDO_CAMPEOES'}
                  title="Projeto anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="relative w-[200px] h-[160px] flex items-center justify-center overflow-hidden">
                  <img
                    key={activeProject}
                    src={projectAssets.logo}
                    alt={projectAssets.name}
                    className="max-w-[200px] max-h-[160px] w-auto h-auto object-contain animate-fade-in"
                  />
                </div>
                <button
                  onClick={() => { setActiveProject('DANIEL_DIAS'); setLoginNucleoId(''); setRegNucleo(''); }}
                  className={`p-1.5 rounded-full transition-all ${activeProject === 'DANIEL_DIAS' ? 'opacity-30 cursor-default' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
                  disabled={activeProject === 'DANIEL_DIAS'}
                  title="Próximo projeto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              {/* Indicadores */}
              <div className="flex gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full transition-all ${activeProject === 'FORMANDO_CAMPEOES' ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`} />
                <span className={`w-2 h-2 rounded-full transition-all ${activeProject === 'DANIEL_DIAS' ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Gestão de Núcleo</h2>
              <p className="text-gray-500 mt-1 font-medium text-sm">{projectAssets.name}</p>
            </div>

            {/* Toggle Login/Cadastro */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4 relative">
              <button
                onClick={() => setIsRegistering(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all z-10 ${!isRegistering ? 'text-white bg-gradient-to-r from-blue-600 to-teal-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all z-10 ${isRegistering ? 'text-white bg-gradient-to-r from-blue-600 to-teal-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Cadastrar
              </button>
            </div>

            {/* Formulários com Transição */}
            <div className="relative">
              {!isRegistering ? (
                // --- LOGIN FORM ---
                <form onSubmit={handleLogin} className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Núcleo de Atuação</label>
                    <div className="relative">
                      <select
                        value={loginNucleoId}
                        onChange={(e) => setLoginNucleoId(e.target.value)}
                        className="block w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2.5 px-3 pr-8 rounded-xl text-sm leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="">Selecione seu núcleo...</option>
                        {filteredNucleos.map(nucleo => (
                          <option key={nucleo.id} value={nucleo.id}>{nucleo.nome}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">E-mail</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="professor@teste.com"
                      className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Senha</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="123456"
                      className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-teal-600 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2">
                    {loading ? 'Acessando...' : 'Entrar no Sistema'}
                  </button>
                </form>
              ) : (
                // --- REGISTER FORM ---
                <form onSubmit={handleRegister} className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Perfil</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as 'PROFESSOR' | 'ADMIN')}
                        className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-[10px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="PROFESSOR">Professor</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Núcleo</label>
                      <select
                        value={regNucleo}
                        onChange={(e) => setRegNucleo(e.target.value)}
                        className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-[10px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="">Selecione...</option>
                        {filteredNucleos.map(n => <option key={n.id} value={n.id}>{n.nome.split('-')[0]}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Nome Completo</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">E-mail</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="Ex: joao@esporte.gov.br"
                      className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Senha</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-teal-600 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2">
                    {loading ? 'Cadastrando...' : 'Criar Conta'}
                  </button>
                </form>
              )}
            </div>

            {!isRegistering && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button onClick={handleDemoAccess} className="text-gray-400 font-bold text-[10px] uppercase tracking-wider hover:text-blue-600 transition-colors">
                  Acesso Administrador/Demo
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  if (view === AppView.PDF_BUILDER_VIEW) {
    return <PDFBuilderPreview onBack={() => setView(AppView.DEV_ENVIRONMENT)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {user && view !== AppView.REPORT && view !== AppView.DEV_ENVIRONMENT && view !== AppView.ADMIN_DASHBOARD && view !== AppView.FREQUENCY_REPORT && view !== AppView.PDLIE_REPORT && <Header user={user} onLogout={handleLogout} />}

      <main className={(view === AppView.REPORT || view === AppView.DEV_ENVIRONMENT || view === AppView.FREQUENCY_REPORT || view === AppView.PDLIE_REPORT) ? "" : (view === AppView.ADMIN_DASHBOARD ? "h-screen" : "py-6 print:py-0 print:m-0")}>
        {user && (
          <PDFBuilderSidebar onOpenPreview={() => setView(AppView.PDF_BUILDER_VIEW)} />
        )}

        {view === AppView.ADMIN_DASHBOARD && user && (
          <AdminDashboard
            nucleos={nucleos}
            onNavigateToServices={() => setView(AppView.DASHBOARD)}
            userParams={{ nome: user.nome, email: user.email }}
            onLogout={handleLogout}
            students={students}
            documents={collectedDocuments}
            onAddNucleo={(newNucleo) => setNucleos([...nucleos, newNucleo])}
            onDischargeStudent={handleDischargeStudent}
          />
        )}

        {view === AppView.DASHBOARD && (
          <Dashboard
            onNavigate={navigateTo}
            itemsCount={students.length + collectedEvidence.length + collectedDocuments.length}
            onBack={user?.role === 'ADMIN' ? () => setView(AppView.ADMIN_DASHBOARD) : undefined}
          />
        )}

        {view === AppView.FEATURE_PRE_CADASTRO && (
          <PreCadastroDashboard
            candidates={preCadastros}
            nucleos={nucleos}
            students={students}
            onAddCandidate={(data) => setPreCadastros(prev => [...prev, data])}
            onUpdateCandidate={(id, updates) => setPreCadastros(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))}
            onDeleteCandidate={(id) => setPreCadastros(prev => prev.filter(c => c.id !== id))}
            onBack={() => setView(AppView.DASHBOARD)}
            onOpenPublicForm={() => {
              window.open(window.location.origin + window.location.pathname + '?service=precadastro&token=admin_preview', '_blank');
            }}
          />
        )}

        {view === AppView.FEATURE_OCR && (
          <CameraOCR
            onBack={() => setView(AppView.DASHBOARD)}
            savedStudents={students}
            onSave={handleSaveStudent}
            nucleoId={user?.nucleo_id || undefined}
            onInactivateStudent={handleInactivateStudent}
            onReactivateStudent={handleReactivateStudent}
            collectedDocuments={collectedDocuments}
            onSaveDeclaracao={handleSaveDeclaracao}
            onSaveDeclaracaoProntidao={handleSaveDeclaracaoProntidao}
            baseUrl={window.location.origin + window.location.pathname}
            preCadastros={preCadastros}
          />
        )}

        {view === AppView.FEATURE_DOC_UPLOAD && (
          <DocumentUpload
            docType={navParams.type as DocumentType}
            title={navParams.title || 'Documento'}
            students={students.filter(s => s.status !== 'INATIVO')}
            history={collectedDocuments}
            inventory={inventory}
            nucleos={nucleos}
            currentNucleoId={user?.nucleo_id || undefined}
            onBack={() => setView(AppView.DASHBOARD)}
            onSave={(data) => {
              handleSaveDocument(data);
              setView(AppView.DASHBOARD);
            }}
            onUpdateHistory={setCollectedDocuments}
          />
        )}

        {view === AppView.FEATURE_SERVICO_SOCIAL && (
          <ServicoSocialDashboard
            students={students}
            history={collectedDocuments}
            nucleos={nucleos}
            onBack={() => setView(AppView.DASHBOARD)}
            onUpdateHistory={setCollectedDocuments}
          />
        )}

        {view === AppView.FEATURE_CROSS_REFERENCE && (
          <CrossReferenceView
            students={students}
            history={collectedDocuments}
            nucleos={nucleos}
            currentNucleoId={user?.nucleo_id || undefined}
            onBack={() => setView(AppView.DASHBOARD)}
          />
        )}

        {view === AppView.FEATURE_INVENTORY && (
          <InventoryControl
            onBack={() => setView(AppView.DASHBOARD)}
            inventory={inventory}
            history={collectedDocuments} // Passando Histórico
            onUpdateInventory={handleUpdateInventory}
            onAddItem={handleAddItemToInventory}
          />
        )}

        {view === AppView.FEATURE_META_QUALITATIVA && (
          <MetaQualitativa
            onBack={() => setView(AppView.DASHBOARD)}
            defaultProfessorName={user?.nome}
            history={collectedDocuments.filter(doc => doc.type === 'PESQUISA_META')}
            onSave={handleSaveDocument}
          />
        )}

        {view === AppView.FEATURE_SOCIOECONOMIC && (
          <SocioeconomicForm
            onBack={() => setView(AppView.DASHBOARD)}
            history={collectedDocuments.filter(doc => doc.type === 'INDICADORES_SAUDE')}
            onSave={handleSaveDocument}
          />
        )}

        {view === AppView.FEATURE_EVIDENCE && user && (
          <EvidenceUpload
            user={user}
            initialCategory={navParams.category as EvidenceType}
            onBack={() => setView(AppView.DASHBOARD)}
            onSave={handleSaveEvidence}
            history={collectedEvidence}
          />
        )}

        {view === AppView.REPORT && user && (
          <ReportPreview
             user={user}
             students={students}
             nucleos={nucleos}
             evidences={collectedEvidence}
             documents={collectedDocuments}
             onUpdateStudent={handleSaveStudent}
             onBack={() => setView(AppView.DASHBOARD)}
          />
        )}

        {view === AppView.DEV_ENVIRONMENT && user && (
          <div className="pt-20"> {/* Add padding to prevent going under header */}
            <AmbienteDesenvolvimento 
              nucleos={nucleos}
              students={students}
              history={collectedDocuments}
              onOpenBuilder={() => setView(AppView.PDF_BUILDER_VIEW)}
              onOpenFrequencyReport={() => setView(AppView.FREQUENCY_REPORT)}
              onOpenPDLIEReport={() => setView(AppView.PDLIE_REPORT)}
              onBack={() => setView(AppView.DASHBOARD)}
            />
          </div>
        )}

        {view === AppView.FREQUENCY_REPORT && user && (
          <FrequencyReportBuilder
            students={students}
            history={collectedDocuments}
            nucleos={nucleos}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
          />
        )}

        {view === AppView.PDLIE_REPORT && user && (
          <PDLIEReportBuilder
            nucleos={nucleos}
            evidences={collectedEvidence}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PDFBuilderProvider>
      <AppContent />
    </PDFBuilderProvider>
  );
};

export default App;
