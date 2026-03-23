
import React, { useMemo } from 'react';
import { StudentDraft, DocumentLog, Nucleo } from '../types';

interface CrossReferenceViewProps {
  students: StudentDraft[];
  history: DocumentLog[];
  nucleos: Nucleo[];
  currentNucleoId?: string;
  onBack: () => void;
}

// ─── UTILITY: Parse attendance data from collected documents ───
function buildMonthlyData(history: DocumentLog[], students: StudentDraft[], nucleoId?: string) {
  const freqDocs = history.filter(d => d.type === 'LISTA_FREQUENCIA');
  const nucleoStudents = nucleoId ? students.filter(s => s.nucleo_id === nucleoId && s.status !== 'INATIVO') : students.filter(s => s.status !== 'INATIVO');
  const totalStudents = nucleoStudents.length || 1;

  // Group frequency docs by month
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

  // Sort months chronologically
  const sortedMonths = Object.keys(monthMap).sort();
  return sortedMonths.map(key => {
    const [y, m] = key.split('-');
    const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const entry = monthMap[key];
    const avgFreq = entry.daysOfClass > 0 ? (entry.totalPresences / totalStudents / entry.daysOfClass) * entry.daysOfClass : 0;
    const avgAbsence = entry.daysOfClass > 0 ? entry.totalAbsences / totalStudents : 0;
    return {
      label: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`,
      daysOfClass: entry.daysOfClass,
      totalAbsences: entry.totalAbsences,
      avgFrequency: Math.min(parseFloat(avgFreq.toFixed(2)), entry.daysOfClass),
      avgAbsence: parseFloat(avgAbsence.toFixed(2)),
    };
  });
}

// ─── MOCK DATA (fallback when no real data) ───
const MOCK_MONTHLY = [
  { label: 'abr/24', daysOfClass: 2, totalAbsences: 4, avgFrequency: 1.92, avgAbsence: 0.08 },
  { label: 'mai/24', daysOfClass: 9, totalAbsences: 19, avgFrequency: 8.62, avgAbsence: 0.38 },
  { label: 'jun/24', daysOfClass: 8, totalAbsences: 25, avgFrequency: 7.50, avgAbsence: 0.50 },
  { label: 'jul/24', daysOfClass: 9, totalAbsences: 23, avgFrequency: 8.54, avgAbsence: 0.46 },
  { label: 'ago/24', daysOfClass: 8, totalAbsences: 27, avgFrequency: 7.84, avgAbsence: 0.54 },
  { label: 'set/24', daysOfClass: 9, totalAbsences: 32, avgFrequency: 8.00, avgAbsence: 0.64 },
  { label: 'out/24', daysOfClass: 8, totalAbsences: 15, avgFrequency: 7.82, avgAbsence: 0.30 },
  { label: 'nov/24', daysOfClass: 9, totalAbsences: 9, avgFrequency: 8.74, avgAbsence: 0.18 },
  { label: 'dez/24', daysOfClass: 6, totalAbsences: 12, avgFrequency: 5.28, avgAbsence: 0.24 },
  { label: 'jan/25', daysOfClass: 8, totalAbsences: 34, avgFrequency: 7.32, avgAbsence: 0.68 },
  { label: 'fev/25', daysOfClass: 8, totalAbsences: 15, avgFrequency: 7.70, avgAbsence: 0.30 },
  { label: 'mar/25', daysOfClass: 7, totalAbsences: 10, avgFrequency: 7.28, avgAbsence: 0.20 },
  { label: 'abr/25', daysOfClass: 8, totalAbsences: 8, avgFrequency: 7.40, avgAbsence: 0.16 },
  { label: 'mai/25', daysOfClass: 8, totalAbsences: 8, avgFrequency: 7.96, avgAbsence: 0.06 },
  { label: 'jun/25', daysOfClass: 9, totalAbsences: 0, avgFrequency: 8.98, avgAbsence: 0.00 },
  { label: 'jul/25', daysOfClass: 9, totalAbsences: 3, avgFrequency: 9.00, avgAbsence: 0.14 },
  { label: 'ago/25', daysOfClass: 8, totalAbsences: 9, avgFrequency: 8.30, avgAbsence: 0.30 },
  { label: 'set/25', daysOfClass: 9, totalAbsences: 16, avgFrequency: 8.68, avgAbsence: 0.32 },
  { label: 'out/25', daysOfClass: 9, totalAbsences: 7, avgFrequency: 9.00, avgAbsence: 0.14 },
  { label: 'nov/25', daysOfClass: 7, totalAbsences: 15, avgFrequency: 7.18, avgAbsence: 0.30 },
  { label: 'dez/25', daysOfClass: 6, totalAbsences: 10, avgFrequency: 5.80, avgAbsence: 0.20 },
];

// ─── SVG BAR CHART COMPONENT ───
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
        {/* Y axis lines */}
        {Array.from({ length: maxY + 1 }, (_, i) => {
          const y = padT + plotH - (i / maxY) * plotH;
          return (
            <g key={i}>
              <line x1={padL} x2={chartW - padR} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{i}</text>
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
              {/* Bar 1 */}
              <rect
                x={singleColor ? x + barGroupW * 0.2 : x + gap}
                y={padT + plotH - h1}
                width={barW}
                height={h1}
                fill={singleColor ? MONTH_COLORS[i % MONTH_COLORS.length] : color1}
                rx={2}
              />
              {/* Value label on bar 1 */}
              <text
                x={singleColor ? x + barGroupW * 0.2 + barW / 2 : x + gap + barW / 2}
                y={padT + plotH - h1 - 3}
                textAnchor="middle"
                fontSize={7}
                fontWeight="bold"
                fill={singleColor ? MONTH_COLORS[i % MONTH_COLORS.length] : color1}
              >{d.value1}</text>
              {/* Bar 2 */}
              {d.value2 !== undefined && !singleColor && (
                <>
                  <rect
                    x={x + gap + barW + gap}
                    y={padT + plotH - h2}
                    width={barW}
                    height={h2}
                    fill={color2}
                    rx={2}
                  />
                  <text
                    x={x + gap + barW + gap + barW / 2}
                    y={padT + plotH - h2 - 3}
                    textAnchor="middle"
                    fontSize={7}
                    fontWeight="bold"
                    fill={color2}
                  >{d.value2}</text>
                </>
              )}
              {/* X label */}
              <text
                x={x + barGroupW / 2}
                y={chartH - padB + 14}
                textAnchor="middle"
                fontSize={7}
                fill="#6b7280"
                fontWeight="600"
              >{d.label}</text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: singleColor ? '#2563eb' : color1 }}></span>
          <span className="text-[10px] text-gray-600 font-medium">{legend1}</span>
        </div>
        {legend2 && !singleColor && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color2 }}></span>
            <span className="text-[10px] text-gray-600 font-medium">{legend2}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PIE CHART COMPONENT ───
const PieChart: React.FC<{ freqPercent: number; faltaPercent: number; title: string }> = ({ freqPercent, faltaPercent, title }) => {
  const r = 80;
  const cx = 100, cy = 100;
  // SVG arc for the "faltas" slice
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
        {/* Full circle = Frequência */}
        <circle cx={cx} cy={cy} r={r} fill="#2563eb" />
        {/* Faltas slice */}
        {faltaPercent > 0 && (
          <path
            d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill="#f97316"
          />
        )}
        {/* Center labels */}
        <text x={cx} y={cy + 25} textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">Frequência</text>
        <text x={cx} y={cy + 40} textAnchor="middle" fontSize="10" fill="white">{freqPercent}%</text>
        {faltaPercent > 0 && (
          <>
            <text x={cx + r * 0.45} y={cy - r * 0.5} textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Faltas</text>
            <text x={cx + r * 0.45} y={cy - r * 0.35} textAnchor="middle" fontSize="9" fill="white">{faltaPercent}%</text>
          </>
        )}
      </svg>
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-600"></span><span className="text-xs text-gray-300">Frequência</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500"></span><span className="text-xs text-gray-300">Faltas</span></div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───
export const CrossReferenceView: React.FC<CrossReferenceViewProps> = ({
  students, history, nucleos, currentNucleoId, onBack
}) => {
  const nucleo = nucleos.find(n => n.id === currentNucleoId);
  const cityLabel = nucleo ? nucleo.nome.split(' | ')[0] || nucleo.nome.split(' - ')[0] : 'Todos os Núcleos';

  const monthlyData = useMemo(() => {
    const real = buildMonthlyData(history, students, currentNucleoId);
    return real.length >= 3 ? real : MOCK_MONTHLY;
  }, [history, students, currentNucleoId]);

  // Totals for pie chart
  const totals = useMemo(() => {
    const totalDays = monthlyData.reduce((a, m) => a + m.daysOfClass, 0);
    const totalAbsences = monthlyData.reduce((a, m) => a + m.totalAbsences, 0);
    const totalStudents = (currentNucleoId ? students.filter(s => s.nucleo_id === currentNucleoId) : students).filter(s => s.status !== 'INATIVO').length || 1;
    const totalPossible = totalDays * totalStudents;
    const totalPresences = totalPossible - totalAbsences;
    const freqPct = totalPossible > 0 ? Math.round((totalPresences / totalPossible) * 100) : 100;
    return { freqPct, faltaPct: 100 - freqPct };
  }, [monthlyData, students, currentNucleoId]);

  // Enrolled students info for Relação table
  const enrolledStudents = useMemo(() => {
    const filtered = currentNucleoId
      ? students.filter(s => s.nucleo_id === currentNucleoId && s.status !== 'INATIVO')
      : students.filter(s => s.status !== 'INATIVO');
    return filtered.sort((a, b) => a.nome.localeCompare(b.nome)).map(s => {
      const birth = s.data_nascimento ? new Date(s.data_nascimento) : null;
      const age = birth ? Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '-';
      const escola = s.escola_tipo === 'PUBLICA' ? 'Pública' : s.escola_tipo === 'PARTICULAR' ? 'Particular' : '-';
      let ensino = '-';
      if (typeof age === 'number') {
        if (age <= 10) ensino = 'Fund. I';
        else if (age <= 14) ensino = 'Fund. II';
        else ensino = 'Médio';
      }
      return { ...s, age, escola, ensino };
    });
  }, [students, currentNucleoId]);

  // Resumo Geral data per student
  const resumoData = useMemo(() => {
    const filtered = currentNucleoId
      ? students.filter(s => s.nucleo_id === currentNucleoId && s.status !== 'INATIVO')
      : students.filter(s => s.status !== 'INATIVO');

    const freqDocs = history.filter(d => d.type === 'LISTA_FREQUENCIA');
    const totalDays = monthlyData.reduce((a, m) => a + m.daysOfClass, 0) || 1;

    return filtered.sort((a, b) => a.nome.localeCompare(b.nome)).map((student, idx) => {
      let presences = 0;
      freqDocs.forEach(doc => {
        if (doc.metaData?.present?.includes(student.nome)) presences++;
      });
      const absences = totalDays - presences;
      const pctFreq = Math.round((presences / totalDays) * 100);
      const pctFalta = 100 - pctFreq;
      return {
        num: idx + 1,
        nome: student.nome,
        diasAula: totalDays,
        freqTotal: presences,
        pctFreq,
        totalFaltas: absences,
        pctFalta,
      };
    });
  }, [students, history, monthlyData, currentNucleoId]);

  // Split monthly data into two rows (year 1 and year 2) for tables
  const half = Math.ceil(monthlyData.length / 2);
  const row1 = monthlyData.slice(0, half);
  const row2 = monthlyData.slice(half);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-500 text-white px-4 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight">Cruzamento de Dados e Gráficos</h1>
              <p className="text-blue-100 text-xs font-medium">Anexo de Frequência — {cityLabel}</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold">{enrolledStudents.length} alunos</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">

        {/* ═══════════ SECTION 1: RESUMO GERAL ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">1</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Resumo Geral da Frequência</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase tracking-wide">
              Projeto "Escolinha de Triathlon" em {cityLabel}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  <th className="px-2 py-2 text-left font-bold text-blue-800 w-10">Nº</th>
                  <th className="px-2 py-2 text-left font-bold text-blue-800">Cidade/Estado</th>
                  <th className="px-2 py-2 text-left font-bold text-blue-800">Evento/modalidade</th>
                  <th className="px-2 py-2 text-left font-bold text-blue-800">Nome (ordem alfabética)</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Dias de aula</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Freq. total</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">% Freq.</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Nº faltas</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">% Falta</th>
                </tr>
              </thead>
              <tbody>
                {resumoData.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                    <td className="px-2 py-1.5 text-gray-600">{r.num}</td>
                    <td className="px-2 py-1.5 text-gray-600">{cityLabel}</td>
                    <td className="px-2 py-1.5 text-gray-600">Triathlon</td>
                    <td className="px-2 py-1.5 font-medium text-gray-800">{r.nome}</td>
                    <td className="px-2 py-1.5 text-center text-gray-700">{r.diasAula}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-blue-700">{r.freqTotal}</td>
                    <td className="px-2 py-1.5 text-center font-bold text-green-700">{r.pctFreq}%</td>
                    <td className="px-2 py-1.5 text-center font-bold text-red-600">{r.totalFaltas}</td>
                    <td className="px-2 py-1.5 text-center text-red-500">{r.pctFalta}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════ SECTION 2: RELAÇÃO DE ALUNOS ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">2</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Relação de Alunos Regularmente Matriculados</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase tracking-wide">
              Relação do Número de Alunos Regularmente Matriculados no Projeto
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50 border-b border-blue-100">
                  <th className="px-2 py-2 text-left font-bold text-blue-800">Cidade/Estado</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800" colSpan={2}>Gênero</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Nº alunos</th>
                  <th className="px-2 py-2 text-left font-bold text-blue-800">Nome (ordem alfabética)</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Idade</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Ensino</th>
                  <th className="px-2 py-2 text-center font-bold text-blue-800">Escola</th>
                </tr>
                <tr className="bg-blue-50/50 border-b border-blue-100">
                  <th></th>
                  <th className="px-2 py-1 text-center text-[10px] font-bold text-blue-600">Masc.</th>
                  <th className="px-2 py-1 text-center text-[10px] font-bold text-blue-600">Fem.</th>
                  <th></th><th></th><th></th><th></th><th></th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map((s, i) => {
                  // Simple gender inference from name
                  const lastChar = s.nome.split(' ')[0].slice(-1).toLowerCase();
                  const isFem = lastChar === 'a';
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                      <td className="px-2 py-1.5 text-gray-600">{cityLabel}</td>
                      <td className="px-2 py-1.5 text-center">{!isFem ? '✓' : ''}</td>
                      <td className="px-2 py-1.5 text-center">{isFem ? '✓' : ''}</td>
                      <td className="px-2 py-1.5 text-center font-bold text-blue-700">{i === 0 ? enrolledStudents.length : ''}</td>
                      <td className="px-2 py-1.5 font-medium text-gray-800">{s.nome}</td>
                      <td className="px-2 py-1.5 text-center text-gray-700">{s.age}</td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{s.ensino}</td>
                      <td className="px-2 py-1.5 text-center text-gray-600">{s.escola}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════ SECTION 3: GRÁFICO PIZZA ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">3</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Figura 1 — Média da Frequência e Faltas</h2>
          </div>
          <PieChart
            freqPercent={totals.freqPct}
            faltaPercent={totals.faltaPct}
            title={`Média da Frequência e faltas dos alunos do projeto em ${cityLabel}`}
          />
        </section>

        {/* ═══════════ SECTION 4: GRÁFICO BARRAS — Média de Frequência ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">4</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Figura 2 — Média de Frequência dos Alunos</h2>
          </div>
          <BarChart
            data={monthlyData.map(m => ({ label: m.label, value1: m.daysOfClass, value2: m.avgFrequency }))}
            maxY={10}
            title={`Média de frequência dos alunos do projeto em ${cityLabel}`}
            legend1="Dias de aula no mês"
            legend2="Média de frequência"
          />
        </section>

        {/* ═══════════ SECTION 5: GRÁFICO BARRAS — Média de Faltas ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">5</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Figura 3 — Média de Faltas dos Alunos</h2>
          </div>
          <BarChart
            data={monthlyData.map(m => ({ label: m.label, value1: m.daysOfClass, value2: m.avgAbsence }))}
            maxY={10}
            title={`Média de faltas dos alunos do projeto em ${cityLabel}`}
            legend1="Dias de aula no mês"
            legend2="Média de faltas dos alunos"
          />
        </section>

        {/* ═══════════ SECTION 6: TABELAS DE FALTAS ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">6</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Frequência e Faltas — Tabelas</h2>
          </div>

          {/* Tabela 3: Histórico de faltas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto mb-4">
            <div className="bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase">
              Histórico do número de faltas dos alunos — {cityLabel}
            </div>
            {[row1, row2].map((row, ri) => (
              <table key={ri} className="w-full text-xs border-b border-gray-100">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-2 py-1.5 text-left font-bold text-blue-800 w-24">Mês</th>
                    {row.map(m => <th key={m.label} className="px-2 py-1.5 text-center font-bold text-blue-800">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-2 py-1.5 font-bold text-gray-700">N° de faltas</td>
                    {row.map(m => <td key={m.label} className="px-2 py-1.5 text-center font-bold text-gray-800">{m.totalAbsences}</td>)}
                  </tr>
                </tbody>
              </table>
            ))}
          </div>

          {/* Tabela 4: Média de faltas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="bg-blue-700 text-white text-center py-2 text-xs font-bold uppercase">
              Média de faltas dos alunos — {cityLabel}
            </div>
            {[row1, row2].map((row, ri) => (
              <table key={ri} className="w-full text-xs border-b border-gray-100">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-2 py-1.5 text-left font-bold text-blue-800 w-32">Mês</th>
                    {row.map(m => <th key={m.label} className="px-2 py-1.5 text-center font-bold text-blue-800">{m.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-2 py-1.5 font-bold text-gray-700">Dias de aula (média)</td>
                    {row.map(m => <td key={m.label} className="px-2 py-1.5 text-center text-gray-700">{m.daysOfClass}</td>)}
                  </tr>
                  <tr className="bg-blue-50/30">
                    <td className="px-2 py-1.5 font-bold text-gray-700">Média de faltas</td>
                    {row.map(m => <td key={m.label} className="px-2 py-1.5 text-center font-bold text-orange-600">{m.avgAbsence.toFixed(2).replace('.', ',')}</td>)}
                  </tr>
                </tbody>
              </table>
            ))}
          </div>
        </section>

        {/* ═══════════ SECTION 7: GRÁFICO BARRAS — Histórico de Faltas ═══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">7</span>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Figura 4 — Histórico do Número de Faltas</h2>
          </div>
          <BarChart
            data={monthlyData.map(m => ({ label: m.label, value1: m.totalAbsences }))}
            maxY={35}
            title={`Histórico de número de faltas dos alunos do projeto em ${cityLabel}`}
            legend1="Nº de faltas no mês"
            singleColor
          />
        </section>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-400 pt-4">
          Fonte: Escolinha de Triathlon ({new Date().getFullYear()})
        </div>
      </div>
    </div>
  );
};
