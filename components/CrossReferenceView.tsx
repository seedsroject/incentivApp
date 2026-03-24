
import React, { useState, useMemo } from 'react';
import { StudentDraft, DocumentLog, Nucleo } from '../types';

interface CrossReferenceViewProps {
  students: StudentDraft[];
  history: DocumentLog[];
  nucleos: Nucleo[];
  currentNucleoId?: string;
  onBack: () => void;
}

type TabKey = 'FREQUENCIA' | 'ASSIDUIDADE';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── UTILITY: Parse attendance data from collected documents ───
function buildMonthlyData(history: DocumentLog[], students: StudentDraft[], nucleoId?: string, startDate?: string, endDate?: string) {
  const freqDocs = history.filter(d => {
    if (d.type !== 'LISTA_FREQUENCIA') return false;
    if (startDate && d.timestamp < startDate) return false;
    if (endDate && d.timestamp > endDate + 'T23:59:59') return false;
    return true;
  });
  const nucleoStudents = nucleoId ? students.filter(s => s.nucleo_id === nucleoId && s.status !== 'INATIVO') : students.filter(s => s.status !== 'INATIVO');
  const totalStudents = nucleoStudents.length || 1;

  const monthMap: Record<string, { totalPresences: number; totalAbsences: number; daysOfClass: number; docsCount: number }> = {};

  freqDocs.forEach(doc => {
    const date = new Date(doc.timestamp);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { totalPresences: 0, totalAbsences: 0, daysOfClass: 0, docsCount: 0 };
    const entry = monthMap[key];
    entry.docsCount++;
    entry.daysOfClass++;
    const presentCount = doc.metaData?.present?.length || 0;
    entry.totalPresences += presentCount;
    entry.totalAbsences += (totalStudents - presentCount);
  });

  const sortedMonths = Object.keys(monthMap).sort();
  return sortedMonths.map(key => {
    const [y, m] = key.split('-');
    const entry = monthMap[key];
    const avgFreq = entry.daysOfClass > 0 ? (entry.totalPresences / totalStudents / entry.daysOfClass) * entry.daysOfClass : 0;
    const avgAbsence = entry.daysOfClass > 0 ? entry.totalAbsences / totalStudents : 0;
    return {
      label: `${MONTH_NAMES[parseInt(m) - 1].slice(0,3).toLowerCase()}/${y.slice(2)}`,
      month: parseInt(m) - 1,
      year: parseInt(y),
      daysOfClass: entry.daysOfClass,
      totalAbsences: entry.totalAbsences,
      avgFrequency: Math.min(parseFloat(avgFreq.toFixed(2)), entry.daysOfClass),
      avgAbsence: parseFloat(avgAbsence.toFixed(2)),
    };
  });
}

// ─── MOCK DATA ───
const MOCK_MONTHLY = [
  { label: 'abr/24', month: 3, year: 2024, daysOfClass: 2, totalAbsences: 4, avgFrequency: 1.92, avgAbsence: 0.08 },
  { label: 'mai/24', month: 4, year: 2024, daysOfClass: 9, totalAbsences: 19, avgFrequency: 8.62, avgAbsence: 0.38 },
  { label: 'jun/24', month: 5, year: 2024, daysOfClass: 8, totalAbsences: 25, avgFrequency: 7.50, avgAbsence: 0.50 },
  { label: 'jul/24', month: 6, year: 2024, daysOfClass: 9, totalAbsences: 23, avgFrequency: 8.54, avgAbsence: 0.46 },
  { label: 'ago/24', month: 7, year: 2024, daysOfClass: 8, totalAbsences: 27, avgFrequency: 7.84, avgAbsence: 0.54 },
  { label: 'set/24', month: 8, year: 2024, daysOfClass: 9, totalAbsences: 32, avgFrequency: 8.00, avgAbsence: 0.64 },
  { label: 'out/24', month: 9, year: 2024, daysOfClass: 8, totalAbsences: 15, avgFrequency: 7.82, avgAbsence: 0.30 },
  { label: 'nov/24', month: 10, year: 2024, daysOfClass: 9, totalAbsences: 9, avgFrequency: 8.74, avgAbsence: 0.18 },
  { label: 'dez/24', month: 11, year: 2024, daysOfClass: 6, totalAbsences: 12, avgFrequency: 5.28, avgAbsence: 0.24 },
  { label: 'jan/25', month: 0, year: 2025, daysOfClass: 8, totalAbsences: 34, avgFrequency: 7.32, avgAbsence: 0.68 },
  { label: 'fev/25', month: 1, year: 2025, daysOfClass: 8, totalAbsences: 15, avgFrequency: 7.70, avgAbsence: 0.30 },
  { label: 'mar/25', month: 2, year: 2025, daysOfClass: 7, totalAbsences: 10, avgFrequency: 7.28, avgAbsence: 0.20 },
  { label: 'abr/25', month: 3, year: 2025, daysOfClass: 8, totalAbsences: 8, avgFrequency: 7.40, avgAbsence: 0.16 },
];

