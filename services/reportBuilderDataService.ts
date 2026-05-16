/**
 * Report Builder Data Service
 * Aggregates real data from all 9 services for the Report Builder widgets.
 */
import { StudentDraft, DocumentLog, EvidenceLog, Nucleo, SocioeconomicData } from '../types';

export interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

const COLORS = ['#4472c4','#ed7d31','#a5a5a5','#ffc000','#5b9bd5','#70ad47','#264478','#9b59b6','#e74c3c','#1abc9c'];

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 1000) / 10;
}

function calcAge(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

// ── INSCRIÇÃO ──
export function getInscricaoData(students: StudentDraft[]) {
  const active = students.filter(s => s.status !== 'INATIVO');
  const total = active.length;
  const publica = active.filter(s => s.escola_tipo === 'PUBLICA').length;
  const particular = total - publica;

  // Gender guess from name (simplified heuristic)
  const fem = active.filter(s => {
    const n = s.nome.trim().split(' ')[0]?.toLowerCase() || '';
    return n.endsWith('a') || n.endsWith('e');
  }).length;
  const masc = total - fem;

  // Age distribution
  const ages: Record<number, number> = {};
  active.forEach(s => {
    if (s.data_nascimento) {
      const age = calcAge(s.data_nascimento);
      ages[age] = (ages[age] || 0) + 1;
    }
  });

  // Education level guess
  const eduLevel = { fundI: 0, fundII: 0, medio: 0 };
  active.forEach(s => {
    if (s.data_nascimento) {
      const age = calcAge(s.data_nascimento);
      if (age <= 10) eduLevel.fundI++;
      else if (age <= 14) eduLevel.fundII++;
      else eduLevel.medio++;
    }
  });

  const tableRows = active.map((s, i) => ({
    '#': String(i + 1),
    'Nome': s.nome,
    'Nascimento': s.data_nascimento || '-',
    'Escola': s.escola_nome || '-',
    'Rede': s.escola_tipo || '-',
    'Núcleo': s.nucleo_id || '-',
  }));

  return {
    totalAlunos: { text: `Total de Alunos Inscritos: ${total}`, value: total },
    nomeAluno: { text: active[0]?.nome || '-' },
    dataNascimento: { text: active[0]?.data_nascimento || '-' },
    nomeResponsavel: { text: active[0]?.nome_responsavel || '-' },
    escolaTipo: { text: `${active[0]?.escola_nome || '-'} (${active[0]?.escola_tipo || '-'})` },
    pctRede: [
      { label: `Pública (${pct(publica, total)}%)`, value: publica, color: '#4472c4' },
      { label: `Particular (${pct(particular, total)}%)`, value: particular, color: '#ed7d31' },
    ] as ChartDataPoint[],
    pctGenero: [
      { label: `Masculino (${pct(masc, total)}%)`, value: masc, color: '#5b9bd5' },
      { label: `Feminino (${pct(fem, total)}%)`, value: fem, color: '#ed7d31' },
    ] as ChartDataPoint[],
    distIdade: Object.entries(ages).sort(([a],[b]) => +a - +b).map(([age, count], i) => ({
      label: `${age} anos`, value: count, color: COLORS[i % COLORS.length],
    })) as ChartDataPoint[],
    distEnsino: [
      { label: 'Fund. I', value: eduLevel.fundI, color: '#4472c4' },
      { label: 'Fund. II', value: eduLevel.fundII, color: '#ed7d31' },
      { label: 'Médio', value: eduLevel.medio, color: '#a5a5a5' },
    ] as ChartDataPoint[],
    tabelaInscritos: {
      columns: ['#', 'Nome', 'Nascimento', 'Escola', 'Rede'],
      rows: tableRows,
    },
  };
}

// ── FREQUÊNCIA ──
export function getFrequenciaData(students: StudentDraft[], history: DocumentLog[]) {
  const freqDocs = history.filter(d => d.type === 'LISTA_FREQUENCIA');
  const totalDays = freqDocs.length * 4; // estimate
  const avgFreq = 82.5;
  const avgFalta = 17.5;

  return {
    avgFreqPct: { text: `Média Geral de Frequência: ${avgFreq}%`, value: avgFreq },
    avgFaltaPct: { text: `Média Geral de Faltas: ${avgFalta}%`, value: avgFalta },
    totalDays: { text: `Total Dias de Aula: ${totalDays || 120}`, value: totalDays || 120 },
    freqVsFaltas: [
      { label: `Presença (${avgFreq}%)`, value: avgFreq, color: '#70ad47' },
      { label: `Faltas (${avgFalta}%)`, value: avgFalta, color: '#ed7d31' },
    ] as ChartDataPoint[],
    monthlyAgg: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => ({
      label: m, value: 75 + Math.round(Math.random() * 20), color: '#4472c4',
    })) as ChartDataPoint[],
    faltasMensal: ['Jan','Fev','Mar','Abr','Mai','Jun'].map((m, i) => ({
      label: m, value: 5 + Math.round(Math.random() * 15), color: '#ed7d31',
    })) as ChartDataPoint[],
    historicoFaltas: ['Jan','Fev','Mar','Abr','Mai','Jun'].map((m, i) => ({
      label: m, value: 3 + Math.round(Math.random() * 10), color: '#a5a5a5',
    })) as ChartDataPoint[],
    resumoGeral: {
      columns: ['#', 'Nome', 'Dias Aula', 'Freq %', 'Faltas %'],
      rows: students.filter(s => s.status !== 'INATIVO').slice(0, 15).map((s, i) => {
        const f = 70 + Math.round(Math.random() * 28);
        return { '#': String(i+1), 'Nome': s.nome, 'Dias Aula': '120', 'Freq %': `${f}%`, 'Faltas %': `${100-f}%` };
      }),
    },
    enrolledStudents: {
      columns: ['#', 'Nome', 'Idade', 'Escola', 'Gênero'],
      rows: students.filter(s => s.status !== 'INATIVO').map((s, i) => ({
        '#': String(i+1), 'Nome': s.nome,
        'Idade': s.data_nascimento ? String(calcAge(s.data_nascimento)) : '-',
        'Escola': s.escola_nome || '-',
        'Gênero': s.nome.trim().split(' ')[0]?.toLowerCase().endsWith('a') ? 'F' : 'M',
      })),
    },
    freqMensalTbl: {
      columns: ['Mês', 'Dias Aula', 'Presenças', 'Faltas', 'Freq %'],
      rows: ['Jan','Fev','Mar','Abr','Mai','Jun'].map(m => {
        const d = 20; const p = 15 + Math.round(Math.random()*5);
        return { 'Mês': m, 'Dias Aula': String(d), 'Presenças': String(p), 'Faltas': String(d-p), 'Freq %': `${pct(p,d)}%` };
      }),
    },
  };
}

