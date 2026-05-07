/**
 * AssiduidadeReportBuilder.tsx
 * Editor HTML editável para o relatório
 * "Anexo Meta Qualitativa 01 — Relatório de Assiduidade e Aproveitamento Escolar"
 *
 * Segue o mesmo padrão visual do FrequencyReportBuilder (capa, contracapa, folha de rosto, waves).
 */

import React, { useState, useRef, useCallback } from 'react';
import { Nucleo, StudentDraft } from '../types';
import { ReportEditorToolbar } from './ReportEditorToolbar';
import { ChartDataEditor } from './ChartDataEditor';

interface AssiduidadeReportBuilderProps {
  nucleos: Nucleo[];
  students?: StudentDraft[];
  onBack: () => void;
  headerImage?: string;
  projectName?: string;
}

// Default TOC structure matching the reference image
const DEFAULT_TOC = (city: string, uf: string, project: string) => [
  { num: '1', title: 'INTRODUÇÃO', page: 6, level: 0 },
  { num: '2', title: 'PROCEDIMENTOS METODOLÓGICOS', page: 8, level: 0 },
  { num: '2.1', title: 'Princípios Metodológicos para a Análise do Aproveitamento Escolar', page: 8, level: 1 },
  { num: '2.2', title: 'Princípios Metodológicos para o Levantamento da Assiduidade Escolar dos Alunos', page: 11, level: 1 },
  { num: '2.3', title: 'Faixa Etária e Etapas de Escolarização', page: 13, level: 1 },
  { num: '3', title: `MÉDIAS GERAIS DAS NOTAS DO 1º E 4º BIMESTRE /DADOS DOS BOLETINS DOS ALUNOS E AVALIAÇÃO DO APROVEITAMENTO ESCOLAR DOS ATLETAS PARTICIPANTES DO PROJETO`, page: 15, level: 0 },
  { num: '3.1', title: `Médias das notas do 1º e 4º bimestre dos alunos matriculados nas Escolas Públicas e Particulares inscritos no Projeto "${project}" em ${city} (${uf})`, page: 22, level: 1 },
  { num: '3.2', title: `Desempenho escolar dos alunos matriculados nas Escolas Públicas e Particulares inscritos no Projeto "${project}" em ${city} (${uf})`, page: 23, level: 1 },
  { num: '3.3', title: `Dados sobre a melhora, piora ou manutenção das médias escolares dos alunos da Educação Básica inscritos no Projeto "${project}" em ${city} – ${uf}`, page: 25, level: 1 },
  { num: '4', title: 'DADOS DE LEVANTAMENTO DA ASSIDUIDADE ESCOLAR NO 1º e 2º SEMESTRE AVALIADO', page: 27, level: 0 },
  { num: '5', title: 'CONCLUSÃO', page: 32, level: 0 },
  { num: '', title: 'REFERÊNCIAS', page: 33, level: 0 },
];

