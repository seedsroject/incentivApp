import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { TocItem, RBPage, RBWidget, SidebarItem, SIDEBAR_BLOCKS, genId, recalcNumbers, WidgetDataConfig } from './ReportBuilderTypes';
import { StudentDraft, DocumentLog, EvidenceLog, Nucleo } from '../types';
import { resolveWidgetData, ChartDataPoint, serializeWidgetForAI, buildTemplateVars, resolveTemplateText, TEMPLATE_VAR_LIST } from '../services/reportBuilderDataService';
import { analyzeWidgetData } from '../services/geminiService';
import { WidgetConfigurator } from './WidgetConfigurator';

/* ─── Calculation Engine ─── */
type CalcOp = 'SUM' | 'AVG' | 'PCT' | 'COUNT' | 'MIN' | 'MAX';
interface CalcField { id: string; label: string; serviceId: string; variableKey: string; op: CalcOp; result: number | string; }

const CALC_SOURCES = [
  { serviceId: 'INSCRICAO', variableKey: 'totalAlunos', label: 'Total Alunos' },
  { serviceId: 'INSCRICAO', variableKey: 'pctRede', label: 'Rede Pública/Particular' },
  { serviceId: 'INSCRICAO', variableKey: 'pctGenero', label: 'Gênero (M/F)' },
  { serviceId: 'FREQUENCIA', variableKey: 'avgFreqPct', label: 'Média Freq (%)' },
  { serviceId: 'FREQUENCIA', variableKey: 'avgFaltaPct', label: 'Média Faltas (%)' },
  { serviceId: 'FREQUENCIA', variableKey: 'totalDays', label: 'Total Dias Aula' },
  { serviceId: 'ASSIDUIDADE', variableKey: 'totalBeneficiados', label: 'Total Beneficiados' },
  { serviceId: 'ASSIDUIDADE', variableKey: 'melhoraPiora', label: 'Melhora/Piora/Manteve' },
  { serviceId: 'SOCIOECONOMICO', variableKey: 'renda', label: 'Renda Familiar' },
  { serviceId: 'EVIDENCIAS', variableKey: 'contagem', label: 'Contagem Evidências' },
];

function runCalc(op: CalcOp, data: any): string {
  if (!data) return '—';
  if (data.value !== undefined) {
    const v = Number(data.value);
    if (op === 'SUM' || op === 'COUNT') return String(v);
    if (op === 'AVG') return v.toFixed(1);
    if (op === 'PCT') return v.toFixed(1) + '%';
    if (op === 'MIN' || op === 'MAX') return String(v);
  }
  if (Array.isArray(data)) {
    const vals = data.map((d: any) => Number(d.value)).filter((n: number) => !isNaN(n));
    if (!vals.length) return '—';
    const sum = vals.reduce((a: number, b: number) => a + b, 0);
    if (op === 'SUM') return String(sum);
    if (op === 'AVG') return (sum / vals.length).toFixed(1);
    if (op === 'COUNT') return String(vals.length);
    if (op === 'PCT') return ((vals[0] / sum) * 100).toFixed(1) + '%';
    if (op === 'MIN') return String(Math.min(...vals));
    if (op === 'MAX') return String(Math.max(...vals));
  }
  if (data.text) return data.text;
  return '—';
}

interface Props {
  onBack: () => void;
  projectName?: string;
  students?: StudentDraft[];
  history?: DocumentLog[];
  evidences?: EvidenceLog[];
  nucleos?: Nucleo[];
  headerImage?: string;
}

// ─── SIDEBAR SVG ICONS ───────────────────────────────────────────────────────
const _s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const BLOCK_ICONS: Record<string, React.ReactNode> = {
  'clipboard': <svg {..._s}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  'bar-chart': <svg {..._s}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  'trending-up': <svg {..._s}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  'users': <svg {..._s}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  'target': <svg {..._s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  'camera': <svg {..._s}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  'file-text': <svg {..._s}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  'building': <svg {..._s}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="6.01"/><line x1="15" y1="6" x2="15" y2="6.01"/><line x1="9" y1="10" x2="9" y2="10.01"/><line x1="15" y1="10" x2="15" y2="10.01"/><line x1="9" y1="14" x2="9" y2="14.01"/><line x1="15" y1="14" x2="15" y2="14.01"/><path d="M9 22v-4h6v4"/></svg>,
  'puzzle': <svg {..._s}><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 01-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 10-3.214 3.214c.446.166.855.497.925.968a.979.979 0 01-.276.837l-1.61 1.61a2.404 2.404 0 01-1.705.707 2.402 2.402 0 01-1.704-.706l-1.568-1.568a1.026 1.026 0 00-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 11-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 00-.289-.877l-1.568-1.568A2.402 2.402 0 011.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 103.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0112 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 113.237 3.237c-.464.18-.894.527-.967 1.02z"/></svg>,
};

const BlockIcon: React.FC<{ name: string }> = ({ name }) => {
  const icon = BLOCK_ICONS[name];
  if (!icon) return null;
  return <span style={{ color: '#3b82f6', display: 'inline-flex', flexShrink: 0 }}>{icon}</span>;
};

const ITEM_TYPE_ICONS: Record<string, React.ReactNode> = {
  'TEXT': <svg {..._s} style={{width:13,height:13}}><path d="M4 7V4h16v3"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  'TABLE': <svg {..._s} style={{width:13,height:13}}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  'IMAGE': <svg {..._s} style={{width:13,height:13}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  'CHART_PIE': <svg {..._s} style={{width:13,height:13}}><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>,
  'CHART_BAR': <svg {..._s} style={{width:13,height:13}}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  'SHAPE': <svg {..._s} style={{width:13,height:13}}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>,
};

const ItemTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const icon = ITEM_TYPE_ICONS[type] || ITEM_TYPE_ICONS['TEXT'];
  return <span style={{ color: '#64748b', display: 'inline-flex' }}>{icon}</span>;
};

// ── Saved Template storage ──
const TEMPLATES_KEY = 'rb_saved_templates';
interface SavedTemplate {
  id: string;
  title: string;
  coverType: 'blue' | 'green';
  city: string;
  year: string;
  createdAt: string;
  toc: TocItem[];
  pages: RBPage[];
  showCover: boolean;
  showBackCover: boolean;
  showResume: boolean;
  showTocPage: boolean;
  bannerUrl?: string;
}

export function getSavedTemplates(): SavedTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]'); } catch { return []; }
}
function saveTemplateToStorage(t: SavedTemplate) {
  const all = getSavedTemplates().filter(x => x.id !== t.id);
  all.push(t);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all));
}
export function deleteTemplate(id: string) {
  const all = getSavedTemplates().filter(x => x.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(all));
}