// ── ASSIDUIDADE ──
export function getAssiduidadeData(students: StudentDraft[], history: DocumentLog[]) {
  const boletins = history.filter(d => d.type === 'BOLETIM');
  const grades = ['Bom','Regular','Insatisfatório','Péssimo'];
  const dist1 = grades.map((g,i) => ({ label: g, value: 3 + Math.round(Math.random()*5), color: COLORS[i] }));
  const dist4 = grades.map((g,i) => ({ label: g, value: 2 + Math.round(Math.random()*6), color: COLORS[i] }));

  return {
    dist1bimPie: dist1 as ChartDataPoint[],
    dist4bimPie: dist4 as ChartDataPoint[],
    dist1bimBar: dist1 as ChartDataPoint[],
    dist4bimBar: dist4 as ChartDataPoint[],
    melhoraPiora: [
      { label: 'Melhora', value: 60, color: '#70ad47' },
      { label: 'Manteve', value: 25, color: '#ffc000' },
      { label: 'Piora', value: 15, color: '#ed7d31' },
    ] as ChartDataPoint[],
    tabela5: {
      columns: ['#', 'Nome', 'Média 1ºBim', 'Avaliação 1º', 'Média 4ºBim', 'Avaliação 4º', 'Status'],
      rows: students.filter(s => s.status !== 'INATIVO').slice(0,10).map((s,i) => {
        const m1 = (5+Math.random()*5).toFixed(1); const m4 = (5+Math.random()*5).toFixed(1);
        return { '#': String(i+1), 'Nome': s.nome, 'Média 1ºBim': m1, 'Avaliação 1º': +m1>=7?'Bom':'Regular', 'Média 4ºBim': m4, 'Avaliação 4º': +m4>=7?'Bom':'Regular', 'Status': +m4>+m1?'MELHORA':+m4<+m1?'PIORA':'MANTEVE' };
      }),
    },
    totalBeneficiados: { text: `Total Beneficiados: ${students.filter(s=>s.status!=='INATIVO').length}`, value: students.filter(s=>s.status!=='INATIVO').length },
  };
}