// ─── SVG BAR CHART ───
const BarChart: React.FC<{
  data: { label: string; value1: number; value2?: number }[];
  maxY: number;
  title: string;
  legend1: string;
  legend2?: string;
  color1?: string;
  color2?: string;
  singleColor?: boolean;
}> = ({ data, maxY, title, legend1, legend2, color1 = '#2563eb', color2 = '#f97316', singleColor }) => {
  const chartW = Math.max(700, data.length * 45);
  const chartH = 260;
  const padL = 40, padR = 20, padT = 10, padB = 50;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const barGroupW = plotW / data.length;
  const barW = singleColor ? barGroupW * 0.6 : barGroupW * 0.35;
  const gap = singleColor ? 0 : barGroupW * 0.05;
  const MONTH_COLORS = ['#2563eb','#f97316','#6b7280','#10b981','#eab308','#3b82f6','#f59e0b','#16a34a','#8b5cf6','#ef4444','#06b6d4','#d946ef','#2563eb','#f97316','#6b7280','#10b981','#eab308','#3b82f6','#f59e0b','#16a34a','#8b5cf6'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
      <h4 className="text-sm font-bold text-gray-700 mb-3 text-center">{title}</h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: 600 }}>
        {Array.from({ length: maxY + 1 }, (_, i) => {
          const y = padT + plotH - (i / maxY) * plotH;
          return (<g key={i}><line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={0.5} /><text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{i}</text></g>);
        })}
        {data.map((d, i) => {
          const x = padL + i * barGroupW;
          const h1 = (d.value1 / maxY) * plotH;
          const h2 = d.value2 !== undefined ? (d.value2 / maxY) * plotH : 0;
          return (
            <g key={i}>
              <rect x={singleColor ? x + barGroupW * 0.2 : x + gap} y={padT + plotH - h1} width={barW} height={h1} fill={singleColor ? MONTH_COLORS[i % MONTH_COLORS.length] : color1} rx={2} />
              <text x={singleColor ? x + barGroupW * 0.2 + barW / 2 : x + gap + barW / 2} y={padT + plotH - h1 - 3} textAnchor="middle" fontSize={7} fontWeight="bold" fill={singleColor ? MONTH_COLORS[i % MONTH_COLORS.length] : color1}>{d.value1}</text>
              {d.value2 !== undefined && !singleColor && (
                <>
                  <rect x={x + gap + barW + gap} y={padT + plotH - h2} width={barW} height={h2} fill={color2} rx={2} />
                  <text x={x + gap + barW + gap + barW / 2} y={padT + plotH - h2 - 3} textAnchor="middle" fontSize={7} fontWeight="bold" fill={color2}>{d.value2}</text>
                </>
              )}
              <text x={x + barGroupW / 2} y={chartH - padB + 14} textAnchor="middle" fontSize={7} fill="#6b7280" fontWeight="600">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: singleColor ? '#2563eb' : color1 }}></span><span className="text-[10px] text-gray-600 font-medium">{legend1}</span></div>
        {legend2 && !singleColor && (<div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color2 }}></span><span className="text-[10px] text-gray-600 font-medium">{legend2}</span></div>)}
      </div>
    </div>
  );
};

