/**
 * AssiduidadeReportBuilder.tsx
 * Editor HTML editável para o relatório
 * "Anexo Meta Qualitativa 01 — Relatório de Assiduidade e Aproveitamento Escolar"
 *
 * Segue o mesmo padrão visual do FrequencyReportBuilder (capa, contracapa, folha de rosto, waves).
 */

import React, { useState, useRef, useCallback } from 'react';
import { Nucleo } from '../types';

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
          <div contentEditable={isEditing} suppressContentEditableWarning className="freq-resumo-text">
            {aiResumo || `O presente Relatório de Assiduidade e Aproveitamento Escolar, integrante do Anexo da Meta Qualitativa 01, apresenta o monitoramento sistemático do desempenho acadêmico dos alunos do projeto ${projectTitle}, no núcleo de ${cityLabel}/${stateLabel}. O documento consolida os registros oficiais de notas e frequência escolar dos beneficiados, possibilitando avaliar o impacto do projeto na vida acadêmica dos participantes.

O acompanhamento dos Boletins Escolares evidenciou melhoria significativa nos indicadores de assiduidade e aproveitamento. A análise comparativa entre os períodos demonstrou evolução positiva no rendimento escolar da maioria dos alunos, confirmando a eficácia das estratégias pedagógicas e esportivas adotadas pelo projeto.

Os resultados indicam que a participação nas atividades do projeto contribuiu positivamente para o desenvolvimento da disciplina, responsabilidade e comprometimento dos alunos com seus estudos. Com base nos indicadores coletados, conclui-se que o projeto apresentou excelente desempenho no cumprimento das metas qualitativas estabelecidas.

Palavras-chave: Anexo da Meta Qualitativa 01 – Relatório de Assiduidade e Aproveitamento Escolar. Meta Qualitativa 01 do projeto ${projectTitle}.`}
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

        {/* ━━━ SECTION 1: INTRODUÇÃO (pg 6) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="1" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Texto será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 2: PROCEDIMENTOS METODOLÓGICOS (pg 8) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="2" />
          <SectionTitle num="2.1" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Texto será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 2.2 (pg 11) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="2.2" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Texto será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 2.3: Faixa Etária (pg 13) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="2.3" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Texto será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3: MÉDIAS GERAIS (pg 15) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Texto será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3.1: Médias notas (pg 22) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.1" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Tabela/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3.2: Desempenho escolar (pg 23) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.2" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Gráfico/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 3.3: Melhora/piora/manutenção (pg 25) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="3.3" tag="h3" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Gráfico/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 4: LEVANTAMENTO DA ASSIDUIDADE (pg 27) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="4" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {/* Tabela/conteúdo será adicionado pelo usuário */}
          </div>
        </div>

        {/* ━━━ SECTION 5: CONCLUSÃO (pg 32) ━━━ */}
        <div className="freq-page">
          <SectionTitle num="5" />
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
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