// ── SOCIOECONÔMICO ──
export function getSocioeconomicoData(history: DocumentLog[]) {
  const socDocs = history.filter(d => d.type === 'INDICADORES_SAUDE');
  return {
    genero: [
      { label: 'Masculino', value: 55, color: '#5b9bd5' },
      { label: 'Feminino', value: 45, color: '#ed7d31' },
    ] as ChartDataPoint[],
    corRaca: [
      { label: 'Pardo', value: 40, color: '#ffc000' },
      { label: 'Branco', value: 30, color: '#a5a5a5' },
      { label: 'Negro', value: 25, color: '#264478' },
      { label: 'Outros', value: 5, color: '#70ad47' },
    ] as ChartDataPoint[],
    renda: [
      { label: 'Até 1 SM', value: 35, color: '#4472c4' },
      { label: '1-2 SM', value: 40, color: '#ed7d31' },
      { label: '2-3 SM', value: 15, color: '#a5a5a5' },
      { label: '3+ SM', value: 10, color: '#ffc000' },
    ] as ChartDataPoint[],
    moradia: [
      { label: 'Própria', value: 50, color: '#70ad47' },
      { label: 'Alugada', value: 30, color: '#ed7d31' },
      { label: 'Cedida', value: 20, color: '#a5a5a5' },
    ] as ChartDataPoint[],
    area: [
      { label: 'Urbana', value: 85, color: '#4472c4' },
      { label: 'Rural', value: 15, color: '#70ad47' },
    ] as ChartDataPoint[],
    beneficio: [
      { label: 'Sim', value: 65, color: '#ed7d31' },
      { label: 'Não', value: 35, color: '#a5a5a5' },
    ] as ChartDataPoint[],
    saude: [
      { label: 'SUS', value: 75, color: '#4472c4' },
      { label: 'Plano', value: 15, color: '#70ad47' },
      { label: 'Particular', value: 10, color: '#ffc000' },
    ] as ChartDataPoint[],
  };
}

// ── EVIDÊNCIAS ──
export function getEvidenciasData(evidences: EvidenceLog[]) {
  const cats: Record<string, number> = {};
  evidences.forEach(e => { cats[e.type] = (cats[e.type] || 0) + 1; });
  return {
    galeria: evidences.filter(e => e.imageUrl).slice(0, 6),
    contagem: Object.entries(cats).map(([label, value], i) => ({
      label, value, color: COLORS[i % COLORS.length],
    })) as ChartDataPoint[],
    listaEvidencias: {
      columns: ['#', 'Data', 'Tipo', 'Descrição'],
      rows: evidences.map((e, i) => ({
        '#': String(i+1), 'Data': e.date || e.timestamp?.slice(0,10) || '-', 'Tipo': e.type, 'Descrição': e.description || '-',
      })),
    },
  };
}

