/**
 * AssiduidadeReportBuilder.tsx
 * Editor HTML editável para o relatório
 * "Anexo Meta Qualitativa 01 — Relatório de Assiduidade e Aproveitamento Escolar"
 *
 * Segue o mesmo padrão visual do FrequencyReportBuilder (capa, contracapa, folha de rosto, waves).
 */

import React, { useState, useRef, useCallback } from 'react';
import { Nucleo } from '../types';
import { ReportEditorToolbar } from './ReportEditorToolbar';

interface AssiduidadeReportBuilderProps {
  nucleos: Nucleo[];
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
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {/* Texto será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3.1: Médias notas (pg 22) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.1" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {/* Tabela/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3.2: Desempenho escolar (pg 23) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.2" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {/* Gráfico/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3.3: Melhora/piora/manutenção (pg 25) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.3" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm' }}>
            {/* Gráfico/conteúdo será adicionado pelo usuário */}
          </div>
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