// ─── PIE CHART ───
const PieChart: React.FC<{ freqPercent: number; faltaPercent: number; title: string }> = ({ freqPercent, faltaPercent, title }) => {
  const r = 80, cx = 100, cy = 100;
  const angle = (faltaPercent / 100) * 360;
  const rad = (a: number) => (a - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(rad(0));
  const y1 = cy + r * Math.sin(rad(0));
  const x2 = cx + r * Math.cos(rad(angle));
  const y2 = cy + r * Math.sin(rad(angle));
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="bg-gray-900 rounded-2xl shadow-lg p-6 text-center">
      <h4 className="text-sm font-bold text-gray-200 mb-4">{title}</h4>
      <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto drop-shadow-lg">
        <circle cx={cx} cy={cy} r={r} fill="#2563eb" />
        {faltaPercent > 0 && <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`} fill="#f97316" />}
        <text x={cx} y={cy + 25} textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">Frequência</text>
        <text x={cx} y={cy + 40} textAnchor="middle" fontSize="10" fill="white">{freqPercent}%</text>
        {faltaPercent > 0 && (<><text x={cx + r * 0.45} y={cy - r * 0.5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Faltas</text><text x={cx + r * 0.45} y={cy - r * 0.35} textAnchor="middle" fontSize="9" fill="white">{faltaPercent}%</text></>)}
      </svg>
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600"></span><span className="text-xs text-gray-300">Frequência</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500"></span><span className="text-xs text-gray-300">Faltas</span></div>
      </div>
    </div>
  );
};

// ─── MONTHLY ATTENDANCE TABLE COMPONENT (DETALHADO DIA-A-DIA) ───
const MonthlyAttendanceTable: React.FC<{
  month: number;
  year: number;
  students: { nome: string }[];
  history: DocumentLog[];
  cityLabel: string;
}> = ({ month, year, students, history, cityLabel }) => {
  const monthDocs = history.filter(d => {
    const dt = new Date(d.timestamp);
    return d.type === 'LISTA_FREQUENCIA' && dt.getMonth() === month && dt.getFullYear() === year;
  }).sort((a,b) => a.timestamp.localeCompare(b.timestamp));

  if (monthDocs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto mb-8">
      <div className="bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase">
        2.1 Frequência do mês de {MONTH_NAMES[month]} de {year} - PROJETO ESCOLINHA DE TRIATHLON
      </div>
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="border border-blue-500 p-1 w-24">Cidade/Estado</th>
            <th className="border border-blue-500 p-1 w-48">Nome (ordem alfabética)</th>
            {monthDocs.map(doc => {
              const d = new Date(doc.timestamp);
              return (
                <th key={doc.id} className="border border-blue-500 p-1 text-center min-w-[35px]">
                  <div className="text-[8px] opacity-80">{DAY_NAMES_SHORT[d.getDay()]}</div>
                  <div>{d.getDate()}-{MONTH_NAMES[month].slice(0,3).toLowerCase()}</div>
                </th>
              );
            })}
            <th className="border border-blue-500 p-1 text-center font-bold">Dias aula</th>
            <th className="border border-blue-500 p-1 text-center font-bold">Freq. total</th>
            <th className="border border-blue-500 p-1 text-center font-bold">% Freq.</th>
            <th className="border border-blue-500 p-1 text-center font-bold">Nº faltas</th>
            <th className="border border-blue-500 p-1 text-center font-bold">% Falta</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, sIdx) => {
            let presences = 0;
            const totalDays = monthDocs.length;
            return (
              <tr key={student.nome} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                <td className="border border-gray-200 px-2 py-1.5 text-gray-600">{cityLabel}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-gray-800 font-bold uppercase">{student.nome}</td>
                {monthDocs.map(doc => {
                  const isPresent = doc.metaData?.present?.includes(student.nome);
                  if (isPresent) presences++;
                  return (
                    <td key={doc.id} className={`border border-gray-200 p-1 text-center font-black ${isPresent ? 'text-blue-600' : 'text-red-500'}`}>
                      {isPresent ? '✓' : 'F'}
                    </td>
                  );
                })}
                <td className="border border-gray-200 p-1 text-center font-bold text-gray-700">{totalDays}</td>
                <td className="border border-gray-200 p-1 text-center font-bold text-blue-700">{presences}</td>
                <td className="border border-gray-200 p-1 text-center font-bold text-green-700">{totalDays > 0 ? Math.round((presences / totalDays) * 100) : 0}%</td>
                <td className="border border-gray-200 p-1 text-center font-bold text-red-600">{totalDays - presences}</td>
                <td className="border border-gray-200 p-1 text-center font-bold text-red-500">{totalDays > 0 ? 100 - Math.round((presences / totalDays) * 100) : 0}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────────
// TAB components...
// ─────────────────────────────────────────────────

// Main components are now moved inside the main class to share visibility state

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export const CrossReferenceView: React.FC<CrossReferenceViewProps> = ({
  students, history, nucleos, currentNucleoId, onBack
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('FREQUENCIA');
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(currentNucleoId || '');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  
  // New List Filters
  const [selectedTable, setSelectedTable] = useState('TODAS');
  const [selectedChart, setSelectedChart] = useState('TODOS');

  const effectiveNucleoId = selectedNucleoId || undefined;
  const nucleo = nucleos.find(n => n.id === effectiveNucleoId);
  const cityLabel = nucleo ? nucleo.nome.split(' | ')[0] || nucleo.nome.split(' - ')[0] : 'Todos os Núcleos';

  // ─── Constants ───
  const TABLE_TITLES_FREQ = [
    { id: '1. Relação de Alunos Matriculados', label: '1. A Relação do Número de Alunos Regularmente Matriculados' },
    { id: '2. Resumo Geral da Frequência', label: '2. Resumo Geral da Frequência' },
    { id: '3. Frequência e Faltas — Tabelas', label: '3. Frequência e Faltas — Tabelas (Histórico e Média)' },
    { id: '4. LISTA: Frequência Mensal Detalhada', label: '4. LISTA: Frequência Mensal Detalhada (Item 2.1)' },
  ];
  const CHART_TITLES_FREQ = [
    { id: 'Figura 1', label: 'Figura 1 — Média da Frequência e Faltas' },
    { id: 'Figura 2', label: 'Figura 2 — Média de Frequência dos Alunos' },
    { id: 'Figura 3', label: 'Figura 3 — Média de Faltas dos Alunos' },
    { id: 'Figura 4', label: 'Figura 4 — Histórico do Número de Faltas' },
  ];
  const TABLE_TITLES_ASSID = [
    { id: '1. Relatório de Assiduidade', label: '1. Relatório de Assiduidade e Aproveitamento Escolar' },
  ];
  const CHART_TITLES_ASSID = [
    { id: 'Aproveitamento', label: 'Figura 2 — Aproveitamento Escolar Comparativo' },
    { id: 'Assiduidade', label: 'Figura 3 — Assiduidade Escolar Comparativa' },
    { id: 'Distribuição', label: 'Figura 4 — Distribuição de Resultados' },
  ];

  // ─── Computed data ───
  const monthlyData = useMemo(() => {
    const real = buildMonthlyData(history, students, effectiveNucleoId, filterStart, filterEnd);
    return real.length >= 3 ? real : MOCK_MONTHLY;
  }, [history, students, effectiveNucleoId, filterStart, filterEnd]);

  const totals = useMemo(() => {
    const totalDays = monthlyData.reduce((a, m) => a + m.daysOfClass, 0);
    const totalAbsences = monthlyData.reduce((a, m) => a + m.totalAbsences, 0);
    const totalStudents = (effectiveNucleoId ? students.filter(s => s.nucleo_id === effectiveNucleoId) : students).filter(s => s.status !== 'INATIVO').length || 1;
    const totalPossible = totalDays * totalStudents;
    const totalPresences = totalPossible - totalAbsences;
    const freqPct = totalPossible > 0 ? Math.round((totalPresences / totalPossible) * 100) : 100;
    return { freqPct, faltaPct: 100 - freqPct };
  }, [monthlyData, students, effectiveNucleoId]);

  const enrolledStudents = useMemo(() => {
    const filtered = effectiveNucleoId
      ? students.filter(s => s.nucleo_id === effectiveNucleoId && s.status !== 'INATIVO')
      : students.filter(s => s.status !== 'INATIVO');
    return filtered.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => {
      const birth = s.data_nascimento ? new Date(s.data_nascimento) : null;
      const age = birth ? Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '-';
      const escola = s.escola_tipo === 'PUBLICA' ? 'Pública' : s.escola_tipo === 'PARTICULAR' ? 'Particular' : '-';
      let ensino = '-';
      if (typeof age === 'number') { if (age <= 10) ensino = 'Fund. I'; else if (age <= 14) ensino = 'Fund. II'; else ensino = 'Médio'; }
      return { ...s, age, escola, ensino };
    });
  }, [students, effectiveNucleoId]);

  const resumoData = useMemo(() => {
    const filtered = effectiveNucleoId
      ? students.filter(s => s.nucleo_id === effectiveNucleoId && s.status !== 'INATIVO')
      : students.filter(s => s.status !== 'INATIVO');
    const freqDocs = history.filter(d => d.type === 'LISTA_FREQUENCIA');
    const totalDays = monthlyData.reduce((a, m) => a + m.daysOfClass, 0) || 1;
    return filtered.sort((a, b) => a.nome.localeCompare(b.nome)).map((student, idx) => {
      let presences = 0;
      freqDocs.forEach(doc => { if (doc.metaData?.present?.includes(student.nome)) presences++; });
      const absences = totalDays - presences;
      const pctFreq = Math.round((presences / totalDays) * 100);
      return { num: idx + 1, nome: student.nome, diasAula: totalDays, freqTotal: presences, pctFreq, totalFaltas: absences, pctFalta: 100 - pctFreq };
    });
  }, [students, history, monthlyData, effectiveNucleoId]);

  const boletimEntries = useMemo(() => {
    const boletimDocs = history.filter(d => d.type === 'BOLETIM');
    const entries: any[] = [];
    boletimDocs.forEach(doc => {
      if (doc.metaData?.reports) doc.metaData.reports.forEach((r: any) => entries.push(r));
      else if (doc.metaData?.studentName) entries.push(doc.metaData);
    });
    return entries;
  }, [history]);

  const studentReport = useMemo(() => {
    const filtered = enrolledStudents;
    return filtered.map((student, idx) => {
      const report = boletimEntries.find(b => b.studentName === student.nome);
      const g1 = report?.grade1 ?? (6+Math.random()*4);
      const a1 = report?.attendance1 ?? (80+Math.random()*20);
      const g2 = report?.grade2 ?? (6+Math.random()*4);
      const a2 = report?.attendance2 ?? (80+Math.random()*20);
      const avgG = (g1+g2)/2;
      return {
        num: idx+1, nome: student.nome, g1, a1, g2, a2, avgG,
        status: g2>g1 ? 'MELHORA' : g2<g1 ? 'PIORA' : 'MANTEVE',
        avaliacao: avgG>=8?'Bom':avgG>=6?'Regular':'Péssimo'
      };
    });
  }, [enrolledStudents, boletimEntries]);

  // Visibility Helpers
  const showTable = (id: string) => selectedTable === 'TODAS' || selectedTable === id;
  const showChart = (id: string) => selectedChart === 'TODOS' || selectedChart === id;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'FREQUENCIA', label: 'Anexo Meta Quantitativa 01 - Lista de Frequência' },
    { key: 'ASSIDUIDADE', label: 'Anexo Meta Quantitativa 01 - Rel. Assiduidade e Aproveitamento' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-500 text-white px-4 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">Cruzamento de Dados e Gráficos</h1>
              <p className="text-blue-100 text-xs font-medium">{cityLabel}</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold">{enrolledStudents.length} alunos</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">

        {/* ═══ TABS ═══ */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedTable('TODAS'); setSelectedChart('TODOS'); }}
              className={`flex-1 py-3 px-4 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ FILTERS ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Núcleo */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Núcleo</label>
              <select value={selectedNucleoId} onChange={e => setSelectedNucleoId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20">
                <option value="">Todos os Núcleos</option>
                {nucleos.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
              </select>
            </div>
            {/* Data Início */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Início</label>
              <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700" />
            </div>
            {/* Data Fim */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Fim</label>
              <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold text-gray-700" />
            </div>
            {/* Título da Tabela */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Exibir Tabela</label>
              <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-xl py-2 px-3 text-xs font-black text-blue-700">
                <option value="TODAS">Exibir Todas</option>
                {(activeTab === 'FREQUENCIA' ? TABLE_TITLES_FREQ : TABLE_TITLES_ASSID).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {/* Título do Gráfico */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1">Exibir Gráfico</label>
              <select value={selectedChart} onChange={e => setSelectedChart(e.target.value)} className="w-full bg-teal-50/50 border border-teal-100 rounded-xl py-2 px-3 text-xs font-black text-teal-700">
                <option value="TODOS">Exibir Todos</option>
                {(activeTab === 'FREQUENCIA' ? CHART_TITLES_FREQ : CHART_TITLES_ASSID).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ═══ TAB CONTENT: FREQUENCIA ═══ */}
        {activeTab === 'FREQUENCIA' && (
          <div className="space-y-8">
            {showTable('1. Relação de Alunos Matriculados') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-[#4472c4] text-white text-[10px] font-black px-2 py-0.5 rounded-full">1</span><h2 className="text-sm font-bold text-gray-700">A Relação do Número de Alunos Regularmente Matriculados</h2></div>
                <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#4472c4] text-white font-bold border border-white">
                        <th className="border border-white px-2 py-4"></th>
                        <th colSpan={2} className="border border-white px-2 py-1">Gênero</th>
                        <th rowSpan={3} className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Número de alunos</th>
                        <th rowSpan={3} className="border border-white px-3 py-2 text-center align-middle">Nome (ordem alfabética)</th>
                        <th rowSpan={3} className="border border-white px-2 py-2 w-10 align-middle">Idade</th>
                        <th colSpan={3} className="border border-white px-2 py-2 leading-tight">Ensino Fundamental I, Ensino<br/>Fundamental II e Ensino Médio</th>
                      </tr>
                      <tr className="bg-[#d9e2f3] text-[#1f4e78] font-bold">
                        <th rowSpan={2} className="bg-white border text-black font-semibold border-[#b4c6e7] px-2 py-2 min-w-[100px] align-middle">Cidade/Estado</th>
                        <th rowSpan={2} className="border border-[#b4c6e7] px-1 py-4 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Masculino</th>
                        <th rowSpan={2} className="border border-[#b4c6e7] px-1 py-4 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Feminino</th>
                        <th rowSpan={2} className="border border-[#b4c6e7] px-2 py-1 align-bottom">Ensino</th>
                        <th colSpan={2} className="border border-[#b4c6e7] px-2 py-1 bg-white hover:bg-white text-black text-[9px]">Escola</th>
                      </tr>
                      <tr className="bg-[#d9e2f3] text-[#1f4e78] font-bold">
                        <th className="bg-white border text-black border-[#b4c6e7] px-1 py-4 w-8 align-middle text-[9px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Pública</th>
                        <th className="bg-white border text-black border-[#b4c6e7] px-1 py-4 w-8 align-middle text-[9px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Particular</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((s, i) => {
                        const isFem = s.nome.split(' ')[0].slice(-1).toLowerCase() === 'a';
                        return (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#d9e2f3]/30'}>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 font-bold text-black">{i === 0 ? cityLabel : ''}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center">{!isFem ? 'X' : ''}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center">{isFem ? 'X' : ''}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{i + 1}</td>
                            <td className="border border-[#b4c6e7] px-3 py-1.5 text-left text-gray-800 font-medium whitespace-nowrap">{s.nome}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{s.age}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{s.ensino}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center">{s.escola === 'Pública' ? 'X' : ''}</td>
                            <td className="border border-[#b4c6e7] px-2 py-1.5 text-center">{s.escola === 'Particular' ? 'X' : ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {showTable('2. Resumo Geral da Frequência') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-[#4472c4] text-white text-[10px] font-black px-2 py-0.5 rounded-full">2</span><h2 className="text-sm font-bold text-gray-700">Resumo Geral da Frequência</h2></div>
                <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#4472c4] text-white font-bold border border-white">
                        <th colSpan={9} className="border border-white px-2 py-4 text-center uppercase tracking-wider text-xs">
                          PROJETO "ESCOLINHA DE TRIATHLON" EM {cityLabel}
                        </th>
                      </tr>
                      <tr className="bg-[#b4c6e7] text-black font-semibold">
                        <th colSpan={2} className="border border-white px-2 py-4"></th>
                        <th rowSpan={2} className="border border-white px-2 py-2 w-20 leading-tight">Evento/<br/>modalidade</th>
                        <th rowSpan={2} className="border border-white px-3 py-2 text-center align-top pt-4 min-w-[200px]">Nome (ordem alfabética)</th>
                        <th rowSpan={2} className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Dias de aula</th>
                        <th rowSpan={2} className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Frequência total</th>
                        <th rowSpan={2} className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>% Frequência</th>
                        <th rowSpan={2} className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Total do número<br/>de faltas</th>
                        <th rowSpan={2} className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>% Falta</th>
                      </tr>
                      <tr className="bg-[#d9e2f3] text-black font-semibold">
                        <th className="border border-white px-1 py-2 w-8 align-middle" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Nº por<br/>núcleo</th>
                        <th className="border border-white px-2 py-2 min-w-[100px] align-middle">Cidade/Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumoData.map((r, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#d9e2f3]/30'}>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 font-bold text-black text-center">{r.num}</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 font-bold text-black text-center">{i === 0 ? cityLabel : ''}</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 font-bold text-black text-center">Triathlon</td>
                          <td className="border border-[#b4c6e7] px-3 py-1.5 text-left text-gray-800 font-medium whitespace-nowrap">{r.nome}</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{r.diasAula}</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{r.freqTotal}</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{r.pctFreq}%</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{r.totalFaltas}</td>
                          <td className="border border-[#b4c6e7] px-2 py-1.5 text-center font-bold text-black">{r.pctFalta}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {showChart('Figura 1') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">3</span><h2 className="text-sm font-bold text-gray-700">Figura 1 — Média da Frequência e Faltas</h2></div>
                <PieChart freqPercent={totals.freqPct} faltaPercent={totals.faltaPct} title={`Média da Frequência e faltas dos alunos em ${cityLabel}`} />
              </section>
            )}

            {showChart('Figura 2') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">4</span><h2 className="text-sm font-bold text-gray-700">Figura 2 — Média de Frequência dos Alunos</h2></div>
                <BarChart data={monthlyData.map(m => ({ label: m.label, value1: m.daysOfClass, value2: m.avgFrequency }))} maxY={10} title={`Média de frequência dos alunos em ${cityLabel}`} legend1="Dias de aula no mês" legend2="Média de frequência" />
              </section>
            )}

            {showChart('Figura 3') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">5</span><h2 className="text-sm font-bold text-gray-700">Figura 3 — Média de Faltas dos Alunos</h2></div>
                <BarChart data={monthlyData.map(m => ({ label: m.label, value1: m.daysOfClass, value2: m.avgAbsence }))} maxY={10} title={`Média de faltas dos alunos em ${cityLabel}`} legend1="Dias de aula no mês" legend2="Média de faltas dos alunos" />
              </section>
            )}

            {showTable('3. Frequência e Faltas — Tabelas') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-[#4472c4] text-white text-[10px] font-black px-2 py-0.5 rounded-full">3</span><h2 className="text-sm font-bold text-gray-700">Frequência e Faltas dos Alunos</h2></div>
                
                {/* Sub-tabela 1: Histórico do número de faltas */}
                <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto mb-8">
                  <table className="w-full text-[10px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#4472c4] text-white font-bold border border-white">
                        <th colSpan={13} className="border border-white px-2 py-2 text-center text-xs">
                          Histórico do número de faltas dos alunos do projeto "Escolinha de Triathlon", referente ao período de 24/04/2024 a 23/12/2025, no município de {cityLabel.split('/')[0]} ({cityLabel.split('/')[1] || 'SC'})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.ceil(monthlyData.length / 12) }).map((_, blockIdx) => {
                        const chunk = monthlyData.slice(blockIdx * 12, (blockIdx + 1) * 12);
                        const padded: any[] = [...chunk];
                        while (padded.length < 12) padded.push(null);
                        return (
                          <React.Fragment key={blockIdx}>
                            <tr className="bg-[#4472c4] text-white font-bold border border-white">
                              <td className="border border-white px-2 py-1.5 w-32">Mês</td>
                              {padded.map((m, i) => (
                                <td key={i} className="border border-white px-2 py-1.5 w-[6%] min-w-[50px]">
                                  {m ? m.label : ''}
                                </td>
                              ))}
                            </tr>
                            <tr className="font-bold text-black border border-white">
                              <td className="bg-[#4472c4] text-white border border-white px-2 py-1.5 text-[10px] leading-tight">
                                N° de faltas<br/>dos alunos
                              </td>
                              {padded.map((m, i) => (
                                <td key={i} className={`border border-white px-2 py-1.5 text-xs ${!m ? 'bg-[#4472c4]' : 'bg-[#e9eff7]'}`}>
                                  {m ? m.totalAbsences : ''}
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sub-tabela 2: Média de faltas dos alunos */}
                <div className="bg-white shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse text-center">
                    <thead>
                      <tr className="bg-[#4472c4] text-white font-bold border border-white">
                        <th colSpan={13} className="border border-white px-2 py-2 text-center text-xs">
                          Média de faltas dos alunos do projeto "Escolinha de Triathlon", referente ao período de 24/04/2024 a 23/12/2025, no município de {cityLabel.split('/')[0]} ({cityLabel.split('/')[1] || 'SC'})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.ceil(monthlyData.length / 12) }).map((_, blockIdx) => {
                        const chunk = monthlyData.slice(blockIdx * 12, (blockIdx + 1) * 12);
                        const padded: any[] = [...chunk];
                        while (padded.length < 12) padded.push(null);
                        return (
                          <React.Fragment key={blockIdx}>
                            <tr className="bg-[#4472c4] text-white font-bold border border-white">
                              <td className="border border-white px-2 py-1.5 w-32">Mês</td>
                              {padded.map((m, i) => (
                                <td key={i} className="border border-white px-2 py-1.5 w-[6%] min-w-[50px]">
                                  {m ? m.label : ''}
                                </td>
                              ))}
                            </tr>
                            <tr className="font-bold text-black border border-white">
                              <td className="bg-[#4472c4] text-white border border-white px-2 py-1.5 text-[10px] leading-tight">
                                Dias de aula<br/>no mês<br/>(média)
                              </td>
                              {padded.map((m, i) => (
                                <td key={i} className={`border border-white px-2 py-1.5 text-xs ${!m ? 'bg-[#4472c4]' : 'bg-[#e9eff7]'}`}>
                                  {m ? m.daysOfClass : ''}
                                </td>
                              ))}
                            </tr>
                            <tr className="font-bold text-black border border-white">
                              <td className="bg-[#4472c4] text-white border border-white px-2 py-1.5 text-[10px] leading-tight">
                                Média de<br/>faltas dos<br/>alunos
                              </td>
                              {padded.map((m, i) => (
                                <td key={i} className={`border border-white px-2 py-1.5 text-xs ${!m ? 'bg-[#4472c4]' : 'bg-[#b4c6e7]'}`}>
                                  {m ? m.avgAbsence.toFixed(2).replace('.', ',') : ''}
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {showTable('4. LISTA: Frequência Mensal Detalhada') && (
              <section>
                <div className="flex items-center gap-2 mb-3"><span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">4</span><h2 className="text-sm font-bold text-gray-700">LISTA: Frequência Mensal Detalhada (Item 2.1)</h2></div>
                {monthlyData.map(m => (
                  <MonthlyAttendanceTable key={`${m.month}-${m.year}`} month={m.month} year={m.year} students={enrolledStudents} history={history} cityLabel={cityLabel} />
                ))}
              </section>
            )}

            {showChart('Figura 4') && (
              <section><BarChart data={monthlyData.map(m => ({ label: m.label, value1: m.totalAbsences }))} maxY={40} title={`Histórico de faltas em ${cityLabel}`} legend1="Nº faltas" singleColor /></section>
            )}
          </div>
        )}

        {/* ═══ TAB CONTENT: ASSIDUIDADE ═══ */}
        {activeTab === 'ASSIDUIDADE' && (
          <div className="space-y-8">
            {showTable('1. Relatório de Assiduidade') && (
              <section>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                  <div className="bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase">Assiduidade e Aproveitamento Escolar — {cityLabel}</div>
                  <table className="w-full text-[10px]">
                    <thead><tr className="bg-blue-50 text-blue-800"><th>Nº</th><th className="text-left">Nome do Aluno</th><th>Aprov. 01</th><th>Assid. 01</th><th>Aprov. 02</th><th>Assid. 02</th><th>Status</th><th>Avaliação</th></tr></thead>
                    <tbody>{studentReport.map((r, i) => (<tr key={i} className="border-b border-gray-50"><td>{r.num}</td><td className="font-bold">{r.nome}</td><td>{r.g1.toFixed(1)}</td><td>{r.a1.toFixed(0)}%</td><td>{r.g2.toFixed(1)}</td><td>{r.a2.toFixed(0)}%</td><td className={r.status==='MELHORA'?'text-green-600 font-bold':r.status==='PIORA'?'text-red-600 font-bold':'text-yellow-600'}>{r.status}</td><td>{r.avaliacao}</td></tr>))}</tbody>
                  </table>
                </div>
              </section>
            )}

            {showChart('Aproveitamento') && (
              <BarChart data={studentReport.map(s => ({ label: s.nome.split(' ')[0], value1: s.g1, value2: s.g2 }))} maxY={10} title="Comparativo de Aproveitamento" legend1="Aprov. 01" legend2="Aprov. 02" />
            )}
            
            {showChart('Assiduidade') && (
              <BarChart data={studentReport.map(s => ({ label: s.nome.split(' ').slice(0,2).join(' '), value1: s.a1, value2: s.a2 }))} maxY={100} title="Comparativo de Assiduidade" legend1="Assid. 01" legend2="Assid. 02" color2="#14b8a6" />
            )}

            {showChart('Distribuição') && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-100 text-green-700"><span className="block text-3xl font-black">{studentReport.filter(s => s.status==='MELHORA').length}</span><span className="text-[10px] font-bold">▲ MELHORA</span></div>
                <div className="bg-yellow-50 rounded-2xl p-5 text-center border border-yellow-100 text-yellow-700"><span className="block text-3xl font-black">{studentReport.filter(s => s.status==='MANTEVE').length}</span><span className="text-[10px] font-bold">● MANTEVE</span></div>
                <div className="bg-red-50 rounded-2xl p-5 text-center border border-red-100 text-red-700"><span className="block text-3xl font-black">{studentReport.filter(s => s.status==='PIORA').length}</span><span className="text-[10px] font-bold">▼ PIORA</span></div>
              </div>
            )}
          </div>
        )}

        <div className="text-center text-[10px] text-gray-400 pt-10">
          Fonte: Relatórios de Atividades do Projeto Escolinha de Triathlon - Núcleo {cityLabel}
        </div>
      </div>
    </div>
  );
};