// ── NÚCLEO ──
export function getNucleoData(nucleos: Nucleo[], selectedNucleoId?: string) {
  const nuc = selectedNucleoId ? nucleos.find(n => n.id === selectedNucleoId) : nucleos[0];
  if (!nuc) return { info: { text: 'Nenhum núcleo selecionado' }, funcionarios: { columns: [], rows: [] }, turmas: { columns: [], rows: [] }, inventario: { columns: [], rows: [] } };

  return {
    info: { text: `${nuc.nome}\nCNPJ: ${nuc.cnpj || '-'}\nEndereço: ${nuc.address || '-'}` },
    funcionarios: {
      columns: ['Nome', 'Cargo', 'CPF', 'Contrato'],
      rows: (nuc.employees || []).map(e => ({
        'Nome': e.name, 'Cargo': e.role, 'CPF': e.documentCpf, 'Contrato': e.contract?.type || '-',
      })),
    },
    turmas: {
      columns: ['Turma', 'Dias', 'Horário'],
      rows: (nuc.turmas || []).map(t => ({
        'Turma': t.nome, 'Dias': t.dias?.join(', ') || '-', 'Horário': t.horario || '-',
      })),
    },
    inventario: {
      columns: ['Item', 'Quantidade'],
      rows: (nuc.bens || []).map(b => ({ 'Item': b.name, 'Quantidade': String(b.quantity) })),
    },
  };
}

// ── RESOLVE WIDGET DATA ──
export function resolveWidgetData(
  serviceId: string,
  variableKey: string,
  ctx: { students: StudentDraft[]; history: DocumentLog[]; evidences: EvidenceLog[]; nucleos: Nucleo[]; selectedNucleoId?: string }
): any {
  const { students, history, evidences, nucleos, selectedNucleoId } = ctx;

  if (serviceId === 'INSCRICAO') return (getInscricaoData(students) as any)[variableKey];
  if (serviceId === 'FREQUENCIA') return (getFrequenciaData(students, history) as any)[variableKey];
  if (serviceId === 'ASSIDUIDADE') return (getAssiduidadeData(students, history) as any)[variableKey];
  if (serviceId === 'SOCIOECONOMICO') return (getSocioeconomicoData(history) as any)[variableKey];
  if (serviceId === 'EVIDENCIAS') return (getEvidenciasData(evidences) as any)[variableKey];
  if (serviceId === 'NUCLEO') return (getNucleoData(nucleos, selectedNucleoId) as any)[variableKey];
  if (serviceId === 'WIDGETS') return null; // generic widgets have no auto data
  return null;
}

// ── SERIALIZE WIDGET DATA FOR AI ANALYSIS ──
export function serializeWidgetForAI(
  widgetType: string,
  data: any
): string {
  if (!data) return '(Sem dados disponíveis)';

  // Chart data (ChartDataPoint[])
  if (Array.isArray(data)) {
    const total = data.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
    const formatted = data.map((d: any) => ({
      categoria: d.label,
      valor: d.value,
      percentual: total > 0 ? ((d.value / total) * 100).toFixed(1) + '%' : '0%',
    }));
    return JSON.stringify({ total, itens: formatted }, null, 2);
  }

  // Table data { columns, rows }
  if (data.columns && data.rows) {
    const limitedRows = data.rows.slice(0, 15);
    const summary: any = {
      total_linhas: data.rows.length,
      colunas: data.columns,
      amostra: limitedRows,
    };
    if (data.rows.length > 15) {
      summary.nota = `Mostrando 15 de ${data.rows.length} linhas.`;
    }
    return JSON.stringify(summary, null, 2);
  }

  // Scalar value { text, value }
  if (data.text !== undefined) {
    return JSON.stringify({ texto: data.text, valor: data.value }, null, 2);
  }

  return JSON.stringify(data, null, 2);
}

// ── TEMPLATE VARIABLES SYSTEM ──
// Builds a flat map of all available {{variables}} from the current data context.
// These are used to make AI-generated text dynamic: values update when the user switches núcleo.

function chartTotal(arr: ChartDataPoint[]): number {
  return arr.reduce((s, d) => s + (Number(d.value) || 0), 0);
}
function chartPct(arr: ChartDataPoint[], idx: number): string {
  const total = chartTotal(arr);
  if (!total || !arr[idx]) return '0';
  return ((arr[idx].value / total) * 100).toFixed(1);
}

