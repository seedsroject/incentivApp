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

export const AssiduidadeReportBuilder: React.FC<AssiduidadeReportBuilderProps> = ({
  nucleos,
  onBack,
  headerImage = '/header_full.png',
  projectName = 'Escolinha de Triathlon',
}) => {
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(nucleos[0]?.id || '');
  const [isEditing, setIsEditing] = useState(true);
  const [aiResumo, setAiResumo] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedNucleo = nucleos.find(n => n.id === selectedNucleoId);
  const nucleoShortName = selectedNucleo?.nome.split('|')[0]?.trim() || 'Núcleo';
  const rawState = selectedNucleo?.nome.split('|')[1]?.trim() || 'UF';
  const stateLabel = rawState.split(/[\s\-–]/)[0]?.trim() || 'UF';
  const cityLabel = nucleoShortName;
  const currentYear = new Date().getFullYear();
  const projectTitle = projectName;
  const projectTitleUpper = projectName.toUpperCase();

  const handlePrint = useCallback(() => { window.print(); }, []);

  const handleGenerateAI = useCallback(async () => {
    setIsGeneratingAI(true);
    try {
      // Fallback text (can be replaced with real Gemini call later)
      setAiResumo(`O presente Relatório de Assiduidade e Aproveitamento Escolar, integrante do Anexo da Meta Qualitativa 01, apresenta o monitoramento sistemático do desempenho acadêmico dos alunos do projeto ${projectTitle}, no núcleo de ${cityLabel}/${stateLabel}. O documento consolida os registros oficiais de notas e frequência escolar dos beneficiados, possibilitando avaliar o impacto do projeto na vida acadêmica dos participantes.\n\nO acompanhamento dos Boletins Escolares evidenciou melhoria significativa nos indicadores de assiduidade e aproveitamento. A análise comparativa entre os períodos demonstrou evolução positiva no rendimento escolar da maioria dos alunos, confirmando a eficácia das estratégias pedagógicas e esportivas adotadas pelo projeto.\n\nOs resultados indicam que a participação nas atividades do projeto contribuiu positivamente para o desenvolvimento da disciplina, responsabilidade e comprometimento dos alunos com seus estudos. Com base nos indicadores coletados, conclui-se que o projeto apresentou excelente desempenho no cumprimento das metas qualitativas estabelecidas.\n\nPalavras-chave: Anexo da Meta Qualitativa 01 – Relatório de Assiduidade e Aproveitamento Escolar. Meta Qualitativa 01 do projeto ${projectTitle}.`);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [projectTitle, cityLabel, stateLabel]);

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
      <div ref={reportRef} className="freq-report-content" style={{ contentVisibility: 'auto' }}>

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
            <div className="freq-cover-bottom-project" contentEditable={isEditing} suppressContentEditableWarning>
              PROJETO {projectTitleUpper}
            </div>
            <div className="freq-cover-bottom-citybox" contentEditable={isEditing} suppressContentEditableWarning>
              {cityLabel} | {stateLabel}<br/>{currentYear}
            </div>
            <div className="freq-cover-bottom-ref" contentEditable={isEditing} suppressContentEditableWarning>
              RELATÓRIO DA META QUALITATIVA DO PROJETO "{projectTitleUpper}",<br/>
              REFERENTE AO NÚCLEO DE {nucleoShortName.toUpperCase()}
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
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
              Meta Qualitativa 01:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
              Meta:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 8px' }}>
              Identificar a melhoria da assiduidade e do aproveitamento escolar dos alunos participantes do projeto.
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
              Indicador:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 8px' }}>
              Percentual de melhoria na assiduidade e aproveitamento escolar dos beneficiados.
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
              Instrumento de Verificação:
            </p>
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
          <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 40, color: '#111' }}>SUMÁRIO</h2>
          <table className="freq-toc-table">
            <tbody>
              {[
                { num: '1', title: 'Resumo Executivo', page: '04' },
                { num: '2', title: 'Quadro Comparativo de Assiduidade e Aproveitamento', page: '06' },
                { num: '3', title: 'Análise dos Resultados', page: '07' },
                { num: '4', title: 'Boletins Escolares (Evidências)', page: '08' },
              ].map((item, i) => (
                <tr key={i}>
                  <td style={{ width: 50, fontWeight: 700, fontSize: 13, color: '#333', paddingRight: 12 }}>{item.num}</td>
                  <td style={{ fontSize: 13, color: '#333', borderBottom: '1px dotted #ccc', paddingBottom: 8, paddingTop: 8 }}>
                    <span contentEditable={isEditing} suppressContentEditableWarning>{item.title}</span>
                  </td>
                  <td style={{ width: 50, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#333' }}>{item.page}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ━━━ PAGE 6: QUADRO COMPARATIVO ━━━ */}
        <div className="freq-page">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#111' }}>2 QUADRO COMPARATIVO DE ASSIDUIDADE E APROVEITAMENTO ESCOLAR</h2>
          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontStyle: 'italic', borderTop: '2px solid #4472c4', borderBottom: '2px solid #4472c4', padding: '4px 0', marginBottom: 20, color: '#333' }}>
            PROJETO {projectTitleUpper} — {nucleoShortName.toUpperCase()} / {stateLabel}
          </div>
          <div className="freq-section-header-bar">
            RELATÓRIO DE ASSIDUIDADE E APROVEITAMENTO ESCOLAR — {nucleoShortName.toUpperCase()} / {stateLabel}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="freq-table-resumo">
              <thead>
                <tr className="freq-table-header">
                  <th style={{ width: 35 }}>Nº</th>
                  <th>Nome do Aluno (ordem alfabética)</th>
                  <th style={{ width: 75 }}>Aproveitamento<br/>Escolar 01</th>
                  <th style={{ width: 75 }}>Assiduidade<br/>Escolar 01</th>
                  <th style={{ width: 75 }}>Aproveitamento<br/>Escolar 02</th>
                  <th style={{ width: 75 }}>Assiduidade<br/>Escolar 02</th>
                  <th style={{ width: 80 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Placeholder rows - dados serão integrados futuramente */}
                {[1,2,3,4,5].map(i => (
                  <tr key={i} className={i % 2 === 0 ? 'freq-row-even' : 'freq-row-odd'}>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>{i}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ fontWeight: 500, color: '#000' }}>[Nome do Aluno {i}]</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>—</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>—</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>—</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>—</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>MELHORA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 10, color: '#888', marginTop: 8, textAlign: 'right' }}>Fonte: {projectTitle} ({currentYear})</p>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ marginTop: 20, fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            A tabela acima apresenta o quadro comparativo de assiduidade e aproveitamento escolar dos alunos do projeto "{projectTitle}" no núcleo de {cityLabel}/{stateLabel}. Os dados serão preenchidos com as informações extraídas dos boletins escolares, permitindo a análise da evolução acadêmica dos beneficiados ao longo do período de execução do projeto.
          </div>
        </div>

        {/* ━━━ PAGE 7: ANÁLISE ━━━ */}
        <div className="freq-page">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>3 ANÁLISE DOS RESULTADOS</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            {`A análise dos boletins escolares dos alunos participantes do projeto "${projectTitle}" no núcleo de ${cityLabel}/${stateLabel} demonstra resultados positivos no que se refere à assiduidade e ao aproveitamento escolar dos beneficiados.

Os indicadores apontam que a maioria dos alunos apresentou melhoria em seus índices de frequência escolar e em suas notas, evidenciando o impacto positivo que a participação no projeto exerce sobre a rotina acadêmica dos beneficiados.

A prática esportiva regular, aliada ao acompanhamento pedagógico oferecido pelo projeto, contribui para o desenvolvimento de habilidades socioemocionais como disciplina, pontualidade, trabalho em equipe e autoestima, fatores que se refletem diretamente no desempenho escolar.

Com base nos dados coletados, conclui-se que o projeto cumpriu com êxito os objetivos estabelecidos na Meta Qualitativa 01, promovendo melhoria mensurável na vida acadêmica de seus beneficiados.`}
          </div>
        </div>

        {/* ━━━ PAGE 8: PLACEHOLDER BOLETINS ━━━ */}
        <div className="freq-page">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>4 BOLETINS ESCOLARES (EVIDÊNCIAS)</h2>
          <div style={{ padding: 40, border: '2px dashed #ccc', borderRadius: 8, textAlign: 'center', color: '#999', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Área reservada para os Boletins Escolares</p>
            <p style={{ fontSize: 12 }}>As cópias dos boletins dos alunos serão anexadas nesta seção como evidência documental da Meta Qualitativa 01.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssiduidadeReportBuilder;