const A4W = 794, A4H = 1123;

/* ─── Núcleo location helpers ─── */
function extractCityUF(nucleo?: { nome?: string; address?: string; city?: string }): string {
  if (!nucleo) return 'Cidade | UF';
  // If city field exists, use it
  if (nucleo.city) {
    // Try to extract UF from address or name
    const uf = nucleo.address?.match(/\b([A-Z]{2})\b(?:\s*[-–]|\s*$|\s*,)/)?.[1]
            || nucleo.nome?.match(/\b([A-Z]{2})\b/)?.[1]
            || '';
    return uf ? `${nucleo.city} | ${uf}` : nucleo.city;
  }
  // Try to extract from nome (e.g. "Ilhéus | BA - CEEP do Chocolate – ...")
  const nome = nucleo.nome || '';
  if (nome.includes('|')) {
    const parts = nome.split('|').map(s => s.trim());
    const city = parts[0];
    // Extract just the 2-letter UF from the second part (before any dash/description)
    const ufPart = parts[1]?.match(/^([A-Z]{2})/)?.[1] || parts[1]?.split(/\s*[-–]\s*/)[0]?.trim() || '';
    return `${city} | ${ufPart}`;
  }
  // Try address
  if (nucleo.address) {
    const parts = nucleo.address.split(',').map(s => s.trim());
    const last = parts[parts.length - 1];
    const penult = parts.length >= 2 ? parts[parts.length - 2] : '';
    // Try to find UF pattern in last or penultimate part
    const ufMatch = last.match(/\b([A-Z]{2})\b/) || penult.match(/\b([A-Z]{2})\b/);
    const cityMatch = penult.match(/([\wÀ-ú\s]+)/);
    if (ufMatch && cityMatch) return `${cityMatch[1].trim()} | ${ufMatch[1]}`;
  }
  // For nomes like "Bairro Novo - Rua..., Curitiba - PR" try to get city/UF from end
  const ufFromEnd = nome.match(/,?\s*([\wÀ-ú\s]+)\s*-\s*([A-Z]{2})\s*$/);
  if (ufFromEnd) return `${ufFromEnd[1].trim()} | ${ufFromEnd[2]}`;
  // Last resort: just take the part before the first dash
  const shortName = nome.split(/\s*[-–]\s*/)[0].trim();
  return shortName || 'Cidade | UF';
}