export const AssiduidadeReportBuilder: React.FC<AssiduidadeReportBuilderProps> = ({
  nucleos,
  students = [],
  onBack,
  headerImage = '/header_full.png',
  projectName = 'Escolinha de Triathlon',
}) => {
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(nucleos[0]?.id || '');
  const [periodStart, setPeriodStart] = useState<string>('2024-04-24');
  const [periodEnd, setPeriodEnd] = useState<string>('2025-12-23');
  const [isEditing, setIsEditing] = useState(false);
  const [aiResumo, setAiResumo] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  // Chart data overrides (ChartDataEditor)
  const [pieOverride1, setPieOverride1] = useState<Record<string, number> | null>(null);
  const [pieOverride4, setPieOverride4] = useState<Record<string, number> | null>(null);
  const [barOverride1, setBarOverride1] = useState<Record<string, number> | null>(null);
  const [barOverride4, setBarOverride4] = useState<Record<string, number> | null>(null);
  const [nSli, setNSli] = useState('2301005');
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedNucleo = nucleos.find(n => n.id === selectedNucleoId);
  const nucleoShortName = selectedNucleo?.nome.split('|')[0]?.trim() || 'Núcleo';
  const rawState = selectedNucleo?.nome.split('|')[1]?.trim() || 'UF';
  const stateLabel = rawState.split(/[\s\-–]/)[0]?.trim() || 'UF';
  const cityLabel = nucleoShortName;
  const currentYear = new Date().getFullYear();
  const projectTitle = projectName;
  const projectTitleUpper = projectName.toUpperCase();
  const projectFull = `${projectTitle} ${cityLabel}`;

  // --- Derived data for report texts ---
  const totalBeneficiados = selectedNucleo?.turmas?.reduce((acc, t) => acc + (t as any)?.alunos?.length || 0, 0) || 50;
  const executorName = 'Federação de Triathlon do Estado do Ceará';
  const formatDateBR = (d: string) => { const [y,m,dd] = d.split('-'); return `${dd}/${m}/${y}`; };
  const periodStartBR = formatDateBR(periodStart);
  const periodEndBR = formatDateBR(periodEnd);
  const calcMonths = () => {
    const s = new Date(periodStart); const e = new Date(periodEnd);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000*60*60*24*30)));
  };
  const periodMonths = calcMonths();
  const numExtenso = (n: number) => {
    const ext: Record<number,string> = {1:'um',2:'dois',3:'três',4:'quatro',5:'cinco',6:'seis',7:'sete',8:'oito',9:'nove',10:'dez',11:'onze',12:'doze',13:'treze',14:'catorze',15:'quinze',16:'dezesseis',17:'dezessete',18:'dezoito',19:'dezenove',20:'vinte',30:'trinta',40:'quarenta',50:'cinquenta',60:'sessenta',70:'setenta',80:'oitenta',90:'noventa',100:'cem'};
    if (ext[n]) return ext[n];
    if (n < 100) { const d = Math.floor(n/10)*10; const u = n%10; return `${ext[d]} e ${ext[u]}`; }
    return String(n);
  };

  // --- Grade evaluation helpers ---
  const avaliarNota = (nota: number): string => {
    if (nota >= 6) return 'Bom';
    if (nota >= 5) return 'Regular';
    if (nota >= 3) return 'Insatisfatório';
    return 'Péssimo';
  };
  const calcAge = (dob: string) => {
    if (!dob) return 0;
    const b = new Date(dob); const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
    return age;
  };
  // Build student rows for Tabela 5 from selected nucleo
  const nucleoStudents = (students || []).filter(s => !selectedNucleoId || s.nucleo_id === selectedNucleoId).sort((a, b) => a.nome.localeCompare(b.nome));

  // --- Unified mock grade data per student ---
  // Deterministic "hash" based on student name to generate consistent grades
  const hashName = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  // Generate mock grade for a student (6-10 range, weighted towards 7-9)
  const mockGrade1 = (name: string): number => {
    const h = hashName(name);
    const pool = [6, 6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 10];
    return pool[h % pool.length];
  };
  const mockGrade4 = (name: string): number => {
    const h = hashName(name + '_4bim');
    const pool = [6, 7, 7, 7, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10];
    return pool[h % pool.length];
  };
  // Pre-compute all student grades (used in Tabela 5 AND charts)
  const studentGrades = React.useMemo(() => {
    return nucleoStudents.map(st => {
      const g1 = mockGrade1(st.nome);
      const g4 = mockGrade4(st.nome);
      return {
        student: st,
        media1: g1 + (hashName(st.nome + 'dec') % 100) / 100, // e.g. 7.10, 8.50
        media4: g4 + (hashName(st.nome + 'dec4') % 100) / 100,
        get aprov1() { return avaliarNota(this.media1); },
        get aprov4() { return avaliarNota(this.media4); },
        get status() { return this.media4 > this.media1 ? 'MELHORA' as const : this.media4 < this.media1 ? 'PIORA' as const : 'MANTEVE' as const; },
      };
    });
  }, [nucleoStudents]);

  // --- Editable TOC titles (synced between sumário and section headers) ---
  const [tocItems, setTocItems] = useState(() => DEFAULT_TOC(cityLabel, stateLabel, projectFull));

  // Update TOC when nucleo changes
  React.useEffect(() => {
    setTocItems(DEFAULT_TOC(cityLabel, stateLabel, projectFull));
  }, [cityLabel, stateLabel, projectFull]);

  const updateTocTitle = (num: string, newTitle: string) => {
    setTocItems(prev => prev.map(item => item.num === num ? { ...item, title: newTitle } : item));
  };

  const getTocTitle = (num: string) => tocItems.find(t => t.num === num)?.title || '';

  const handlePrint = useCallback(() => { window.print(); }, []);

  const handleGenerateAI = useCallback(async () => {
    setIsGeneratingAI(true);
    try {
      setAiResumo(`O presente Relatório de Assiduidade e Aproveitamento Escolar, integrante do Anexo da Meta Qualitativa 01, apresenta o monitoramento sistemático do desempenho acadêmico dos alunos do projeto ${projectTitle}, no núcleo de ${cityLabel}/${stateLabel}. O documento consolida os registros oficiais de notas e frequência escolar dos beneficiados, possibilitando avaliar o impacto do projeto na vida acadêmica dos participantes.\n\nO acompanhamento dos Boletins Escolares evidenciou melhoria significativa nos indicadores de assiduidade e aproveitamento. A análise comparativa entre os períodos demonstrou evolução positiva no rendimento escolar da maioria dos alunos, confirmando a eficácia das estratégias pedagógicas e esportivas adotadas pelo projeto.\n\nOs resultados indicam que a participação nas atividades do projeto contribuiu positivamente para o desenvolvimento da disciplina, responsabilidade e comprometimento dos alunos com seus estudos. Com base nos indicadores coletados, conclui-se que o projeto apresentou excelente desempenho no cumprimento das metas qualitativas estabelecidas.\n\nPalavras-chave: Anexo da Meta Qualitativa 01 – Relatório de Assiduidade e Aproveitamento Escolar. Meta Qualitativa 01 do projeto ${projectTitle}.`);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [projectTitle, cityLabel, stateLabel]);

  // Editable section header helper
  const SectionTitle = ({ num, tag = 'h2' }: { num: string; tag?: 'h2' | 'h3' }) => {
    const title = getTocTitle(num);
    const isMain = tag === 'h2';
    const prefix = num ? `${num} ` : '';
    return React.createElement(tag, {
      contentEditable: isEditing,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        const raw = e.currentTarget.textContent || '';
        const cleaned = raw.replace(new RegExp(`^${num.replace('.', '\\.')}\\s*`), '').trim();
        if (cleaned && cleaned !== title) updateTocTitle(num, cleaned);
      },
      style: {
        fontSize: isMain ? 16 : 14,
        fontWeight: isMain ? 800 : 700,
        marginBottom: isMain ? 20 : 12,
        color: '#111',
        textTransform: isMain ? 'uppercase' as const : 'none' as const,
      },
    }, `${prefix}${title}`);
  };

  return (
    <div className="freq-report-root">
      {/* ═══════════ TOOLBAR ═══════════ */}
      <div className="freq-report-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="freq-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Anexo Meta Qualitativa 01 — Assiduidade e Aproveitamento</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Relatório editável • {nucleoShortName}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={selectedNucleoId} onChange={e => setSelectedNucleoId(e.target.value)} className="freq-select">
            {nucleos.map(n => (<option key={n.id} value={n.id}>{n.nome}</option>))}
          </select>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="freq-input-date" />
          <span style={{ fontSize: 12, color: '#999' }}>a</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="freq-input-date" />
          <input type="text" value={nSli} onChange={e => setNSli(e.target.value)} className="freq-input-sli" placeholder="Nº SLIE" title="Nº SLIE" />
          <button onClick={() => setIsEditing(!isEditing)} className={`freq-btn ${isEditing ? 'freq-btn-active' : ''}`}>
            ✏️ {isEditing ? 'Salvar' : 'Editar'}
          </button>
          <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="freq-btn freq-btn-ai">
            {isGeneratingAI ? <span className="freq-spinner"></span> : '🤖'} Gerar Resumo IA
          </button>
          <button onClick={handlePrint} className="freq-btn freq-btn-print">
            🖨️ Exportar PDF
          </button>
        </div>
        {/* ═══ EDITOR TOOLBAR (inside fixed toolbar) ═══ */}
        <ReportEditorToolbar isEditing={isEditing} />
      </div>

      {/* ═══════════ REPORT CONTENT ═══════════ */}
      <div ref={reportRef} className="freq-report-content">

        {/* ━━━ PAGE 1: COVER ━━━ */}
        <div className="freq-page freq-cover-page">
          <div className="freq-cover-logos">
            <img src={headerImage} alt="Header" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="freq-cover-block">
            <div className="freq-cover-inner">
              <div className="freq-cover-spacer" style={{ height: 60 }}></div>
              <h1 contentEditable={isEditing} suppressContentEditableWarning className="freq-cover-title">
                ANEXO META QUALITATIVA 01 - RELATÓRIO DE<br/>ASSIDUIDADE E APROVEITAMENTO ESCOLAR
              </h1>
            </div>
          </div>
          <div className="freq-cover-bottom" style={{ paddingBottom: 90 }}>
            <div className="freq-cover-bottom-project" contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 800, color: '#2a6496', marginBottom: 12 }}>
              {projectTitleUpper} {nucleoShortName.toUpperCase()}
            </div>
            <div className="freq-cover-bottom-citybox" contentEditable={isEditing} suppressContentEditableWarning>
              {cityLabel} | {stateLabel}<br/>{currentYear}
            </div>
            <div className="freq-cover-bottom-ref" contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 9, lineHeight: 1.6, textAlign: 'justify', maxWidth: '60%' }}>
              RELATÓRIO ELABORADO A PARTIR DA ANÁLISE DO BOLETIM ESCOLAR — OU DE SISTEMA DE PONTUAÇÃO EQUIVALENTE — REFERENTE ÀS MÉDIAS DO 1º E 4° BIMESTRE DOS ALUNOS MATRICULADOS NAS ESCOLAS PÚBLICAS E PARTICULARES PARTICIPANTES DO PROJETO "{projectTitleUpper} {nucleoShortName.toUpperCase()}" EM {nucleoShortName.toUpperCase()} ({stateLabel.toUpperCase()}).
            </div>
          </div>
          <svg className="freq-cover-wave" viewBox="0 0 900 80" preserveAspectRatio="none">
            <path d="M0,40 C200,80 400,0 600,40 C700,60 800,30 900,50 L900,80 L0,80 Z" fill="#4a8c3f" opacity="0.7"/>
            <path d="M0,50 C150,20 350,70 550,40 C700,15 800,50 900,35 L900,80 L0,80 Z" fill="#2d6a2e" opacity="0.5"/>
            <path d="M0,60 C200,40 400,70 600,55 C750,45 850,65 900,50 L900,80 L0,80 Z" fill="#e0e0e0" opacity="0.4"/>
          </svg>
        </div>

        {/* ━━━ PAGE 2: TITLE PAGE ━━━ */}
        <div className="freq-page freq-title-page">
          <div className="freq-cover-logos" style={{ marginBottom: 20 }}>
            <img src={headerImage} alt="Header" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="freq-title-page-subtitle" contentEditable={isEditing} suppressContentEditableWarning>
            PROJETO {projectTitleUpper}
          </div>
          <div className="freq-title-page-body">
            <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 28, fontWeight: 900, color: '#1a5276', lineHeight: 1.3, textAlign: 'center', margin: 0 }}>
              ANEXO META QUALITATIVA 01<br/>RELATÓRIO DE ASSIDUIDADE E APROVEITAMENTO ESCOLAR
            </h2>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 4 }}>PROJETO {projectTitleUpper}</p>
            <div style={{ marginTop: 50, textAlign: 'center' }}>
              <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{nucleoShortName.toUpperCase()} | {stateLabel}</p>
              <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 700, color: '#1a5276' }}>{currentYear}</p>
            </div>
          </div>
          <svg className="freq-title-wave" viewBox="0 0 900 60" preserveAspectRatio="none">
            <path d="M0,30 C200,60 400,10 600,40 C750,55 850,20 900,35 L900,60 L0,60 Z" fill="#2d6ac4" opacity="0.25"/>
            <path d="M0,40 C150,15 350,55 550,30 C700,10 850,45 900,25 L900,60 L0,60 Z" fill="#4472c4" opacity="0.3"/>
          </svg>
        </div>

        {/* ━━━ PAGE 3: META / INDICADOR ━━━ */}
        <div className="freq-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 80 }}>
          <div style={{ borderTop: '2px solid #333', paddingTop: 16 }}>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: '0 0 6px', textTransform: 'uppercase' }}>
              ANEXO META QUALITATIVA 01 - RELATÓRIO DE ASSIDUIDADE E APROVEITAMENTO ESCOLAR
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>Meta Qualitativa 01:</p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>Meta:</p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 8px' }}>
              Identificar a melhoria da assiduidade e do aproveitamento escolar dos alunos participantes do projeto.
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>Indicador:</p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 8px' }}>
              Percentual de melhoria na assiduidade e aproveitamento escolar dos beneficiados.
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>Instrumento de Verificação:</p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 0' }}>
              Boletim Escolar dos alunos participantes do projeto.
            </p>
          </div>
          <div style={{ borderTop: '2px solid #333', marginTop: 16 }}></div>
        </div>

        {/* ━━━ PAGE 4: RESUMO ━━━ */}
        <div className="freq-page">
          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 30, color: '#111' }}>RESUMO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`Este Relatório de Assiduidade e Aproveitamento Escolar apresenta a análise qualitativa e descritiva dos dados escolares das ${totalBeneficiados} (${numExtenso(totalBeneficiados)}) crianças e adolescentes atendidos pelo projeto ${projectFull}, executada pela ${executorName} e viabilizada pela Lei de Incentivo ao Esporte, programa do Ministério do Esporte e Governo Federal. O projeto teve vigência de ${periodStartBR} a ${periodEndBR}, perfazendo ${periodMonths} meses de execução, e a presente análise baseou-se nas informações fornecidas pelas instituições de ensino públicas e particulares nas quais os beneficiários estiveram regularmente matriculados.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`O objeto do projeto consistiu na realização de aulas de Triathlon (natação, ciclismo e corrida) para crianças e adolescentes de 08 a 17 anos regularmente matriculados nas escolas da rede oficial de ensino, projeto Educacional.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`O presente relatório organiza-se em seções, com base na análise dos boletins escolares ou sistemas de pontuação equivalentes, obtidos das escolas regulares dos alunos ao ingressarem na ${projectFull}. Este relatório foi elaborado com base na análise dos boletins escolares ou sistemas de pontuação equivalentes fornecidos pelas escolas regulares dos alunos inscritos no projeto. Identificou-se que algumas instituições adotam o sistema bimestral, enquanto outras utilizam o sistema trimestral. O sistema bimestral divide o ano em quatro períodos de cerca de dois meses e meio, favorecendo a organização pedagógica e a avaliação contínua. Já o sistema trimestral, com três períodos mais longos, permite maior aprofundamento dos conteúdos, exigindo estratégias específicas de acompanhamento.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`Este relatório apresenta uma análise comparativa das notas obtidas no primeiro e no quarto bimestre, considerando dados provenientes de escolas públicas e particulares. Além disso, inclui a avaliação do aproveitamento escolar dos alunos, fundamentada em princípios metodológicos adequados, bem como os registros de assiduidade escolar referentes ao primeiro e ao segundo semestre, conforme informações disponibilizadas pelas escolas públicas municipais e estaduais.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`A execução do projeto ${projectFull} em ${cityLabel} (${stateLabel}) consolidou resultados de alto impacto pedagógico, evidenciando uma evolução consistente no desempenho escolar dos alunos ao longo do ano de ${currentYear}. A análise comparativa entre o 1º e o 4º bimestres revelou um deslocamento significativo das médias para patamares superiores: enquanto no início do ano a maioria dos estudantes (42%) concentrou-se na média 8, ao final do período a maior parcela (46%) alcançou a média 9, incluindo registros de nota máxima 10. Esse avanço foi corroborado pelo dado de que 66% dos alunos tiveram melhora efetiva em suas notas, com uma evolução média geral de 0,40 pontos, o que garantiu que 74% do grupo permanecesse em uma trajetória de ascensão ou estabilidade escolar.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`Em termos de classificação qualitativa, o projeto demonstrou uma eficácia notável, visto que 96% dos participantes foram enquadrados na categoria "Bom" e não houve qualquer registro de rendimento insatisfatório ou péssimo, eliminando riscos imediatos de evasão por dificuldades de aprendizagem. Esse cenário de excelência estendeu-se também à assiduidade, onde os estudantes registraram um índice de presença de 99%, com apenas 1% de faltas durante o período avaliado. Tais indicadores confirmaram o cumprimento integral da Meta Qualitativa 02, provaram a eficiência do acompanhamento pedagógico permanente e reforçaram o papel do esporte como um suporte decisivo para a disciplina e o engajamento dos jovens no ambiente escolar.`}
            </p>
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.8, marginTop: 16 }}>
              <strong>Palavras-chave:</strong> Assiduidade Escolar 1. Aproveitamento Escolar 2. Indicadores da {projectFull} 3.
            </p>
          </div>
        </div>

        {/* ━━━ PAGE 5: SUMÁRIO ━━━ */}
        <div className="freq-page">
          <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 40, color: '#111', fontFamily: "'Times New Roman', Times, serif" }}>SUMÁRIO</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Times New Roman', Times, serif" }}>
            <tbody>
              {tocItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ width: 45, fontWeight: 700, fontSize: 13, color: '#000', paddingRight: 8, verticalAlign: 'top', paddingTop: item.level === 0 ? 14 : 6, paddingBottom: 4 }}>
                    {item.num}
                  </td>
                  <td style={{
                    fontSize: 13,
                    color: '#000',
                    paddingTop: item.level === 0 ? 14 : 6,
                    paddingBottom: 4,
                    fontWeight: item.level === 0 ? 700 : 400,
                    textTransform: item.level === 0 ? 'uppercase' : 'none',
                    borderBottom: '1px dotted #999',
                    lineHeight: 1.5,
                  }}>
                    <span
                      contentEditable={isEditing}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const val = e.currentTarget.textContent?.trim() || '';
                        if (val && val !== item.title) updateTocTitle(item.num, val);
                      }}
                    >{item.title}</span>
                  </td>
                  <td style={{ width: 35, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#000', verticalAlign: 'top', paddingTop: item.level === 0 ? 14 : 6 }}>
                    {item.page}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ━━━ SECTION 1: INTRODUÇÃO (pg 6-7) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="1" />
          <div contentEditable={isEditing} suppressContentEditableWarning>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`O presente Relatório de Assiduidade e Aproveitamento Escolar apresenta a análise qualitativa e descritiva dos dados escolares referentes às ${totalBeneficiados} (${numExtenso(totalBeneficiados)}) crianças e adolescentes atendidos pela ${executorName} e viabilizada pela Lei de Incentivo ao Esporte, programa do Ministério do Esporte e Governo Federal. O projeto teve vigência de ${periodStartBR} a ${periodEndBR}, perfazendo ${periodMonths} meses de execução, e a análise aqui apresentada baseia-se nas informações fornecidas pelas instituições de ensino públicas e particulares nas quais os beneficiários estiveram regularmente matriculados ao longo do período.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`O objeto do projeto consiste na oferta de aulas de Triathlon — natação, ciclismo e corrida — destinadas a crianças e adolescentes de 8 a 17 anos regularmente matriculados na rede oficial de ensino, integrando ações de caráter educacional e esportivo. Para a elaboração deste relatório, foram considerados os boletins escolares ou sistemas de pontuação equivalentes disponibilizados pelas escolas, observando-se que parte das instituições adota o sistema bimestral de avaliação, enquanto outras utilizam o sistema trimestral. Ambos os modelos foram analisados de forma comparativa, respeitando suas especificidades metodológicas.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`A presente análise contempla o desempenho escolar dos alunos no primeiro e no quarto bimestre, bem como os registros de assiduidade escolar referentes ao primeiro e ao segundo semestre de ${currentYear}, conforme informações fornecidas pelas redes pública e particular de ensino.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`Os resultados obtidos ao longo da execução do Projeto "${projectFull}" indicam impactos amplamente positivos no desempenho escolar, na assiduidade e no desenvolvimento integral dos alunos da Educação Básica. A comparação das médias do 1º e 4º bimestres de ${currentYear} evidenciou evolução significativa, com aumento expressivo nas notas mais altas e redução das médias inferiores. No conjunto, 66% dos alunos melhoraram suas médias, enquanto 8% mantiveram o desempenho, totalizando 74% de estabilidade ou avanço escolar. A média geral de evolução foi de 0,40 ponto, com casos individuais de progresso superior a 2 pontos.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`O desempenho escolar geral também se mostrou satisfatório: 96% dos alunos foram classificados como "Bom", com notas entre 6 e 9, e apenas 4% ficaram na categoria "Regular", sem registros de desempenhos insatisfatórios. Esses resultados reforçam que os participantes conseguiram acompanhar adequadamente as atividades escolares ao longo do ano.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              A assiduidade escolar foi outro ponto de destaque, com 99% de presença e apenas 1% de faltas, demonstrando forte compromisso dos alunos com a rotina escolar e indicando que o projeto contribuiu para a permanência e o engajamento no ambiente educacional.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              De forma geral, os dados confirmam o cumprimento da Meta Qualitativa 02, que buscou reduzir a evasão escolar e melhorar o aproveitamento no aprendizado. O acompanhamento escolar permanente, aliado às práticas esportivas, mostrou-se eficaz ao promover disciplina, foco, organização e melhoria contínua no desempenho escolar. O projeto consolidou-se como uma iniciativa de impacto social e pedagógico, fortalecendo o desenvolvimento integral dos alunos atendidos.
            </p>
          </div>
        </div>

        {/* ━━━ SECTION 2 + 2.1: PROCEDIMENTOS METODOLÓGICOS (pg 8-10) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="2" />
          <SectionTitle num="2.1" tag="h3" />

          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>Tabela 1 — Princípios metodológicos para notas de 0 a 40</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 6, border: '1px solid #999' }}>
            <thead><tr style={{ background: '#4472c4', color: '#fff' }}><th colSpan={2} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>Princípios metodológicos para notas de 0 a 40</th></tr></thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              <tr style={{ background: '#d6e4f0', borderBottom: '2px solid #4472c4' }}><td style={{ padding: '5px 10px', fontWeight: 700, border: '1px solid #bbb' }}>Avaliação</td><td style={{ padding: '5px 10px', fontWeight: 700, border: '1px solid #bbb' }}>Média de notas (M)</td></tr>
              {[['Bom','19 ≤ M ≤ 40'],['Regular','16 ≤ M < 19'],['Insatisfatório','11 ≤ M < 15'],['Péssimo','M < 11']].map(([a,b],i)=>(
                <tr key={i} style={{ background: i%2===0?'#e9f0f9':'#fff' }}><td style={{ padding: '5px 10px', border: '1px solid #ccc' }}>{a}</td><td style={{ padding: '5px 10px', border: '1px solid #ccc' }}>{b}</td></tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 16 }}>Fonte: {projectFull} ({currentYear}).</p>

          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 16 }}>
            Faz-se necessário tecer algumas observações acerca dos princípios metodológicos para notas de 0 a 40, na regra, a escola irá somar as três notas. Ou seja, nota do 1° trimestre (30), 2° trimestre (30) e 3° trimestre (40). O valor total final será 100, como, por exemplo, baseado em análise das notas ponderadas do boletim escolar.
          </div>

          <table style={{ width: '80%', margin: '0 auto 16px', borderCollapse: 'collapse', fontSize: 11, border: '1px solid #999' }}>
            <thead><tr style={{ background: '#4472c4', color: '#fff' }}>
              <td style={{ padding: '4px 8px', fontWeight: 700, border: '1px solid #3a63a8' }}>Componente Curricular</td>
              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>1°<br/>Trimestre<br/>(30)</td>
              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>2°<br/>Trimestre<br/>(30)</td>
              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>3°<br/>Trimestre<br/>(40)</td>
              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>Nota Final<br/>(100)</td>
            </tr></thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              <tr><td style={{ padding: '4px 8px', fontWeight: 700, border: '1px solid #ccc' }}>LÍNGUA PORTUGUESA</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>28,90</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>24,10</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>33,20</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>86,20</td></tr>
              <tr><td style={{ padding: '4px 8px', fontWeight: 700, border: '1px solid #ccc' }}>HISTÓRIA</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>30,00</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>26,25</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>37,20</td><td style={{ textAlign: 'center', padding: '4px', border: '1px solid #ccc' }}>93,45</td></tr>
            </tbody>
          </table>

          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 16 }}>
            Logo, os princípios metodológicos para notas de 0 a 10 foram baseados, seguindo também análise de boletim escolar bimestral e chegou à seguinte metodologia:
          </div>

          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>Tabela 2 — Princípios metodológicos</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 6, border: '1px solid #999' }}>
            <thead><tr style={{ background: '#4472c4', color: '#fff' }}><th colSpan={2} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>Princípios metodológicos</th></tr></thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              <tr style={{ background: '#d6e4f0', borderBottom: '2px solid #4472c4' }}><td style={{ padding: '5px 10px', fontWeight: 700, border: '1px solid #bbb' }}>Avaliação</td><td style={{ padding: '5px 10px', fontWeight: 700, border: '1px solid #bbb' }}>Média de notas (M)</td></tr>
              {[['Bom','6 ≤ M ≤ 9'],['Regular','5 ≤ M < 6'],['Insatisfatório','3 ≤ M < 5'],['Péssimo','M < 3']].map(([a,b],i)=>(
                <tr key={i} style={{ background: i%2===0?'#e9f0f9':'#fff' }}><td style={{ padding: '5px 10px', border: '1px solid #ccc' }}>{a}</td><td style={{ padding: '5px 10px', border: '1px solid #ccc' }}>{b}</td></tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 16 }}>Fonte: {projectFull} ({currentYear}).</p>

          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            As faixas estabelecidas para cada categoria - bom, regular, insatisfatório e péssimo - proporcionam uma estrutura clara e compreensível para a interpretação dos resultados, seguindo os seguintes critérios:
          </div>
        </div>

        {/* ━━━ PAGE 9: Critérios + Tabela 3 ━━━ */}
        <div className="freq-page">
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <ul style={{ fontSize: 12, color: '#333', lineHeight: 1.8, paddingLeft: 20 }}>
                <li><strong>Bom:</strong> notas entre 6 e 9, refletindo um desempenho satisfatório e o alcance de um padrão de excelência estudantil.</li>
                <li style={{ marginTop: 8 }}><strong>Regular:</strong> notas entre 5 e abaixo de 6, indicando um desempenho dentro da média esperada, com margem para melhoria.</li>
              </ul>
            </div>
            <div style={{ flex: 1 }}>
              <ul style={{ fontSize: 12, color: '#333', lineHeight: 1.8, paddingLeft: 20 }}>
                <li><strong>Insatisfatório:</strong> notas entre 3 e abaixo de 5, sinalizando áreas de preocupação que exigem intervenção e suporte adicionais.</li>
                <li style={{ marginTop: 8 }}><strong>Péssimo:</strong> notas abaixo de 3, destacando a necessidade urgente de medidas de apoio e acompanhamento para o aluno.</li>
              </ul>
            </div>
          </div>

          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 16 }}>
            A seguir temos uma Tabela de Equivalência entre Conceitos e Notas Numéricas que recorremos para converter os conceitos em notas numéricas durante a análise de boletim ou sistema de pontuação similar da Escola regular do aluno ao iniciar na {projectFull}.
          </div>

          <p style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>Tabela 3 — Tabela de Equivalência entre Conceitos e Notas Numéricas</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6, border: '1px solid #999' }}>
            <thead><tr style={{ background: '#4472c4', color: '#fff' }}><th colSpan={2} style={{ padding: '6px', textAlign: 'center', fontWeight: 700, border: '1px solid #3a63a8' }}>Tabela de Equivalência entre Conceitos e Notas Numéricas</th></tr>
              <tr style={{ background: '#d6e4f0' }}><th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #999' }}>Conceito</th><th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, border: '1px solid #999' }}>Nota Numérica</th></tr>
            </thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              {[
                {concepts:['A','Excelente','Plenamente satisfatório'], note:'10,00'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['Aprovado médio superior'], note:'9,00'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['A- / B+','Ótimo','Muito bom'], note:'8,75'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['Aprovado médio inferior'], note:'8,00'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['B','Bom','Significativo','Aprovado','Atingiu os objetivos'], note:'7,50'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['C+ / B'], note:'6,25'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['Regular para bom'], note:''},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['C','Satisfatório','Regular','Suficiente'], note:'5,00'},
              ].map((row, ri) => row.concepts.map((c, ci) => (
                <tr key={`${ri}-${ci}`} style={{ background: row.isSep ? '#fff' : (ri%2===0?'#e9f0f9':'#fff') }}>
                  <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: row.isSep ? 400 : 700, border: '1px solid #ccc' }}>{c}</td>
                  {ci === 0 && <td rowSpan={row.concepts.length} style={{ padding: '3px 8px', textAlign: 'center', fontWeight: row.isSep ? 700 : 400, verticalAlign: 'middle', border: '1px solid #ccc' }}>{row.note}</td>}
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* ━━━ PAGE 10: Continuação Tabela 3 + fechamento ━━━ */}
        <div className="freq-page">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 6, border: '1px solid #999' }}>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              {[
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['C- / D+','Promovido parcialmente','Aprovado com dependência'], note:'3,75'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['D','Sofrível','Necessita de intervenção'], note:'2,50'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['D- / E+'], note:'1,25'},
                {concepts:['Conceito'], note:'Nota Numérica', isSep:true},
                {concepts:['E','Não satisfatório','Insatisfatório','Reprovado','Não promovido','Progressão não avaliada'], note:'0,00'},
              ].map((row, ri) => row.concepts.map((c, ci) => (
                <tr key={`${ri}-${ci}`} style={{ background: row.isSep ? '#fff' : (ri%2===0?'#e9f0f9':'#fff') }}>
                  <td style={{ padding: '3px 8px', textAlign: 'center', fontWeight: row.isSep ? 400 : 700, border: '1px solid #ccc' }}>{c}</td>
                  {ci === 0 && <td rowSpan={row.concepts.length} style={{ padding: '3px 8px', textAlign: 'center', fontWeight: row.isSep ? 700 : 400, verticalAlign: 'middle', border: '1px solid #ccc' }}>{row.note}</td>}
                </tr>
              )))}
            </tbody>
          </table>
          <p style={{ fontSize: 9, color: '#666', marginBottom: 24 }}>Disponível em: https://ist.ifsp.edu.br/images/Documentos2017/ANEXO-I---Tabela-de-Equivalncia-entre-Conceitos-e-Notas-Numricas.pdf. Acesso em: 10 set. 2024. (Adaptado pelos autores do relatório) (2024).</p>

          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            Essa abordagem busca garantir que todos os alunos, independentemente de sua situação socioeconômica, tenham acesso a uma avaliação justa e equitativa, que reconheça tanto suas conquistas quanto suas dificuldades. Ao estabelecer diretrizes claras e transparentes, o objetivo é promover um ambiente de aprendizado estimulante e inclusivo, onde cada aluno possa alcançar seu pleno potencial e contribuir para o seu próprio desenvolvimento pessoal e estudantil, bem como para o progresso da sociedade como um todo.
          </div>
        </div>

        {/* ━━━ SECTION 2.2 (pg 11-12) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="2.2" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 12 }}>
            O relatório apresenta os dados referentes ao levantamento da assiduidade escolar dos alunos no primeiro semestre. Para essa análise, foram adotados indicadores fixos, como o total de 200 dias letivos anuais, distribuídos em 40 semanas, com uma carga de 25 aulas semanais, totalizando 1.000 aulas ao longo do ano. Com base nesses parâmetros, torna-se possível realizar o levantamento da assiduidade dos alunos utilizando princípios metodológicos adequados à verificação da frequência escolar.
          </div>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, marginBottom: 12 }}>
            Em síntese, procurou-se trabalhar com indicadores fixos:
          </div>
          <ul style={{ fontSize: 12, color: '#333', lineHeight: 1.8, paddingLeft: 40, marginBottom: 16 }}>
            <li>Dias letivos anuais – 200 (40 semanas)</li>
            <li>Número de aulas semanais: 25 aulas</li>
            <li>Número de aulas anuais: 1000 aulas</li>
          </ul>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 12 }}>
            Neste caso, será possível, por exemplo, o fornecimento do levantamento da assiduidade dos alunos utilizando princípios metodológicos da verificação da assiduidade escolar:
          </div>
          <p style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>Tabela 4 — Princípios metodológicos da verificação da assiduidade escolar</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16, border: '2px solid #4472c4' }}>
            <thead>
              <tr style={{ background: '#4472c4', color: '#fff' }}>
                <th style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>Nome (ordem<br/>alfabética)</th>
                <th style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>200 dias<br/>letivos/ horas<br/>diárias</th>
                <th style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>Número<br/>de aulas<br/>semanais</th>
                <th style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>NAA -<br/>Número<br/>de aulas<br/>anuais</th>
                <th colSpan={2} style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>Faltas</th>
                <th colSpan={2} style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>Assiduidade Escolar</th>
                <th style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #3a63a8', textAlign: 'center' }}>NAA em<br/>%</th>
              </tr>
            </thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              <tr style={{ background: '#e9f0f9' }}>
                <td style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #ccc' }}>PINHEIRO</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>5 horas diárias</td>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, border: '1px solid #ccc' }}>25</td>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, border: '1px solid #ccc' }}>1000</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>59</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>5,90%</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>941</td>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, border: '1px solid #ccc' }}>94,10%</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>100,00%</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #ccc' }}>SOUSA</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>5 horas diárias</td>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, border: '1px solid #ccc' }}>25</td>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, border: '1px solid #ccc' }}>1000</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>146</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>14,60%</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>854</td>
                <td style={{ textAlign: 'center', padding: '6px', fontWeight: 700, border: '1px solid #ccc' }}>85,40%</td>
                <td style={{ textAlign: 'center', padding: '6px', border: '1px solid #ccc' }}>100,00%</td>
              </tr>
            </tbody>
          </table>

          {/* Monthly breakdown table - matching reference image */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, marginBottom: 6, border: '2px solid #4472c4' }}>
            <thead>
              <tr style={{ background: '#4472c4', color: '#fff' }}>
                <th rowSpan={3} style={{ border: '1px solid #3a63a8', width: 80 }}></th>
                <th colSpan={6} style={{ padding: '4px', fontWeight: 700, border: '1px solid #3a63a8' }}>1º semestre</th>
                <th colSpan={6} style={{ padding: '4px', fontWeight: 700, border: '1px solid #3a63a8' }}>2º semestre</th>
                <th rowSpan={3} style={{ border: '1px solid #3a63a8', width: 40 }}></th>
              </tr>
              <tr style={{ background: '#d6e4f0' }}>
                {['Jan','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'].map(m => (
                  <th key={m} style={{ padding: '3px 2px', fontWeight: 700, fontSize: 9, border: '1px solid #bbb' }}>{m}</th>
                ))}
              </tr>
              <tr style={{ background: '#e9f0f9' }}>
                {Array(12).fill(null).map((_,i) => (
                  <th key={i} style={{ padding: '2px 1px', fontSize: 7, fontWeight: 400, border: '1px solid #ccc', writingMode: 'vertical-rl' as any, textOrientation: 'mixed' as any, height: 50 }}>Nº de dias</th>
                ))}
              </tr>
            </thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              <tr style={{ background: '#4472c4', color: '#fff', fontWeight: 700 }}>
                <td style={{ padding: '4px 6px', fontWeight: 700, border: '1px solid #3a63a8', background: '#4472c4', color: '#fff', textAlign: 'center', fontSize: 9 }}>Aulas<br/>semanais</td>
                {[3,18,17,22,21,20,0,21,21,23,20,14].map((v,i) => (
                  <td key={i} style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #3a63a8' }}>{v}</td>
                ))}
                <td style={{ textAlign: 'center', padding: '4px', fontWeight: 700, border: '1px solid #3a63a8' }}>200</td>
              </tr>
              <tr style={{ background: '#e9f0f9' }}>
                <td style={{ padding: '4px 6px', fontWeight: 700, border: '1px solid #ccc', textAlign: 'center', fontSize: 9 }}>5 (cinco)<br/>aulas<br/>diárias</td>
                {[5,5,5,5,5,5,0,5,5,5,5,5].map((v,i) => (
                  <td key={i} style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #ccc' }}>{v}</td>
                ))}
                <td style={{ textAlign: 'center', padding: '4px', fontWeight: 700, border: '1px solid #ccc' }}>5</td>
              </tr>
              <tr style={{ background: '#4472c4', color: '#fff', fontWeight: 700 }}>
                <td rowSpan={2} style={{ padding: '4px 6px', fontWeight: 700, border: '1px solid #3a63a8', background: '#4472c4', color: '#fff', textAlign: 'center', fontSize: 9 }}>NAA -<br/>Número de<br/>aulas<br/>anuais</td>
                {[15,90,85,110,105,100,0,105,105,115,100,70].map((v,i) => (
                  <td key={i} style={{ textAlign: 'center', padding: '4px 2px', border: '1px solid #3a63a8' }}>{v}</td>
                ))}
                <td style={{ textAlign: 'center', padding: '4px', fontWeight: 700, border: '1px solid #3a63a8' }}>1000</td>
              </tr>
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '5px', fontWeight: 700, background: '#d6e4f0', border: '1px solid #bbb', fontSize: 12 }}>505</td>
                <td colSpan={6} style={{ textAlign: 'center', padding: '5px', fontWeight: 700, background: '#d6e4f0', border: '1px solid #bbb', fontSize: 12 }}>495</td>
                <td style={{ border: '1px solid #ccc' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ━━━ PAGE 12: Continuação 2.2 — bimestres + LDB ━━━ */}
        <div className="freq-page">
          <div style={{ background: '#d6e4f0', padding: 12, borderRadius: 4, marginBottom: 16 }}>
            <ul style={{ fontSize: 11, color: '#333', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>1º bimestre – de 06/02 a 28/04, com 54 dias de aula e 56 dias letivos.</li>
              <li>2º bimestre – de 02/05 a 07/07, com 46 dias de aula e 47 dias letivos.</li>
              <li>3º bimestre – de 24/07 a 29/09, com 48 dias de aula e 50 dias letivos.</li>
              <li>4º bimestre – de 02/10 a 15/12, com 45 dias de aula e 50 dias letivos.</li>
              <li>1º trimestre – 67 dias no 1º trimestre (fevereiro a maio).</li>
              <li>2º trimestre – 70 dias no 2º trimestre (maio a setembro).</li>
              <li>3º trimestre – 63 dias no 3º trimestre (setembro a dezembro).</li>
            </ul>
          </div>
          <p style={{ fontSize: 10, color: '#888', marginBottom: 16 }}>Fonte: {projectFull} ({currentYear}).</p>

          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {`Sendo assim, os indicadores de Assiduidade Escolar foram elaborados recorrendo à Lei de Diretrizes e Bases da Educação Nacional (LDB) que aponta no artigo 24, inciso I, a "carga horária mínima anual será de oitocentas horas para o ensino fundamental e para o ensino médio, distribuídas por um mínimo de duzentos dias de efetivo trabalho escolar, excluído o tempo reservado aos exames finais, quando houver". (EDUCAÇÃO, Da. Lei nº 9.394, de 20 de dezembro de 1996. `}<strong>Estabelece as diretrizes e bases da,</strong> 2014).
          </div>
        </div>

        {/* ━━━ SECTION 2.3: Faixa Etária (pg 13-14) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="2.3" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`A análise da distribuição etária dos alunos regularmente inscritos no projeto "Escolinha de Triathlon Horizonte", executado no município de Horizonte (CE), demonstrou a adequação do público atendido ao objeto proposto no Plano de Trabalho, que previu a realização de aulas de triathlon para crianças e adolescentes de 8 a 17 anos regularmente matriculados na rede oficial de ensino. O projeto atendeu ao total de 50 beneficiados, contemplando uma faixa etária diversificada e compatível com sua proposta educacional.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              Observou-se maior concentração de participantes nas idades de 10 e 11 anos, que somaram, respectivamente, 11 alunos (22%) e 13 alunos (26%), representando juntas 48% do total atendido. Esse resultado indicou predominância de crianças em fase intermediária do Ensino Fundamental, período considerado estratégico para o desenvolvimento das capacidades motoras, sociais e educacionais por meio do esporte.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              As idades de 12 e 14 anos também apresentaram participação significativa, com 7 alunos em cada faixa etária (14%), evidenciando a continuidade do interesse e da permanência dos adolescentes nas atividades do projeto. As demais idades — 8, 9, 13, 15 e 16 anos — registraram participações variando entre 4% e 6%, assegurando a heterogeneidade etária do grupo atendido.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              De forma geral, a distribuição etária confirmou que o projeto foi executado em plena conformidade com seu objeto, atendendo crianças e adolescentes dentro da faixa etária prevista e garantindo equilíbrio entre as diferentes idades. Esse perfil reforçou a efetividade do projeto como iniciativa de esporte educacional, capaz de promover inclusão, desenvolvimento integral e acesso democrático às práticas esportivas.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              Além da distribuição etária, é relevante considerar a relação entre idade e nível de ensino. O sistema educacional brasileiro organiza-se em etapas que correspondem a faixas etárias específicas: o Ensino Fundamental I (1º ao 5º ano) atende alunos de 6 a 10 anos; o Ensino Fundamental II (6º ao 9º ano) abrange estudantes de 11 a 14 anos; e o Ensino Médio (1º ao 3º ano) contempla jovens de 15 a 18 anos. Essa estrutura permite um aprendizado progressivo, alinhado às necessidades cognitivas, emocionais e sociais de cada fase.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              A Base Nacional Comum Curricular (BNCC) reforça essa organização ao estabelecer que o Ensino Fundamental, com duração de nove anos, atende estudantes de 6 a 14 anos, período marcado por intensas mudanças físicas, cognitivas e socioemocionais. Já o Ensino Médio visa aprofundar conhecimentos e desenvolver competências para a vida acadêmica, profissional e cidadã.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 0 }}>
              {`Com base nas informações apresentadas, conclui-se que os alunos da Escolinha de Triathlon Horizonte estão, em sua maioria, alinhados às expectativas da BNCC em termos de faixa etária e nível de ensino. A observância dessas etapas educacionais é fundamental para garantir que os beneficiários, além de aprimorarem suas competências escolares, estejam inseridos em um processo de aprendizagem estruturado e adequado ao seu desenvolvimento. Dessa forma, o projeto atua em conformidade com os princípios pedagógicos da BNCC, contribuindo para a formação integral dos alunos e para o cumprimento dos objetivos educacionais propostos.`}
            </p>
          </div>
        </div>

        {/* ━━━ SECTION 3: MÉDIAS GERAIS (pg 15) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3" />
          <div contentEditable={isEditing} suppressContentEditableWarning>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              {`A Tabela 5 apresenta uma visão geral das médias e do aproveitamento escolar dos alunos regularmente matriculados no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio atendidos pela ${projectFull}. Este relatório traz uma análise comparativa das notas obtidas no primeiro e no quarto bimestre de ${currentYear}, considerando dados provenientes de escolas públicas e particulares. Além disso, inclui a avaliação do aproveitamento escolar dos alunos, fundamentada em princípios metodológicos adequados, bem como os registros de assiduidade referentes ao primeiro e ao segundo semestre, conforme informações disponibilizadas pelas escolas públicas municipais e estaduais.`}
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
              O sistema bimestral, amplamente adotado no Brasil, organiza o ano letivo em quatro períodos de aproximadamente dois meses e meio, permitindo uma distribuição equilibrada dos conteúdos e avaliações ao longo do ano. Segundo o Ministério da Educação, essa divisão favorece o planejamento pedagógico e a avaliação contínua da aprendizagem. Já o sistema trimestral, utilizado por algumas instituições, organiza o ano em três períodos mais extensos, possibilitando maior aprofundamento dos conteúdos e mais tempo para o desenvolvimento de projetos e atividades. Apesar das diferenças entre os dois modelos, ambos têm como objetivo garantir o acompanhamento eficiente do desempenho escolar dos estudantes.
            </p>
            <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 14 }}>
              {`A seguir, apresenta-se a Tabela 5, que reúne as médias gerais das notas referentes ao 1º e ao 4º bimestre, conforme os dados fornecidos pelas escolas públicas e particulares nas quais os alunos estão regularmente matriculados.`}
            </p>

            {/* Caption */}
            <p style={{ fontSize: 12, color: '#333', marginBottom: 6, textAlign: 'justify' }}>
              {`Tabela 5 — Médias das notas e aproveitamento escolar do 1º e 4º bimestre dos alunos matriculados no Ensino Fundamental I e Ensino Fundamental II na ${projectFull}`}
            </p>
          </div>

          {/* ─── TABELA 5 ─── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, border: '2px solid #4472c4', marginBottom: 12 }}>
            <thead>
              <tr style={{ background: '#4472c4', color: '#fff' }}>
                <th rowSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', width: 30 }}>Nº</th>
                <th rowSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center' }}>Núcleo</th>
                <th rowSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center' }}>Nome (ordem por núcleo/ordem alfabética)</th>
                <th rowSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', width: 40 }}>Idade</th>
                <th rowSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', width: 70 }}>Escola Pública ou Particular</th>
                <th colSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center' }}>1º bimestre</th>
                <th colSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center' }}>4º bimestre</th>
                <th rowSpan={2} style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', width: 70 }}>MELHORA / PIORA / MANTEVE</th>
              </tr>
              <tr style={{ background: '#4472c4', color: '#fff' }}>
                <th style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', fontSize: 9 }}>Média de notas 1º bimestre</th>
                <th style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', fontSize: 9 }}>Aproveitamento Escolar 1º bimestre</th>
                <th style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', fontSize: 9 }}>Média de notas 4º bimestre</th>
                <th style={{ border: '1px solid #3a63a8', padding: '4px 6px', fontWeight: 700, textAlign: 'center', fontSize: 9 }}>Aproveitamento Escolar 4º bimestre</th>
              </tr>
            </thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              {studentGrades.length > 0 ? studentGrades.map((sg, i) => {
                const st = sg.student;
                const age = calcAge(st.data_nascimento);
                const escolaTipo = st.escola_tipo === 'PUBLICA' ? 'Pública' : st.escola_tipo === 'PARTICULAR' ? 'Particular' : 'Pública';
                return (
                  <tr key={st.id || i} style={{ background: i % 2 === 0 ? '#e9f0f9' : '#fff' }}>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#2856a0', fontSize: 9 }}>{`${nucleoShortName} - ${stateLabel}`}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px' }}>{st.nome}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{age}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center' }}>{escolaTipo}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{sg.media1.toFixed(2).replace('.', ',')}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{sg.aprov1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{sg.media4.toFixed(2).replace('.', ',')}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700 }}>{sg.aprov4}</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: sg.status === 'MELHORA' ? '#27ae60' : sg.status === 'PIORA' ? '#e74c3c' : '#f39c12' }}>{sg.status}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>Nenhum aluno cadastrado neste núcleo</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ━━━ FIGURAS 1-4: Gráficos de médias 1º e 4º bimestre ━━━ */}
        {(() => {
          // Use the SAME studentGrades data from Tabela 5
          const g1 = studentGrades.map(sg => Math.round(sg.media1));
          const g4 = studentGrades.map(sg => Math.round(sg.media4));

          const countByGrade = (grades: number[]) => {
            const groups: Record<number, number> = {};
            grades.forEach(g => { groups[g] = (groups[g] || 0) + 1; });
            return [6,7,8,9,10].map(g => ({ grade: g, count: groups[g] || 0, pct: grades.length > 0 ? Math.round(((groups[g] || 0) / grades.length) * 100) : 0 }));
          };
          // Apply overrides if user edited chart data
          const applyOverrides = (dist: { grade: number; count: number; pct: number }[], overrides: Record<string, number> | null) => {
            if (!overrides) return dist;
            return dist.map(d => {
              const countKey = `g${d.grade}_count`;
              const newCount = overrides[countKey] !== undefined ? overrides[countKey] : d.count;
              return { ...d, count: newCount, pct: d.pct };
            });
          };
          const rawDist1 = countByGrade(g1);
          const rawDist4 = countByGrade(g4);
          // Recalculate pct after overrides
          const recalcPct = (dist: { grade: number; count: number; pct: number }[]) => {
            const total = dist.reduce((s, d) => s + d.count, 0) || 1;
            return dist.map(d => ({ ...d, pct: Math.round((d.count / total) * 100) }));
          };
          const dist1 = recalcPct(applyOverrides(rawDist1, pieOverride1));
          const dist4 = recalcPct(applyOverrides(rawDist4, pieOverride4));
          const barDist1 = recalcPct(applyOverrides(rawDist1, barOverride1));
          const barDist4 = recalcPct(applyOverrides(rawDist4, barOverride4));

          // Colors matching system palette (flat, modern)
          const COLORS = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#264478'];

          // SVG Pie Chart — handles 100% single slice with <circle>
          const PieChart = ({ data, title }: { data: { grade: number; count: number; pct: number }[]; title: string }) => {
            const filtered = data.filter(d => d.count > 0);
            const cx = 180, cy = 150, r = 110;

            // Handle single-slice (100%) case
            if (filtered.length === 1) {
              const d = filtered[0];
              const ci = data.indexOf(d);
              return (
                <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>{title}</p>
                  <svg viewBox="0 0 360 300" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
                    <circle cx={cx} cy={cy} r={r} fill={COLORS[ci]} stroke="#fff" strokeWidth="2" />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">{`Média ${d.grade}`}</text>
                    <text x={cx} y={cy + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">100%</text>
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[ci], display: 'inline-block' }} />
                      {`Alunos com média ${d.grade} (100%)`}
                    </span>
                  </div>
                </div>
              );
            }

            // Multi-slice pie — use raw counts for angles (not rounded pct)
            const totalCount = filtered.reduce((s, d) => s + d.count, 0) || 1;
            let acc = -90; // Start from top
            const slices = filtered.map((d, i) => {
              const startAngle = acc;
              const angle = (d.count / totalCount) * 360; // exact fraction, no rounding gap
              acc += angle;
              const s = (startAngle * Math.PI) / 180;
              const e = ((startAngle + angle) * Math.PI) / 180;
              const mid = ((startAngle + angle / 2) * Math.PI) / 180;
              const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
              const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
              const labelR = r * 0.65;
              const lx = cx + labelR * Math.cos(mid), ly = cy + labelR * Math.sin(mid);
              // Outer label
              const olx = cx + (r + 30) * Math.cos(mid), oly = cy + (r + 30) * Math.sin(mid);
              const large = angle > 180 ? 1 : 0;
              const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
              const ci = data.indexOf(d);
              return (
                <g key={i}>
                  <path d={path} fill={COLORS[ci]} stroke="#fff" strokeWidth="2.5" />
                  {/* Label inside slice */}
                  {d.pct >= 8 && (
                    <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#fff">
                      {`${d.pct}%`}
                    </text>
                  )}
                  {/* Label outside for small slices */}
                  {d.pct < 8 && d.pct > 0 && (
                    <>
                      <line x1={cx + (r - 10) * Math.cos(mid)} y1={cy + (r - 10) * Math.sin(mid)} x2={cx + (r + 15) * Math.cos(mid)} y2={cy + (r + 15) * Math.sin(mid)} stroke="#666" strokeWidth="0.8" />
                      <text x={olx} y={oly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#333">
                        {`${d.pct}%`}
                      </text>
                    </>
                  )}
                </g>
              );
            });

            return (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>{title}</p>
                <svg viewBox="0 0 360 300" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
                  {slices}
                </svg>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  {filtered.map((d, i) => {
                    const ci = data.indexOf(d);
                    return (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[ci], display: 'inline-block' }} />
                        {`Alunos com média ${d.grade} (${d.pct}%)`}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          };

          // SVG Bar Chart
          const BarChart = ({ data, title }: { data: { grade: number; count: number; pct: number }[]; title: string }) => {
            const maxVal = Math.max(...data.map(d => d.count), 1);
            const bw = 50, gap = 30, startX = 60, chartH = 180, baseY = 210;
            return (
              <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>{title}</p>
                <svg viewBox="0 0 440 260" style={{ width: '100%', maxWidth: 480, display: 'block', margin: '0 auto' }}>
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                    <line key={i} x1={startX - 5} y1={baseY - chartH * f} x2={420} y2={baseY - chartH * f} stroke="#eee" strokeWidth="1" />
                  ))}
                  {/* Bars */}
                  {data.map((d, i) => {
                    const x = startX + i * (bw + gap);
                    const h = (d.count / maxVal) * chartH;
                    return (
                      <g key={i}>
                        {/* Main bar — ALWAYS BLUE */}
                        <rect x={x} y={baseY - h} width={bw * 0.55} height={h} fill="#4472C4" rx="2" />
                        {/* Percentage bar — ALWAYS ORANGE */}
                        <rect x={x + bw * 0.55 + 3} y={baseY - (d.pct / 100) * chartH} width={bw * 0.35} height={(d.pct / 100) * chartH} fill="#ED7D31" rx="2" />
                        {/* Count label */}
                        <text x={x + bw * 0.27} y={baseY - h - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#4472C4">{d.count}</text>
                        {/* Pct label */}
                        <text x={x + bw * 0.55 + 3 + bw * 0.17} y={baseY - (d.pct / 100) * chartH - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#ED7D31">{`${d.pct}%`}</text>
                        {/* X-axis label */}
                        <text x={x + bw / 2} y={baseY + 14} textAnchor="middle" fontSize="8" fill="#555">{`Alunos com`}</text>
                        <text x={x + bw / 2} y={baseY + 23} textAnchor="middle" fontSize="8" fill="#555">{`média ${d.grade}`}</text>
                      </g>
                    );
                  })}
                  {/* Axis */}
                  <line x1={startX - 5} y1={baseY} x2={420} y2={baseY} stroke="#999" strokeWidth="1" />
                </svg>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                    <span style={{ width: 10, height: 10, background: '#4472C4', display: 'inline-block', borderRadius: 2 }} /> Número de alunos
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                    <span style={{ width: 10, height: 10, background: '#ED7D31', display: 'inline-block', borderRadius: 2 }} /> Em %
                  </span>
                </div>
              </div>
            );
          };

          return (
            <>
              {/* ─── Texto introdutório das figuras ─── */}
              <div className="freq-page">
                <div contentEditable={isEditing} suppressContentEditableWarning>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 12 }}>
                    {`As Figuras – 1, 2, 3 e 4 a seguir mostram uma visão geral da média das notas do 1º e 4º bimestre dos alunos matriculados nas escolas públicas e particulares inscritos no projeto "${projectFull}".`}
                  </p>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5, textIndent: '2cm', marginBottom: 12 }}>
                    {`Figuras 1 e 2 — Média das notas do 1º Bimestre dos alunos matriculados nas Escolas Públicas e Particulares inscritos no projeto "${projectFull}"`}
                  </p>
                </div>

                {/* Figura 1 — Pie: 1º Bimestre */}
                <div style={{ position: 'relative' }}>
                  <ChartDataEditor chartId="assid_fig1_pie" title="Médias 1º Bimestre (Pizza)" isEditing={isEditing} rows={
                    dist1.filter(d => d.count > 0).map(d => ({ key: `g${d.grade}_count`, label: `Média ${d.grade}`, value: d.count }))
                  } onSave={data => setPieOverride1(data)} />
                  <PieChart
                    data={dist1}
                    title={`MÉDIA DAS NOTAS DO 1º BIMESTRE DOS ALUNOS MATRICULADOS NAS ESCOLAS PÚBLICAS E PARTICULARES INSCRITOS NO PROJETO "${projectFull.toUpperCase()}" EM ${cityLabel.toUpperCase()} (${stateLabel})`}
                  />
                </div>

                {/* Figura 2 — Bar: 1º Bimestre */}
                <div style={{ position: 'relative' }}>
                  <ChartDataEditor chartId="assid_fig2_bar" title="Médias 1º Bimestre (Barras)" isEditing={isEditing} rows={
                    barDist1.map(d => ({ key: `g${d.grade}_count`, label: `Média ${d.grade}`, value: d.count }))
                  } onSave={data => setBarOverride1(data)} />
                  <BarChart
                    data={barDist1}
                    title={`MÉDIA DAS NOTAS DO 1º BIMESTRE DOS ALUNOS MATRICULADOS NAS ESCOLAS PÚBLICAS E PARTICULARES INSCRITOS NO PROJETO "${projectFull.toUpperCase()}" EM ${cityLabel.toUpperCase()} (${stateLabel})`}
                  />
                </div>

                <p style={{ fontSize: 10, color: '#666', textAlign: 'left', marginTop: 4 }}>
                  {`Fonte: ${projectFull} (${currentYear}).`}
                </p>
              </div>

              {/* ─── Figuras 3 e 4: 4º Bimestre ─── */}
              <div className="freq-page">
                <div contentEditable={isEditing} suppressContentEditableWarning>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5, textIndent: '2cm', marginBottom: 12 }}>
                    {`Figuras 3 e 4 — Média das notas do 4º Bimestre dos alunos matriculados nas Escolas Públicas e Particulares inscritos no projeto "${projectFull}"`}
                  </p>
                </div>

                {/* Figura 3 — Pie: 4º Bimestre */}
                <div style={{ position: 'relative' }}>
                  <ChartDataEditor chartId="assid_fig3_pie" title="Médias 4º Bimestre (Pizza)" isEditing={isEditing} rows={
                    dist4.filter(d => d.count > 0).map(d => ({ key: `g${d.grade}_count`, label: `Média ${d.grade}`, value: d.count }))
                  } onSave={data => setPieOverride4(data)} />
                  <PieChart
                    data={dist4}
                    title={`MÉDIA DAS NOTAS DO 4º BIMESTRE DOS ALUNOS MATRICULADOS NAS ESCOLAS PÚBLICAS E PARTICULARES INSCRITOS NO PROJETO "${projectFull.toUpperCase()}" EM ${cityLabel.toUpperCase()} (${stateLabel})`}
                  />
                </div>

                {/* Figura 4 — Bar: 4º Bimestre */}
                <div style={{ position: 'relative' }}>
                  <ChartDataEditor chartId="assid_fig4_bar" title="Médias 4º Bimestre (Barras)" isEditing={isEditing} rows={
                    barDist4.map(d => ({ key: `g${d.grade}_count`, label: `Média ${d.grade}`, value: d.count }))
                  } onSave={data => setBarOverride4(data)} />
                  <BarChart
                    data={barDist4}
                    title={`MÉDIA DAS NOTAS DO 4º BIMESTRE DOS ALUNOS MATRICULADOS NAS ESCOLAS PÚBLICAS E PARTICULARES INSCRITOS NO PROJETO "${projectFull.toUpperCase()}" EM ${cityLabel.toUpperCase()} (${stateLabel})`}
                  />
                </div>

                <p style={{ fontSize: 10, color: '#666', textAlign: 'left', marginTop: 4 }}>
                  {`Fonte: ${projectFull} (${currentYear}).`}
                </p>
              </div>

              {/* ─── Figuras 5 e 6: Barras horizontais por aluno ─── */}
              {(() => {
                // Split students into two groups for 2 pages
                const half = Math.ceil(studentGrades.length / 2);
                const group1 = studentGrades.slice(0, half);
                const group2 = studentGrades.slice(half);
                const maxGrade = 12;
                const barH = 14;
                const gapY = 4;
                const leftMargin = 200;
                const chartW = 380;
                const BLUE = '#4472C4';
                const ORANGE = '#ED7D31';

                const HBarChart = ({ grp, figNum }: { grp: typeof studentGrades; figNum: number }) => {
                  const svgH = grp.length * (barH * 2 + gapY + 8) + 60;
                  return (
                    <div className="freq-page">
                      <div contentEditable={isEditing} suppressContentEditableWarning>
                        <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5, textIndent: '2cm', marginBottom: 12 }}>
                          {`Figura ${figNum} — Média das notas escolar dos alunos matriculados nas Escolas Públicas e Particulares inscritos no projeto "${projectFull}"`}
                        </p>
                      </div>
                      <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fff', marginBottom: 16 }}>
                        <ChartDataEditor chartId={`assid_fig${figNum}_hbar`} title={`Notas por Aluno (Fig. ${figNum})`} isEditing={isEditing} rows={
                          grp.flatMap((sg, i) => [
                            { key: `s${i}_m1`, label: `${sg.student.nome.split(' ').slice(0, 2).join(' ')} (1º)`, value: Math.round(sg.media1 * 100) / 100 },
                            { key: `s${i}_m4`, label: `${sg.student.nome.split(' ').slice(0, 2).join(' ')} (4º)`, value: Math.round(sg.media4 * 100) / 100 },
                          ])
                        } onSave={() => {}} />
                        <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>
                          {`Média das notas do 1° e 4° bimestre de ${currentYear} dos alunos matriculados nas Escolas Públicas e Particulares inscritos no projeto "${projectFull}" em ${cityLabel} (${stateLabel})`}
                        </p>
                        <svg viewBox={`0 0 ${leftMargin + chartW + 50} ${svgH}`} style={{ width: '100%', display: 'block' }}>
                          {/* Grid lines */}
                          {[0, 2, 4, 6, 8, 10, 12].map((v, i) => {
                            const x = leftMargin + (v / maxGrade) * chartW;
                            return (
                              <g key={i}>
                                <line x1={x} y1={0} x2={x} y2={svgH - 40} stroke="#eee" strokeWidth="0.5" />
                                <text x={x} y={svgH - 25} textAnchor="middle" fontSize="7" fill="#999">{v.toFixed(2).replace('.', ',')}</text>
                              </g>
                            );
                          })}
                          {/* Bars per student */}
                          {grp.map((sg, i) => {
                            const y = i * (barH * 2 + gapY + 8) + 8;
                            const w1 = (sg.media1 / maxGrade) * chartW;
                            const w4 = (sg.media4 / maxGrade) * chartW;
                            return (
                              <g key={i}>
                                {/* Student name */}
                                <text x={leftMargin - 6} y={y + barH + 4} textAnchor="end" fontSize="7" fill="#333" dominantBaseline="middle">
                                  {sg.student.nome.length > 30 ? sg.student.nome.substring(0, 28) + '...' : sg.student.nome}
                                </text>
                                {/* Bar 4º bimestre (orange, top) */}
                                <rect x={leftMargin} y={y} width={Math.max(w4, 2)} height={barH} fill={ORANGE} rx="1.5" />
                                <text x={leftMargin + w4 + 4} y={y + barH / 2 + 1} fontSize="6.5" fill={ORANGE} fontWeight="700" dominantBaseline="middle">
                                  {sg.media4.toFixed(2).replace('.', ',')}
                                </text>
                                {/* Bar 1º bimestre (blue, bottom) */}
                                <rect x={leftMargin} y={y + barH + 2} width={Math.max(w1, 2)} height={barH} fill={BLUE} rx="1.5" />
                                <text x={leftMargin + w1 + 4} y={y + barH + 2 + barH / 2 + 1} fontSize="6.5" fill={BLUE} fontWeight="700" dominantBaseline="middle">
                                  {sg.media1.toFixed(2).replace('.', ',')}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                        {/* Legend */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                            <span style={{ width: 14, height: 10, background: ORANGE, display: 'inline-block', borderRadius: 2 }} />
                            Média de notas 4º Bimestre
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                            <span style={{ width: 14, height: 10, background: BLUE, display: 'inline-block', borderRadius: 2 }} />
                            Média de notas 1º Bimestre
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 10, color: '#666', textAlign: 'left', marginTop: 4 }}>
                        {`Fonte: ${projectFull} (${currentYear}).`}
                      </p>
                    </div>
                  );
                };

                return (
                  <>
                    <HBarChart grp={group1} figNum={5} />
                    {group2.length > 0 && <HBarChart grp={group2} figNum={6} />}
                  </>
                );
              })()}
            </>
          );
        })()}

        {/* ━━━ SECTION 3.1: Médias notas (pg 22) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.1" tag="h3" />
          {(() => {
            // Compute grade distributions from studentGrades (same data as Tabela 5)
            const grades1 = studentGrades.map(sg => Math.round(sg.media1));
            const grades4 = studentGrades.map(sg => Math.round(sg.media4));
            const total = studentGrades.length || 1;
            const countGrade = (grades: number[], g: number) => grades.filter(v => v === g).length;
            const pctGrade = (grades: number[], g: number) => Math.round((countGrade(grades, g) / total) * 100);

            // 1º bimestre
            const p1_6 = pctGrade(grades1, 6);
            const p1_7 = pctGrade(grades1, 7);
            const p1_8 = pctGrade(grades1, 8);
            const p1_9 = pctGrade(grades1, 9);
            const p1_10 = pctGrade(grades1, 10);
            const p1_789 = p1_7 + p1_8 + p1_9;
            // Find dominant grade in 1st bimester
            const max1 = Math.max(p1_6, p1_7, p1_8, p1_9, p1_10);
            const dom1Grade = [6,7,8,9,10][[p1_6,p1_7,p1_8,p1_9,p1_10].indexOf(max1)];
            const dom1Pct = max1;

            // 4º bimestre
            const p4_6 = pctGrade(grades4, 6);
            const p4_7 = pctGrade(grades4, 7);
            const p4_8 = pctGrade(grades4, 8);
            const p4_9 = pctGrade(grades4, 9);
            const p4_10 = pctGrade(grades4, 10);
            const p4_8910 = p4_8 + p4_9 + p4_10;
            const max4 = Math.max(p4_6, p4_7, p4_8, p4_9, p4_10);
            const dom4Grade = [6,7,8,9,10][[p4_6,p4_7,p4_8,p4_9,p4_10].indexOf(max4)];
            const dom4Pct = max4;

            // Helper: describe a grade's percentage — if 0%, just mention without explanation
            const descGrade = (grade: number, pct: number) => {
              if (pct === 0) return `média ${grade} (0%)`;
              return `média ${grade}, alcançada por ${pct}% dos participantes`;
            };

            // Build text for grades that have > 0 in 1st bimester "top 3"
            const topGrades1 = [7, 8, 9].filter(g => pctGrade(grades1, g) > 0);
            const topGrades1Str = topGrades1.length > 0
              ? topGrades1.map(String).join(', ') + ` e` .replace(', e', ' e')
              : '7, 8 e 9';

            // Build text for grades > 0 in 4th bimester "top 3"
            const topGrades4 = [8, 9, 10].filter(g => pctGrade(grades4, g) > 0);
            const hasMedia10_4 = p4_10 > 0;

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning>
                <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                  {`A análise comparativa das médias escolares dos alunos inscritos no Projeto "${projectFull}", no 1º e no 4º bimestres de ${currentYear}, evidencia uma evolução pedagógica significativa e coerente com os objetivos educacionais propostos. No 1º bimestre, observa-se que a maioria dos estudantes já apresentava desempenho satisfatório, com forte concentração nas médias ${topGrades1.join(', ')}, que, juntas, representaram ${p1_789}% do total de alunos. Destaca-se, especialmente, a predominância da ${descGrade(dom1Grade, dom1Pct)}, indicando um bom nível de aproveitamento escolar desde o início do acompanhamento.`}
                </p>
                <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                  {`No 4º bimestre, os resultados demonstram avanço expressivo no desempenho escolar geral. Nota-se uma redução proporcional dos alunos com médias mais baixas e um crescimento consistente nas faixas de médias mais elevadas. As médias ${topGrades4.join(', ')} passaram a concentrar ${p4_8910}% dos alunos, com destaque para a ${descGrade(dom4Grade, dom4Pct)}${hasMedia10_4 ? `, além do registro de alunos com média máxima 10 (${p4_10}%)` : ''}. Esse deslocamento do desempenho para patamares superiores indica não apenas a manutenção da assiduidade escolar, mas também a melhoria efetiva do aproveitamento no aprendizado ao longo do ano letivo.`}
                </p>
                <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                  Esses resultados confirmam o cumprimento da Meta Qualitativa 02, que visa reduzir a evasão escolar e melhorar o rendimento escolar dos alunos atendidos. O acompanhamento escolar permanente, definido como Indicador 02, mostrou-se eficaz ao possibilitar o monitoramento contínuo da frequência e do desempenho, permitindo intervenções pedagógicas oportunas quando necessárias. Os relatórios elaborados como instrumento de verificação atestam a assiduidade dos alunos e a evolução consistente das médias escolares, reforçando o papel do projeto como uma ação integrada de esporte educacional que contribui de forma concreta para o desenvolvimento escolar e social dos participantes.
                </p>
              </div>
            );
          })()}
        </div>

        {/* ━━━ SECTION 3.2: Desempenho escolar (pg 23) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.2" tag="h3" />
          {(() => {
            // Classify each student's overall performance using 4th bimester grade
            const categories = ['Bom', 'Regular', 'Insatisfatório', 'Péssimo'] as const;
            const CAT_COLORS: Record<string, string> = {
              'Bom': '#4472C4',
              'Regular': '#ED7D31',
              'Insatisfatório': '#A5A5A5',
              'Péssimo': '#FFC000',
            };
            const total = studentGrades.length || 1;
            const catCount = (cat: string) => studentGrades.filter(sg => avaliarNota(sg.media4) === cat).length;
            const desempData = categories.map(cat => ({
              label: cat,
              count: catCount(cat),
              pct: Math.round((catCount(cat) / total) * 100),
              color: CAT_COLORS[cat],
            }));

            const titleUpper = `DESEMPENHO ESCOLAR DOS ALUNOS DA EDUCAÇÃO BÁSICA MATRICULADOS NAS ESCOLAS PÚBLICAS E PARTICULARES INSCRITOS NO PROJETO "${projectFull.toUpperCase()}" EM ${cityLabel.toUpperCase()} (${stateLabel})`;

            // ── Pie Chart (Figura 7) ──
            const cx = 180, cy = 160, r = 120;
            const filtered = desempData.filter(d => d.count > 0);
            const totalCount = filtered.reduce((s, d) => s + d.count, 0) || 1;

            let pieSVG: React.ReactNode;
            if (filtered.length === 1) {
              pieSVG = (
                <svg viewBox="0 0 360 340" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
                  <circle cx={cx} cy={cy} r={r} fill={filtered[0].color} stroke="#fff" strokeWidth="2" />
                  <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">{filtered[0].label}</text>
                  <text x={cx} y={cy + 22} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">100%</text>
                </svg>
              );
            } else {
              let acc = -90;
              const slices = filtered.map((d, i) => {
                const startAngle = acc;
                const angle = (d.count / totalCount) * 360;
                acc += angle;
                const s = (startAngle * Math.PI) / 180;
                const e = ((startAngle + angle) * Math.PI) / 180;
                const mid = ((startAngle + angle / 2) * Math.PI) / 180;
                const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
                const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
                const large = angle > 180 ? 1 : 0;
                const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
                // Label position
                const labelR = d.pct >= 10 ? r * 0.6 : r + 30;
                const labelColor = d.pct >= 10 ? '#fff' : d.color;
                const lx = cx + labelR * Math.cos(mid), ly = cy + labelR * Math.sin(mid);
                return (
                  <g key={i}>
                    <path d={path} fill={d.color} stroke="#fff" strokeWidth="2.5" />
                    {d.pct > 0 && (
                      <>
                        <text x={lx} y={ly - 6} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={labelColor}>
                          {d.label}
                        </text>
                        <text x={lx} y={ly + 8} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill={labelColor}>
                          {`${d.pct}%`}
                        </text>
                      </>
                    )}
                  </g>
                );
              });
              pieSVG = (
                <svg viewBox="0 0 360 340" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
                  {slices}
                </svg>
              );
            }

            // ── Bar Chart (Figura 8) ──
            const maxVal = Math.max(...desempData.map(d => d.count), 1);
            const bw = 60, gap = 40, startX = 60, chartH = 200, baseY = 230;
            const barSVG = (
              <svg viewBox="0 0 460 290" style={{ width: '100%', maxWidth: 500, display: 'block', margin: '0 auto' }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                  <line key={i} x1={startX - 5} y1={baseY - chartH * f} x2={430} y2={baseY - chartH * f} stroke="#eee" strokeWidth="1" />
                ))}
                {/* Bars */}
                {desempData.map((d, i) => {
                  const x = startX + i * (bw + gap);
                  const h = (d.count / maxVal) * chartH;
                  const hPct = (d.pct / 100) * chartH;
                  return (
                    <g key={i}>
                      {/* Count bar — BLUE */}
                      <rect x={x} y={baseY - h} width={bw * 0.5} height={h} fill="#4472C4" rx="2" />
                      {/* Pct bar — ORANGE */}
                      <rect x={x + bw * 0.5 + 4} y={baseY - hPct} width={bw * 0.4} height={hPct} fill="#ED7D31" rx="2" />
                      {/* Count label */}
                      <text x={x + bw * 0.25} y={baseY - h - 8} textAnchor="middle" fontSize="12" fontWeight="700" fill="#4472C4">{d.count}</text>
                      {/* Pct label */}
                      <text x={x + bw * 0.5 + 4 + bw * 0.2} y={baseY - hPct - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="#ED7D31">{`${d.pct}%`}</text>
                      {/* X-axis label */}
                      <text x={x + bw / 2} y={baseY + 16} textAnchor="middle" fontSize="9" fill="#555">{d.label}</text>
                    </g>
                  );
                })}
                {/* Axis */}
                <line x1={startX - 5} y1={baseY} x2={430} y2={baseY} stroke="#999" strokeWidth="1" />
              </svg>
            );

            return (
              <>
                <div contentEditable={isEditing} suppressContentEditableWarning>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5, textIndent: '2cm', marginBottom: 12 }}>
                    {`Figuras 7 e 8 — Desempenho escolar dos alunos da Educação Básica matriculados nas Escolas Públicas e Particulares inscritos no projeto "${projectFull}" em ${cityLabel} (${stateLabel})`}
                  </p>
                </div>

                {/* Figura 7 — Pie: Desempenho Escolar */}
                <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                  <ChartDataEditor chartId="assid_fig7_pie" title="Desempenho Escolar (Pizza)" isEditing={isEditing} rows={
                    desempData.map(d => ({ key: d.label, label: d.label, value: d.count }))
                  } onSave={() => {}} />
                  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>
                    {titleUpper}
                  </p>
                  {pieSVG}
                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                    {desempData.map((d, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                        {`${d.label} (${d.pct}%)`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Figura 8 — Bar: Desempenho Escolar */}
                <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                  <ChartDataEditor chartId="assid_fig8_bar" title="Desempenho Escolar (Barras)" isEditing={isEditing} rows={
                    desempData.map(d => ({ key: d.label, label: d.label, value: d.count }))
                  } onSave={() => {}} />
                  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>
                    {titleUpper}
                  </p>
                  {barSVG}
                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                      <span style={{ width: 10, height: 10, background: '#4472C4', display: 'inline-block', borderRadius: 2 }} /> Número de alunos
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                      <span style={{ width: 10, height: 10, background: '#ED7D31', display: 'inline-block', borderRadius: 2 }} /> Em %
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 10, color: '#666', textAlign: 'left', marginTop: 4 }}>
                  {`Fonte: ${projectFull} (${currentYear}).`}
                </p>

                {/* ─── Texto analítico do desempenho escolar ─── */}
                <div contentEditable={isEditing} suppressContentEditableWarning style={{ marginTop: 16 }}>
                  {(() => {
                    const pBom = desempData.find(d => d.label === 'Bom')!;
                    const pReg = desempData.find(d => d.label === 'Regular')!;
                    const pIns = desempData.find(d => d.label === 'Insatisfatório')!;
                    const pPes = desempData.find(d => d.label === 'Péssimo')!;

                    // Build conditional sentences for Insatisfatório and Péssimo
                    const zeroCategories = [pIns, pPes].filter(c => c.pct === 0);
                    const nonZeroLow = [pIns, pPes].filter(c => c.pct > 0);

                    let paragrafo3Intro = '';
                    if (zeroCategories.length === 2) {
                      paragrafo3Intro = `Não houve registros de alunos nas faixas Insatisfatório (${pIns.pct}%) ou Péssimo (${pPes.pct}%), o que reforça a inexistência de situações críticas de baixo rendimento escolar ou de risco imediato de evasão associada a dificuldades de aprendizagem.`;
                    } else if (zeroCategories.length === 1 && nonZeroLow.length === 1) {
                      const zero = zeroCategories[0];
                      const nz = nonZeroLow[0];
                      paragrafo3Intro = `Registrou-se ${nz.pct}% dos alunos na faixa ${nz.label}. Não houve registros na faixa ${zero.label} (${zero.pct}%).`;
                    } else {
                      paragrafo3Intro = `Registrou-se ${pIns.pct}% dos alunos na faixa Insatisfatório e ${pPes.pct}% na faixa Péssimo.`;
                    }

                    return (
                      <>
                        <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                          {`A análise do desempenho escolar dos alunos da Educação Básica participantes do Projeto "${projectFull}", no município de ${cityLabel} (${stateLabel}), revela um quadro amplamente positivo e alinhado aos objetivos educacionais propostos. Os dados demonstram que ${pBom.pct}% dos alunos avaliados foram classificados na categoria Bom, com notas situadas entre 6 e 9, evidenciando um desempenho satisfatório e a consolidação de um padrão consistente de aproveitamento escolar. Esse resultado expressivo indica que a grande maioria dos participantes consegue acompanhar adequadamente as atividades escolares, mantendo rendimento compatível com as exigências pedagógicas da Educação Básica.`}
                        </p>
                        <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                          {pReg.pct > 0
                            ? `Observa-se ainda que ${pReg.pct}% dos alunos foram enquadrados na categoria Regular, correspondente a notas entre 5 e abaixo de 6, o que sinaliza desempenho dentro da média esperada, porém com necessidade de atenção pedagógica pontual para aprimoramento. ${paragrafo3Intro}`
                            : `Observa-se que ${pReg.pct}% dos alunos foram enquadrados na categoria Regular. ${paragrafo3Intro}`
                          }
                        </p>
                        <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                          Esse cenário evidencia a efetividade das ações de acompanhamento escolar permanente previstas no Indicador 02, uma vez que o monitoramento contínuo da frequência e do desempenho contribuiu para a identificação precoce de eventuais dificuldades e para a adoção de medidas de apoio quando necessárias. Assim, os resultados confirmam o cumprimento da Meta Qualitativa 02, voltada à redução da evasão escolar e à melhoria do aproveitamento no aprendizado, demonstrando que o projeto, ao articular práticas esportivas educacionais com o acompanhamento pedagógico sistemático, promove impactos positivos e duradouros no desenvolvimento escolar dos alunos atendidos.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </>
            );
          })()}
        </div>

        {/* ━━━ SECTION 3.3: Melhora/piora/manutenção (pg 25) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.3" tag="h3" />
          {(() => {
            // Compute MELHORA / PIORA / MANTEVE from studentGrades
            const total = studentGrades.length || 1;
            const countMelhora = studentGrades.filter(sg => sg.status === 'MELHORA').length;
            const countPiora = studentGrades.filter(sg => sg.status === 'PIORA').length;
            const countManteve = studentGrades.filter(sg => sg.status === 'MANTEVE').length;
            const pctMelhora = Math.round((countMelhora / total) * 100);
            const pctPiora = Math.round((countPiora / total) * 100);
            const pctManteve = Math.round((countManteve / total) * 100);
            const pctSucesso = pctMelhora + pctManteve;

            // Average evolution and max improvement
            const diffs = studentGrades.map(sg => sg.media4 - sg.media1);
            const avgEvolucao = diffs.length > 0 ? (diffs.reduce((s, d) => s + d, 0) / diffs.length) : 0;
            const maxMelhora = diffs.length > 0 ? Math.max(...diffs) : 0;

            const STATUS_COLORS: Record<string, string> = {
              'MELHORA': '#4472C4',
              'PIORA': '#ED7D31',
              'MANTEVE': '#FFC000',
            };
            const statusData = [
              { label: 'MELHORA', count: countMelhora, pct: pctMelhora, color: STATUS_COLORS['MELHORA'] },
              { label: 'PIORA', count: countPiora, pct: pctPiora, color: STATUS_COLORS['PIORA'] },
              { label: 'MANTEVE', count: countManteve, pct: pctManteve, color: STATUS_COLORS['MANTEVE'] },
            ];

            const titleUpper = `Dados sobre a melhora, piora ou manutenção das médias escolares dos alunos da Educação Básica inscritos no projeto "${projectFull}" em ${cityLabel} (${stateLabel})`;

            // ── Pie Chart (Figura 9) ──
            const cx = 180, cy = 160, r = 120;
            const filtered = statusData.filter(d => d.count > 0);
            const totalCount = filtered.reduce((s, d) => s + d.count, 0) || 1;

            let pieSVG: React.ReactNode;
            if (filtered.length === 1) {
              pieSVG = (
                <svg viewBox="0 0 360 340" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
                  <circle cx={cx} cy={cy} r={r} fill={filtered[0].color} stroke="#fff" strokeWidth="2" />
                  <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">{filtered[0].label}</text>
                  <text x={cx} y={cy + 22} textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff">100%</text>
                </svg>
              );
            } else {
              let acc = -90;
              const slices = filtered.map((d, i) => {
                const startAngle = acc;
                const angle = (d.count / totalCount) * 360;
                acc += angle;
                const s = (startAngle * Math.PI) / 180;
                const e = ((startAngle + angle) * Math.PI) / 180;
                const mid = ((startAngle + angle / 2) * Math.PI) / 180;
                const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
                const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
                const large = angle > 180 ? 1 : 0;
                const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
                const labelR = d.pct >= 10 ? r * 0.55 : r + 30;
                const labelColor = d.pct >= 10 ? '#fff' : d.color;
                const lx = cx + labelR * Math.cos(mid), ly = cy + labelR * Math.sin(mid);
                return (
                  <g key={i}>
                    <path d={path} fill={d.color} stroke="#fff" strokeWidth="2.5" />
                    {d.pct > 0 && (
                      <>
                        <text x={lx} y={ly - 6} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill={labelColor}>
                          {d.label}
                        </text>
                        <text x={lx} y={ly + 8} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="700" fill={labelColor}>
                          {`${d.pct}%`}
                        </text>
                      </>
                    )}
                  </g>
                );
              });
              pieSVG = (
                <svg viewBox="0 0 360 340" style={{ width: '100%', maxWidth: 420, display: 'block', margin: '0 auto' }}>
                  {slices}
                </svg>
              );
            }

            return (
              <>
                <div contentEditable={isEditing} suppressContentEditableWarning>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.5, textIndent: '2cm', marginBottom: 12 }}>
                    {`Figura 9 — Dados sobre a melhora, piora ou manutenção das médias escolares dos alunos da Educação Básica inscritos no projeto "${projectFull}" em ${cityLabel} (${stateLabel})`}
                  </p>
                </div>

                {/* Figura 9 — Pie: Melhora/Piora/Manteve */}
                <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                  <ChartDataEditor chartId="assid_fig9_pie" title="Melhora / Piora / Manteve" isEditing={isEditing} rows={
                    statusData.map(d => ({ key: d.label, label: d.label, value: d.count }))
                  } onSave={() => {}} />
                  <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', margin: '0 0 8px' }}>
                    {titleUpper}
                  </p>
                  {pieSVG}
                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                    {statusData.map((d, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                        {`${d.label} (${d.pct}%)`}
                      </span>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: 10, color: '#666', textAlign: 'left', marginTop: 4, marginBottom: 16 }}>
                  {`Fonte: ${projectFull} (${currentYear}).`}
                </p>

                {/* ─── Texto analítico Melhora/Piora/Manteve ─── */}
                <div contentEditable={isEditing} suppressContentEditableWarning>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                    {`O projeto ${projectFull}, executado em ${cityLabel} (${stateLabel}), revelou resultados sólidos no que diz respeito ao desempenho escolar de seus participantes na Educação Básica. Durante o período de execução, a análise dos dados demonstrou que o esporte foi um motor de disciplina, visto que ${pctMelhora > 0 ? `${pctMelhora.toFixed(2).replace('.', ',')}% dos alunos-atletas apresentaram uma melhora efetiva em suas médias escolares` : `${pctMelhora.toFixed(2).replace('.', ',')}% dos alunos-atletas apresentaram melhora`}. ${pctManteve > 0 ? `Quando somados aos ${pctManteve.toFixed(2).replace('.', ',')}% que mantiveram o rendimento estável, o índice de sucesso escolar do projeto alcançou a marca de ${pctSucesso.toFixed(2).replace('.', ',')}%, o que validou a iniciativa como uma ferramenta eficaz de transformação social e pedagógica.` : `O percentual que manteve o rendimento foi de ${pctManteve.toFixed(2).replace('.', ',')}%.`}`}
                  </p>
                  <p style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', marginBottom: 6 }}>
                    {`A média geral de evolução do grupo fixou-se em ${avgEvolucao.toFixed(2).replace('.', ',')}, um valor que representou um ganho substancial de aprendizado coletivo dentro do contexto escolar. ${maxMelhora > 0 ? `Houve casos de destaque individual onde estudantes registraram saltos impressionantes de até ${maxMelhora.toFixed(2).replace('.', ',')} pontos em suas médias anuais.` : ''} ${pctPiora > 0 ? `Por outro lado, a parcela de alunos que teve uma queda no desempenho (${pctPiora.toFixed(2).replace('.', ',')}%) apresentou, em sua maioria, oscilações pequenas, indicando que a rotina de treinos não prejudicou o aprendizado, mas sim exigiu ajustes pontuais de foco.` : `O percentual de piora foi de ${pctPiora.toFixed(2).replace('.', ',')}%.`} Em suma, os dados confirmaram que o projeto cumpriu seu papel integral, provando que o esforço no esporte caminhou lado a lado com o sucesso nos boletins.`}
                  </p>
                </div>
              </>
            );
          })()}
        </div>

        {/* ━━━ SECTION 4: LEVANTAMENTO DA ASSIDUIDADE (pg 27) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="4" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {/* Tabela/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 5: CONCLUSÃO (pg 32) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="5" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {`A conclusão deste relatório sobre assiduidade e aproveitamento escolar dos alunos do projeto "${projectTitle}" no núcleo de ${cityLabel}/${stateLabel} demonstra que o projeto cumpriu com êxito os objetivos estabelecidos na Meta Qualitativa 01, promovendo melhoria mensurável na vida acadêmica de seus beneficiados.`}
          </div>
        </div>

        {/* ━━━ REFERÊNCIAS (pg 33) ━━━ */}
        <div className="freq-page">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>REFERÊNCIAS</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 2, textAlign: 'justify' }}>
            <p>ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. MANUAL DA LEI DE INCENTIVO AO ESPORTE. Diretoria de Programas e Políticas de Incentivo ao Esporte (DPPIE). Brasília, 2023.</p>
            <p style={{ marginTop: 16 }}>ESPORTE, Do. Lei nº 11.438, de 29 de dezembro de 2006. Dispõe sobre incentivos e benefícios para fomentar as atividades de caráter desportivo e dá outras providências, 2006.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssiduidadeReportBuilder;
