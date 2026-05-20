
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Nucleo, AppView, StudentDraft, EvidenceLog, DocumentLog, DocumentType, EvidenceType, InventoryItem, ProjectId } from './types';
import { supabase } from './services/supabaseClient';
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
import { AssiduidadeReportBuilder } from './components/AssiduidadeReportBuilder';
import { PesquisaReportBuilder } from './components/PesquisaReportBuilder';
import { InscricaoReportBuilder } from './components/InscricaoReportBuilder';
import { ReportBuilder } from './components/ReportBuilder';
import { PreCadastroData } from './types';
import { ReportPreview } from './components/ReportPreview';



const isValidUUID = (uuid?: string | null) => {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

/**
 * Resolve um nucleoId que pode ser um UUID real ou um slug antigo (ex: "nuc_ilheus", "dd_cajuru").
 * Retorna o objeto Nucleo correspondente buscando primeiro por UUID, depois por padrão no email.
 */
const resolveNucleoFromIdOrSlug = (nucleoIdOrSlug: string | null | undefined, nucleosList: any[]): any | undefined => {
  if (!nucleoIdOrSlug || !nucleosList.length) return undefined;
  // 1. Busca direta por UUID
  const byId = nucleosList.find((n: any) => n.id === nucleoIdOrSlug);
  if (byId) return byId;
  // 2. Busca pelo slug antigo no campo email (ex: contato.nuc_ilheus@esporte.gov.br)
  const byEmail = nucleosList.find((n: any) => n.email && n.email.includes(`${nucleoIdOrSlug}@`));
  if (byEmail) return byEmail;
  // 3. Busca pelo slug antigo no campo email com prefixo "contato."
  const byEmailPrefix = nucleosList.find((n: any) => n.email && n.email.includes(`contato.${nucleoIdOrSlug}@`));
  if (byEmailPrefix) return byEmailPrefix;
  // 4. Busca parcial no nome (ex: "nuc_ilheus" → busca "ilhéus" no nome, sem acentos)
  const slugLower = nucleoIdOrSlug.toLowerCase().replace(/^(nuc_|dd_|fut_)/, '');
  if (slugLower.length >= 3) {
    const byNome = nucleosList.find((n: any) => {
      const nomeLower = (n.nome || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return nomeLower.includes(slugLower);
    });
    if (byNome) return byNome;
  }
  return undefined;
};

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
].map(n => {
  // Extrair UF do nome (ex: "Ilhéus | BA -..." → "BA", "Curitiba - PR" → "PR")
  const ufMatch = n.nome.match(/[\s\-–,|\/]+([A-Z]{2})[\s\-–]/);
  const trailingMatch = n.nome.match(/[\s\-–,|\/]+([A-Z]{2})\s*$/);
  const estado = ufMatch?.[1] || trailingMatch?.[1] || undefined;
  return {
    ...n,
    project: 'FORMANDO_CAMPEOES' as const,
    estado,
    stockDetails: generateStockDetails(n.stockStatus as any),
    address: n.nome.split(' - ')[1] || 'Endereço não cadastrado',
    phone: '(00) 3333-4444',
    email: `contato.${n.id}@esporte.gov.br`,
    employees: generateMockEmployees(n.id, n.nome)
  };
}) as Nucleo[];

// --- NÚCLEOS DANIEL DIAS ---
const DANIEL_DIAS_NUCLEOS: Nucleo[] = [
  { id: 'dd_cic', nome: 'CIC | PR - CEL Bairro CIC – Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4925, -49.3450], stockStatus: 'HIGH' },
  { id: 'dd_boa_vista', nome: 'Boa Vista | PR - CEL Boa Vista – Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.3850, -49.2319], stockStatus: 'MEDIUM' },
  { id: 'dd_boqueirao', nome: 'Boqueirão | PR - CEL Boqueirão – Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.5008, -49.2392], stockStatus: 'HIGH' },
  { id: 'dd_osvaldo_cruz', nome: 'Centro | PR - CEL Osvaldo Cruz – Rua Cel. Dulcídio, 950, Centro, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4386, -49.2783], stockStatus: 'MEDIUM' },
  { id: 'dd_cajuru', nome: 'Cajuru | PR - CEL Cajuru – Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4611, -49.2133], stockStatus: 'HIGH' },
  { id: 'dd_santa_felicidade', nome: 'Santa Felicidade | PR - CEL Santa Felicidade – Via Vêneto, 1431, Santa Felicidade, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.4053, -49.3283], stockStatus: 'MEDIUM' },
  { id: 'dd_gente_bairro_novo', nome: 'Sítio Cercado | PR - Clube da Gente Bairro Novo – Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.5532, -49.2743], stockStatus: 'LOW' },
  { id: 'dd_gente_cic', nome: 'CIC Gente | PR - Clube da Gente CIC – Rua Emílio Romani, s/n, CIC, Curitiba - PR', project: 'DANIEL_DIAS', coordinates: [-25.5100, -49.3500], stockStatus: 'HIGH' },
  { id: 'dd_valinhos_juventude', nome: 'Valinhos | SP - Praça da Juventude – Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP', project: 'DANIEL_DIAS', coordinates: [-22.9708, -46.9958], stockStatus: 'MEDIUM' },
  { id: 'dd_valinhos_nardini', nome: 'Valinhos Nardini | SP - Parque Monsenhor Nardini – Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP', project: 'DANIEL_DIAS', coordinates: [-22.9650, -47.0050], stockStatus: 'HIGH' },
  { id: 'dd_atibaia_ciem2', nome: 'Atibaia CIEM2 | SP - CIEM 2 – Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP', project: 'DANIEL_DIAS', coordinates: [-23.1170, -46.5530], stockStatus: 'MEDIUM' },
  { id: 'dd_atibaia_ciem3', nome: 'Atibaia CIEM3 | SP - CIEM 3 – Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP', project: 'DANIEL_DIAS', coordinates: [-23.1250, -46.5650], stockStatus: 'LOW' },
  { id: 'dd_atibaia_elefantao', nome: 'Atibaia Elefantão | SP - Piscina do Elefantão – Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP', project: 'DANIEL_DIAS', coordinates: [-23.1170, -46.5500], stockStatus: 'HIGH' },
  { id: 'dd_ponta_grossa_arena', nome: 'Ponta Grossa | PR - Arena Multiuso – Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR', project: 'DANIEL_DIAS', coordinates: [-25.0950, -50.1619], stockStatus: 'MEDIUM' },
  { id: 'dd_ponta_grossa_cecon', nome: 'Ponta Grossa CECON | PR - CECON (Idoso) – Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR', project: 'DANIEL_DIAS', coordinates: [-25.0900, -50.1700], stockStatus: 'LOW' },
  { id: 'dd_hortolandia', nome: 'Hortolândia | SP - Complexo Nelson Cancian – Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP', project: 'DANIEL_DIAS', coordinates: [-22.8600, -47.2200], stockStatus: 'HIGH' },
  { id: 'dd_jundiai', nome: 'Jundiaí | SP - CECE Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', project: 'DANIEL_DIAS', coordinates: [-23.1864, -46.8842], stockStatus: 'MEDIUM' },
  { id: 'dd_limeira', nome: 'Limeira | SP - Piscina Alberto Savoi – Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP', project: 'DANIEL_DIAS', coordinates: [-22.5650, -47.4017], stockStatus: 'LOW' },
  { id: 'dd_extrema', nome: 'Extrema | MG - Parque de Eventos – Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG', project: 'DANIEL_DIAS', coordinates: [-22.8550, -46.3178], stockStatus: 'HIGH' },
  { id: 'dd_pindoretama', nome: 'Pindoretama | CE - Ginásio Poliesportivo – Centro da Cidade, Pindoretama - CE', project: 'DANIEL_DIAS', coordinates: [-4.0142, -38.3050], stockStatus: 'MEDIUM' },
  { id: 'dd_pacajus', nome: 'Pacajus | CE - Estádio/Ginásio Municipal – Rua Tabelião José de Lima, s/n, Pacajus - CE', project: 'DANIEL_DIAS', coordinates: [-4.1722, -38.4617], stockStatus: 'LOW' },
  { id: 'dd_canaa', nome: 'Canaã dos Carajás | PA - Polo de Natação Municipal – Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA', project: 'DANIEL_DIAS', coordinates: [-6.4967, -49.8783], stockStatus: 'HIGH' },
  { id: 'dd_belo_jardim', nome: 'Belo Jardim | PE - SESC Belo Jardim (Parceria) – Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE', project: 'DANIEL_DIAS', coordinates: [-8.3361, -36.4244], stockStatus: 'MEDIUM' },

].map(n => {
  const ufMatch = n.nome.match(/[\s\-–,|\/]+([A-Z]{2})[\s\-–]/);
  const trailingMatch = n.nome.match(/[\s\-–,|\/]+([A-Z]{2})\s*$/);
  const estado = ufMatch?.[1] || trailingMatch?.[1] || undefined;
  return {
    ...n,
    estado,
    stockDetails: generateStockDetails(n.stockStatus as any),
    address: n.nome.split('–')[1]?.trim() || 'Endereço não cadastrado',
    phone: '(00) 3333-4444',
    email: `contato.${n.id}@danieldias.org.br`,
    employees: generateMockEmployees(n.id, n.nome)
  };
}) as Nucleo[];

// --- NÚCLEOS FUTEBOL ---
const FUTEBOL_NUCLEOS: Nucleo[] = [
  { id: 'fut_maracanau', nome: 'Maracanaú | CE - Sede Maracanaú, Maracanaú - CE', project: 'FUTEBOL', coordinates: [-3.8744, -38.6256], stockStatus: 'HIGH' },
  { id: 'fut_caucaia', nome: 'Caucaia | CE - Sede Caucaia, Caucaia - CE', project: 'FUTEBOL', coordinates: [-3.7375, -38.6533], stockStatus: 'MEDIUM' },
  { id: 'fut_pacajus', nome: 'Pacajus | CE - Sede Pacajus, Pacajus - CE', project: 'FUTEBOL', coordinates: [-4.1722, -38.4617], stockStatus: 'HIGH' },
  { id: 'fut_itaitinga', nome: 'Itaitinga | CE - Sede Itaitinga, Itaitinga - CE', project: 'FUTEBOL', coordinates: [-3.9667, -38.5278], stockStatus: 'MEDIUM' },
  { id: 'fut_maranguape', nome: 'Maranguape | CE - Sede Maranguape, Maranguape - CE', project: 'FUTEBOL', coordinates: [-3.8914, -38.6836], stockStatus: 'HIGH' },
].map(n => {
  const ufMatch = n.nome.match(/[\s\-–,|\/]+([A-Z]{2})[\s\-–]/);
  const trailingMatch = n.nome.match(/[\s\-–,|\/]+([A-Z]{2})\s*$/);
  const estado = ufMatch?.[1] || trailingMatch?.[1] || undefined;
  return {
    ...n,
    estado,
    stockDetails: generateStockDetails(n.stockStatus as any),
    address: n.nome.split('–')[1]?.trim() || 'Endereço não cadastrado',
    phone: '(00) 3333-4444',
    email: `contato.${n.id}@futebol.org.br`,
    employees: generateMockEmployees(n.id, n.nome)
  };
}) as Nucleo[];

// ALL_NUCLEOS mantido como fallback para modo Demo/offline
const ALL_NUCLEOS = [...MOCK_NUCLEOS, ...DANIEL_DIAS_NUCLEOS, ...FUTEBOL_NUCLEOS];

// Inventário vazio — dados reais vêm do Supabase

const AppContent: React.FC = () => {
  // --- STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [students, setStudents] = useState<StudentDraft[]>([]);
  const [preCadastros, setPreCadastros] = useState<PreCadastroData[]>([]);
  const [nucleos, setNucleos] = useState<Nucleo[]>(ALL_NUCLEOS);
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState<ProjectId>('FORMANDO_CAMPEOES');
  const [supabaseProjectId, setSupabaseProjectId] = useState<string | null>(null); // UUID do projeto no Supabase
  const [authChecked, setAuthChecked] = useState(false); // Controla se já verificou sessão existente

  // --- SUPABASE: Carregar núcleos do banco ---
  const loadNucleosFromSupabase = useCallback(async (projectSlug: ProjectId) => {
    try {
      // Buscar project UUID pelo slug
      const { data: projectData } = await supabase
        .from('projects').select('id').eq('slug', projectSlug).single();
      if (projectData) {
        setSupabaseProjectId(projectData.id);
        // Buscar núcleos do projeto
        const { data: nucleosData } = await supabase
          .from('nucleos').select('*').eq('project_id', projectData.id).order('nome');
        if (nucleosData && nucleosData.length > 0) {
          const mapped: Nucleo[] = nucleosData.map((n: any) => {
            // Extrair UF do nome ou endereço como fallback
            const extractUF = (text: string | null | undefined): string | undefined => {
              if (!text) return undefined;
              // Padrões: "Horizonte - CE", "São José – PR", "Curitiba, PR", "Nucleo|BA", "Local / SP"
              const match = text.match(/[\s\-–,|\/]+([A-Za-z]{2})\s*$/);
              return match ? match[1].toUpperCase() : undefined;
            };
            const estado = n.estado || extractUF(n.nome) || extractUF(n.address) || extractUF(n.city) || undefined;

            return {
            id: n.id,
            nome: n.nome,
            project: projectSlug,
            coordinates: n.coordinates ? [parseFloat(n.coordinates.split(',')[1]?.replace(')','') || '0'), parseFloat(n.coordinates.split('(')[1]?.split(',')[0] || '0')] as [number, number] : undefined,
            address: n.address || '',
            phone: n.phone || '(00) 0000-0000',
            email: n.email || `contato@${projectSlug.toLowerCase()}.org.br`,
            cnpj: n.cnpj,
            razaoSocial: n.razao_social,
            city: n.city,
            estado,
            sliNumber: n.sli_number,
            dias_aulas: n.dias_aulas,
            horario_aulas: n.horario_aulas,
            durabilidade: n.durabilidade,
            dataInicio: n.data_inicio,
            dataTermino: n.data_termino,
            stockStatus: (n.stock_status || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
            stockDetails: generateStockDetails((n.stock_status || 'MEDIUM') as any),
            employees: [],
          };
          });
          // Deduplicar núcleos: manter apenas o que tem UF no final do endereço
          const deduped = (() => {
            const seen = new Map<string, Nucleo>();
            for (const n of mapped) {
              // Chave normalizada: primeira parte do nome
              const baseName = (n.nome || '')
                .split('-')[0]
                .split('|')[0]
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .trim();
              
              const normAddr = baseName || 'desconhecido';
              
              const existing = seen.get(normAddr);
              if (!existing) {
                seen.set(normAddr, n);
              } else {
                // Preferir o que tem UF no endereço (ex: "- CE" ou "– CE")
                const ufRegex = /\s*[-–]\s*[A-Z]{2}\s*$/i;
                const hasUF = ufRegex.test(n.address || '') || ufRegex.test(n.nome || '');
                const existingHasUF = ufRegex.test(existing.address || '') || ufRegex.test(existing.nome || '');
                
                if (hasUF && !existingHasUF) {
                  seen.set(normAddr, n);
                } else if (!existingHasUF && n.address && !existing.address) {
                  seen.set(normAddr, n);
                }
              }
            }
            return Array.from(seen.values());
          })();
          // Debug: mostrar núcleos carregados e seus estados
          console.log('[Nucleos] Carregados (' + deduped.length + '):', deduped.map(n => ({
            nome: n.nome,
            estado: n.estado || '⚠️ NULL',
            address: n.address?.substring(0, 40)
          })));
          // Mescla: núcleos do Supabase para este projeto + fallback de outros projetos
          setNucleos(prev => {
            const otherProjects = prev.filter(n => n.project !== projectSlug);
            return [...deduped, ...otherProjects];
          });
        }
      }
    } catch (err) {
      console.warn('Supabase núcleos fallback para mock:', err);
    }
  }, []);

  // --- SUPABASE: Carregar alunos do banco ---
  const loadStudentsFromSupabase = useCallback(async (projectUUID: string, projectSlug: ProjectId) => {
    try {
      const { data, error } = await supabase
        .from('students').select('*').eq('project_id', projectUUID).order('nome');
      if (error) { console.warn('Erro ao carregar alunos:', error); return; }
      if (data && data.length > 0) {
        // Fetch declarations and documents in parallel to enrich the students
        const studentIds = data.map((s: any) => s.id);
        const [decsResult, docsResult] = await Promise.all([
          supabase.from('student_declarations').select('*').in('student_id', studentIds),
          supabase.from('documents').select('student_id, type, file_url, metadata, created_at').in('student_id', studentIds)
        ]);

        const decs = decsResult.data || [];
        const docs = docsResult.data || [];

        const mapped: StudentDraft[] = data.map((s: any) => {
          const studentDecs = decs.filter((d: any) => d.student_id === s.id);
          const uni = studentDecs.find((d: any) => d.type === 'UNIFORMES');
          const pron = studentDecs.find((d: any) => d.type === 'PRONTIDAO');
          const auto = studentDecs.find((d: any) => d.type === 'AUTORIZACAO_VIAGEM');

          const studentDocs = docs.filter((d: any) => d.student_id === s.id);
          // Helper to get latest document of a type
          const getLatestDoc = (type: string) => studentDocs
            .filter((d: any) => d.type === type)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          const meta = getLatestDoc('PESQUISA_META');
          const socio = getLatestDoc('INDICADORES_SAUDE');
          const boletim = getLatestDoc('BOLETIM');
          const decMatricula = getLatestDoc('DECLARACAO_MATRICULA');

          return {
            id: s.id,
            projectId: projectSlug,
            nucleo_id: s.nucleo_id,
            turma_id: s.turma_id,
            nome: s.nome,
            data_nascimento: s.data_nascimento || '',
            rg_cpf: s.rg_cpf || '',
            nome_responsavel: s.nome_responsavel || '',
            endereco: s.endereco || '',
            telefone: s.telefone || '',
            email_contato: s.email_contato || '',
            escola_nome: s.escola_nome || '',
            escola_tipo: s.escola_tipo || '',
            n_sli: s.n_sli || '',
            nome_projeto: s.nome_projeto || '',
            proponente: s.proponente || '',
            nome_responsavel_organizacao: s.nome_responsavel_organizacao || '',
            status: s.status || 'ATIVO',
            materiais_pendentes: s.materiais_pendentes || false,
            portador_necessidade_especial: s.portador_necessidade_especial || false,
            laudo_url: s.laudo_url,
            ficha_url: s.ficha_url,
            assinatura: s.assinatura,
            data_assinatura: s.data_assinatura,
            timestamp: s.created_at,
            declaracao_uniformes: uni ? uni.data : undefined,
            declaracao_prontidao: pron ? pron.data : undefined,
            autorizacao_viagem: auto ? auto.data : undefined,
            questionario_quantitativo: meta ? { url: meta.file_url || meta.metadata?.url, timestamp: meta.created_at, metadata: meta.metadata } : undefined,
            pesquisa_socioeconomica: socio ? { url: socio.file_url || socio.metadata?.url, timestamp: socio.created_at, metadata: socio.metadata } : undefined,
            // Prioridade: campo direto na tabela students > documents table (fallback)
            boletim_escolar: s.boletim_escolar || (boletim ? { url: boletim.file_url || boletim.metadata?.url, timestamp: boletim.created_at, ...boletim.metadata } : undefined),
            declaracao_matricula: s.declaracao_matricula || (decMatricula ? { url: decMatricula.file_url || decMatricula.metadata?.url, imageUrl: decMatricula.metadata?.imageUrl || decMatricula.file_url || '', timestamp: decMatricula.created_at, ocrData: decMatricula.metadata?.ocrData } : undefined),
          };
        });
        setStudents(mapped);
      }
    } catch (err) {
      console.warn('Supabase alunos fallback:', err);
    }
  }, []);

  // --- SUPABASE: Carregar documentos do banco ---
  const loadDocumentsFromSupabase = useCallback(async (projectUUID: string, projectSlug: ProjectId) => {
    try {
      const { data, error } = await supabase
        .from('documents').select('*').eq('project_id', projectUUID).order('created_at', { ascending: false });
      if (error) { console.warn('Erro ao carregar documentos:', error); return; }
      if (data && data.length > 0) {
        const mapped: DocumentLog[] = data.map((d: any) => ({
          id: d.id,
          projectId: projectSlug,
          timestamp: d.created_at,
          type: d.type as DocumentType,
          title: d.title,
          description: d.description || '',
          fileUrl: d.file_url || '',
          metaData: d.metadata || {},
          status: d.status || '',
          nucleoId: d.nucleo_id,
          uploadedBy: d.uploaded_by,
        }));
        setCollectedDocuments(mapped);
      }
    } catch (err) {
      console.warn('Supabase docs fallback:', err);
    }
  }, []);

  // --- SUPABASE: Carregar evidências do banco ---
  const loadEvidencesFromSupabase = useCallback(async (projectUUID: string, projectSlug: ProjectId) => {
    try {
      const { data, error } = await supabase
        .from('evidences').select('*').eq('project_id', projectUUID).order('created_at', { ascending: false });
      if (error) { console.warn('Erro ao carregar evidências:', error); return; }
      if (data && data.length > 0) {
        const mapped: EvidenceLog[] = data.map((e: any) => ({
          id: e.id,
          projectId: projectSlug,
          timestamp: e.created_at,
          date: e.evidence_date,
          type: e.type,
          description: e.description || '',
          imageUrl: e.image_url || '',
          user_id: e.uploaded_by,
        }));
        setCollectedEvidence(mapped);
      }
    } catch (err) {
      console.warn('Supabase evidences fallback:', err);
    }
  }, []);

  // --- SUPABASE: Carregar inventário do banco ---
  const loadInventoryFromSupabase = useCallback(async (projectUUID: string, projectSlug: ProjectId) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items').select('*').eq('project_id', projectUUID).order('name');
      if (error) { console.warn('Erro ao carregar inventário:', error); return; }
      if (data && data.length > 0) {
        const mapped: InventoryItem[] = data.map((i: any) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          initialQuantity: i.initial_quantity,
          unit: i.unit || 'Unid.',
          minThreshold: i.min_threshold || 0,
          category: i.category || 'OUTROS',
          projectId: projectSlug,
          purchaseDate: i.purchase_date || undefined,
        }));
        setInventory(mapped);
      }
    } catch (err) {
      console.warn('Supabase inventory fallback:', err);
    }
  }, []);

  // --- SUPABASE: Carregar pré-cadastros do banco ---
  const loadPreCadastrosFromSupabase = useCallback(async (projectUUID: string, projectSlug: ProjectId) => {
    try {
      const { data, error } = await supabase
        .from('pre_cadastros').select('*').eq('project_id', projectUUID).order('created_at', { ascending: false });
      if (error) { console.warn('Erro ao carregar pré-cadastros:', error); return; }
      if (data && data.length > 0) {
        const mapped: PreCadastroData[] = data.map((p: any) => ({
          id: p.id,
          projectId: projectSlug,
          timestamp: p.created_at,
          nucleo_id: p.nucleo_id,
          status: p.status || 'AGUARDANDO',
          nome_aluno: p.nome_aluno,
          data_nascimento: p.data_nascimento || '',
          raca: p.raca || '',
          pcd: p.pcd || '',
          deficiencia_desc: p.deficiencia_desc || '',
          laudo_url: p.laudo_url,
          rg: p.rg || '',
          cpf: p.cpf || '',
          tipo_escola: p.tipo_escola || '',
          bolsa_estudo: p.bolsa_estudo || '',
          nome_escola: p.nome_escola || '',
          periodo_estudo: p.periodo_estudo || '',
          cursando: p.cursando || '',
          frequencia_atividade: p.frequencia_atividade || '',
          nome_responsavel: p.nome_responsavel || '',
          telefone: p.telefone || '',
          email: p.email || '',
          endereco: p.endereco || '',
          local_moradia: p.local_moradia || '',
          tipo_imovel: p.tipo_imovel || '',
          qtd_pessoas_casa: p.qtd_pessoas_casa || '',
          renda_bruta: p.renda_bruta || '',
          beneficio_gov: p.beneficio_gov || '',
          sistema_saude: p.sistema_saude || '',
          vacinas_dia: p.vacinas_dia || '',
          altura: p.altura || '',
          peso: p.peso || '',
          sabe_nadar: p.sabe_nadar || '',
          sabe_pedalar: p.sabe_pedalar || '',
          intuito: p.intuito || '',
          restricao_dias: p.restricao_dias || '',
        }));
        setPreCadastros(mapped);
      }
    } catch (err) {
      console.warn('Supabase precadastros fallback:', err);
    }
  }, []);

  // --- Função agregadora: carregar tudo do projeto ---
  const loadAllProjectData = useCallback(async (projectUUID: string, projectSlug: ProjectId) => {
    await Promise.all([
      loadStudentsFromSupabase(projectUUID, projectSlug),
      loadDocumentsFromSupabase(projectUUID, projectSlug),
      loadEvidencesFromSupabase(projectUUID, projectSlug),
      loadInventoryFromSupabase(projectUUID, projectSlug),
      loadPreCadastrosFromSupabase(projectUUID, projectSlug),
    ]);
  }, [loadStudentsFromSupabase, loadDocumentsFromSupabase, loadEvidencesFromSupabase, loadInventoryFromSupabase, loadPreCadastrosFromSupabase]);

  // --- SUPABASE: Verificar sessão existente ao montar ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Buscar acesso do usuário
          const { data: accessData } = await supabase
            .from('user_project_access')
            .select('*, projects(slug, nome)')
            .eq('user_id', session.user.id);
          
          if (accessData && accessData.length > 0) {
            const defaultAccess = accessData.find((a: any) => a.is_default) || accessData[0];
            const projectSlug = (defaultAccess as any).projects?.slug as ProjectId;
            if (projectSlug) setActiveProject(projectSlug);
            
            const selectedNucleo = nucleos.find(n => n.id === defaultAccess.nucleo_id);
            setUser({
              uid: session.user.id,
              nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              role: defaultAccess.role as any,
              nucleo_id: defaultAccess.nucleo_id,
              nucleo_nome: selectedNucleo?.nome,
              projectId: projectSlug,
              estado_responsavel: defaultAccess.estado_responsavel || undefined,
            });
            // Carregar dados do projeto
            await loadNucleosFromSupabase(projectSlug);
            if (defaultAccess.project_id) {
              setSupabaseProjectId(defaultAccess.project_id);
              await loadAllProjectData(defaultAccess.project_id, projectSlug);
            }
            
            // Se estiver numa rota pública de formulário, não redireciona para o dashboard
            const searchParams = new URLSearchParams(window.location.search);
            const hashContent = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.hash.substring(1);
            const hashParams = new URLSearchParams(hashContent);
            const isPublicRoute = (searchParams.get('token') || hashParams.get('token')) && (searchParams.get('service') || hashParams.get('service'));
            
            if (!isPublicRoute) {
              if (defaultAccess.status === 'PENDENTE') {
                setView(AppView.PENDING_APPROVAL);
              } else {
                setView(defaultAccess.role === 'ADMIN' ? AppView.ADMIN_DASHBOARD : AppView.DASHBOARD);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao verificar sessão:', err);
      } finally {
        setAuthChecked(true);
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- PROJECT-SCOPED DATA ---
  const filteredNucleos = useMemo(() => {
    let list = nucleos.filter(n => n.project === activeProject);
    if (user && user.role === 'ADMIN' && user.estado_responsavel && user.email !== 'admin.geral@formandocampeoes.org.br') {
      list = list.filter(n => n.estado === user.estado_responsavel);
    }
    return list;
  }, [nucleos, activeProject, user]);

  const projectStudents = useMemo(() => {
    let list = students.filter(s => !s.projectId || s.projectId === activeProject);
    if (user && user.role === 'ADMIN' && user.estado_responsavel && user.email !== 'admin.geral@formandocampeoes.org.br') {
      const allowedNucleos = new Set(filteredNucleos.map(n => n.id));
      list = list.filter(s => s.nucleo_id && allowedNucleos.has(s.nucleo_id));
    }
    return list;
  }, [students, activeProject, user, filteredNucleos]);
  const projectPreCadastros = useMemo(() => preCadastros.filter(p => !p.projectId || p.projectId === activeProject), [preCadastros, activeProject]);

  // Alunos filtrados pelo núcleo do usuário logado
  const nucleoStudents = useMemo(() => {
    if (!user?.nucleo_id) return projectStudents; // Admin sem núcleo ou com estado_responsavel: vê todos (do estado, já filtrado acima)
    return projectStudents.filter(s => s.nucleo_id === user.nucleo_id);
  }, [projectStudents, user?.nucleo_id]);

  // Navigation Params
  const [navParams, setNavParams] = useState<any>({});

  // Data State
  const [collectedEvidence, setCollectedEvidence] = useState<EvidenceLog[]>([]);

  // Documentos agora carregam do Supabase após login
  const [collectedDocuments, setCollectedDocuments] = useState<DocumentLog[]>([]);

  // (Dados mock removidos — tudo vem do Supabase agora)

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // --- PROJECT-SCOPED DOCUMENTS / EVIDENCE / INVENTORY ---
  const projectDocuments = useMemo(() => collectedDocuments.filter(d => !d.projectId || d.projectId === activeProject), [collectedDocuments, activeProject]);
  const projectEvidence = useMemo(() => collectedEvidence.filter(e => !e.projectId || e.projectId === activeProject), [collectedEvidence, activeProject]);

  // --- PROJECT ASSETS HELPER ---
  const PROJECT_LIST: ProjectId[] = ['FORMANDO_CAMPEOES', 'DANIEL_DIAS', 'FUTEBOL'];
  const projectAssets = useMemo(() => {
    if (activeProject === 'DANIEL_DIAS') return { logo: '/logo_Daniel_Dias.png', header: '/Banner_Relatorio_Daniel.png', name: 'Nadando com Daniel Dias' };
    if (activeProject === 'FUTEBOL') return { logo: '/logo_futebol.png', header: '/Banner_relatorio_futebol.png', name: 'Escolinha de Futebol' };
    return { logo: '/logo.png', header: '/header_full.png', name: 'Escolinha de Triathlon' };
  }, [activeProject]);

  // --- DYNAMIC FAVICON & TITLE ---
  useEffect(() => {
    // Update favicon
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = projectAssets.logo;
    link.type = 'image/png';

    // Update page title
    document.title = `${projectAssets.name} — Gestão Esportiva`;
  }, [projectAssets]);

  const [loginNucleoId, setLoginNucleoId] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginEstado, setLoginEstado] = useState<string | null>(null); // Estado do usuário sendo logado

  // Buscar estado_responsavel do usuário quando ele digita o e-mail
  useEffect(() => {
    if (!loginEmail || !loginEmail.includes('@')) {
      setLoginEstado(null);
      return;
    }

    // Super admin vê todos
    if (loginEmail.trim().toLowerCase() === 'admin.geral@formandocampeoes.org.br') {
      setLoginEstado(null);
      return;
    }

    const timer = setTimeout(async () => {
      const email = loginEmail.trim().toLowerCase();
      try {
        // Tentativa 1: Buscar estado direto da profiles (requer migração 016)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, estado_responsavel')
          .eq('email', email)
          .maybeSingle();
        
        if (profileData?.estado_responsavel) {
          console.log('[Login] Estado encontrado em profiles:', profileData.estado_responsavel);
          setLoginEstado(profileData.estado_responsavel);
          setLoginNucleoId('');
          return;
        }

        // Tentativa 2: Se achou o perfil mas sem estado, buscar via user_project_access
        // (requer que o user tenha um session ativa, pode falhar sem auth)
        if (profileData?.id) {
          const { data: accessData } = await supabase
            .from('user_project_access')
            .select('estado_responsavel')
            .eq('user_id', profileData.id)
            .not('estado_responsavel', 'is', null)
            .limit(1)
            .maybeSingle();
          
          if (accessData?.estado_responsavel) {
            console.log('[Login] Estado encontrado em user_project_access:', accessData.estado_responsavel);
            setLoginEstado(accessData.estado_responsavel);
            setLoginNucleoId('');
            return;
          }
        }

        // Nenhum estado encontrado — mostrar todos os núcleos
        console.log('[Login] Nenhum estado encontrado para:', email, profileError?.message || '');
        setLoginEstado(null);
      } catch (err) {
        console.warn('[Login] Erro ao buscar estado:', err);
        setLoginEstado(null);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [loginEmail]);

  // Núcleos do projeto ativo (para login)
  const projectNucleosForLogin = useMemo(() => {
    return nucleos.filter(n => n.project === activeProject);
  }, [nucleos, activeProject]);

  // Lista de estados únicos disponíveis nos núcleos
  const availableEstados = useMemo(() => {
    const estados = new Set<string>();
    projectNucleosForLogin.forEach(n => {
      if (n.estado) estados.add(n.estado);
    });
    return Array.from(estados).sort();
  }, [projectNucleosForLogin]);

  // Núcleos filtrados para a tela de login (por estado selecionado)
  const loginFilteredNucleos = useMemo(() => {
    if (!loginEstado) return projectNucleosForLogin;
    const filtered = projectNucleosForLogin.filter(n => n.estado === loginEstado);
    return filtered.length > 0 ? filtered : projectNucleosForLogin; // Fallback
  }, [projectNucleosForLogin, loginEstado]);

  // Recarregar dados ao trocar projeto (se logado)
  useEffect(() => {
    if (user && supabaseProjectId) {
      loadAllProjectData(supabaseProjectId, activeProject);
    }
  }, [activeProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Efeito para tratar Link Externo (Pai) - Captura de Hash e Query de forma robusta
  useEffect(() => {
    const handleRouting = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashContent = window.location.hash.includes('?')
        ? window.location.hash.split('?')[1]
        : window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashContent);

      const token = searchParams.get('token') || hashParams.get('token');
      const service = searchParams.get('service') || hashParams.get('service');
      const studentId = searchParams.get('studentId') || hashParams.get('studentId');
      const project = searchParams.get('project') || hashParams.get('project');
      const nucleoId = searchParams.get('nucleoId') || hashParams.get('nucleoId');

      if (token && service) {
        console.log("Rota pública detectada:", { token, service, studentId, project, nucleoId });
        if (project && ['FORMANDO_CAMPEOES', 'DANIEL_DIAS', 'FUTEBOL'].includes(project)) {
          setActiveProject(project as ProjectId);
          try {
            // Load Nucleos from Supabase instead of just projectData, this sets up the publicNucleo context correctly
            await loadNucleosFromSupabase(project as ProjectId);
          } catch (e) {
            console.error('Erro ao buscar supabaseProjectId na rota publica:', e);
          }
        }
        setView(AppView.PUBLIC_FORM);
        setNavParams({ token, service, studentId, project, nucleoId });
      }
    };

    handleRouting();
    window.addEventListener('hashchange', () => handleRouting());
    window.addEventListener('popstate', () => handleRouting());
    return () => {
      window.removeEventListener('hashchange', () => handleRouting());
      window.removeEventListener('popstate', () => handleRouting());
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      // 1. Autenticar com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (authError) {
        setLoginError(authError.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setLoginError('Erro ao autenticar. Tente novamente.');
        setLoading(false);
        return;
      }

      // 2. Buscar acesso do usuário ao projeto selecionado
      const { data: projectData } = await supabase
        .from('projects').select('id').eq('slug', activeProject).single();

      if (!projectData) {
        setLoginError('Projeto não encontrado.');
        setLoading(false);
        return;
      }

      const { data: accessData } = await supabase
        .from('user_project_access')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('project_id', projectData.id)
        .single();

      let role: string = 'PROFESSOR';
      let nucleoId: string | null = loginNucleoId || null;

      if (accessData) {
        role = accessData.role;
        if (accessData.nucleo_id) nucleoId = accessData.nucleo_id;
        // Super Admin / Admin: permite trocar de núcleo pelo seletor de login
        if ((role === 'ADMIN' || role === 'SUPER_ADMIN') && loginNucleoId) {
          nucleoId = loginNucleoId;
        }
      } else {
        // Verifica se tem acesso a QUALQUER projeto (pode ser super admin global)
        const { data: anyAccess } = await supabase
          .from('user_project_access')
          .select('*, projects(slug)')
          .eq('user_id', authData.user.id);
        
        if (anyAccess && anyAccess.length > 0) {
          // Tem acesso a outro projeto — criar acesso cross-project para admins
          const isAdmin = anyAccess.some((a: any) => a.role === 'ADMIN' || a.role === 'SUPER_ADMIN');
          if (isAdmin) {
            // Admin pode acessar qualquer projeto: cria acesso automático
            role = 'ADMIN';
            nucleoId = loginNucleoId || null;
            await supabase.from('user_project_access').insert({
              user_id: authData.user.id,
              project_id: projectData.id,
              nucleo_id: nucleoId,
              role: 'ADMIN',
              is_default: false,
            });
          } else {
            setLoginError(`Você não tem acesso ao projeto ${activeProject === 'FORMANDO_CAMPEOES' ? 'Triathlon' : activeProject === 'DANIEL_DIAS' ? 'Daniel Dias' : 'Futebol'}. Selecione outro projeto.`);
            setLoading(false);
            return;
          }
        } else {
          setLoginError('Você não tem acesso a nenhum projeto. Contate o administrador.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
      }

      // 3. Carregar todos os dados do Supabase
      await loadNucleosFromSupabase(activeProject);
      setSupabaseProjectId(projectData.id);
      await loadAllProjectData(projectData.id, activeProject);

      // 4. Definir usuário
      const selectedNucleoObj = nucleos.find(n => n.id === nucleoId);
      setUser({
        uid: authData.user.id,
        nome: authData.user.user_metadata?.nome || authData.user.email?.split('@')[0] || 'Usuário',
        email: authData.user.email || loginEmail,
        role: role as any,
        nucleo_id: nucleoId,
        nucleo_nome: selectedNucleoObj?.nome,
        projectId: activeProject,
        estado_responsavel: accessData?.estado_responsavel || loginEstado || undefined,
      });

      // 5. Redirecionar
      if (accessData?.status === 'PENDENTE') {
        setView(AppView.PENDING_APPROVAL);
      } else if (role === 'ADMIN') {
        setView(AppView.ADMIN_DASHBOARD);
      } else {
        setView(AppView.DASHBOARD);
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      setLoginError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    const demoNucleo = filteredNucleos.find(n => n.id === loginNucleoId) || filteredNucleos[0] || nucleos[0];
    
    try {
      const { data: projectData } = await supabase
        .from('projects').select('id').eq('slug', activeProject).single();
      if (projectData) {
        setSupabaseProjectId(projectData.id);
        await loadAllProjectData(projectData.id, activeProject);
      }
    } catch (e) {
      console.error('Erro ao buscar supabaseProjectId no demo:', e);
    }

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro ao fazer logout:', err);
    }
    setUser(null);
    setLoginNucleoId('');
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setStudents([]);
    setCollectedEvidence([]);
    setCollectedDocuments([]);
    setInventory([]);
    setNavParams({});
    setSupabaseProjectId(null);
    setView(AppView.LOGIN);
  };

  const navigateTo = (view: AppView, params?: any) => {
    if (params) setNavParams(params);
    setView(view);
  };

  // --- Data Handlers (Supabase-Integrated) ---
  const handleSaveStudent = async (data: StudentDraft): Promise<string | undefined> => {
    const timestamp = new Date().toISOString();
    const existingIndex = students.findIndex(s => s.id === data.id);

    if (existingIndex >= 0) {
      // UPDATE existente
      const updated = { ...data, timestamp };
      setStudents(prev => {
        const copy = [...prev];
        copy[existingIndex] = updated;
        return copy;
      });
      // Persistir no Supabase
      if (supabaseProjectId) {
        try {
          // Limitar tamanho da assinatura base64 (max ~500KB)
          const assinaturaValue = data.assinatura && data.assinatura.length < 500000 ? data.assinatura : null;
          const { error } = await supabase.from('students').update({
            nome: data.nome,
            data_nascimento: data.data_nascimento || null,
            rg_cpf: data.rg_cpf || null,
            nome_responsavel: data.nome_responsavel || null,
            endereco: data.endereco || null,
            telefone: data.telefone || null,
            email_contato: data.email_contato || null,
            escola_nome: data.escola_nome || null,
            escola_tipo: data.escola_tipo || '',
            n_sli: data.n_sli || null,
            nucleo_id: isValidUUID(data.nucleo_id) ? data.nucleo_id : null,
            status: data.status || 'ATIVO',
            materiais_pendentes: data.materiais_pendentes || false,
            portador_necessidade_especial: data.portador_necessidade_especial || false,
            assinatura: assinaturaValue,
            data_assinatura: data.data_assinatura || null,
          }).eq('id', data.id);
          if (error) {
            console.error('❌ Erro ao atualizar aluno:', error.message, error.details);
          } else {
            return data.id;
          }
        } catch (err: any) {
          console.error('❌ Exceção ao atualizar aluno:', err);
        }
      }
      return data.id;
    } else {
      // INSERT novo
      const newStudent: StudentDraft = {
        ...data,
        id: data.id || crypto.randomUUID(),
        status: data.status || 'ATIVO',
        projectId: activeProject,
        timestamp,
      };
      setStudents(prev => [...prev, newStudent]);
      // Persistir no Supabase
      if (supabaseProjectId) {
        try {
          // Não enviar base64 grandes no INSERT — eles vão para Storage depois
          // fichaUrl pode ter MB de base64, assinatura pode ter ~50-200KB
          const assinaturaValue = data.assinatura && data.assinatura.length < 500000 ? data.assinatura : null;
          const fichaValue = data.fichaUrl;
          const fichaForDb = fichaValue && fichaValue.length < 500000 ? fichaValue : null;
          
          if (fichaValue && fichaValue.length >= 500000) {
            console.warn(`⚠️ ficha_url muito grande (${(fichaValue.length/1024).toFixed(0)}KB), não enviado ao banco. Use Storage.`);
          }
          if (data.assinatura && data.assinatura.length >= 500000) {
            console.warn(`⚠️ assinatura muito grande (${(data.assinatura.length/1024).toFixed(0)}KB), não enviado ao banco. Use Storage.`);
          }

          const insertPayload = {
            id: newStudent.id,
            project_id: supabaseProjectId,
            nucleo_id: isValidUUID(data.nucleo_id) ? data.nucleo_id : null,
            nucleo_nome: data.nucleo_nome || null,
            nome: data.nome,
            data_nascimento: data.data_nascimento || null,
            rg_cpf: data.rg_cpf || null,
            nome_responsavel: data.nome_responsavel || null,
            endereco: data.endereco || null,
            telefone: data.telefone || null,
            email_contato: data.email_contato || null,
            escola_nome: data.escola_nome || null,
            escola_tipo: data.escola_tipo || '',
            n_sli: data.n_sli || null,
            nome_projeto: data.nome_projeto || null,
            proponente: data.proponente || null,
            nome_responsavel_organizacao: data.nome_responsavel_organizacao || null,
            status: 'ATIVO',
            materiais_pendentes: data.materiais_pendentes || false,
            portador_necessidade_especial: data.portador_necessidade_especial || false,
            assinatura: assinaturaValue,
            data_assinatura: data.data_assinatura || null,
            ficha_url: fichaForDb,
          };
          console.log('[Supabase] Inserindo aluno:', data.nome, 'projeto:', supabaseProjectId, 'ID:', newStudent.id);
          const { error } = await supabase.from('students').insert(insertPayload);
          if (error) {
            console.error('❌ Erro ao inserir aluno no Supabase:', error.message, error.details, error.hint, error.code);
            alert(`Erro ao salvar no banco: ${error.message}`);
          } else {
            console.log('✅ Aluno salvo no Supabase:', newStudent.id, newStudent.nome);
            // newStudent is already in students state with newStudent.id
            return newStudent.id;
          }
        } catch (err: any) {
          console.error('❌ Exceção ao inserir aluno:', err?.message || err);
          alert(`Erro inesperado ao salvar: ${err?.message || 'Erro de conexão'}`);
        }
      } else {
        console.warn('⚠️ supabaseProjectId é null — aluno salvo apenas localmente!');
      }
      return newStudent.id;
    }
  };

  const handleSaveEvidence = async (data: EvidenceLog) => {
    setCollectedEvidence(prev => [...prev, data]);
    // Persistir no Supabase
    if (supabaseProjectId) {
      const { error } = await supabase.from('evidences').insert({
        project_id: supabaseProjectId,
        nucleo_id: user?.nucleo_id || null,
        uploaded_by: user?.uid || null,
        type: data.type,
        description: data.description,
        image_url: data.imageUrl || null,
        evidence_date: data.date || null,
      });
      if (error) console.warn('Erro ao salvar evidência:', error);
    }
  };

  const handleSaveDocument = async (data: DocumentLog) => {
    // LÓGICA DE BAIXA DE ESTOQUE AUTOMÁTICA
    if (data.type === 'LISTA_FREQUENCIA' && data.metaData?.inventoryDeduction) {
      const deductions = data.metaData.inventoryDeduction;
      const deductionList = Array.isArray(deductions) ? deductions : [deductions];
      
      const currentInventory = [...inventory];
      const updates: { localId: string; dbId: string; itemName: string; oldQty: number; newQty: number; amount: number }[] = [];
      
      for (const ded of deductionList) {
        if (!ded?.itemId || !ded?.amount || ded.amount <= 0) continue;

        // Match por ID exato primeiro, depois fallback por nome
        let item = currentInventory.find(i => i.id === ded.itemId);
        if (!item && ded.itemName) {
          item = currentInventory.find(i => i.name === ded.itemName);
        }
        
        if (item) {
          const newQty = Math.max(0, item.quantity - ded.amount);
          updates.push({ localId: item.id, dbId: item.id, itemName: item.name, oldQty: item.quantity, newQty, amount: ded.amount });
        } else {
          console.error(`[Estoque] ❌ Item NÃO encontrado! ID: "${ded.itemId}", Name: "${ded.itemName}"`);
        }
      }

      if (updates.length > 0) {
        // Atualizar estado local
        setInventory(prev => prev.map(item => {
          const upd = updates.find(u => u.localId === item.id);
          return upd ? { ...item, quantity: upd.newQty } : item;
        }));

        // Persistir CADA dedução no Supabase
        const itemNames: string[] = [];
        let totalDeducted = 0;
        
        for (const upd of updates) {
          totalDeducted += upd.amount;
          itemNames.push(`${upd.itemName} (${upd.oldQty} → ${upd.newQty})`);
          
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(upd.dbId);
          
          if (isUUID) {
            // ID é UUID válido — update direto
            const { error } = await supabase
              .from('inventory_items')
              .update({ quantity: upd.newQty })
              .eq('id', upd.dbId)
              .select();
            if (error) {
              console.error(`[Estoque] ❌ Supabase erro ao atualizar "${upd.itemName}":`, error);
            }
          } else {
            // ID temporário — buscar UUID real por nome + project
            if (supabaseProjectId) {
              const { data: found } = await supabase
                .from('inventory_items')
                .select('id, quantity')
                .eq('project_id', supabaseProjectId)
                .eq('name', upd.itemName)
                .single();
              
              if (found) {
                const { error } = await supabase
                  .from('inventory_items')
                  .update({ quantity: Math.max(0, found.quantity - upd.amount) })
                  .eq('id', found.id);
                if (error) {
                  console.error(`[Estoque] ❌ Erro no update por nome "${upd.itemName}":`, error);
                } else {
                  // Atualizar ID local para futuras operações
                  setInventory(prev => prev.map(i => i.id === upd.localId ? { ...i, id: found.id } : i));
                }
              }
            }
          }
        }

        alert(`✅ Estoque atualizado!\n${itemNames.join('\n')}\nTotal: -${totalDeducted} unidades.`);
      }
    }

    setCollectedDocuments(prev => [...prev, data]);
    
    // Atualizar o estado do aluno localmente se for um documento de questionário/boletim
    if (data.studentId && ['PESQUISA_META', 'INDICADORES_SAUDE', 'BOLETIM'].includes(data.type)) {
      setStudents(prev => prev.map(s => {
        if (s.id === data.studentId || s.nome === data.studentId) {
          const docUrl = data.fileUrl || data.metaData?.url || '';
          if (data.type === 'PESQUISA_META') {
            return { ...s, questionario_quantitativo: { url: docUrl, timestamp: new Date().toISOString(), metadata: data.metaData } };
          }
          if (data.type === 'INDICADORES_SAUDE') {
            return { ...s, pesquisa_socioeconomica: { url: docUrl, timestamp: new Date().toISOString(), metadata: data.metaData } };
          }
          if (data.type === 'BOLETIM') {
            const boletimPayload = { url: docUrl, timestamp: new Date().toISOString(), ...data.metaData };
            return { ...s, boletim_escolar: boletimPayload };
          }
        }
        return s;
      }));
    }

    // Persistir no Supabase
    if (supabaseProjectId) {
      const { error } = await supabase.from('documents').insert({
        project_id: supabaseProjectId,
        nucleo_id: isValidUUID(data.nucleoId) ? data.nucleoId : (isValidUUID(user?.nucleo_id) ? user?.nucleo_id : null),
        student_id: data.studentId || null,
        uploaded_by: user?.uid || null,
        type: data.type,
        title: data.title,
        description: data.description || null,
        file_url: data.fileUrl || null,
        metadata: data.metaData || null,
        status: data.status || null,
      });
      if (error) console.warn('Erro ao salvar documento:', error);

      // Persist boletim/declaração to student record for reload durability
      const sid = data.studentId;
      if (sid && isValidUUID(sid)) {
        if (data.type === 'BOLETIM') {
          const docUrl = data.fileUrl || data.metaData?.url || '';
          const { error: updErr } = await supabase.from('students').update({
            boletim_escolar: { url: docUrl, timestamp: new Date().toISOString(), ...data.metaData }
          }).eq('id', sid);
          if (updErr) console.warn('Erro ao vincular boletim ao aluno:', updErr);
        }
        if (data.type === 'DECLARACAO_MATRICULA') {
          const docUrl = data.fileUrl || data.metaData?.imageUrl || data.metaData?.url || '';
          const { error: updErr } = await supabase.from('students').update({
            declaracao_matricula: { url: docUrl, imageUrl: data.metaData?.imageUrl || '', timestamp: new Date().toISOString(), ocrData: data.metaData?.ocrData }
          }).eq('id', sid);
          if (updErr) console.warn('Erro ao vincular declaração ao aluno:', updErr);
        }
      }
    }
  };

  const handleUpdateInventory = async (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    // Persistir no Supabase
    const payload: any = {
      name: updatedItem.name,
      quantity: updatedItem.quantity,
      initial_quantity: updatedItem.initialQuantity,
      unit: updatedItem.unit,
      min_threshold: updatedItem.minThreshold,
      category: updatedItem.category,
    };
    if (updatedItem.purchaseDate) payload.purchase_date = updatedItem.purchaseDate;

    let { error } = await supabase.from('inventory_items').update(payload).eq('id', updatedItem.id);
    // Fallback sem purchase_date se coluna não existir
    if (error && updatedItem.purchaseDate) {
      delete payload.purchase_date;
      const retry = await supabase.from('inventory_items').update(payload).eq('id', updatedItem.id);
      error = retry.error;
    }
    if (error) console.warn('Erro ao atualizar estoque:', error);
  };

  const handleAddItemToInventory = async (newItem: InventoryItem) => {
    setInventory(prev => [...prev, newItem]);
    // Persistir no Supabase
    if (supabaseProjectId) {
      const payload: any = {
        project_id: supabaseProjectId,
        name: newItem.name,
        quantity: newItem.quantity,
        initial_quantity: newItem.initialQuantity,
        unit: newItem.unit,
        min_threshold: newItem.minThreshold,
        category: newItem.category,
      };
      // Tenta incluir purchase_date (pode falhar se migração 017 não foi executada)
      if (newItem.purchaseDate) payload.purchase_date = newItem.purchaseDate;

      let { data: inserted, error } = await supabase.from('inventory_items').insert(payload).select().single();
      
      // Se falhou por causa de purchase_date (coluna não existe), tenta sem
      if (error && newItem.purchaseDate) {
        console.warn('[Inventory] Tentando sem purchase_date:', error.message);
        delete payload.purchase_date;
        const retry = await supabase.from('inventory_items').insert(payload).select().single();
        inserted = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('[Inventory] Erro ao adicionar item:', error);
        alert(`⚠️ Erro ao salvar no banco: ${error.message}`);
      } else if (inserted) {
        console.log('[Inventory] Item salvo com sucesso, ID:', inserted.id);
        setInventory(prev => prev.map(i => i.id === newItem.id ? { ...i, id: inserted.id } : i));
      }
    } else {
      console.warn('[Inventory] supabaseProjectId não definido, item não persistido no banco.');
    }
  };

  // --- Register State ---
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'PROFESSOR' | 'COORDENADOR' | 'ADMIN'>('PROFESSOR');
  const [regNucleo, setRegNucleo] = useState('');
  const [regEstado, setRegEstado] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleDischargeStudent = async (studentId: string, nucleoId: string) => {
    // 1. Remove student do state
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // 1b. Deletar do Supabase
    await supabase.from('students').delete().eq('id', studentId);

    // 2. Auto-notification for waiting list
    const candidate = preCadastros.find(c => c.nucleo_id === nucleoId && c.status === 'AGUARDANDO');
    if (candidate) {
      alert(`✅ BAIXA REALIZADA com sucesso.\n\n🔔 NOTIFICAÇÃO AUTOMÁTICA:\nO candidato "${candidate.nome_aluno}" da Fila de Espera do núcleo sugerido foi notificado via E-mail/WhatsApp sobre a disponibilidade desta vaga.`);
      setPreCadastros(prev => prev.map(c => c.id === candidate.id ? { ...c, status: 'APROVADO' } : c));
    } else {
      alert(`✅ BAIXA REALIZADA com sucesso.\n\nℹ️ Não há nenhum candidato na Fila de Espera aguardando para este núcleo no momento.`);
    }
  };

  const handleInactivateStudent = async (studentIdOrNome: string, checklist: { id: string; name: string; returned: boolean }[], replacementCandidateId?: string, replacementName?: string) => {
    const hasPending = checklist.some(c => !c.returned);
    const targetStudent = students.find(s => s.id === studentIdOrNome || s.nome === studentIdOrNome);

    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, status: 'INATIVO' as const, materiais_pendentes: hasPending, materiais_checklist: checklist };
      }
      return s;
    }));

    // Persistir no Supabase
    if (targetStudent?.id) {
      await supabase.from('students').update({ status: 'INATIVO', materiais_pendentes: hasPending }).eq('id', targetStudent.id);
    }

    // Transfer attendance records to the replacement student
    if (replacementCandidateId && replacementName) {
      const nameToReplace = targetStudent?.nome || studentIdOrNome;
      setCollectedDocuments(prev => prev.map(doc => {
        if (doc.type === 'LISTA_FREQUENCIA' && doc.metaData?.present && Array.isArray(doc.metaData.present)) {
          const updatedPresent = doc.metaData.present.map((name: string) => name === nameToReplace ? replacementName : name);
          return { ...doc, metaData: { ...doc.metaData, present: updatedPresent } };
        }
        return doc;
      }));
      setPreCadastros(prev => prev.map(c => c.id === replacementCandidateId ? { ...c, status: 'APROVADO' } : c));
      alert(`✅ BAIXA REALIZADA\n\n🔄 TRANSFERÊNCIA DE FREQUÊNCIA:\nTodas as presenças de "${nameToReplace}" foram transferidas para "${replacementName}".\n\n🔔 O candidato foi notificado da vaga.`);
    }
  };


  const handleReactivateStudent = async (studentIdOrNome: string) => {
    const targetStudent = students.find(s => s.id === studentIdOrNome || s.nome === studentIdOrNome);
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, status: 'ATIVO' };
      }
      return s;
    }));
    // Persistir no Supabase
    if (targetStudent?.id) {
      await supabase.from('students').update({ status: 'ATIVO', materiais_pendentes: false }).eq('id', targetStudent.id);
    }
  };

  const handleSaveDeclaracao = async (studentIdOrNome: string, declaracao: import('./types').DeclaracaoUniformes) => {
    const student = students.find(s => s.id === studentIdOrNome || s.nome === studentIdOrNome);
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, declaracao_uniformes: declaracao };
      }
      return s;
    }));
    // Persistir no Supabase (delete + insert para evitar duplicatas)
    if (student?.id) {
      await supabase.from('student_declarations').delete().eq('student_id', student.id).eq('type', 'UNIFORMES');
      await supabase.from('student_declarations').insert({
        student_id: student.id,
        type: 'UNIFORMES',
        data: declaracao,
        assinatura: declaracao.assinatura || null,
        data_assinatura: declaracao.data_assinatura || null,
      });
    }
  };

  const handleSaveDeclaracaoProntidao = async (studentIdOrNome: string, declaracao: import('./types').DeclaracaoProntidao) => {
    const student = students.find(s => s.id === studentIdOrNome || s.nome === studentIdOrNome);
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, declaracao_prontidao: declaracao };
      }
      return s;
    }));
    // Persistir no Supabase (delete + insert para evitar duplicatas)
    if (student?.id) {
      await supabase.from('student_declarations').delete().eq('student_id', student.id).eq('type', 'PRONTIDAO');
      await supabase.from('student_declarations').insert({
        student_id: student.id,
        type: 'PRONTIDAO',
        data: declaracao,
        assinatura: (declaracao as any).assinatura || null,
        data_assinatura: (declaracao as any).data_assinatura || null,
      });
    }
  };

  const handleSaveAutorizacaoViagem = async (studentIdOrNome: string, autorizacao: import('./types').AutorizacaoViagem) => {
    const student = students.find(s => s.id === studentIdOrNome || s.nome === studentIdOrNome);
    setStudents(prev => prev.map(s => {
      if (s.id === studentIdOrNome || s.nome === studentIdOrNome) {
        return { ...s, autorizacao_viagem: autorizacao };
      }
      return s;
    }));
    // Persistir no Supabase
    if (student?.id) {
      await supabase.from('student_declarations').delete().eq('student_id', student.id).eq('type', 'AUTORIZACAO_VIAGEM');
      await supabase.from('student_declarations').insert({
        student_id: student.id,
        type: 'AUTORIZACAO_VIAGEM',
        data: autorizacao,
        assinatura: (autorizacao as any).assinatura_responsavel || null,
        data_assinatura: (autorizacao as any).data_assinatura || null,
      });
    }
  };

  // --- RENDER LOGIC ---

  // Estado para núcleo carregado diretamente do Supabase (para formulários públicos sem login)
  const [publicNucleoFromDb, setPublicNucleoFromDb] = useState<Nucleo | null>(null);

  useEffect(() => {
    if (view !== AppView.PUBLIC_FORM || !navParams.nucleoId) return;
    // Se já encontrou nos nucleos locais, não precisa buscar
    const localMatch = resolveNucleoFromIdOrSlug(navParams.nucleoId, nucleos);
    if (localMatch) { setPublicNucleoFromDb(null); return; }
    // Buscar diretamente do Supabase pelo UUID
    const fetchNucleo = async () => {
      try {
        const { data } = await supabase.from('nucleos').select('*').eq('id', navParams.nucleoId).single();
        if (data) {
          const extractUF = (text: string | null | undefined): string | undefined => {
            if (!text) return undefined;
            const match = text.match(/[\s\-–,|\/]+([A-Za-z]{2})\s*$/);
            return match ? match[1].toUpperCase() : undefined;
          };
          const estado = data.estado || extractUF(data.nome) || extractUF(data.address) || undefined;
          setPublicNucleoFromDb({
            id: data.id,
            nome: data.nome,
            project: (navParams.project || 'FORMANDO_CAMPEOES') as ProjectId,
            address: data.address || '',
            city: data.city,
            estado,
            sliNumber: data.sli_number,
            cnpj: data.cnpj,
            razaoSocial: data.razao_social,
          });
          console.log('[PublicForm] Núcleo carregado do Supabase:', data.nome);
        }
      } catch (err) {
        console.warn('[PublicForm] Erro ao buscar núcleo:', err);
      }
    };
    fetchNucleo();
  }, [view, navParams.nucleoId, nucleos]);

  if (view === AppView.PUBLIC_FORM) {
    const publicNucleo = resolveNucleoFromIdOrSlug(navParams.nucleoId, nucleos) || resolveNucleoFromIdOrSlug(navParams.nucleoId, filteredNucleos) || publicNucleoFromDb;
    return (
      <PublicFormView
        serviceId={navParams.service}
        studentId={navParams.studentId}
        projectId={navParams.project as ProjectId | undefined}
        currentNucleo={publicNucleo || undefined}
        onSave={async (data) => {
          if (navParams.service === 'ficha') {
            if (data?.type === 'declaracao_uniformes') {
              return handleSaveDeclaracao(data.studentId, data.declaracao);
            } else if (data?.type === 'declaracao_prontidao') {
              return handleSaveDeclaracaoProntidao(data.studentId, data.declaracao);
            } else if (data?.type === 'autorizacao_viagem') {
              return handleSaveAutorizacaoViagem(data.studentId, data.autorizacao);
            } else if (data?.type === 'INDICADORES_SAUDE' || data?.type === 'PESQUISA_META' || data?.type === 'DECLARACAO_MATRICULA' || data?.categoria || data?.type === 'MATRICULA' || data?.type === 'BOLETIM' || (data?.id && typeof data?.id === 'string' && (data.id.startsWith('saude_') || data.id.startsWith('meta_')))) {
              return handleSaveDocument(data);
            } else {
              return handleSaveStudent(data);
            }
          }
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
            // Persistir no Supabase
            if (supabaseProjectId) {
              supabase.from('pre_cadastros').insert({
                project_id: supabaseProjectId,
                nucleo_id: isValidUUID(data.nucleo_id) ? data.nucleo_id : null,
                status: 'AGUARDANDO',
                nome_aluno: data.nome_aluno,
                data_nascimento: data.data_nascimento || null,
                raca: data.raca || null, pcd: data.pcd || null,
                deficiencia_desc: data.deficiencia_desc || null,
                rg: data.rg || null, cpf: data.cpf || null,
                tipo_escola: data.tipo_escola || null,
                bolsa_estudo: data.bolsa_estudo || null,
                nome_escola: data.nome_escola || null,
                periodo_estudo: data.periodo_estudo || null,
                cursando: data.cursando || null,
                frequencia_atividade: data.frequencia_atividade || null,
                nome_responsavel: data.nome_responsavel || null,
                telefone: data.telefone || null,
                email: data.email || null,
                endereco: data.endereco || null,
                local_moradia: data.local_moradia || null,
                tipo_imovel: data.tipo_imovel || null,
                qtd_pessoas_casa: data.qtd_pessoas_casa || null,
                renda_bruta: data.renda_bruta || null,
                beneficio_gov: data.beneficio_gov || null,
                sistema_saude: data.sistema_saude || null,
                vacinas_dia: data.vacinas_dia || null,
                altura: data.altura || null, peso: data.peso || null,
                sabe_nadar: data.sabe_nadar || null,
                sabe_pedalar: data.sabe_pedalar || null,
                intuito: data.intuito || null,
                restricao_dias: data.restricao_dias || null,
              });
            }
          }
        }}
      />
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }
    if (regRole === 'ADMIN' && !regEstado) {
      setLoginError('Por favor, selecione o Estado de atuação.');
      return;
    }
    if (regRole !== 'ADMIN' && !regNucleo) {
      setLoginError('Por favor, selecione o Núcleo.');
      return;
    }

    setLoading(true);
    setLoginError('');
    try {
      // 1. Cadastrar no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: { data: { nome: regName } },
      });

      if (authError) {
        let msg = authError.message;
        if (msg.includes('already registered')) msg = 'Este e-mail já está cadastrado.';
        if (msg.includes('Password should be')) msg = 'A senha deve ter pelo menos 6 caracteres.';
        setLoginError(msg);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setLoginError('Erro ao criar conta. Tente novamente.');
        setLoading(false);
        return;
      }

      // 2. Buscar project UUID
      const { data: projectData } = await supabase
        .from('projects').select('id').eq('slug', activeProject).single();

      if (projectData) {
        // 3. Criar acesso ao projeto (AGUARDANDO aprovação de admin)
        const { error: insertError } = await supabase.from('user_project_access').insert({
          user_id: authData.user.id,
          project_id: projectData.id,
          nucleo_id: regRole === 'ADMIN' ? null : regNucleo,
          role: regRole,
          is_default: true,
          estado_responsavel: regRole === 'ADMIN' ? regEstado : null,
          status: 'PENDENTE',
        });
        
        if (insertError) {
            console.error('Erro ao inserir acesso:', insertError);
        }

        // Espelhar estado_responsavel na tabela profiles para lookup pré-login
        if (regRole === 'ADMIN' && regEstado) {
          await supabase.from('profiles')
            .update({ estado_responsavel: regEstado })
            .eq('id', authData.user.id);
        }
      }

      // 4. Carregar todos os dados do projeto
      await loadNucleosFromSupabase(activeProject);
      if (projectData) {
        setSupabaseProjectId(projectData.id);
        await loadAllProjectData(projectData.id, activeProject);
      }

      const selectedNucleoObj = regRole !== 'ADMIN' ? nucleos.find(n => n.id === regNucleo) : undefined;
      setUser({
        uid: authData.user.id,
        nome: regName,
        email: regEmail,
        role: regRole,
        nucleo_id: regRole === 'ADMIN' ? null : regNucleo,
        nucleo_nome: selectedNucleoObj?.nome,
        projectId: activeProject,
        status: 'PENDENTE',
        estado_responsavel: regRole === 'ADMIN' ? regEstado : undefined,
      });
      setView(AppView.PENDING_APPROVAL);
      alert(`Cadastro realizado com sucesso! Sua solicitação está em análise.`);
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setLoginError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (view === AppView.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-2 sm:p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">

          <div className="p-6 sm:p-8">
            {/* Logo Carousel - Seletor de Projeto */}
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-full flex items-center justify-center gap-1 mb-2 group relative">
                {/* Seta Esquerda — invisível até hover */}
                <button
                  onClick={() => { const idx = PROJECT_LIST.indexOf(activeProject); if (idx > 0) { setActiveProject(PROJECT_LIST[idx - 1]); setLoginNucleoId(''); setRegNucleo(''); setLoginError(''); } }}
                  className={`p-2 rounded-full transition-all duration-300 ${PROJECT_LIST.indexOf(activeProject) === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-400 hover:text-gray-700 hover:scale-110'}`}
                  disabled={PROJECT_LIST.indexOf(activeProject) === 0}
                  title="Projeto anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {/* Logo com glow de fundo */}
                <div className="relative w-[200px] h-[160px] flex items-center justify-center overflow-visible">
                  {/* Glow / sombra de fundo */}
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-all duration-700 scale-75"
                    style={{ background: activeProject === 'DANIEL_DIAS' ? 'radial-gradient(circle, #0ea5e9 0%, #64748b 40%, transparent 70%)' : activeProject === 'FUTEBOL' ? 'radial-gradient(circle, #22c55e 0%, #15803d 40%, transparent 70%)' : 'radial-gradient(circle, #3b82f6 0%, #06b6d4 40%, transparent 70%)' }}
                  />
                  <img
                    key={activeProject}
                    src={projectAssets.logo}
                    alt={projectAssets.name}
                    className="max-w-[200px] max-h-[160px] w-auto h-auto object-contain relative z-10"
                    style={{ animation: 'fadeSlideIn 0.5s cubic-bezier(0.16,1,0.3,1) both' }}
                  />
                </div>
                {/* Seta Direita — invisível até hover */}
                <button
                  onClick={() => { const idx = PROJECT_LIST.indexOf(activeProject); if (idx < PROJECT_LIST.length - 1) { setActiveProject(PROJECT_LIST[idx + 1]); setLoginNucleoId(''); setRegNucleo(''); setLoginError(''); } }}
                  className={`p-2 rounded-full transition-all duration-300 ${PROJECT_LIST.indexOf(activeProject) === PROJECT_LIST.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-400 hover:text-gray-700 hover:scale-110'}`}
                  disabled={PROJECT_LIST.indexOf(activeProject) === PROJECT_LIST.length - 1}
                  title="Próximo projeto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              {/* Indicadores com cor por projeto */}
              <div className="flex gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full transition-all duration-500 cursor-pointer ${activeProject === 'FORMANDO_CAMPEOES' ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'}`} onClick={() => { setActiveProject('FORMANDO_CAMPEOES'); setLoginNucleoId(''); setRegNucleo(''); }} />
                <span className={`w-2 h-2 rounded-full transition-all duration-500 cursor-pointer ${activeProject === 'DANIEL_DIAS' ? 'bg-sky-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'}`} onClick={() => { setActiveProject('DANIEL_DIAS'); setLoginNucleoId(''); setRegNucleo(''); }} />
                <span className={`w-2 h-2 rounded-full transition-all duration-500 cursor-pointer ${activeProject === 'FUTEBOL' ? 'bg-green-500 scale-125' : 'bg-gray-300 hover:bg-gray-400'}`} onClick={() => { setActiveProject('FUTEBOL'); setLoginNucleoId(''); setRegNucleo(''); }} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{activeProject === 'DANIEL_DIAS' ? 'Instituto Daniel Dias' : activeProject === 'FUTEBOL' ? 'Escolinha de Futebol' : 'Escolinha de Triathlon'}</h2>
              <p className={`mt-1 font-medium text-sm transition-colors duration-500 ${activeProject === 'DANIEL_DIAS' ? 'text-sky-600' : activeProject === 'FUTEBOL' ? 'text-green-600' : 'text-gray-500'}`}>{projectAssets.name}</p>
            </div>

            {/* Toggle Login/Cadastro — cores adaptam ao projeto */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4 relative">
              <button
                onClick={() => setIsRegistering(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 z-10 ${!isRegistering
                  ? (activeProject === 'DANIEL_DIAS' ? 'text-white bg-gradient-to-r from-sky-500 to-slate-400 shadow-sm' : activeProject === 'FUTEBOL' ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm' : 'text-white bg-gradient-to-r from-blue-600 to-teal-500 shadow-sm')
                  : 'text-gray-500 hover:text-gray-700'}`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsRegistering(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 z-10 ${isRegistering
                  ? (activeProject === 'DANIEL_DIAS' ? 'text-white bg-gradient-to-r from-sky-500 to-slate-400 shadow-sm' : activeProject === 'FUTEBOL' ? 'text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-sm' : 'text-white bg-gradient-to-r from-blue-600 to-teal-500 shadow-sm')
                  : 'text-gray-500 hover:text-gray-700'}`}
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
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">E-mail</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Estado / Região</label>
                      <div className="relative">
                        <select
                          value={loginEstado || ''}
                          onChange={(e) => {
                            setLoginEstado(e.target.value || null);
                            setLoginNucleoId(''); // Reset núcleo quando estado muda
                          }}
                          className="block w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2.5 px-3 pr-8 rounded-xl text-sm leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        >
                          <option value="">Todos</option>
                          {availableEstados.map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Núcleo de Atuação</label>
                      <div className="relative">
                        <select
                          value={loginNucleoId}
                          onChange={(e) => setLoginNucleoId(e.target.value)}
                          className="block w-full appearance-none bg-gray-50 border border-gray-200 text-gray-800 font-medium py-2.5 px-3 pr-8 rounded-xl text-sm leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                        >
                          <option value="">Selecione...</option>
                          {loginFilteredNucleos.map(nucleo => (
                            <option key={nucleo.id} value={nucleo.id}>
                              {nucleo.nome.split('-')[0]} {nucleo.address ? ` - ${nucleo.address}` : ''}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Senha</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 pr-10 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                        {showLoginPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className={`w-full text-white py-3 rounded-xl font-bold text-base shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 ${activeProject === 'DANIEL_DIAS' ? 'bg-gradient-to-r from-sky-500 to-slate-500 shadow-sky-500/30 hover:from-sky-600 hover:to-slate-600' : activeProject === 'FUTEBOL' ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-600 to-teal-500 shadow-blue-600/30 hover:from-blue-700 hover:to-teal-600'}`}>
                    {loading ? 'Acessando...' : 'Entrar no Sistema'}
                  </button>
                  {loginError && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium text-center animate-fade-in">
                      ⚠️ {loginError}
                    </div>
                  )}
                </form>
              ) : (
                // --- REGISTER FORM ---
                <form onSubmit={handleRegister} className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">Perfil</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as 'PROFESSOR' | 'COORDENADOR' | 'ADMIN')}
                        className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-[10px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="PROFESSOR">Professor</option>
                        <option value="COORDENADOR">Coordenador</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 ml-1">
                        {regRole === 'ADMIN' ? 'Estado / Região' : 'Núcleo'}
                      </label>
                      {regRole === 'ADMIN' ? (
                        <select
                          value={regEstado}
                          onChange={(e) => setRegEstado(e.target.value)}
                          className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-[10px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="">Selecione o Estado...</option>
                          {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={regNucleo}
                          onChange={(e) => setRegNucleo(e.target.value)}
                          className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-2 text-[10px] font-bold text-gray-800 focus:outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="">Selecione...</option>
                          {filteredNucleos.map(n => (
                            <option key={n.id} value={n.id}>
                              {n.nome.split('-')[0]} {n.address ? ` - ${n.address}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
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
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="block w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 pr-10 text-gray-800 font-medium text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                        {showRegPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className={`w-full text-white py-3 rounded-xl font-bold text-base shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 ${activeProject === 'DANIEL_DIAS' ? 'bg-gradient-to-r from-sky-500 to-slate-500 shadow-sky-500/30 hover:from-sky-600 hover:to-slate-600' : activeProject === 'FUTEBOL' ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-600 to-teal-500 shadow-blue-600/30 hover:from-blue-700 hover:to-teal-600'}`}>
                    {loading ? 'Cadastrando...' : 'Criar Conta'}
                  </button>
                  {loginError && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium text-center animate-fade-in">
                      ⚠️ {loginError}
                    </div>
                  )}
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

  if (view === AppView.PENDING_APPROVAL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in border-t-4 border-yellow-500">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Acesso Pendente</h2>
          <p className="text-gray-600 mb-8">
            Seu cadastro foi recebido com sucesso e está aguardando a aprovação do administrador do projeto. Você receberá acesso assim que for autorizado.
          </p>
          <button 
            onClick={handleLogout}
            className="text-gray-500 font-bold hover:text-gray-800 transition"
          >
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (view === AppView.PDF_BUILDER_VIEW) {
    return <PDFBuilderPreview onBack={() => setView(AppView.DEV_ENVIRONMENT)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {user && view !== AppView.REPORT && view !== AppView.DEV_ENVIRONMENT && view !== AppView.ADMIN_DASHBOARD && view !== AppView.FREQUENCY_REPORT && view !== AppView.PDLIE_REPORT && view !== AppView.INSCRICAO_REPORT && view !== AppView.ASSIDUIDADE_REPORT && view !== AppView.PESQUISA_REPORT && (view as string) !== 'REPORT_BUILDER' && <Header user={user} onLogout={handleLogout} projectLogo={user.projectId === 'DANIEL_DIAS' ? '/logo_Daniel_Dias.png' : user.projectId === 'FUTEBOL' ? '/logo_futebol.png' : '/logo.png'} />}

      <main className={(view === AppView.REPORT || view === AppView.DEV_ENVIRONMENT || view === AppView.FREQUENCY_REPORT || view === AppView.PDLIE_REPORT || view === AppView.INSCRICAO_REPORT || view === AppView.ASSIDUIDADE_REPORT || view === AppView.PESQUISA_REPORT || (view as string) === 'REPORT_BUILDER') ? "" : (view === AppView.ADMIN_DASHBOARD ? "h-screen" : "py-6 print:py-0 print:m-0")}>
        {user && (
          <PDFBuilderSidebar onOpenPreview={() => setView(AppView.PDF_BUILDER_VIEW)} />
        )}

        {view === AppView.ADMIN_DASHBOARD && user && (
          <AdminDashboard
            nucleos={filteredNucleos}
            onNavigateToServices={() => setView(AppView.DASHBOARD)}
            userParams={{ nome: user.nome, email: user.email }}
            currentUser={user}
            onLogout={handleLogout}
            students={projectStudents}
            documents={projectDocuments}
            onAddNucleo={(newNucleo) => setNucleos([...nucleos, { ...newNucleo, project: activeProject }])}
            onDischargeStudent={handleDischargeStudent}
            projectLogo={user.projectId === 'DANIEL_DIAS' ? '/logo_Daniel_Dias.png' : user.projectId === 'FUTEBOL' ? '/logo_futebol.png' : '/logo.png'}
            projectId={activeProject}
            inventory={inventory}
          />
        )}

        {view === AppView.DASHBOARD && (
          <Dashboard
            onNavigate={navigateTo}
            itemsCount={students.length + collectedEvidence.length + collectedDocuments.length}
            onBack={user?.role === 'ADMIN' ? () => setView(AppView.ADMIN_DASHBOARD) : undefined}
            projectId={activeProject}
            nucleoId={user?.nucleo_id || undefined}
            inventory={inventory}
          />
        )}

        {view === AppView.FEATURE_PRE_CADASTRO && (
          <PreCadastroDashboard
            candidates={preCadastros}
            nucleos={filteredNucleos}
            students={projectStudents}
            onAddCandidate={async (data) => {
              setPreCadastros(prev => [...prev, data]);
              if (supabaseProjectId) {
                const { error } = await supabase.from('pre_cadastros').insert({
                  project_id: supabaseProjectId,
                  nucleo_id: isValidUUID(data.nucleo_id) ? data.nucleo_id : null,
                  status: data.status || 'AGUARDANDO',
                  nome_aluno: data.nome_aluno,
                  data_nascimento: data.data_nascimento || null,
                  raca: data.raca || null,
                  pcd: data.pcd || null,
                  deficiencia_desc: data.deficiencia_desc || null,
                  rg: data.rg || null,
                  cpf: data.cpf || null,
                  tipo_escola: data.tipo_escola || null,
                  bolsa_estudo: data.bolsa_estudo || null,
                  nome_escola: data.nome_escola || null,
                  periodo_estudo: data.periodo_estudo || null,
                  cursando: data.cursando || null,
                  frequencia_atividade: data.frequencia_atividade || null,
                  nome_responsavel: data.nome_responsavel || null,
                  telefone: data.telefone || null,
                  email: data.email || null,
                  endereco: data.endereco || null,
                  local_moradia: data.local_moradia || null,
                  tipo_imovel: data.tipo_imovel || null,
                  qtd_pessoas_casa: data.qtd_pessoas_casa || null,
                  renda_bruta: data.renda_bruta || null,
                  beneficio_gov: data.beneficio_gov || null,
                  sistema_saude: data.sistema_saude || null,
                  vacinas_dia: data.vacinas_dia || null,
                  altura: data.altura || null,
                  peso: data.peso || null,
                  sabe_nadar: data.sabe_nadar || null,
                  sabe_pedalar: data.sabe_pedalar || null,
                  intuito: data.intuito || null,
                  id: data.id,
                  restricao_dias: data.restricao_dias || null,
                });
                if (error) console.warn('Erro ao salvar pré-cadastro:', error);
                // The candidate is already added to state with data.id
              }
            }}
            onUpdateCandidate={async (id, updates) => {
              setPreCadastros(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
              await supabase.from('pre_cadastros').update(updates).eq('id', id);
            }}
            onDeleteCandidate={async (id) => {
              setPreCadastros(prev => prev.filter(c => c.id !== id));
              await supabase.from('pre_cadastros').delete().eq('id', id);
            }}
            onBack={() => setView(AppView.DASHBOARD)}
            onOpenPublicForm={() => {
              window.open(window.location.origin + window.location.pathname + '?service=precadastro&token=admin_preview', '_blank');
            }}
          />
        )}

        {view === AppView.FEATURE_OCR && (
          <CameraOCR
            onBack={() => setView(AppView.DASHBOARD)}
            savedStudents={nucleoStudents}
            onSave={handleSaveStudent}
            nucleoId={user?.nucleo_id || undefined}
            currentNucleo={nucleos.find(n => n.id === user?.nucleo_id)}
            onInactivateStudent={handleInactivateStudent}
            onReactivateStudent={handleReactivateStudent}
            collectedDocuments={collectedDocuments}
            onSaveDeclaracao={handleSaveDeclaracao}
            onSaveDeclaracaoProntidao={handleSaveDeclaracaoProntidao}
            baseUrl={window.location.origin + window.location.pathname}
            preCadastros={preCadastros}
            headerImage={projectAssets.header}
          />
        )}

        {view === AppView.FEATURE_DOC_UPLOAD && (
          <DocumentUpload
            docType={navParams.type as DocumentType}
            title={navParams.title || 'Documento'}
            students={nucleoStudents.filter(s => s.status !== 'INATIVO')}
            history={collectedDocuments}
            inventory={inventory}
            nucleos={filteredNucleos}
            currentNucleoId={user?.nucleo_id || undefined}
            onBack={() => setView(AppView.DASHBOARD)}
            onSave={(data) => {
              handleSaveDocument(data);
              // Auto-attach OCR data to student when linked (Declaração de Matrícula)
              if (data.type === 'DECLARACAO_MATRICULA' && data.metaData?.studentId && data.metaData?.ocrData) {
                const sid = data.metaData.studentId;
                const ocr = data.metaData.ocrData;
                setStudents(prev => prev.map(s =>
                  s.id === sid ? {
                    ...s,
                    declaracao_matricula: {
                      ...ocr,
                      imageUrl: data.metaData?.imageUrl || '',
                      dataRegistro: data.timestamp,
                    }
                  } : s
                ));
                // Persist declaração to student in Supabase
                if (supabaseProjectId && isValidUUID(sid)) {
                  supabase.from('students').update({
                    declaracao_matricula: {
                      ...ocr,
                      imageUrl: data.metaData?.imageUrl || '',
                      dataRegistro: data.timestamp,
                    }
                  }).eq('id', sid).then(({ error }) => {
                    if (error) console.warn('Erro ao vincular declaração ao aluno:', error);
                  });
                }
              }
              // Auto-attach boletim data to each linked student (Boletim Escolar)
              if (data.type === 'BOLETIM' && data.metaData?.reports && Array.isArray(data.metaData.reports)) {
                const reports = data.metaData.reports as any[];
                reports.forEach((report: any) => {
                  if (report.studentId) {
                    const boletimData = {
                      url: report.imageUrl || '',
                      timestamp: data.timestamp,
                      grade1: report.grade1,
                      attendance1: report.attendance1,
                      grade2: report.grade2,
                      attendance2: report.attendance2,
                      subjects: report.subjects,
                      status: report.status,
                      avaliacao: report.avaliacao,
                    };
                    setStudents(prev => prev.map(s =>
                      s.id === report.studentId ? {
                        ...s,
                        boletim_escolar: boletimData
                      } : s
                    ));
                    // Persist boletim to student record in Supabase
                    if (supabaseProjectId && isValidUUID(report.studentId)) {
                      supabase.from('students').update({
                        boletim_escolar: boletimData
                      }).eq('id', report.studentId).then(({ error }) => {
                        if (error) console.warn('Erro ao salvar boletim no aluno:', error);
                      });
                    }
                  }
                });
              }
              setView(AppView.DASHBOARD);
            }}
            onUpdateHistory={setCollectedDocuments}
          />
        )}

        {view === AppView.FEATURE_SERVICO_SOCIAL && (
          <ServicoSocialDashboard
            students={students}
            history={collectedDocuments}
            nucleos={filteredNucleos}
            onBack={() => setView(AppView.DASHBOARD)}
            onUpdateHistory={setCollectedDocuments}
          />
        )}

        {view === AppView.FEATURE_CROSS_REFERENCE && (
          <CrossReferenceView
            students={students}
            history={collectedDocuments}
            nucleos={filteredNucleos}
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
            history={projectDocuments.filter(doc => doc.type === 'PESQUISA_META')}
            onSave={handleSaveDocument}
            headerImage={projectAssets.header}
            projectName={projectAssets.name}
          />
        )}

        {view === AppView.FEATURE_SOCIOECONOMIC && (
          <SocioeconomicForm
            onBack={() => setView(AppView.DASHBOARD)}
            history={projectDocuments.filter(doc => doc.type === 'INDICADORES_SAUDE')}
            onSave={handleSaveDocument}
            headerImage={projectAssets.header}
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
             nucleos={filteredNucleos}
             evidences={projectEvidence}
             documents={projectDocuments}
             onUpdateStudent={handleSaveStudent}
             onBack={() => setView(AppView.DASHBOARD)}
          />
        )}

        {view === AppView.DEV_ENVIRONMENT && user && (
          <div className="pt-20"> {/* Add padding to prevent going under header */}
            <AmbienteDesenvolvimento 
              nucleos={filteredNucleos}
              students={projectStudents}
              history={projectDocuments}
              onOpenBuilder={() => setView(AppView.PDF_BUILDER_VIEW)}
              onOpenFrequencyReport={() => setView(AppView.FREQUENCY_REPORT)}
              onOpenPDLIEReport={() => setView(AppView.PDLIE_REPORT)}
              onOpenAssiduidadeReport={() => setView(AppView.ASSIDUIDADE_REPORT)}
              onOpenPesquisaReport={() => setView(AppView.PESQUISA_REPORT)}
              onOpenInscricaoReport={() => setView(AppView.INSCRICAO_REPORT)}
              onOpenReportBuilder={() => setView('REPORT_BUILDER' as any)}
              onBack={() => setView(AppView.DASHBOARD)}
              headerImage={projectAssets.header}
            />
          </div>
        )}

        {view === AppView.FREQUENCY_REPORT && user && (
          <FrequencyReportBuilder
            students={projectStudents}
            history={projectDocuments}
            nucleos={filteredNucleos}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
            headerImage={projectAssets.header}
          />
        )}

        {view === AppView.PDLIE_REPORT && user && (
          <PDLIEReportBuilder
            nucleos={filteredNucleos}
            evidences={projectEvidence}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
            headerImage={projectAssets.header}
          />
        )}

        {view === AppView.ASSIDUIDADE_REPORT && user && (
          <AssiduidadeReportBuilder
            nucleos={filteredNucleos}
            students={projectStudents}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
            headerImage={projectAssets.header}
            projectName={projectAssets.name}
          />
        )}

        {view === AppView.PESQUISA_REPORT && user && (
          <PesquisaReportBuilder
            nucleos={filteredNucleos}
            students={projectStudents}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
            headerImage={projectAssets.header}
            projectName={projectAssets.name}
          />
        )}

        {view === AppView.INSCRICAO_REPORT && user && (
          <InscricaoReportBuilder
            students={projectStudents}
            nucleos={filteredNucleos}
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
            headerImage={projectAssets.header}
            projectName={projectAssets.name}
            history={collectedDocuments}
          />
        )}

        {(view as string) === 'REPORT_BUILDER' && user && (
          <ReportBuilder
            onBack={() => setView(AppView.DEV_ENVIRONMENT)}
            projectName={projectAssets.name}
            students={projectStudents}
            history={projectDocuments}
            evidences={projectEvidence}
            nucleos={filteredNucleos}
            headerImage={projectAssets.header}
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
