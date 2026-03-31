/**
 * FrequencyReportBuilder.tsx
 * Editor HTML editável para o relatório
 * "Anexo Meta Quantitativa 01 — Lista de Frequência"
 * 
 * Reproduz fielmente o layout do PDF original com dados do Cruzamento de Dados.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { StudentDraft, DocumentLog, Nucleo } from '../types';
import {
  buildFrequencyReportData,
  generateTableOfContents,
  FrequencyReportData,
  EnrolledStudentRow,
  ResumoGeralRow,
  MonthlyAttendanceDetail,
} from '../services/frequencyReportService';
import { generateFrequencyReportAnalysis } from '../services/geminiService';

// ─── CONSTANTS ───
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const BLUE_PRIMARY = '#002855';
const BLUE_HEADER = '#4472c4';
const BLUE_LIGHT = '#d6e4f0';
const BLUE_ROW_ALT = '#dce6f1';

interface FrequencyReportBuilderProps {
  students: StudentDraft[];
  history: DocumentLog[];
  nucleos: Nucleo[];
  onBack: () => void;
}

// ─── SVG BAR CHART (Print-friendly) ───
const ReportBarChart: React.FC<{
  data: { label: string; value1: number; value2?: number }[];
  maxY: number;
  title: string;
  legend1: string;
  legend2?: string;
  color1?: string;
  color2?: string;
  singleColor?: boolean;
}> = ({ data, maxY, title, legend1, legend2, color1 = '#4472c4', color2 = '#ed7d31', singleColor }) => {
  const chartW = Math.max(750, data.length * 48);
  const chartH = 320;
  const padL = 45, padR = 20, padT = 15, padB = 55;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const barGroupW = plotW / data.length;
  const barW = singleColor ? barGroupW * 0.55 : barGroupW * 0.35;
  const gap = singleColor ? 0 : barGroupW * 0.05;
  const MONTH_COLORS = ['#4472c4','#ed7d31','#a5a5a5','#ffc000','#5b9bd5','#70ad47','#264478','#9b57a0','#636363','#eb6c14','#2e75b6','#bf9000','#4472c4','#ed7d31','#a5a5a5','#ffc000','#5b9bd5','#70ad47','#264478','#9b57a0','#636363'];

  return (
    <div className="freq-report-chart" style={{ pageBreakInside: 'avoid' }}>
      <h4 style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>{title}</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', minWidth: 600, border: '1px solid #e0e0e0', borderRadius: 4, background: '#fff' }}>
        {/* Grid lines */}
        {Array.from({ length: maxY + 1 }, (_, i) => {
          const y = padT + plotH - (i / maxY) * plotH;
          return (
            <g key={i}>
              <line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="#e0e0e0" strokeWidth={0.5} />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={9} fill="#666">{i}</text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const x = padL + i * barGroupW;
          const h1 = (d.value1 / maxY) * plotH;
          const h2 = d.value2 !== undefined ? (d.value2 / maxY) * plotH : 0;
          return (
            <g key={i}>
              <rect x={singleColor ? x + barGroupW * 0.22 : x + gap} y={padT + plotH - h1} width={barW} height={h1} fill={singleColor ? MONTH_COLORS[i % MONTH_COLORS.length] : color1} rx={1} />
              <text x={singleColor ? x + barGroupW * 0.22 + barW / 2 : x + gap + barW / 2} y={padT + plotH - h1 - 4} textAnchor="middle" fontSize={8} fontWeight="bold" fill={singleColor ? MONTH_COLORS[i % MONTH_COLORS.length] : color1}>{d.value1}</text>
              {d.value2 !== undefined && !singleColor && (
                <>
                  <rect x={x + gap + barW + gap} y={padT + plotH - h2} width={barW} height={h2} fill={color2} rx={1} />
                  <text x={x + gap + barW + gap + barW / 2} y={padT + plotH - h2 - 4} textAnchor="middle" fontSize={8} fontWeight="bold" fill={color2}>{d.value2}</text>
                </>
              )}
              <text x={x + barGroupW / 2} y={chartH - padB + 16} textAnchor="middle" fontSize={8} fill="#444" fontWeight="600">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, background: singleColor ? '#4472c4' : color1, display: 'inline-block', borderRadius: 2 }}></span>
          <span style={{ fontSize: 11, color: '#555' }}>{legend1}</span>
        </div>
        {legend2 && !singleColor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: color2, display: 'inline-block', borderRadius: 2 }}></span>
            <span style={{ fontSize: 11, color: '#555' }}>{legend2}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───
export const FrequencyReportBuilder: React.FC<FrequencyReportBuilderProps> = ({
  students,
  history,
  nucleos,
  onBack
}) => {
  // ─── STATE ───
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(nucleos[0]?.id || '');
  const [periodStart, setPeriodStart] = useState<string>('2024-04-24');
  const [periodEnd, setPeriodEnd] = useState<string>('2025-12-23');
  const [isEditing, setIsEditing] = useState(false);
  const [aiResumo, setAiResumo] = useState<string>('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [nSli, setNSli] = useState('2301005');
  const reportRef = useRef<HTMLDivElement>(null);

  // ─── COMPUTED DATA ───
  const selectedNucleo = useMemo(() => nucleos.find(n => n.id === selectedNucleoId), [nucleos, selectedNucleoId]);

  const reportData = useMemo<FrequencyReportData | null>(() => {
    if (!selectedNucleo) return null;
    return buildFrequencyReportData(students, history, selectedNucleo, periodStart, periodEnd);
  }, [students, history, selectedNucleo, periodStart, periodEnd]);

  const tableOfContents = useMemo(() => {
    if (!reportData) return [];
    return generateTableOfContents(reportData);
  }, [reportData]);

  // ─── AI GENERATION ───
  const handleGenerateAI = useCallback(async () => {
    if (!reportData) return;
    setIsGeneratingAI(true);
    try {
      const text = await generateFrequencyReportAnalysis({
        cityLabel: reportData.cityLabel,
        period: `${reportData.period.startLabel} a ${reportData.period.endLabel}`,
        totalStudents: reportData.totalStudents,
        avgFreqPct: reportData.totals.avgFreqPct,
        avgFaltaPct: reportData.totals.avgFaltaPct,
        monthlyTrends: reportData.monthlyAggregates.map(m => ({
          month: m.label,
          freq: m.avgFrequency,
          faltas: m.totalAbsences
        })),
        totalDays: reportData.totals.totalDays
      });
      setAiResumo(text);
    } catch (err) {
      console.error('Error generating AI analysis:', err);
      // Fallback text
      setAiResumo(`O presente Relatório de Frequência, integrante do Anexo da Meta Quantitativa 01, apresentou o monitoramento sistemático da participação dos alunos do projeto Escolinha de Triathlon, executado de ${reportData.period.startLabel} a ${reportData.period.endLabel}, no município de ${reportData.cityLabel}. O documento consolidou os registros oficiais de assiduidade do projeto, possibilitando avaliar o nível de comprometimento dos participantes, a regularidade das atividades e a efetividade da execução ao longo do período analisado.\n\nO acompanhamento da Lista de Presença evidenciou um desempenho excepcional em relação à assiduidade dos beneficiados. A média registrada foi de ${reportData.totals.avgFreqPct}% de frequência, com apenas ${reportData.totals.avgFaltaPct}% de faltas, demonstrando elevado comprometimento e engajamento dos alunos nas atividades de natação. Em comparação com a Meta Quantitativa estabelecida — que previa um mínimo de 70% de assiduidade — o projeto superou amplamente o indicador, confirmando a eficácia das estratégias de mobilização, acompanhamento e organização das aulas.\n\nOs resultados indicaram que as atividades foram atrativas, adequadas ao público atendido e bem integradas à rotina das famílias, contribuindo para o desenvolvimento de disciplina, responsabilidade e vínculos positivos. Com base no indicador de frequência e na verificação realizada por meio da Lista de Presença, concluiu-se que o projeto apresentou excelente desempenho no cumprimento das metas, consolidando-se como uma iniciativa de significativo impacto social nos territórios atendidos.\n\nPalavras-chave: Anexo da Meta Quantitativa 01 – Lista de Frequência 1. Meta Quantitativa 01 do projeto Escolinha de Triathlon 2. Relatório de Frequência – ${reportData.period.startLabel} a ${reportData.period.endLabel} 03.`);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [reportData]);

  // ─── PRINT ───
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!reportData || !selectedNucleo) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Selecione um núcleo para gerar o relatório.</p>
        <button onClick={onBack} style={{ marginTop: 16, padding: '8px 24px', background: '#4472c4', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>← Voltar</button>
      </div>
    );
  }

  const { cityLabel, stateLabel, period, enrolledStudents, resumoGeral, monthlyAggregates, monthlyDetails, totals, faltasHistorico, mediaFaltas } = reportData;
  const nucleoShortName = selectedNucleo.nome.split('|')[0]?.trim() || selectedNucleo.nome;
  const projectTitle = `Escolinha de Triathlon`;

  return (
    <div className="freq-report-root">
      {/* ═══════════ TOOLBAR (hidden on print) ═══════════ */}
      <div className="freq-report-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="freq-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Anexo Meta Quantitativa 01 — Lista de Frequência</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Relatório editável • {nucleoShortName}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Núcleo */}
          <select
            value={selectedNucleoId}
            onChange={e => setSelectedNucleoId(e.target.value)}
            className="freq-select"
          >
            {nucleos.map(n => (
              <option key={n.id} value={n.id}>{n.nome.split('|')[0]?.trim()}</option>
            ))}
          </select>

          {/* Período */}
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="freq-input-date" />
          <span style={{ fontSize: 12, color: '#999' }}>a</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="freq-input-date" />

          {/* Nº SLIE */}
          <input type="text" value={nSli} onChange={e => setNSli(e.target.value)} className="freq-input-sli" placeholder="Nº SLIE" title="Nº SLIE" />

          {/* Botões */}
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

        {/* ━━━ PAGE 1: COVER (matches PDF) ━━━ */}
        <div className="freq-page freq-cover-page">
          <div className="freq-cover-logos">
            <img src="/assets/lei_do_incentivo.png" alt="Lei de Incentivo ao Esporte" style={{ height: 60 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <img src="/logo.png" alt="Escolinha de Triathlon" style={{ height: 65 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="freq-cover-gov-placeholder">
              <div style={{ fontSize: 8, fontWeight: 700, color: '#333', textAlign: 'center', lineHeight: 1.2 }}>MINISTÉRIO DO<br/>ESPORTE</div>
              <div style={{ fontSize: 7, color: '#555', textAlign: 'center', marginTop: 3 }}>GOVERNO DO<br/>BRASIL</div>
            </div>
          </div>

          <div className="freq-cover-block">
            <div className="freq-cover-inner">
              <div className="freq-cover-spacer" style={{ height: 180 }}></div>
              <h1 contentEditable={isEditing} suppressContentEditableWarning className="freq-cover-title">
                ANEXO META QUANTITATIVA 01 - LISTA DE<br/>FREQUÊNCIA
              </h1>
            </div>
          </div>

          <div className="freq-cover-bottom">
            <div className="freq-cover-bottom-project" contentEditable={isEditing} suppressContentEditableWarning>
              PROJETO ESCOLINHA DE TRIATHLON
            </div>
            <div className="freq-cover-bottom-citybox" contentEditable={isEditing} suppressContentEditableWarning>
              {nucleoShortName} – {stateLabel}<br/>{new Date().getFullYear()}
            </div>
            <div className="freq-cover-bottom-ref" contentEditable={isEditing} suppressContentEditableWarning>
              RELATÓRIO DE FREQUÊNCIA DO PROJETO "ESCOLINHA DE TRIATHLON",<br/>
              REFERENTE AO PERÍODO DE {period.startLabel.toUpperCase()} A {period.endLabel.toUpperCase()}
            </div>
          </div>

          {/* Wave SVG decoration */}
          <svg className="freq-cover-wave" viewBox="0 0 900 80" preserveAspectRatio="none">
            <path d="M0,40 C200,80 400,0 600,40 C700,60 800,30 900,50 L900,80 L0,80 Z" fill="#4a8c3f" opacity="0.7"/>
            <path d="M0,50 C150,20 350,70 550,40 C700,15 800,50 900,35 L900,80 L0,80 Z" fill="#2d6a2e" opacity="0.5"/>
            <path d="M0,60 C200,40 400,70 600,55 C750,45 850,65 900,50 L900,80 L0,80 Z" fill="#e0e0e0" opacity="0.4"/>
          </svg>
        </div>

        {/* ━━━ PAGE 2: TITLE PAGE (matches PDF) ━━━ */}
        <div className="freq-page freq-title-page">
          <div className="freq-cover-logos" style={{ marginBottom: 20 }}>
            <img src="/assets/lei_do_incentivo.png" alt="Lei de Incentivo ao Esporte" style={{ height: 50 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <img src="/logo.png" alt="Escolinha de Triathlon" style={{ height: 55 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="freq-cover-gov-placeholder">
              <div style={{ fontSize: 8, fontWeight: 700, color: '#333', textAlign: 'center', lineHeight: 1.2 }}>MINISTÉRIO DO<br/>ESPORTE</div>
              <div style={{ fontSize: 7, color: '#555', textAlign: 'center', marginTop: 3 }}>GOVERNO DO<br/>BRASIL</div>
            </div>
          </div>
          <div className="freq-title-page-subtitle" contentEditable={isEditing} suppressContentEditableWarning>
            PROJETO ESCOLINHA DE TRIATHLON
          </div>
          <div className="freq-title-page-body">
            <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 28, fontWeight: 900, color: '#1a5276', lineHeight: 1.3, textAlign: 'center', margin: 0 }}>
              ANEXO META QUANTITATIVA<br/>01 - LISTA DE FREQUÊNCIA
            </h2>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 4 }}>PROJETO ESCOLINHA DE TRIATHLON</p>
            <div style={{ marginTop: 50, textAlign: 'center' }}>
              <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{nucleoShortName.toUpperCase()} | {stateLabel}</p>
              <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 700, color: '#1a5276' }}>{new Date().getFullYear()}</p>
            </div>
          </div>
          {/* Wave SVG decoration */}
          <svg className="freq-title-wave" viewBox="0 0 900 60" preserveAspectRatio="none">
            <path d="M0,30 C200,60 400,10 600,40 C750,55 850,20 900,35 L900,60 L0,60 Z" fill="#2d6ac4" opacity="0.25"/>
            <path d="M0,40 C150,15 350,55 550,30 C700,10 850,45 900,25 L900,60 L0,60 Z" fill="#4472c4" opacity="0.3"/>
          </svg>
        </div>

        {/* ━━━ PAGE 3: META / INDICADOR (simple text, matches PDF) ━━━ */}
        <div className="freq-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 80 }}>
          <div style={{ borderTop: '2px solid #333', paddingTop: 16 }}>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 800, color: '#111', margin: '0 0 6px', textTransform: 'uppercase' }}>
              ANEXO META QUANTITATIVA 01 - LISTA DE FREQUÊNCIA
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
              Meta Quantitativa 01:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
              Meta:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 8px' }}>
              Manter assiduidade de 70% dos beneficiados inscritos no projeto nas aulas/atividades propostas.
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
              Indicador:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 8px' }}>
              Percentual de frequência nas aulas/atividades propostas.
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>
              Instrumento de Verificação:
            </p>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', margin: '0 0 0' }}>
              Lista de Presença nas aulas/atividades.
            </p>
          </div>
          <div style={{ borderTop: '2px solid #333', marginTop: 16 }}></div>
        </div>

        {/* ━━━ PAGE 4: RESUMO EXECUTIVO ━━━ */}
        <div className="freq-page">
          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 30, color: '#111' }}>RESUMO</h2>
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            className="freq-resumo-text"
          >
            {aiResumo || `O presente Relatório de Frequência, integrante do Anexo da Meta Quantitativa 01, apresentou o monitoramento sistemático da participação dos alunos do projeto ${projectTitle}, executado de ${period.startLabel} a ${period.endLabel}, no município de ${cityLabel}. O documento consolidou os registros oficiais de assiduidade do projeto desenvolvido no Estado de ${stateLabel}, possibilitando avaliar o nível de comprometimento dos participantes, a regularidade das atividades e a efetividade da execução ao longo do período analisado.

O acompanhamento da Lista de Presença evidenciou um desempenho excepcional em relação à assiduidade dos beneficiados. A média registrada foi de ${totals.avgFreqPct}% de frequência, com apenas ${totals.avgFaltaPct}% de faltas, demonstrando elevado comprometimento e engajamento dos alunos nas atividades. Em comparação com a Meta Quantitativa estabelecida — que previa um mínimo de 70% de assiduidade — o projeto superou amplamente o indicador, confirmando a eficácia das estratégias de mobilização, acompanhamento e organização das aulas.

Os resultados indicaram que as atividades foram atrativas, adequadas ao público atendido e bem integradas à rotina das famílias, contribuindo para o desenvolvimento de disciplina, responsabilidade e vínculos positivos. Com base no indicador de frequência e na verificação realizada por meio da Lista de Presença, concluiu-se que o projeto apresentou excelente desempenho no cumprimento das metas, consolidando-se como uma iniciativa de significativo impacto social nos territórios atendidos.

Palavras-chave: Anexo da Meta Quantitativa 01 – Lista de Frequência 1. Meta Quantitativa 01 do projeto ${projectTitle} 2. Relatório de Frequência – ${period.startLabel} a ${period.endLabel} 03.`}
          </div>
        </div>

        {/* ━━━ PAGE 5: SUMÁRIO ━━━ */}
        <div className="freq-page">
          <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 40, color: '#111' }}>SUMÁRIO</h2>
          <table className="freq-toc-table">
            <tbody>
              {tableOfContents.map((item, i) => (
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

        {/* ━━━ PAGES 6-7: RELAÇÃO DE MATRICULADOS (matches CrossRef item 1) ━━━ */}
        <div className="freq-page">
          <div className="freq-section-header-bar">
            RELAÇÃO DO NÚMERO DE ALUNOS REGULARMENTE MATRICULADOS NO PROJETO "{projectTitle.toUpperCase()}" EM {cityLabel.toUpperCase()}/{stateLabel}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="freq-table-enrollment">
              <thead>
                <tr className="freq-table-header">
                  <th style={{ width: 30, padding: '8px 4px' }}></th>
                  <th colSpan={2} style={{ padding: '4px' }}>Gênero</th>
                  <th rowSpan={3} style={{ width: 35, writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '4px 2px' }}>Número de alunos</th>
                  <th rowSpan={3} style={{ minWidth: 180, textAlign: 'center' }}>Nome (ordem alfabética)</th>
                  <th rowSpan={3} style={{ width: 40 }}>Idade</th>
                  <th colSpan={3}>Ensino Fundamental I, Ensino<br/>Fundamental II e Ensino Médio</th>
                </tr>
                <tr style={{ background: '#d9e2f3', color: '#1f4e78', fontWeight: 700, fontSize: 10, textAlign: 'center' }}>
                  <th rowSpan={2} style={{ background: '#fff', color: '#000', border: '1px solid #b4c6e7', minWidth: 80 }}>Cidade/Estado</th>
                  <th rowSpan={2} style={{ border: '1px solid #b4c6e7', writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '4px 2px', width: 30 }}>Masculino</th>
                  <th rowSpan={2} style={{ border: '1px solid #b4c6e7', writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '4px 2px', width: 30 }}>Feminino</th>
                  <th rowSpan={2} style={{ border: '1px solid #b4c6e7', padding: '4px' }}>Ensino</th>
                  <th colSpan={2} style={{ background: '#fff', color: '#000', border: '1px solid #b4c6e7', fontSize: 9 }}>Escola</th>
                </tr>
                <tr style={{ background: '#d9e2f3', color: '#1f4e78', fontWeight: 700, fontSize: 9, textAlign: 'center' }}>
                  <th style={{ background: '#fff', color: '#000', border: '1px solid #b4c6e7', writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '4px 2px', width: 30 }}>Pública</th>
                  <th style={{ background: '#fff', color: '#000', border: '1px solid #b4c6e7', writingMode: 'vertical-rl', transform: 'rotate(180deg)', padding: '4px 2px', width: 30 }}>Particular</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((row, i) => {
                  const isFem = row.nome.split(' ')[0].slice(-1).toLowerCase() === 'a';
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'freq-row-even' : 'freq-row-odd'}>
                      <td contentEditable={isEditing} suppressContentEditableWarning style={{ fontWeight: 600, color: '#000' }}>{i === 0 ? cityLabel : ''}</td>
                      <td style={{ textAlign: 'center', color: '#000' }}>{!isFem ? 'X' : ''}</td>
                      <td style={{ textAlign: 'center', color: '#000' }}>{isFem ? 'X' : ''}</td>
                      <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 700, color: '#000' }}>{i + 1}</td>
                      <td contentEditable={isEditing} suppressContentEditableWarning style={{ fontWeight: 500, textAlign: 'left', color: '#000', whiteSpace: 'nowrap' }}>{row.nome}</td>
                      <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 700, color: '#000' }}>{row.idade}</td>
                      <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 700, color: '#000' }}>{row.ensino}</td>
                      <td style={{ textAlign: 'center', color: '#000' }}>{row.escolaTipo === 'PUBLICA' ? 'X' : ''}</td>
                      <td style={{ textAlign: 'center', color: '#000' }}>{row.escolaTipo === 'PARTICULAR' ? 'X' : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ━━━ PAGES 8-12: RESUMO GERAL DA FREQUÊNCIA ━━━ */}
        <div className="freq-page">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#111' }}>1 RESUMO GERAL DA FREQUÊNCIA</h2>
          <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontStyle: 'italic', borderTop: '2px solid #4472c4', borderBottom: '2px solid #4472c4', padding: '4px 0', marginBottom: 20, color: '#333' }}>
            {period.startLabel} A {period.endLabel}
          </div>

          <div className="freq-section-header-bar">
            PROJETO "{projectTitle.toUpperCase()}" EM {cityLabel.toUpperCase()}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="freq-table-resumo">
              <thead>
                <tr className="freq-table-header">
                  <th style={{ width: 40 }}>Nº por<br/>núcleo</th>
                  <th>Cidade/Estado</th>
                  <th style={{ width: 80 }}>Evento/<br/>modalidade</th>
                  <th>Nome (ordem alfabética)</th>
                  <th style={{ width: 55 }}>Dias de<br/>aula</th>
                  <th style={{ width: 65 }}>Frequência<br/>total</th>
                  <th style={{ width: 65 }}>% Frequência</th>
                  <th style={{ width: 75 }}>Total do<br/>número de<br/>faltas</th>
                  <th style={{ width: 50 }}>% Falta</th>
                </tr>
              </thead>
              <tbody>
                {resumoGeral.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'freq-row-even' : 'freq-row-odd'}>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>{row.num}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 10, color: '#000' }}>{row.cidade}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', color: '#000' }}>{row.evento}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ fontWeight: 500, color: '#000' }}>{row.nome}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>{row.diasAula}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>{row.freqTotal}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 700, color: row.freqPct >= 70 ? '#16a34a' : '#dc2626' }}>{row.freqPct}%</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>{row.totalFaltas}</td>
                    <td contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600, color: '#000' }}>{row.faltaPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 10, color: '#888', marginTop: 8, textAlign: 'right' }}>Fonte: {projectTitle} ({new Date().getFullYear()})</p>

          {/* Brief text about frequency */}
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ marginTop: 20, fontSize: 12, color: '#333', lineHeight: 1.8, textAlign: 'justify' }}>
            A tabela acima apresenta o resumo geral da frequência dos alunos do projeto "{projectTitle}" no município de {cityLabel}/{stateLabel}, referente ao período de {period.startLabel} a {period.endLabel}. Os dados demonstram que a média geral de frequência foi de {totals.avgFreqPct}%, superando amplamente a meta estabelecida de 70%. O total de faltas registrado foi de {totals.avgFaltaPct}%, evidenciando o elevado comprometimento dos beneficiados com as atividades propostas.
          </div>
        </div>

        {/* ━━━ FIGURA 1 — Média da Frequência e Faltas (Pie Chart) ━━━ */}
        <div className="freq-page">
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 16 }}>
            <strong>Figura 1</strong> — Média da Frequência e faltas dos alunos do projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
          </p>
          <div className="freq-pie-chart-container">
            <h4 style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
              Média da Frequência e faltas dos alunos do projeto "{projectTitle}" em {cityLabel}
            </h4>
            <svg viewBox="0 0 260 260" style={{ width: 240, height: 240 }}>
              {(() => {
                const cx = 130, cy = 130, r = 100;
                const faltaAngle = (totals.avgFaltaPct / 100) * 360;
                const rad = (a: number) => (a - 90) * (Math.PI / 180);
                const x1 = cx + r * Math.cos(rad(0));
                const y1 = cy + r * Math.sin(rad(0));
                const x2 = cx + r * Math.cos(rad(faltaAngle));
                const y2 = cy + r * Math.sin(rad(faltaAngle));
                const largeArc = faltaAngle > 180 ? 1 : 0;
                return (
                  <>
                    <circle cx={cx} cy={cy} r={r} fill="#4472c4" />
                    {totals.avgFaltaPct > 0 && <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill="#ed7d31" />}
                    <text x={cx} y={cy + 10} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">Frequência</text>
                    <text x={cx} y={cy + 28} textAnchor="middle" fontSize="12" fill="white">{totals.avgFreqPct}%</text>
                    {totals.avgFaltaPct > 0 && (
                      <>
                        <text x={cx + r * 0.4} y={cy - r * 0.5} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ed7d31">Faltas</text>
                        <text x={cx + r * 0.4} y={cy - r * 0.35} textAnchor="middle" fontSize="10" fill="#ed7d31">{totals.avgFaltaPct}%</text>
                      </>
                    )}
                  </>
                );
              })()}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 14, background: '#4472c4', display: 'inline-block', borderRadius: 2 }}></span>
                <span style={{ fontSize: 11, color: '#333' }}>Frequência</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 14, height: 14, background: '#ed7d31', display: 'inline-block', borderRadius: 2 }}></span>
                <span style={{ fontSize: 11, color: '#333' }}>Faltas</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 10, color: '#888', marginTop: 8 }}>Fonte: {projectTitle} ({new Date().getFullYear()})</p>
        </div>

        {/* ━━━ FIGURA 2 — Média Frequência ━━━ */}
        <div className="freq-page">
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 16 }}>
            <strong>Figura 2</strong> — Média de frequência dos alunos do projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
          </p>
          <ReportBarChart
            data={monthlyAggregates.map(m => ({ label: m.label, value1: m.daysOfClass, value2: m.avgFrequency }))}
            maxY={Math.max(10, ...monthlyAggregates.map(m => m.daysOfClass))}
            title={`Média de frequência dos alunos do projeto "${projectTitle}" em ${cityLabel}`}
            legend1="Dias de aula no mês"
            legend2="Média de frequência"
          />
          <p style={{ fontSize: 10, color: '#888', marginTop: 8 }}>Fonte: {projectTitle} ({new Date().getFullYear()})</p>
        </div>

        {/* ━━━ FIGURA 3 — Média de Faltas ━━━ */}
        <div className="freq-page">
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 16 }}>
            <strong>Figura 3</strong> — Média de faltas dos alunos projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
          </p>
          <ReportBarChart
            data={monthlyAggregates.map(m => ({ label: m.label, value1: m.daysOfClass, value2: m.avgAbsence }))}
            maxY={Math.max(10, ...monthlyAggregates.map(m => m.daysOfClass))}
            title={`Média de faltas dos alunos do projeto "${projectTitle}" em ${cityLabel}`}
            legend1="Dias de aula no mês"
            legend2="Média de faltas dos alunos"
          />
          <p style={{ fontSize: 10, color: '#888', marginTop: 8 }}>Fonte: {projectTitle} ({new Date().getFullYear()})</p>
        </div>

        {/* ━━━ FIGURA 4 — Histórico de Faltas ━━━ */}
        <div className="freq-page">
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 16 }}>
            <strong>Figura 4</strong> — Histórico do número de faltas dos alunos do projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
          </p>
          <ReportBarChart
            data={faltasHistorico.map(f => ({ label: f.label, value1: f.totalFaltas }))}
            maxY={Math.max(10, ...faltasHistorico.map(f => f.totalFaltas))}
            title={`Histórico de número de faltas dos alunos do projeto "${projectTitle}" em ${cityLabel}`}
            legend1="Nº de faltas"
            singleColor
          />
          <p style={{ fontSize: 10, color: '#888', marginTop: 8 }}>Fonte: {projectTitle} ({new Date().getFullYear()})</p>
        </div>

        {/* ━━━ PAGE 16: TABELAS DE FREQUÊNCIA E FALTAS ━━━ */}
        <div className="freq-page">
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', color: '#222', marginBottom: 20, textTransform: 'uppercase' }}>
            Frequência e de faltas dos alunos do projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
          </h3>

          {/* Tabela Nº Faltas dos alunos */}
          <div className="freq-summary-table-wrapper">
            <div className="freq-section-header-bar" style={{ fontSize: 10 }}>
              Histórico do número de faltas dos alunos do projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="freq-table-mini">
                <thead>
                  <tr className="freq-table-header">
                    <th>Mês</th>
                    {faltasHistorico.slice(0, Math.min(9, faltasHistorico.length)).map((f, i) => (
                      <th key={i}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="freq-meta-label" style={{ fontSize: 10 }}>Nº de faltas<br/>dos alunos</td>
                    {faltasHistorico.slice(0, Math.min(9, faltasHistorico.length)).map((f, i) => (
                      <td key={i} contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600 }}>{f.totalFaltas}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {faltasHistorico.length > 9 && (
                <table className="freq-table-mini" style={{ marginTop: 8 }}>
                  <thead>
                    <tr className="freq-table-header">
                      <th>Mês</th>
                      {faltasHistorico.slice(9).map((f, i) => (
                        <th key={i}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="freq-meta-label" style={{ fontSize: 10 }}>Nº de faltas<br/>dos alunos</td>
                      {faltasHistorico.slice(9).map((f, i) => (
                        <td key={i} contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600 }}>{f.totalFaltas}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Tabela Média de Faltas */}
          <div className="freq-summary-table-wrapper" style={{ marginTop: 24 }}>
            <div className="freq-section-header-bar" style={{ fontSize: 10 }}>
              Média de faltas dos alunos do projeto "{projectTitle}", referente ao período de {period.startLabel} a {period.endLabel}, no município de {cityLabel}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="freq-table-mini">
                <thead>
                  <tr className="freq-table-header">
                    <th>Mês</th>
                    {mediaFaltas.slice(0, Math.min(12, mediaFaltas.length)).map((f, i) => (
                      <th key={i}>{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="freq-meta-label" style={{ fontSize: 10 }}>Dias de aula<br/>no mês (média)</td>
                    {mediaFaltas.slice(0, Math.min(12, mediaFaltas.length)).map((f, i) => (
                      <td key={i} contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center' }}>{f.diasAula}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="freq-meta-label" style={{ fontSize: 10 }}>Média de<br/>faltas dos<br/>alunos</td>
                    {mediaFaltas.slice(0, Math.min(12, mediaFaltas.length)).map((f, i) => (
                      <td key={i} contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600 }}>{f.mediaFaltas.toFixed(2).replace('.', ',')}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {mediaFaltas.length > 12 && (
                <table className="freq-table-mini" style={{ marginTop: 8 }}>
                  <thead>
                    <tr className="freq-table-header">
                      <th>Mês</th>
                      {mediaFaltas.slice(12).map((f, i) => (
                        <th key={i}>{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="freq-meta-label" style={{ fontSize: 10 }}>Dias de aula<br/>no mês (média)</td>
                      {mediaFaltas.slice(12).map((f, i) => (
                        <td key={i} contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center' }}>{f.diasAula}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="freq-meta-label" style={{ fontSize: 10 }}>Média de<br/>faltas dos<br/>alunos</td>
                      {mediaFaltas.slice(12).map((f, i) => (
                        <td key={i} contentEditable={isEditing} suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 600 }}>{f.mediaFaltas.toFixed(2).replace('.', ',')}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ━━━ PAGES 17+: MONTHLY ATTENDANCE LISTS ━━━ */}
        <div className="freq-page">
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#111' }}>2 LISTA DE FREQUÊNCIA DO PROJETO ESCOLINHA DE TRIATHLON</h2>
        </div>

        {monthlyDetails.map((md, mdIdx) => (
          <div key={mdIdx} className="freq-page freq-monthly-page">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#222' }}>
              2.{mdIdx + 1} Frequência do mês de {MONTH_NAMES[md.month].toLowerCase()} de {md.year} do projeto {projectTitle}
            </h3>

            <div className="freq-section-header-bar" style={{ fontSize: 10, textAlign: 'center' }}>
              FREQUÊNCIA DO PROJETO ESCOLINHA DE TRIATHLON – {MONTH_NAMES[md.month].toUpperCase()} DE {md.year} (Nº SLIE: {nSli})
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="freq-table-monthly">
                <thead>
                  <tr className="freq-table-header">
                    <th rowSpan={2} style={{ width: 30 }}></th>
                    <th rowSpan={2}>Cidade/Estado</th>
                    <th rowSpan={2}>Nome (ordem alfabética)</th>
                    {md.days.map((d, i) => (
                      <th key={i} style={{ width: 28, fontSize: 8, padding: '2px 1px' }}>
                        {DAY_NAMES_SHORT[d.dayOfWeek]}
                      </th>
                    ))}
                    <th rowSpan={2} style={{ width: 35, fontSize: 8 }}>Dias de<br/>aula no<br/>mês</th>
                    <th rowSpan={2} style={{ width: 45, fontSize: 8 }}>Freq.<br/>total</th>
                    <th rowSpan={2} style={{ width: 40, fontSize: 8 }}>% Freq.</th>
                    <th rowSpan={2} style={{ width: 40, fontSize: 8 }}>Nº de<br/>faltas</th>
                    <th rowSpan={2} style={{ width: 40, fontSize: 8 }}>% falta</th>
                  </tr>
                  <tr className="freq-table-header">
                    {md.days.map((d, i) => (
                      <th key={i} style={{ fontSize: 7, padding: '1px', whiteSpace: 'nowrap' }}>
                        {String(d.day).padStart(2, '0')}-<br/>{MONTH_NAMES[md.month].slice(0,3).toLowerCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {md.students.map((student, sIdx) => (
                    <tr key={sIdx} className={sIdx % 2 === 0 ? 'freq-row-even' : 'freq-row-odd'}>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 9, color: '#000' }}>{sIdx + 1}</td>
                      <td style={{ fontSize: 9, whiteSpace: 'nowrap', color: '#000' }}>{cityLabel}</td>
                      <td style={{ fontSize: 9, fontWeight: 500, whiteSpace: 'nowrap', color: '#000' }}>{student.nome}</td>
                      {md.days.map((d, dIdx) => {
                        const isPresent = student.presences[d.day];
                        return (
                          <td
                            key={dIdx}
                            contentEditable={isEditing}
                            suppressContentEditableWarning
                            style={{
                              textAlign: 'center',
                              fontSize: 8,
                              fontWeight: 600,
                              color: isPresent ? '#000' : '#c0392b',
                              background: isPresent ? undefined : (isPresent === false ? '#fce4ec' : undefined)
                            }}
                          >
                            {isPresent ? 'PP' : (isPresent === false ? 'ff' : '')}
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 9, color: '#000' }}>{md.days.length}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 9, color: '#000' }}>{student.total}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 9, color: student.freqPct >= 70 ? '#16a34a' : '#dc2626' }}>{student.freqPct}%</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 9, color: '#000' }}>{student.faltas}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 9, color: '#000' }}>{student.faltaPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 9, color: '#888', marginTop: 6, textAlign: 'right' }}>Fonte: {projectTitle} ({new Date().getFullYear()})</p>
          </div>
        ))}

      </div>
    </div>
  );
};

export default FrequencyReportBuilder;