function nucleoDisplayLabel(n: { nome: string; address?: string; city?: string }): string {
  // n.nome already contains full info (e.g. "Ilhéus | BA - CEEP do Chocolate – Av. ...")
  // Only append address/city if nome is short (doesn't contain address)
  if (n.nome.includes(' - ') || n.nome.includes(' – ')) return n.nome;
  const parts = [n.nome];
  if (n.address) parts.push(n.address);
  else if (n.city) parts.push(n.city);
  return parts.join(' — ');
}
/* ─── SVG Pie Chart ─── */
const PieChart: React.FC<{data: ChartDataPoint[]; size?: number}> = ({ data, size = 200 }) => {
  const total = data.reduce((s,d) => s + d.value, 0);
  if (total === 0) return <div className="rb-widget-placeholder">Sem dados</div>;
  const r = size/2 - 10, cx = size/2, cy = size/2;
  let cumAngle = -Math.PI/2;
  const slices = data.map(d => {
    const angle = (d.value/total)*2*Math.PI;
    const x1 = cx + r*Math.cos(cumAngle), y1 = cy + r*Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r*Math.cos(cumAngle), y2 = cy + r*Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z` };
  });
  return (
    <div style={{display:'flex',alignItems:'center',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s,i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5"/>)}
      </svg>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {data.map((d,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:10}}>
            <span style={{width:10,height:10,borderRadius:2,background:d.color,display:'inline-block',flexShrink:0}}/>
            <span>{d.label}: <b>{d.value}</b></span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── SVG Bar Chart ─── */
const BarChart: React.FC<{data: ChartDataPoint[]; height?: number}> = ({ data, height = 160 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const bw = Math.min(40, Math.floor(500 / Math.max(data.length, 1)));
  const w = data.length * (bw + 12) + 40;
  return (
    <div style={{overflowX:'auto'}}>
      <svg width={Math.max(w, 200)} height={height + 30} viewBox={`0 0 ${Math.max(w,200)} ${height+30}`}>
        {data.map((d, i) => {
          const bh = (d.value / max) * (height - 20);
          const x = 30 + i * (bw + 12);
          return (
            <g key={i}>
              <rect x={x} y={height - bh} width={bw} height={bh} fill={d.color} rx={3}/>
              <text x={x + bw/2} y={height - bh - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#333">{d.value}</text>
              <text x={x + bw/2} y={height + 12} textAnchor="middle" fontSize="8" fill="#666">{d.label}</text>
            </g>
          );
        })}
        <line x1="25" y1={height} x2={w} y2={height} stroke="#ccc" strokeWidth="1"/>
      </svg>
    </div>
  );
};

/* ─── Mini Table ─── */
const MiniTable: React.FC<{columns: string[]; rows: Record<string,string>[]}> = ({ columns, rows }) => {
  if (!columns?.length) return <div className="rb-widget-placeholder">Tabela vazia</div>;
  return (
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:9}}>
      <thead>
        <tr>{columns.map(c => <th key={c} style={{background:'#4472c4',color:'#fff',padding:'5px 6px',fontSize:9,fontWeight:700,border:'1px solid #3b63a0',textAlign:'left'}}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.slice(0, 20).map((r, i) => (
          <tr key={i} style={{background: i%2===0?'#fff':'#dce6f1'}}>
            {columns.map(c => <td key={c} style={{padding:'4px 6px',border:'1px solid #c0c0c0',fontSize:9}}>{r[c] || '-'}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ─── Widget Renderer ─── */
const WidgetRenderer: React.FC<{widget: RBWidget; ctx: any; onConfigure?: () => void}> = ({ widget, ctx, onConfigure }) => {
  const data = useMemo(() => {
    // If widget has dataConfig with SYSTEM source, use that
    if (widget.dataConfig?.sourceType === 'SYSTEM' && widget.dataConfig.systemServiceId && widget.dataConfig.systemVariableKey) {
      return resolveWidgetData(widget.dataConfig.systemServiceId, widget.dataConfig.systemVariableKey, ctx);
    }
    // If widget has manual data configured, return null (we use chartData/tableColumns directly)
    if (widget.dataConfig?.sourceType === 'MANUAL') return null;
    // Original behavior
    if (widget.serviceId === 'WIDGETS') return null;
    return resolveWidgetData(widget.serviceId, widget.variableKey, ctx);
  }, [widget.serviceId, widget.variableKey, widget.dataConfig, ctx]);

  if (widget.type === 'TEXT') {
    const txt = data?.text || widget.content || 'Texto editável...';
    return <div contentEditable suppressContentEditableWarning style={{fontSize:12,lineHeight:1.8,textAlign:'justify',textIndent:'1.25cm',minHeight:30,whiteSpace:'pre-wrap'}}>{txt}</div>;
  }
  if (widget.type === 'CHART_PIE' || widget.type === 'CHART_BAR') {
    const chartData = (Array.isArray(data) ? data : widget.chartData) as ChartDataPoint[] | undefined;
    if (!chartData?.length) {
      return (
        <div className="rb-widget-placeholder">
          {widget.type === 'CHART_PIE' ? 'Gráfico Pizza' : 'Gráfico Barras'}: {widget.label}
          <br/><small>Sem dados disponíveis</small>
          {onConfigure && (
            <button className="wc-configure-btn no-print" onClick={e => { e.stopPropagation(); onConfigure(); }}>
              Configurar Dados
            </button>
          )}
        </div>
      );
    }
    // Check if dataConfig specifies a different chart type
    const effectiveType = widget.dataConfig?.chartType || (widget.type === 'CHART_PIE' ? 'PIE' : 'BAR');
    if (effectiveType === 'PIE') return <PieChart data={chartData} />;
    return <BarChart data={chartData} />;
  }
  if (widget.type === 'TABLE') {
    // Check for manual table data first
    const manualTbl = widget.tableColumns?.length ? { columns: widget.tableColumns, rows: widget.tableRows || [] } : null;
    const tbl = (manualTbl || data) as { columns: string[]; rows: Record<string,string>[] } | undefined;
    if (!tbl?.columns?.length) {
      return (
        <div className="rb-widget-placeholder">
          Tabela: {widget.label}<br/><small>Sem dados</small>
          {onConfigure && (
            <button className="wc-configure-btn no-print" onClick={e => { e.stopPropagation(); onConfigure(); }}>
              Configurar Dados
            </button>
          )}
        </div>
      );
    }
    return <MiniTable columns={tbl.columns} rows={tbl.rows} />;
  }
  if (widget.type === 'IMAGE') {
    return <div className="rb-widget-placeholder">{widget.label}</div>;
  }
  return <div className="rb-widget-placeholder">{widget.label}</div>;
};

/* ─── AI Analysis Block ─── */
const AIAnalysisBlock: React.FC<{
  widget: RBWidget;
  ctx: any;
  projectName: string;
  onUpdate: (patch: Partial<RBWidget>) => void;
}> = ({ widget, ctx, projectName, onUpdate }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'editing'>(
    widget.aiAnalysis ? 'ready' : 'idle'
  );
  const [template, setTemplate] = useState(widget.aiAnalysis || '');
  const [error, setError] = useState('');
  const editRef = useRef<HTMLDivElement>(null);
  const position = widget.aiPosition || 'below';

  const hasApiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  // Build template vars from current data context — recalculates when núcleo changes
  const templateVars = useMemo(() => buildTemplateVars(ctx), [ctx]);

  // Resolve {{variables}} in the template with current values
  const resolvedText = useMemo(() => {
    if (!template) return '';
    return resolveTemplateText(template, templateVars);
  }, [template, templateVars]);

  const handleGenerate = async () => {
    setStatus('loading');
    setError('');
    try {
      const data = resolveWidgetData(widget.serviceId, widget.variableKey, ctx);
      const serialized = serializeWidgetForAI(widget.type, data);
      const result = await analyzeWidgetData(
        widget.label,
        widget.type,
        serialized,
        projectName,
        TEMPLATE_VAR_LIST
      );
      setTemplate(result);
      onUpdate({ aiAnalysis: result });
      setStatus('ready');
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar análise');
      setStatus('idle');
    }
  };

  const handleSaveEdit = () => {
    const newText = editRef.current?.innerText || template;
    setTemplate(newText);
    onUpdate({ aiAnalysis: newText });
    setStatus('ready');
  };

  const togglePosition = () => {
    const newPos = position === 'below' ? 'above' : 'below';
    onUpdate({ aiPosition: newPos });
  };

  const handleRemove = () => {
    onUpdate({ showAiBlock: false, aiAnalysis: undefined });
  };

  // ── IDLE STATE ──
  if (status === 'idle') {
    return (
      <div className="rb-ai-block rb-ai-idle no-print">
        <div className="rb-ai-idle-inner">
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4472c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <span style={{fontSize:11,fontWeight:700,color:'#4472c4'}}>Análise IA disponível</span>
          </div>
          <p style={{fontSize:10,color:'#888',margin:'0 0 10px',lineHeight:1.5}}>
            Gere uma análise com variáveis dinâmicas — os valores atualizam automaticamente ao trocar de núcleo.
          </p>
          {error && <p style={{fontSize:10,color:'#e74c3c',margin:'0 0 8px'}}>{error}</p>}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {hasApiKey ? (
              <button onClick={handleGenerate} className="rb-ai-btn rb-ai-btn-primary">Gerar Análise</button>
            ) : (
              <span style={{fontSize:10,color:'#999',fontStyle:'italic'}}>IA indisponível — configure GEMINI_API_KEY</span>
            )}
            <button onClick={togglePosition} className="rb-ai-btn">{position === 'below' ? '↑ Acima' : '↓ Abaixo'}</button>
            <button onClick={handleRemove} className="rb-ai-btn rb-ai-btn-danger">Remover</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING STATE ──
  if (status === 'loading') {
    return (
      <div className="rb-ai-block rb-ai-loading">
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 0'}}>
          <div className="rb-ai-spinner" />
          <div>
            <p style={{fontSize:11,fontWeight:700,color:'#4472c4',margin:0}}>Gerando análise com variáveis dinâmicas...</p>
            <p style={{fontSize:10,color:'#888',margin:'4px 0 0'}}>Processando "{widget.label}"</p>
          </div>
        </div>
      </div>
    );
  }

  // ── EDITING STATE ──
  if (status === 'editing') {
    return (
      <div className="rb-ai-block rb-ai-editing">
        <div className="rb-ai-edit-toolbar no-print" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:600,color:'#888'}}>Editando template — use {'{{'} variavel {'}}'}  para dados dinâmicos</span>
          <div style={{display:'flex',gap:4}}>
            <button onClick={handleSaveEdit} className="rb-ai-btn rb-ai-btn-primary" style={{fontSize:10}}>Salvar</button>
            <button onClick={() => setStatus('ready')} className="rb-ai-btn" style={{fontSize:10}}>Cancelar</button>
          </div>
        </div>
        <div ref={editRef} contentEditable suppressContentEditableWarning
          style={{fontSize:12,lineHeight:1.8,textAlign:'justify',textIndent:'1.25cm',color:'#333',minHeight:40,outline:'none',border:'1px dashed #ccc',borderRadius:4,padding:8,background:'#fafafa',whiteSpace:'pre-wrap'}}
        >{template}</div>
      </div>
    );
  }

  // ── READY STATE — plain text, same formatting as other report text ──
  return (
    <div className="rb-ai-block rb-ai-ready">
      <div className="rb-ai-controls no-print">
        <button onClick={() => setStatus('editing')} className="rb-ai-btn" title="Editar template"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button onClick={handleGenerate} className="rb-ai-btn" title="Regenerar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
        <button onClick={togglePosition} className="rb-ai-btn" title="Alternar posição">{position === 'below' ? '↑' : '↓'}</button>
        <button onClick={handleRemove} className="rb-ai-btn rb-ai-btn-danger" title="Remover"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
      </div>
      <div style={{fontSize:12,lineHeight:1.8,textAlign:'justify',textIndent:'1.25cm',color:'#333',whiteSpace:'pre-wrap'}}>{resolvedText}</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN REPORT BUILDER COMPONENT
   ═══════════════════════════════════════════════ */
export const ReportBuilder: React.FC<Props> = ({
  onBack,
  projectName = 'Escolinha de Triathlon',
  students = [],
  history = [],
  evidences = [],
  nucleos = [],
  headerImage = '/header_full.png',
}) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [pages, setPages] = useState<RBPage[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'toc' | 'blocks' | 'calc'>('toc');
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [showCover, setShowCover] = useState(true);
  const [showBackCover, setShowBackCover] = useState(true);
  const [showResume, setShowResume] = useState(true);
  const [showTocPage, setShowTocPage] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragItem, setDragItem] = useState<SidebarItem | null>(null);
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(nucleos[0]?.id || '');
  const [calcFields, setCalcFields] = useState<CalcField[]>([]);
  const [draggingWidget, setDraggingWidget] = useState<{pageId:string;widgetId:string;startX:number;startY:number;origX:number;origY:number}|null>(null);
  const [customBannerUrl, setCustomBannerUrl] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveCity, setSaveCity] = useState('Cidade | UF');
  const [configuringWidget, setConfiguringWidget] = useState<{pageId:string;widgetId:string}|null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const bannerSrc = customBannerUrl || headerImage;

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setCustomBannerUrl(ev.target.result as string); };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const tmpl: SavedTemplate = {
      id: genId(), title: templateName.trim(), coverType: 'green',
      city: saveCity, year: String(new Date().getFullYear()),
      createdAt: new Date().toISOString(),
      toc, pages, showCover, showBackCover, showResume, showTocPage,
      bannerUrl: customBannerUrl || undefined,
    };
    saveTemplateToStorage(tmpl);
    setShowSaveModal(false);
    setTemplateName('');
    alert('✅ Modelo salvo! Ele aparecerá no painel de Ambiente de Desenvolvimento.');
  };

  const dataCtx = useMemo(() => ({
    students, history, evidences, nucleos, selectedNucleoId,
  }), [students, history, evidences, nucleos, selectedNucleoId]);

  // ── TOC Operations ──
  const addTitle = useCallback((level: 0 | 1 | 2) => {
    const id = genId(), pageId = genId();
    const newItem: TocItem = { id, num: '', title: level === 0 ? 'Novo Título' : 'Novo Subtítulo', level, pageId, widgets: [] };
    setToc(prev => recalcNumbers([...prev, newItem]));
    if (level === 0) setPages(prev => [...prev, { id: pageId, type: 'CONTENT', tocItemId: id, widgets: [] }]);
  }, []);

  const removeTitle = useCallback((id: string) => {
    setToc(prev => recalcNumbers(prev.filter(t => t.id !== id)));
    setPages(prev => prev.filter(p => p.tocItemId !== id));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setToc(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  }, []);

  const moveItem = useCallback((id: string, dir: -1 | 1) => {
    setToc(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx < 0) return prev;
      const ni = idx + dir;
      if (ni < 0 || ni >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
      return recalcNumbers(arr);
    });
  }, []);

  const indentItem = useCallback((id: string, dir: 1 | -1) => {
    setToc(prev => recalcNumbers(prev.map(t => {
      if (t.id !== id) return t;
      const nl = Math.max(0, Math.min(2, t.level + dir)) as 0 | 1 | 2;
      return { ...t, level: nl };
    })));
  }, []);

  // ── Drop handler ──
  const handleDrop = useCallback((pageId: string, item: SidebarItem) => {
    const isDataWidget = ['CHART_PIE','CHART_BAR','TABLE'].includes(item.type) && item.serviceId !== 'WIDGETS';
    const widget: RBWidget = {
      id: genId(), type: item.type, serviceId: item.serviceId,
      variableKey: item.variableKey, label: item.label,
      x: 0, y: 0, width: A4W - 80, height: item.type === 'TEXT' ? 60 : 220,
      content: item.type === 'TEXT' ? item.label : undefined,
      showAiBlock: isDataWidget,
      aiPosition: 'below',
    };
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, widgets: [...p.widgets, widget] } : p));
    setDragItem(null);
  }, []);

  const updateWidget = useCallback((pageId: string, widgetId: string, patch: Partial<RBWidget>) => {
    setPages(prev => prev.map(p => p.id === pageId ? {
      ...p, widgets: p.widgets.map(w => w.id === widgetId ? { ...w, ...patch } : w)
    } : p));
  }, []);

  const removeWidget = useCallback((pageId: string, widgetId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, widgets: p.widgets.filter(w => w.id !== widgetId) } : p));
  }, []);

  const updateWidgetPos = useCallback((pageId: string, widgetId: string, x: number, y: number) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, widgets: p.widgets.map(w => w.id === widgetId ? { ...w, x: Math.max(0, x), y: Math.max(0, y) } : w) } : p));
  }, []);

  // Mouse move handler for free drag
  useEffect(() => {
    if (!draggingWidget) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - draggingWidget.startX;
      const dy = e.clientY - draggingWidget.startY;
      updateWidgetPos(draggingWidget.pageId, draggingWidget.widgetId, draggingWidget.origX + dx, draggingWidget.origY + dy);
    };
    const onUp = () => setDraggingWidget(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingWidget, updateWidgetPos]);

  // Calc engine
  const addCalcField = useCallback(() => {
    const src = CALC_SOURCES[0];
    setCalcFields(prev => [...prev, { id: genId(), label: src.label, serviceId: src.serviceId, variableKey: src.variableKey, op: 'SUM', result: '—' }]);
  }, []);
  const removeCalcField = useCallback((id: string) => {
    setCalcFields(prev => prev.filter(f => f.id !== id));
  }, []);
  const updateCalcField = useCallback((id: string, patch: Partial<CalcField>) => {
    setCalcFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }, []);
  const recalcAll = useCallback(() => {
    setCalcFields(prev => prev.map(f => {
      const data = resolveWidgetData(f.serviceId, f.variableKey, dataCtx);
      return { ...f, result: runCalc(f.op, data) };
    }));
  }, [dataCtx]);

  // ── Build all pages ──
  const allPages: RBPage[] = [];
  if (showCover) allPages.push({ id: '_cover', type: 'COVER', widgets: [] });
  if (showBackCover) allPages.push({ id: '_back', type: 'BACK_COVER', widgets: [] });
  if (showResume) allPages.push({ id: '_resume', type: 'SUMMARY', widgets: [] });
  if (showTocPage) allPages.push({ id: '_toc', type: 'TOC', widgets: [] });
  toc.filter(t => t.level === 0).forEach(t => {
    const pg = pages.find(p => p.tocItemId === t.id);
    if (pg) allPages.push(pg);
  });

  const getSubtitles = (parentId: string) => {
    const idx = toc.findIndex(t => t.id === parentId);
    const subs: TocItem[] = [];
    for (let i = idx + 1; i < toc.length; i++) {
      if (toc[i].level === 0) break;
      subs.push(toc[i]);
    }
    return subs;
  };

  return (
    <div className="rb-root">
      {/* ── TOOLBAR ── */}
      <div className="rb-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="rb-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>Construtor de Relatório</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', margin: 0 }}>{projectName} • {allPages.length} páginas • {students.length} alunos</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={selectedNucleoId} onChange={e => setSelectedNucleoId(e.target.value)} className="rb-toolbar-select">
            <option value="">Todos os Núcleos</option>
            {nucleos.map(n => <option key={n.id} value={n.id}>{nucleoDisplayLabel(n)}</option>)}
          </select>
          <button onClick={() => setShowSaveModal(true)} className="rb-btn-export" style={{background:'linear-gradient(135deg,rgba(16,185,129,.2),rgba(34,197,94,.15))',borderColor:'rgba(16,185,129,.4)',color:'#4ade80',display:'flex',alignItems:'center',gap:5}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Modelo</button>
          <button onClick={() => window.print()} className="rb-btn-export" style={{display:'flex',alignItems:'center',gap:5}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Exportar PDF</button>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => setShowSaveModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:32,width:440,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <h2 style={{fontSize:18,fontWeight:800,marginBottom:20,display:'flex',alignItems:'center',gap:8}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Salvar Modelo Oficial</h2>
            <p style={{fontSize:12,color:'#666',marginBottom:16,lineHeight:1.6}}>Este modelo será salvo e ficará disponível como relatório oficial no painel <b>Ambiente de Desenvolvimento</b>.</p>
            <label style={{fontSize:12,fontWeight:700,color:'#333',display:'block',marginBottom:4}}>Nome do Relatório</label>
            <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Ex: Relatório Trimestral de Atividades" style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginBottom:16,outline:'none',boxSizing:'border-box'}} />
            <label style={{fontSize:12,fontWeight:700,color:'#333',display:'block',marginBottom:4}}>Cidade | UF</label>
            <input value={saveCity} onChange={e => setSaveCity(e.target.value)} style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:8,fontSize:13,marginBottom:20,outline:'none',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setShowSaveModal(false)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #ddd',background:'#fff',cursor:'pointer',fontWeight:700,fontSize:13}}>Cancelar</button>
              <button onClick={handleSaveTemplate} disabled={!templateName.trim()} style={{padding:'10px 24px',borderRadius:8,border:'none',background:templateName.trim()?'linear-gradient(135deg,#1a73e8,#4285f4)':'#ccc',color:'#fff',cursor:templateName.trim()?'pointer':'not-allowed',fontWeight:700,fontSize:13}}>Salvar Modelo</button>
            </div>
          </div>
        </div>
      )}

      <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} style={{display:'none'}} />

      <div className="rb-layout">
        {/* ── SIDEBAR ── */}
        <div className="rb-sidebar no-print">
          <div className="rb-sidebar-tabs">
            <button className={`rb-tab ${sidebarTab === 'toc' ? 'active' : ''}`} onClick={() => setSidebarTab('toc')} style={{display:'flex',alignItems:'center',gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Sumário</button>
            <button className={`rb-tab ${sidebarTab === 'blocks' ? 'active' : ''}`} onClick={() => setSidebarTab('blocks')} style={{display:'flex',alignItems:'center',gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>Blocos</button>
            <button className={`rb-tab ${sidebarTab === 'calc' ? 'active' : ''}`} onClick={() => setSidebarTab('calc')} style={{display:'flex',alignItems:'center',gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>Cálculos</button>
          </div>

          {sidebarTab === 'toc' && (
            <div className="rb-toc-panel">
              <div className="rb-toc-list">
                {toc.map(item => (
                  <div key={item.id} className={`rb-toc-item level-${item.level}`}>
                    <span className="rb-toc-handle" title="Mover">≡</span>
                    <span className="rb-toc-num">{item.num}</span>
                    {editingId === item.id ? (
                      <input autoFocus className="rb-toc-input" defaultValue={item.title}
                        onBlur={e => { updateTitle(item.id, e.target.value); setEditingId(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { updateTitle(item.id, (e.target as HTMLInputElement).value); setEditingId(null); } }}
                      />
                    ) : (
                      <span className="rb-toc-title" onDoubleClick={() => setEditingId(item.id)}>{item.title}</span>
                    )}
                    <div className="rb-toc-actions">
                      <button onClick={() => moveItem(item.id, -1)} title="Subir">↑</button>
                      <button onClick={() => moveItem(item.id, 1)} title="Descer">↓</button>
                      <button onClick={() => indentItem(item.id, 1)} title="Indent">→</button>
                      <button onClick={() => indentItem(item.id, -1)} title="Outdent">←</button>
                      <button onClick={() => setEditingId(item.id)} title="Editar"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                      <button onClick={() => removeTitle(item.id)} title="Remover" className="rb-btn-danger"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
                    </div>
                  </div>
                ))}
                {toc.length === 0 && <p className="rb-empty">Nenhum item. Adicione títulos abaixo.</p>}
              </div>
              <div className="rb-toc-footer">
                <button onClick={() => addTitle(0)} className="rb-btn-add">+ Título Principal</button>
                <button onClick={() => addTitle(1)} className="rb-btn-add sub">+ Subtítulo</button>
              </div>
              <div className="rb-special-pages">
                <span className="rb-sp-label">Páginas Especiais</span>
                <label><input type="checkbox" checked={showCover} onChange={e => setShowCover(e.target.checked)} /> Capa</label>
                <label><input type="checkbox" checked={showBackCover} onChange={e => setShowBackCover(e.target.checked)} /> Contracapa</label>
                <label><input type="checkbox" checked={showResume} onChange={e => setShowResume(e.target.checked)} /> Resumo</label>
                <label><input type="checkbox" checked={showTocPage} onChange={e => setShowTocPage(e.target.checked)} /> Sumário</label>
              </div>
            </div>
          )}

          {sidebarTab === 'blocks' && (
            <div className="rb-blocks-panel">
              {SIDEBAR_BLOCKS.map(block => (
                <div key={block.serviceId} className="rb-block">
                  <button className="rb-block-header" onClick={() => setExpandedBlock(expandedBlock === block.serviceId ? null : block.serviceId)}>
                    <span style={{display:'flex',alignItems:'center',gap:6}}><BlockIcon name={block.icon} />{block.label}</span>
                    <span style={{fontSize:10,color:'#999'}}>{block.items.length} itens {expandedBlock === block.serviceId ? '▾' : '▸'}</span>
                  </button>
                  {expandedBlock === block.serviceId && (
                    <div className="rb-block-items">
                      {block.items.map(item => (
                        <div key={item.id} className="rb-drag-item" draggable
                          onDragStart={() => setDragItem(item)}
                          onDragEnd={() => setDragItem(null)}
                        >
                          <span className="rb-drag-icon"><ItemTypeIcon type={item.type} /></span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sidebarTab === 'calc' && (
            <div className="rb-toc-panel">
              <div style={{padding:'10px 12px',borderBottom:'1px solid #eee'}}>
                <p style={{fontSize:11,color:'#666',margin:'0 0 8px',lineHeight:1.5}}>Monte fórmulas com dados reais do projeto. Use <b>SUM</b>, <b>AVG</b>, <b>PCT</b>, <b>COUNT</b>, <b>MIN</b>, <b>MAX</b>.</p>
              </div>
              <div className="rb-toc-list" style={{padding:8}}>
                {calcFields.map(f => (
                  <div key={f.id} style={{background:'#f7f8fa',borderRadius:8,padding:10,marginBottom:8,border:'1px solid #e8e8e8'}}>
                    <div style={{display:'flex',gap:4,marginBottom:6}}>
                      <select value={`${f.serviceId}|${f.variableKey}`} onChange={e => { const [s,v] = e.target.value.split('|'); const src = CALC_SOURCES.find(c => c.serviceId===s && c.variableKey===v); if(src) updateCalcField(f.id,{serviceId:s,variableKey:v,label:src.label}); }} style={{flex:1,fontSize:11,padding:'4px 6px',borderRadius:4,border:'1px solid #ddd'}}>
                        {CALC_SOURCES.map(s => <option key={s.serviceId+'|'+s.variableKey} value={s.serviceId+'|'+s.variableKey}>{s.label}</option>)}
                      </select>
                      <select value={f.op} onChange={e => updateCalcField(f.id,{op:e.target.value as CalcOp})} style={{width:70,fontSize:11,padding:'4px 6px',borderRadius:4,border:'1px solid #ddd',fontWeight:700}}>
                        {(['SUM','AVG','PCT','COUNT','MIN','MAX'] as CalcOp[]).map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                      <button onClick={() => removeCalcField(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#ccc',fontSize:14}}>×</button>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:10,color:'#888'}}>{f.op}({f.label})</span>
                      <span style={{fontSize:16,fontWeight:800,color: f.result === '—' ? '#ccc' : '#1a73e8'}}>{f.result}</span>
                    </div>
                  </div>
                ))}
                {calcFields.length === 0 && <p className="rb-empty">Adicione campos de cálculo abaixo.</p>}
              </div>
              <div style={{padding:8,borderTop:'1px solid #eee',display:'flex',gap:6}}>
                <button onClick={addCalcField} className="rb-btn-add" style={{flex:1}}>+ Adicionar Campo</button>
                <button onClick={recalcAll} className="rb-btn-add" style={{flex:1,background:'#e8f0fe',borderColor:'#1a73e8',color:'#1a73e8',borderStyle:'solid'}}>⟳ Calcular</button>
              </div>
            </div>
          )}
        </div>

        {/* ── CANVAS ── */}
        <div className="rb-canvas">
          {allPages.length === 0 && (
            <div className="rb-empty-canvas">
              <div style={{fontSize:48,marginBottom:16}}>📄</div>
              <p>Comece montando o <b>Sumário</b> na sidebar à esquerda.</p>
              <p style={{fontSize:13,color:'#aaa'}}>Cada título criará automaticamente uma página aqui.</p>
            </div>
          )}
          {allPages.map((page, pi) => {
            const tocItem = page.tocItemId ? toc.find(t => t.id === page.tocItemId) : null;
            const subtitles = tocItem ? getSubtitles(tocItem.id) : [];
            return (
              <div key={page.id} className="rb-page-wrapper">
                <div className="rb-page-label no-print">Página {pi + 1}{page.type !== 'CONTENT' ? ` — ${page.type === 'COVER' ? 'Capa' : page.type === 'BACK_COVER' ? 'Contracapa' : page.type === 'SUMMARY' ? 'Resumo' : 'Sumário'}` : ''}</div>
                <div className="rb-a4"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('rb-drop-active'); }}
                  onDragLeave={e => e.currentTarget.classList.remove('rb-drop-active')}
                  onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('rb-drop-active'); if (dragItem) handleDrop(page.id, dragItem); }}
                >
                  {/* COVER */}
                  {page.type === 'COVER' && (
                    <div style={{display:'flex',flexDirection:'column',height:A4H,maxHeight:A4H,position:'relative',padding:0,overflow:'hidden'}}>
                      {/* Banner - edge to edge, clickable to change */}
                      <div style={{width:'100%',position:'relative',cursor:'pointer',flexShrink:0}} onClick={() => bannerInputRef.current?.click()} title="Clique para trocar o banner">
                        <img src={bannerSrc} alt="Header" style={{width:'100%',height:'auto',maxHeight:210,objectFit:'cover',objectPosition:'center',display:'block',background:'#fff'}} />
                        <div className="no-print" style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,.5)',color:'#fff',fontSize:9,padding:'3px 8px',borderRadius:4,fontWeight:700}}>📷 Trocar Banner</div>
                      </div>
                      {/* Cover body */}
                      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'0 50px'}}>
                        <div className="rb-cover-block" style={{margin:'40px 0',padding:'55px 50px',borderRadius:0,borderTopLeftRadius:0,borderBottomRightRadius:'40% 8%'}}>
                          <h1 contentEditable suppressContentEditableWarning style={{fontSize:26,fontWeight:900,color:'#fff',textAlign:'left',margin:0,letterSpacing:0.5,lineHeight:1.3}}>TÍTULO DO RELATÓRIO</h1>
                          <p contentEditable suppressContentEditableWarning style={{fontSize:14,color:'rgba(255,255,255,.6)',textAlign:'left',marginTop:12,fontWeight:700,letterSpacing:2,textTransform:'uppercase'}}>Subtítulo editável</p>
                        </div>
                        <div style={{marginTop:'auto',paddingBottom:100,position:'relative',zIndex:10}}>
                          <p contentEditable suppressContentEditableWarning style={{fontSize:13,fontWeight:700,color:'#333',textTransform:'uppercase',marginBottom:10}}>PROJETO</p>
                          <p contentEditable suppressContentEditableWarning style={{fontSize:16,fontWeight:800,color:'#2a6496',textTransform:'uppercase',letterSpacing:1}}>{projectName.toUpperCase()}</p>
                          <div style={{position:'absolute',right:0,bottom:60,background:'#333',color:'#fff',padding:'12px 24px',textAlign:'right',fontWeight:700,fontSize:18,lineHeight:1.4}}>
                            {extractCityUF(nucleos.find(n => n.id === selectedNucleoId))}<br/>{new Date().getFullYear()}
                          </div>
                        </div>
                      </div>
                      <svg style={{position:'absolute',bottom:0,left:0,width:'100%',height:80}} viewBox="0 0 900 80" preserveAspectRatio="none">
                        <path d="M0,40 C200,80 400,0 600,40 C700,60 800,30 900,50 L900,80 L0,80 Z" fill="#4a8c3f" opacity="0.7"/>
                        <path d="M0,60 C200,40 400,70 600,55 C750,45 850,65 900,50 L900,80 L0,80 Z" fill="#e0e0e0" opacity="0.4"/>
                      </svg>
                    </div>
                  )}
                  {/* BACK COVER */}
                  {page.type === 'BACK_COVER' && (
                    <div style={{display:'flex',flexDirection:'column',height:A4H,maxHeight:A4H,position:'relative',padding:0,overflow:'hidden'}}>
                      <div style={{width:'100%',flexShrink:0}} onClick={() => bannerInputRef.current?.click()} title="Clique para trocar o banner">
                        <img src={bannerSrc} alt="Header" style={{width:'100%',height:'auto',maxHeight:210,objectFit:'cover',objectPosition:'center',display:'block',background:'#fff'}} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding:'0 50px' }}>
                        <p style={{fontSize:14,fontWeight:800,color:'#1a5276',textTransform:'uppercase',letterSpacing:1,marginBottom:120,textAlign:'center'}} contentEditable suppressContentEditableWarning>Subtítulo da contracapa</p>
                        <h2 contentEditable suppressContentEditableWarning style={{ fontSize: 24, fontWeight: 900, color: '#1a5276', textAlign: 'center' }}>TÍTULO DO RELATÓRIO</h2>
                        <p contentEditable suppressContentEditableWarning style={{ fontSize: 14, color: '#555', marginTop: 8 }}>PROJETO {projectName.toUpperCase()}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#333', marginTop: 40 }}>
                          {extractCityUF(nucleos.find(n => n.id === selectedNucleoId))}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#1a5276' }}>{new Date().getFullYear()}</p>
                      </div>
                      <svg style={{position:'absolute',bottom:80,left:0,width:'100%',height:60}} viewBox="0 0 900 60" preserveAspectRatio="none">
                        <path d="M0,30 C250,55 500,10 750,35 C800,40 850,50 900,40 L900,60 L0,60 Z" fill="#ccc" opacity="0.3"/>
                      </svg>
                    </div>
                  )}
                  {/* SUMMARY */}
                  {page.type === 'SUMMARY' && (
                    <div style={{ padding: 40 }}>
                      <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 30 }}>RESUMO</h2>
                      <div contentEditable suppressContentEditableWarning style={{ fontSize: 12, lineHeight: 1.8, textAlign: 'justify', textIndent: '1.25cm', color: '#333' }}>
                        Insira aqui o resumo do relatório. Este texto é editável diretamente na folha. Descreva os principais resultados, métricas e conclusões do período analisado.
                      </div>
                    </div>
                  )}
                  {/* TOC PAGE */}
                  {page.type === 'TOC' && (
                    <div style={{ padding: 40 }}>
                      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, marginBottom: 40 }}>SUMÁRIO</h2>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                          {toc.map((item, i) => (
                            <tr key={item.id}>
                              <td style={{ width: 45, fontWeight: 700, fontSize: 13, paddingTop: item.level === 0 ? 14 : 6, paddingBottom: 4 }}>{item.num}</td>
                              <td style={{ fontSize: 13, fontWeight: item.level === 0 ? 700 : 400, textTransform: item.level === 0 ? 'uppercase' : 'none', borderBottom: '1px dotted #999', paddingTop: item.level === 0 ? 14 : 6, paddingBottom: 4, paddingLeft: item.level * 20 }}>{item.title}</td>
                              <td style={{ width: 35, textAlign: 'right', fontWeight: 700, fontSize: 13, paddingTop: item.level === 0 ? 14 : 6 }}>{pi + i + 2}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* CONTENT */}
                  {page.type === 'CONTENT' && tocItem && (
                    <div style={{ padding: 40 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', marginBottom: 20, color: '#111' }} contentEditable suppressContentEditableWarning>{tocItem.num} {tocItem.title}</h2>
                      {/* Interleaved flow: widgets render in order, subtitles inserted between them */}
                      {(() => {
                        const contentItems: React.ReactNode[] = [];
                        const widgets = page.widgets;
                        const subsToPlace = [...subtitles];
                        let subIdx = 0;

                        widgets.forEach((w, wIdx) => {
                          // Before each widget (except the first), insert the next subtitle if available
                          if (subIdx < subsToPlace.length && wIdx > 0 && wIdx <= subsToPlace.length) {
                            const sub = subsToPlace[subIdx];
                            contentItems.push(
                              <h3 key={`sub-${sub.id}`} style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 24, color: '#333', paddingLeft: (sub.level - 1) * 16 }} contentEditable suppressContentEditableWarning>{sub.num} {sub.title}</h3>
                            );
                            subIdx++;
                          }

                          const showAi = w.showAiBlock && ['CHART_PIE','CHART_BAR','TABLE'].includes(w.type) && (w.serviceId !== 'WIDGETS' || w.dataConfig?.sourceType);
                          const aiBlock = showAi ? (
                            <AIAnalysisBlock
                              key={`ai-${w.id}`}
                              widget={w}
                              ctx={dataCtx}
                              projectName={projectName}
                              onUpdate={(patch) => updateWidget(page.id, w.id, patch)}
                            />
                          ) : null;

                          const isConfiguring = configuringWidget?.pageId === page.id && configuringWidget?.widgetId === w.id;
                          const canConfigure = ['CHART_PIE','CHART_BAR','TABLE'].includes(w.type);

                          contentItems.push(
                            <div key={w.id} className="rb-widget" style={{position: w.x > 0 || w.y > 0 ? 'absolute' : 'relative', left: w.x > 0 ? w.x : undefined, top: w.y > 0 ? w.y : undefined, width: w.x > 0 ? w.width || 'auto' : undefined, cursor: draggingWidget?.widgetId === w.id ? 'grabbing' : 'default'}}>
                              {w.aiPosition === 'above' && aiBlock}
                              <div className="rb-widget-header">
                                <span
                                  onMouseDown={e => { e.preventDefault(); setDraggingWidget({pageId:page.id,widgetId:w.id,startX:e.clientX,startY:e.clientY,origX:w.x||0,origY:w.y||0}); }}
                                  style={{cursor:'grab',userSelect:'none',display:'flex',alignItems:'center',gap:4}}
                                  title="Arraste para mover livremente"
                                >✥ <ItemTypeIcon type={w.type} /> {w.label}</span>
                                <div style={{display:'flex',alignItems:'center',gap:4}}>
                                  {canConfigure && (
                                    <button onClick={() => setConfiguringWidget(isConfiguring ? null : {pageId:page.id,widgetId:w.id})} className="rb-ai-toggle-btn" title="Configurar Dados" style={{fontSize:12,display:'inline-flex'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button>
                                  )}
                                  {['CHART_PIE','CHART_BAR','TABLE'].includes(w.type) && (w.serviceId !== 'WIDGETS' || w.dataConfig?.sourceType) && !w.showAiBlock && (
                                    <button onClick={() => updateWidget(page.id, w.id, { showAiBlock: true, aiPosition: 'below' })} className="rb-ai-toggle-btn" title="Adicionar Análise IA" style={{display:'inline-flex'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></button>
                                  )}
                                  <button onClick={() => removeWidget(page.id, w.id)} className="rb-widget-remove">×</button>
                                </div>
                              </div>
                              {/* Inline Configurator */}
                              {isConfiguring && (
                                <div className="no-print">
                                  <WidgetConfigurator
                                    widget={w}
                                    ctx={dataCtx}
                                    calcFields={calcFields}
                                    onUpdate={(patch) => updateWidget(page.id, w.id, patch)}
                                    onClose={() => setConfiguringWidget(null)}
                                  />
                                </div>
                              )}
                              <div className="rb-widget-body">
                                <WidgetRenderer widget={w} ctx={dataCtx} onConfigure={() => setConfiguringWidget({pageId:page.id,widgetId:w.id})} />
                              </div>
                              {(w.aiPosition === 'below' || !w.aiPosition) && aiBlock}
                            </div>
                          );
                        });

                        // Render any remaining subtitles that weren't placed between widgets
                        while (subIdx < subsToPlace.length) {
                          const sub = subsToPlace[subIdx];
                          contentItems.push(
                            <h3 key={`sub-${sub.id}`} style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, marginTop: 24, color: '#333', paddingLeft: (sub.level - 1) * 16 }} contentEditable suppressContentEditableWarning>{sub.num} {sub.title}</h3>
                          );
                          subIdx++;
                        }

                        return contentItems;
                      })()}
                      {page.widgets.length === 0 && (
                        <div className="rb-drop-hint">
                          <p>Arraste blocos de dados da aba <b>Blocos</b> para esta seção</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