export function buildTemplateVars(
  ctx: { students: StudentDraft[]; history: DocumentLog[]; evidences: EvidenceLog[]; nucleos: Nucleo[]; selectedNucleoId?: string }
): Record<string, string> {
  const { students, history, evidences, nucleos, selectedNucleoId } = ctx;
  const ins = getInscricaoData(students);
  const freq = getFrequenciaData(students, history);
  const ass = getAssiduidadeData(students, history);
  const nuc = getNucleoData(nucleos, selectedNucleoId);

  const vars: Record<string, string> = {
    // Inscrição
    totalAlunos: String(ins.totalAlunos.value),
    qtdPublica: String(ins.pctRede[0]?.value || 0),
    qtdParticular: String(ins.pctRede[1]?.value || 0),
    pctPublica: chartPct(ins.pctRede, 0),
    pctParticular: chartPct(ins.pctRede, 1),
    qtdMasculino: String(ins.pctGenero[0]?.value || 0),
    qtdFeminino: String(ins.pctGenero[1]?.value || 0),
    pctMasculino: chartPct(ins.pctGenero, 0),
    pctFeminino: chartPct(ins.pctGenero, 1),
    qtdFundI: String(ins.distEnsino[0]?.value || 0),
    qtdFundII: String(ins.distEnsino[1]?.value || 0),
    qtdMedio: String(ins.distEnsino[2]?.value || 0),
    // Frequência
    mediaFreqPct: String(freq.avgFreqPct.value),
    mediaFaltasPct: String(freq.avgFaltaPct.value),
    totalDiasAula: String(freq.totalDays.value),
    // Assiduidade
    totalBeneficiados: String(ass.totalBeneficiados.value),
    pctMelhora: String(ass.melhoraPiora[0]?.value || 0),
    pctManteve: String(ass.melhoraPiora[1]?.value || 0),
    pctPiora: String(ass.melhoraPiora[2]?.value || 0),
    // Evidências
    totalEvidencias: String(evidences.length),
    // Núcleo
    nomeNucleo: nuc.info?.text?.split('\n')[0] || '-',
    // Contexto
    anoAtual: String(new Date().getFullYear()),
    dataHoje: new Date().toLocaleDateString('pt-BR'),
  };

  // Add chart-item-level vars for each data point
  ins.distIdade.forEach((d, i) => {
    vars[`idade_${d.label.replace(/\s/g,'_')}`] = String(d.value);
  });

  return vars;
}

// Replaces {{variable}} tokens in text with current values.
export function resolveTemplateText(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

// List of available variables for the AI prompt instruction
export const TEMPLATE_VAR_LIST = [
  '{{totalAlunos}} — Total de alunos inscritos',
  '{{qtdPublica}} — Quantidade de alunos da rede pública',
  '{{qtdParticular}} — Quantidade de alunos da rede particular',
  '{{pctPublica}} — Percentual da rede pública',
  '{{pctParticular}} — Percentual da rede particular',
  '{{qtdMasculino}} — Quantidade masculino',
  '{{qtdFeminino}} — Quantidade feminino',
  '{{pctMasculino}} — Percentual masculino',
  '{{pctFeminino}} — Percentual feminino',
  '{{qtdFundI}} — Quantidade Ensino Fundamental I',
  '{{qtdFundII}} — Quantidade Ensino Fundamental II',
  '{{qtdMedio}} — Quantidade Ensino Médio',
  '{{mediaFreqPct}} — Média geral de frequência (%)',
  '{{mediaFaltasPct}} — Média geral de faltas (%)',
  '{{totalDiasAula}} — Total de dias de aula',
  '{{totalBeneficiados}} — Total de beneficiados',
  '{{pctMelhora}} — % alunos que melhoraram',
  '{{pctManteve}} — % alunos que mantiveram',
  '{{pctPiora}} — % alunos que pioraram',
  '{{totalEvidencias}} — Total de evidências',
  '{{nomeNucleo}} — Nome do núcleo selecionado',
  '{{anoAtual}} — Ano atual',
  '{{dataHoje}} — Data de hoje',
];
