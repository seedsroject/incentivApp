/**
 * WidgetConfigurator — Inline data editor for Report Builder widgets.
 * Allows configuring data source (system/manual/calc), editing data in a spreadsheet-like grid,
 * and previewing charts/tables in real-time.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  RBWidget, WidgetDataConfig, ManualDataRow, ManualTableRow,
  AVAILABLE_DATA_SOURCES, CHART_COLORS, genId,
  DataSourceType
} from './ReportBuilderTypes';
import { resolveWidgetData, ChartDataPoint } from '../services/reportBuilderDataService';
import { evaluateGrid, ComputedCell, indexToColLetter, FORMULA_HELP, extractChartData } from '../services/formulaEngine';

interface Props {
  widget: RBWidget;
  ctx: any;
  calcFields: { id: string; label: string; result: number | string }[];
  onUpdate: (patch: Partial<RBWidget>) => void;
  onClose: () => void;
}

const DEFAULT_CHART_ROWS: ManualDataRow[] = [
  { label: 'Categoria A', value: 40, color: CHART_COLORS[0] },
  { label: 'Categoria B', value: 30, color: CHART_COLORS[1] },
  { label: 'Categoria C', value: 20, color: CHART_COLORS[2] },
  { label: 'Categoria D', value: 10, color: CHART_COLORS[3] },
];

const DEFAULT_TABLE_COLS = ['Coluna 1', 'Coluna 2', 'Coluna 3'];
const DEFAULT_TABLE_ROWS: ManualTableRow[] = [
  { 'Coluna 1': 'Dado 1', 'Coluna 2': 'Dado 2', 'Coluna 3': 'Dado 3' },
  { 'Coluna 1': 'Dado 4', 'Coluna 2': 'Dado 5', 'Coluna 3': 'Dado 6' },
];

export const WidgetConfigurator: React.FC<Props> = ({
  widget, ctx, calcFields, onUpdate, onClose
}) => {
  const isChart = ['CHART_PIE', 'CHART_BAR'].includes(widget.type);
  const isTable = widget.type === 'TABLE';

  // Initialize state from existing config or defaults
  const initConfig = widget.dataConfig || {
    sourceType: 'MANUAL' as DataSourceType,
    manualChartData: [...DEFAULT_CHART_ROWS],
    manualTableColumns: [...DEFAULT_TABLE_COLS],
    manualTableRows: DEFAULT_TABLE_ROWS.map(r => ({ ...r })),
    chartType: widget.type === 'CHART_PIE' ? 'PIE' as const : 'BAR' as const,
    showLegend: true,
    showValues: true,
  };

  const [sourceType, setSourceType] = useState<DataSourceType>(initConfig.sourceType);
  const [systemServiceId, setSystemServiceId] = useState(initConfig.systemServiceId || '');
  const [systemVariableKey, setSystemVariableKey] = useState(initConfig.systemVariableKey || '');
  const [chartData, setChartData] = useState<ManualDataRow[]>(initConfig.manualChartData || [...DEFAULT_CHART_ROWS]);
  const [tableColumns, setTableColumns] = useState<string[]>(initConfig.manualTableColumns || [...DEFAULT_TABLE_COLS]);
  const [tableRows, setTableRows] = useState<ManualTableRow[]>(initConfig.manualTableRows || DEFAULT_TABLE_ROWS.map(r => ({ ...r })));
  const [chartType, setChartType] = useState<'PIE' | 'BAR' | 'LINE'>(initConfig.chartType || 'PIE');
  const [showLegend, setShowLegend] = useState(initConfig.showLegend !== false);
  const [showValues, setShowValues] = useState(initConfig.showValues !== false);

  // ── Formula Engine State ──
  const [activeCell, setActiveCell] = useState<{col:number;row:number}|null>(null);
  const [showFormulaHelp, setShowFormulaHelp] = useState(false);
  const [chartBindLabelCol, setChartBindLabelCol] = useState(0);
  const [chartBindValueCol, setChartBindValueCol] = useState(tableColumns.length > 1 ? 1 : 0);

  // ── Chart Formula State ──
  // Stores raw formula strings for chart value cells (index → formula string)
  const [chartFormulas, setChartFormulas] = useState<Record<number, string>>({});
  const [activeChartRow, setActiveChartRow] = useState<number | null>(null);
  const [showChartFormulaHelp, setShowChartFormulaHelp] = useState(false);

  // Evaluate a chart value formula: references are V1, V2... (value of row N)
  const evalChartFormula = useCallback((formula: string, rowIdx: number): { value: number; error?: string } => {
    try {
      const expr = formula.substring(1).trim().toUpperCase();
      // Resolve V references (V1 = chartData[0].value, V2 = chartData[1].value, ...)
      const getVal = (ref: string): number => {
        const m = ref.match(/^V(\d+)$/);
        if (!m) { const n = parseFloat(ref.replace(',', '.')); return isNaN(n) ? 0 : n; }
        const idx = parseInt(m[1], 10) - 1;
        if (idx === rowIdx) throw new Error('Ref circular');
        if (idx < 0 || idx >= chartData.length) return 0;
        // If that row also has a formula, resolve recursively (max depth)
        if (chartFormulas[idx]?.startsWith('=')) {
          return evalChartFormula(chartFormulas[idx], idx).value;
        }
        return chartData[idx]?.value || 0;
      };

      // Resolve range V1:V5
      const resolveRange = (rangeStr: string): number[] => {
        const [a, b] = rangeStr.split(':');
        const mA = a.match(/^V(\d+)$/), mB = b.match(/^V(\d+)$/);
        if (!mA || !mB) return [];
        const start = parseInt(mA[1], 10) - 1, end = parseInt(mB[1], 10) - 1;
        const vals: number[] = [];
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          if (i === rowIdx) continue;
          if (chartFormulas[i]?.startsWith('=')) vals.push(evalChartFormula(chartFormulas[i], i).value);
          else vals.push(chartData[i]?.value || 0);
        }
        return vals;
      };

      // Function match
      const funcMatch = expr.match(/^(SOMA|MEDIA|SUB|DIV|PCT|SUM|AVG)\s*\((.+)\)$/);
      if (funcMatch) {
        const func = funcMatch[1];
        const argsStr = funcMatch[2];
        let args: number[] = [];
        argsStr.split(';').map(s => s.trim()).forEach(part => {
          if (part.includes(':')) { args = args.concat(resolveRange(part)); }
          else { args.push(getVal(part)); }
        });
        switch (func) {
          case 'SOMA': case 'SUM': return { value: args.reduce((a, b) => a + b, 0) };
          case 'MEDIA': case 'AVG': return { value: args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0 };
          case 'SUB': return { value: args.length >= 2 ? args[0] - args[1] : 0 };
          case 'DIV': return args[1] === 0 ? { value: 0, error: 'Div/0' } : { value: args[0] / args[1] };
          case 'PCT': return args[1] === 0 ? { value: 0, error: 'Div/0' } : { value: (args[0] / args[1]) * 100 };
        }
      }

      // Simple arithmetic: =V1+V2-V3*2
      let resolved = expr;
      const refs = expr.match(/V\d+/g);
      if (refs) { for (const r of refs) resolved = resolved.replace(r, String(getVal(r))); }
      if (/^[\d\s+\-*/().]+$/.test(resolved)) {
        const result = new Function(`return (${resolved})`)();
        if (typeof result === 'number' && isFinite(result)) return { value: Math.round(result * 100) / 100 };
      }
      return { value: 0, error: 'Inválida' };
    } catch (e: any) {
      return { value: 0, error: e.message || 'Erro' };
    }
  }, [chartData, chartFormulas]);

  // Compute all formula cells whenever table data changes
  const computedCells = useMemo(() => {
    if (!isTable || sourceType !== 'MANUAL') return new Map<string, ComputedCell>();
    return evaluateGrid(tableColumns, tableRows);
  }, [isTable, sourceType, tableColumns, tableRows]);

  // Get display value for a cell (resolved formula or raw)
  const getCellDisplay = useCallback((ri: number, ci: number, raw: string): string => {
    if (!raw.startsWith('=')) return raw;
    const key = `${ci},${ri}`;
    const computed = computedCells.get(key);
    if (computed?.error) return `#ERR`;
    if (computed) return computed.displayValue;
    return raw;
  }, [computedCells]);

  // Filter available sources by data type
  const chartSources = useMemo(() =>
    AVAILABLE_DATA_SOURCES.filter(s => s.dataType === 'chart'),
    []
  );
  const tableSources = useMemo(() =>
    AVAILABLE_DATA_SOURCES.filter(s => s.dataType === 'table'),
    []
  );
  const availableSources = isChart ? chartSources : tableSources;

  // Group sources by category
  const groupedSources = useMemo(() => {
    const groups: Record<string, typeof availableSources> = {};
    availableSources.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [availableSources]);

  // Preview data from system source
  const systemPreviewData = useMemo(() => {
    if (sourceType !== 'SYSTEM' || !systemServiceId || !systemVariableKey) return null;
    return resolveWidgetData(systemServiceId, systemVariableKey, ctx);
  }, [sourceType, systemServiceId, systemVariableKey, ctx]);

  // ── Chart Data Handlers ──
  const updateChartRow = useCallback((idx: number, field: keyof ManualDataRow, value: string | number) => {
    setChartData(prev => prev.map((r, i) => i === idx ? { ...r, [field]: field === 'value' ? Number(value) || 0 : value } : r));
  }, []);

  const addChartRow = useCallback(() => {
    setChartData(prev => [...prev, { label: `Item ${prev.length + 1}`, value: 0, color: CHART_COLORS[prev.length % CHART_COLORS.length] }]);
  }, []);

  const removeChartRow = useCallback((idx: number) => {
    setChartData(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Table Data Handlers ──
  const updateTableCell = useCallback((rowIdx: number, col: string, value: string) => {
    setTableRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: value } : r));
  }, []);

  const addTableRow = useCallback(() => {
    const newRow: ManualTableRow = {};
    tableColumns.forEach(c => newRow[c] = '');
    setTableRows(prev => [...prev, newRow]);
  }, [tableColumns]);

  const removeTableRow = useCallback((idx: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addTableColumn = useCallback(() => {
    const name = `Coluna ${tableColumns.length + 1}`;
    setTableColumns(prev => [...prev, name]);
    setTableRows(prev => prev.map(r => ({ ...r, [name]: '' })));
  }, [tableColumns]);

  const removeTableColumn = useCallback((col: string) => {
    setTableColumns(prev => prev.filter(c => c !== col));
    setTableRows(prev => prev.map(r => {
      const nr = { ...r };
      delete nr[col];
      return nr;
    }));
  }, []);

  const renameTableColumn = useCallback((oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) return;
    setTableColumns(prev => prev.map(c => c === oldName ? newName : c));
    setTableRows(prev => prev.map(r => {
      const nr = { ...r };
      nr[newName] = nr[oldName] || '';
      delete nr[oldName];
      return nr;
    }));
  }, []);

  // ── Import from calc fields ──
  const importFromCalc = useCallback(() => {
    if (!calcFields.length) return;
    const imported = calcFields.map((f, i) => ({
      label: f.label,
      value: typeof f.result === 'number' ? f.result : parseFloat(String(f.result)) || 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
    setChartData(imported);
    setSourceType('MANUAL');
  }, [calcFields]);

  // ── Save ──
  const handleSave = useCallback(() => {
    const config: WidgetDataConfig = {
      sourceType,
      systemServiceId: sourceType === 'SYSTEM' ? systemServiceId : undefined,
      systemVariableKey: sourceType === 'SYSTEM' ? systemVariableKey : undefined,
      manualChartData: sourceType === 'MANUAL' && isChart ? chartData : undefined,
      manualTableColumns: sourceType === 'MANUAL' && isTable ? tableColumns : undefined,
      manualTableRows: sourceType === 'MANUAL' && isTable ? tableRows : undefined,
      chartType: isChart ? chartType : undefined,
      showLegend,
      showValues,
    };

    const patch: Partial<RBWidget> = { dataConfig: config };

    // Also update the widget's serviceId/variableKey when using system source
    if (sourceType === 'SYSTEM' && systemServiceId && systemVariableKey) {
      patch.serviceId = systemServiceId;
      patch.variableKey = systemVariableKey;
      // Find label
      const src = AVAILABLE_DATA_SOURCES.find(s => s.serviceId === systemServiceId && s.variableKey === systemVariableKey);
      if (src) patch.label = src.label;
    }

    // For manual data, set chartData/tableColumns/tableRows directly on the widget too
    if (sourceType === 'MANUAL') {
      if (isChart) {
        patch.chartData = chartData.map(d => ({ label: d.label, value: d.value, color: d.color }));
        patch.serviceId = 'WIDGETS';
      }
      if (isTable) {
        patch.tableColumns = tableColumns;
        patch.tableRows = tableRows;
        patch.serviceId = 'WIDGETS';
      }
    }

    onUpdate(patch);
    onClose();
  }, [sourceType, systemServiceId, systemVariableKey, chartData, tableColumns, tableRows, chartType, showLegend, showValues, isChart, isTable, onUpdate, onClose]);

  // ── Mini Preview ──
  const previewChartData = useMemo((): ChartDataPoint[] => {
    if (sourceType === 'SYSTEM' && Array.isArray(systemPreviewData)) return systemPreviewData;
    if (sourceType === 'MANUAL') return chartData;
    return [];
  }, [sourceType, systemPreviewData, chartData]);

  return (
    <div className="wc-root">
      {/* Header */}
      <div className="wc-header">
        <div className="wc-header-title">
          <span style={{fontSize:14}}>⚙️</span>
          <span>Configurar {isChart ? 'Gráfico' : 'Tabela'}</span>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={handleSave} className="wc-btn wc-btn-primary">💾 Aplicar</button>
          <button onClick={onClose} className="wc-btn">✕</button>
        </div>
      </div>

      {/* Source Type Tabs */}
      <div className="wc-tabs">
        <button className={`wc-tab ${sourceType === 'MANUAL' ? 'active' : ''}`} onClick={() => setSourceType('MANUAL')}>
          ✏️ Dados Manuais
        </button>
        <button className={`wc-tab ${sourceType === 'SYSTEM' ? 'active' : ''}`} onClick={() => setSourceType('SYSTEM')}>
          📊 Dados do Sistema
        </button>
        {isChart && calcFields.length > 0 && (
          <button className={`wc-tab`} onClick={importFromCalc} title="Importar resultados dos cálculos">
            🧮 Importar Cálculos
          </button>
        )}
      </div>

      {/* ═══ SYSTEM SOURCE ═══ */}
      {sourceType === 'SYSTEM' && (
        <div className="wc-section">
          <label className="wc-label">Fonte de Dados</label>
          <select
            value={`${systemServiceId}|${systemVariableKey}`}
            onChange={e => {
              const [sId, vKey] = e.target.value.split('|');
              setSystemServiceId(sId);
              setSystemVariableKey(vKey);
            }}
            className="wc-select"
          >
            <option value="|">— Selecionar fonte de dados —</option>
            {Object.entries(groupedSources).map(([cat, items]) => (
              <optgroup key={cat} label={`📁 ${cat}`}>
                {items.map(s => (
                  <option key={`${s.serviceId}|${s.variableKey}`} value={`${s.serviceId}|${s.variableKey}`}>
                    {s.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* System Preview */}
          {systemPreviewData && (
            <div className="wc-preview">
              <span className="wc-label" style={{marginBottom:6,display:'block'}}>📋 Preview dos dados:</span>
              {Array.isArray(systemPreviewData) ? (
                <div className="wc-preview-grid">
                  {systemPreviewData.map((d: ChartDataPoint, i: number) => (
                    <div key={i} className="wc-preview-row">
                      <span className="wc-color-dot" style={{background: d.color}} />
                      <span className="wc-preview-label">{d.label}</span>
                      <span className="wc-preview-value">{d.value}</span>
                    </div>
                  ))}
                </div>
              ) : systemPreviewData?.columns ? (
                <div style={{fontSize:10,color:'#666'}}>
                  <strong>Colunas:</strong> {systemPreviewData.columns.join(', ')}<br/>
                  <strong>Linhas:</strong> {systemPreviewData.rows?.length || 0}
                </div>
              ) : (
                <span style={{fontSize:10,color:'#999'}}>Dados disponíveis</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ MANUAL CHART DATA (with Formula Engine) ═══ */}
      {sourceType === 'MANUAL' && isChart && (
        <div className="wc-section">
          {/* Chart Type Selector */}
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <label className="wc-label" style={{marginBottom:0,flex:'none'}}>Tipo:</label>
            {(['PIE', 'BAR', 'LINE'] as const).map(t => (
              <button key={t} className={`wc-chip ${chartType === t ? 'active' : ''}`}
                onClick={() => setChartType(t)}>
                {t === 'PIE' ? '🥧 Pizza' : t === 'BAR' ? '📊 Barras' : '📈 Linhas'}
              </button>
            ))}
          </div>

          {/* ── Chart Formula Bar ── */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,padding:'4px 8px',background:'#f0f4f9',borderRadius:6,border:'1px solid #d0dbe8'}}>
            <span style={{fontSize:11,fontWeight:800,color:'#4472c4',flexShrink:0,fontStyle:'italic',width:20,textAlign:'center'}}>fx</span>
            <div style={{width:1,height:18,background:'#c0cfe0',flexShrink:0}} />
            {activeChartRow !== null ? (
              <>
                <span style={{fontSize:10,fontWeight:700,color:'#666',flexShrink:0,minWidth:22}}>V{activeChartRow + 1}</span>
                <input
                  style={{flex:1,border:'none',background:'transparent',fontSize:11,outline:'none',fontFamily:'monospace',color:'#333'}}
                  value={chartFormulas[activeChartRow] || String(chartData[activeChartRow]?.value ?? '')}
                  onChange={e => {
                    const val = e.target.value;
                    if (val.startsWith('=')) {
                      setChartFormulas(prev => ({ ...prev, [activeChartRow]: val }));
                      const result = evalChartFormula(val, activeChartRow);
                      if (!result.error) updateChartRow(activeChartRow, 'value', result.value);
                    } else {
                      setChartFormulas(prev => { const n = { ...prev }; delete n[activeChartRow]; return n; });
                      updateChartRow(activeChartRow, 'value', val);
                    }
                  }}
                  placeholder="Valor ou fórmula (ex: =SOMA(V1:V3), =V1+V2)"
                />
              </>
            ) : (
              <span style={{flex:1,fontSize:10,color:'#999',fontStyle:'italic'}}>
                Clique no campo Valor para editar • Use = para fórmulas (ref: V1, V2...)
              </span>
            )}
            <button
              onClick={() => setShowChartFormulaHelp(!showChartFormulaHelp)}
              style={{background:showChartFormulaHelp?'#4472c4':'none',color:showChartFormulaHelp?'#fff':'#4472c4',border:'1px solid #4472c4',borderRadius:4,fontSize:9,padding:'2px 6px',cursor:'pointer',fontWeight:700,flexShrink:0}}
              title="Ajuda de fórmulas"
            >?</button>
          </div>

          {/* ── Chart Formula Help ── */}
          {showChartFormulaHelp && (
            <div style={{background:'#f8faff',border:'1px solid #d0dbe8',borderRadius:6,padding:10,marginBottom:8,fontSize:10}}>
              <p style={{fontWeight:700,color:'#333',marginBottom:6,fontSize:11}}>🧮 Fórmulas no Gráfico</p>
              <p style={{color:'#666',marginBottom:6,lineHeight:1.5}}>
                No gráfico, referencie valores por <b>V1</b>, <b>V2</b>, etc (nº da linha).<br/>
                Intervalos: <b>V1:V5</b>. Separe argumentos com <b>;</b>
              </p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[
                  {ex: '=SOMA(V1:V3)', d: 'Soma'},
                  {ex: '=MEDIA(V1:V4)', d: 'Média'},
                  {ex: '=V1+V2', d: 'Soma simples'},
                  {ex: '=SUB(V1;V2)', d: 'Subtração'},
                  {ex: '=DIV(V1;V2)', d: 'Divisão'},
                  {ex: '=PCT(V1;V2)', d: 'Percentual'},
                ].map((h, i) => (
                  <span key={i} style={{fontSize:9,background:'#fff',border:'1px solid #dde5f0',borderRadius:4,padding:'2px 6px'}}>
                    <code style={{color:'#4472c4',fontWeight:700}}>{h.ex}</code> <span style={{color:'#999'}}>— {h.d}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Grid — with formula support in Value column */}
          <div className="wc-grid-header">
            <span style={{width:24}}></span>
            <span style={{flex:1,fontWeight:700}}>Rótulo (Eixo X)</span>
            <span style={{width:100,fontWeight:700,textAlign:'right'}}>Valor (Y) <span style={{fontSize:8,color:'#999',fontWeight:400}}>fx</span></span>
            <span style={{width:36,fontWeight:700,textAlign:'center'}}>Cor</span>
            <span style={{width:24}}></span>
          </div>
          <div className="wc-grid-body">
            {chartData.map((row, i) => {
              const formula = chartFormulas[i];
              const isFormula = !!formula && formula.startsWith('=');
              const isActive = activeChartRow === i;
              const evalResult = isFormula ? evalChartFormula(formula, i) : null;
              return (
                <div key={i} className="wc-grid-row" style={{background: isActive ? '#e8f0fe' : undefined}}>
                  <span className="wc-row-num">{i + 1}</span>
                  <input
                    className="wc-input"
                    value={row.label}
                    onChange={e => updateChartRow(i, 'label', e.target.value)}
                    placeholder="Rótulo..."
                    style={{flex:1}}
                  />
                  <div style={{width:100,position:'relative'}}>
                    {isFormula && !isActive && (
                      <span style={{position:'absolute',top:1,left:2,fontSize:7,color: evalResult?.error ? '#e74c3c' : '#4472c4',fontWeight:700,fontStyle:'italic',zIndex:1}}>fx</span>
                    )}
                    <input
                      className="wc-input wc-input-num"
                      value={isActive ? (formula || String(row.value)) : (isFormula ? String(row.value) : String(row.value))}
                      onChange={e => {
                        const val = e.target.value;
                        if (val.startsWith('=')) {
                          setChartFormulas(prev => ({ ...prev, [i]: val }));
                          const res = evalChartFormula(val, i);
                          if (!res.error) updateChartRow(i, 'value', res.value);
                        } else {
                          setChartFormulas(prev => { const n = { ...prev }; delete n[i]; return n; });
                          updateChartRow(i, 'value', val);
                        }
                      }}
                      onFocus={() => setActiveChartRow(i)}
                      title={isFormula ? `Fórmula: ${formula}` : undefined}
                      style={{
                        width:'100%',
                        fontFamily: isActive && isFormula ? 'monospace' : undefined,
                        fontWeight: isFormula && !isActive ? 700 : undefined,
                        color: evalResult?.error ? '#e74c3c' : isFormula && !isActive ? '#1a5276' : undefined,
                        fontSize: isActive && isFormula ? 10 : undefined,
                        background: isFormula && !isActive ? '#f0f8ff' : undefined,
                      }}
                    />
                  </div>
                  <input
                    type="color"
                    value={row.color}
                    onChange={e => updateChartRow(i, 'color', e.target.value)}
                    className="wc-color-picker"
                  />
                  <button onClick={() => {
                    removeChartRow(i);
                    setChartFormulas(prev => { const n = { ...prev }; delete n[i]; return n; });
                  }} className="wc-btn-icon" title="Remover">×</button>
                </div>
              );
            })}
          </div>

          {/* Computed formulas summary */}
          {Object.keys(chartFormulas).length > 0 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap',padding:'4px 0'}}>
              {Object.entries(chartFormulas).map(([idx, formula]) => {
                const i = Number(idx);
                const res = evalChartFormula(formula, i);
                return (
                  <span key={idx} style={{
                    fontSize:9, padding:'2px 6px', borderRadius:4,
                    background: res.error ? '#fee' : '#e8f4e8', color: res.error ? '#c0392b' : '#27ae60',
                    border: `1px solid ${res.error ? '#f5c6cb' : '#b7e4b7'}`, fontWeight:600,
                  }}>
                    V{i+1} = {res.error || res.value}
                  </span>
                );
              })}
            </div>
          )}

          <div className="wc-grid-footer">
            <button onClick={addChartRow} className="wc-btn wc-btn-add">+ Adicionar Linha</button>
            <div style={{display:'flex',gap:8}}>
              <label className="wc-checkbox"><input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} /> Legenda</label>
              <label className="wc-checkbox"><input type="checkbox" checked={showValues} onChange={e => setShowValues(e.target.checked)} /> Valores</label>
            </div>
          </div>

          {/* Mini Chart Preview */}
          {previewChartData.length > 0 && (
            <div className="wc-mini-preview">
              <span className="wc-label" style={{marginBottom:4,display:'block'}}>Preview:</span>
              <div style={{display:'flex',gap:4,alignItems:'flex-end',height:60}}>
                {previewChartData.map((d, i) => {
                  const max = Math.max(...previewChartData.map(p => p.value), 1);
                  const h = (d.value / max) * 50;
                  return (
                    <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                      <span style={{fontSize:8,color:'#666'}}>{d.value}</span>
                      <div style={{width:20,height:h,background:d.color,borderRadius:2,minHeight:2}} />
                      <span style={{fontSize:7,color:'#999',maxWidth:30,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ MANUAL TABLE DATA (with Formula Engine) ═══ */}
      {sourceType === 'MANUAL' && isTable && (
        <div className="wc-section">
          {/* Column Headers */}
          <div className="wc-tbl-cols">
            <span className="wc-label" style={{marginBottom:4}}>Colunas:</span>
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
              {tableColumns.map((col, i) => (
                <div key={i} className="wc-col-chip">
                  <input
                    className="wc-col-input"
                    value={col}
                    onChange={e => {
                      const newName = e.target.value;
                      const old = tableColumns[i];
                      setTableColumns(prev => prev.map((c, ci) => ci === i ? newName : c));
                      setTableRows(prev => prev.map(r => {
                        const nr = { ...r };
                        nr[newName] = nr[old] || '';
                        if (newName !== old) delete nr[old];
                        return nr;
                      }));
                    }}
                  />
                  {tableColumns.length > 1 && (
                    <button onClick={() => removeTableColumn(col)} className="wc-col-remove">×</button>
                  )}
                </div>
              ))}
              <button onClick={addTableColumn} className="wc-btn wc-btn-add" style={{fontSize:10,padding:'3px 8px'}}>+ Col</button>
            </div>
          </div>

          {/* ── Formula Bar ── */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8,padding:'4px 8px',background:'#f0f4f9',borderRadius:6,border:'1px solid #d0dbe8'}}>
            <span style={{fontSize:11,fontWeight:800,color:'#4472c4',flexShrink:0,fontStyle:'italic',width:20,textAlign:'center'}}>fx</span>
            <div style={{width:1,height:18,background:'#c0cfe0',flexShrink:0}} />
            {activeCell ? (
              <>
                <span style={{fontSize:10,fontWeight:700,color:'#666',flexShrink:0,minWidth:28}}>
                  {indexToColLetter(activeCell.col)}{activeCell.row + 1}
                </span>
                <input
                  style={{flex:1,border:'none',background:'transparent',fontSize:11,outline:'none',fontFamily:'monospace',color:'#333'}}
                  value={tableRows[activeCell.row]?.[tableColumns[activeCell.col]] || ''}
                  onChange={e => updateTableCell(activeCell.row, tableColumns[activeCell.col], e.target.value)}
                  placeholder="Valor ou fórmula (ex: =SOMA(A1:A5))"
                />
              </>
            ) : (
              <span style={{flex:1,fontSize:10,color:'#999',fontStyle:'italic'}}>Clique em uma célula para editar • Use = para fórmulas</span>
            )}
            <button
              onClick={() => setShowFormulaHelp(!showFormulaHelp)}
              style={{background:showFormulaHelp?'#4472c4':'none',color:showFormulaHelp?'#fff':'#4472c4',border:'1px solid #4472c4',borderRadius:4,fontSize:9,padding:'2px 6px',cursor:'pointer',fontWeight:700,flexShrink:0}}
              title="Ajuda de fórmulas"
            >?</button>
          </div>

          {/* ── Formula Help Panel ── */}
          {showFormulaHelp && (
            <div style={{background:'#f8faff',border:'1px solid #d0dbe8',borderRadius:6,padding:10,marginBottom:8,fontSize:10}}>
              <p style={{fontWeight:700,color:'#333',marginBottom:6,fontSize:11}}>🧮 Fórmulas Disponíveis</p>
              <p style={{color:'#666',marginBottom:8,lineHeight:1.5}}>
                Células são referenciadas por letra da coluna + nº da linha (ex: <b>A1</b>, <b>B3</b>).<br/>
                Intervalos usam <b>:</b> (ex: <b>A1:A5</b>). Separe argumentos com <b>;</b>
              </p>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                <thead>
                  <tr style={{background:'#e8eef6'}}>
                    <th style={{padding:'3px 6px',textAlign:'left',fontWeight:700}}>Função</th>
                    <th style={{padding:'3px 6px',textAlign:'left',fontWeight:700}}>Sintaxe</th>
                    <th style={{padding:'3px 6px',textAlign:'left',fontWeight:700}}>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {FORMULA_HELP.map((f, i) => (
                    <tr key={i} style={{background: i%2===0 ? '#fff' : '#f5f7fb'}}>
                      <td style={{padding:'3px 6px',fontWeight:700,color:'#4472c4'}}>{f.name}</td>
                      <td style={{padding:'3px 6px',fontFamily:'monospace',fontSize:9}}>{f.syntax}</td>
                      <td style={{padding:'3px 6px',color:'#666'}}>{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Body — Enhanced with formula support */}
          <div className="wc-tbl-grid" style={{overflowX:'auto'}}>
            <table className="wc-table">
              <thead>
                <tr>
                  <th style={{width:24}}>#</th>
                  {tableColumns.map((c, ci) => (
                    <th key={c} style={{position:'relative'}}>
                      <span style={{fontSize:8,color:'#999',position:'absolute',top:1,left:3,fontWeight:400}}>{indexToColLetter(ci)}</span>
                      {c}
                    </th>
                  ))}
                  <th style={{width:24}}></th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri}>
                    <td className="wc-row-num">{ri + 1}</td>
                    {tableColumns.map((c, ci) => {
                      const raw = row[c] || '';
                      const isFormula = raw.startsWith('=');
                      const cellKeyStr = `${ci},${ri}`;
                      const computed = computedCells.get(cellKeyStr);
                      const hasError = computed?.error;
                      const isActive = activeCell?.col === ci && activeCell?.row === ri;
                      return (
                        <td key={c} style={{position:'relative', background: isActive ? '#e8f0fe' : hasError ? '#fff0f0' : isFormula ? '#f0f8ff' : undefined}}>
                          {isFormula && !isActive && (
                            <span style={{position:'absolute',top:1,left:2,fontSize:8,color: hasError ? '#e74c3c' : '#4472c4',fontWeight:700,fontStyle:'italic'}}>fx</span>
                          )}
                          <input
                            className="wc-cell-input"
                            value={isActive ? raw : (isFormula ? getCellDisplay(ri, ci, raw) : raw)}
                            onChange={e => updateTableCell(ri, c, e.target.value)}
                            onFocus={() => setActiveCell({col: ci, row: ri})}
                            onBlur={() => { /* keep activeCell for formula bar */ }}
                            title={isFormula ? `Fórmula: ${raw}` : undefined}
                            style={{
                              fontFamily: isActive && isFormula ? 'monospace' : undefined,
                              fontWeight: isFormula && !isActive ? 700 : undefined,
                              color: hasError ? '#e74c3c' : isFormula && !isActive ? '#1a5276' : undefined,
                              fontSize: isActive && isFormula ? 10 : undefined,
                            }}
                          />
                        </td>
                      );
                    })}
                    <td><button onClick={() => removeTableRow(ri)} className="wc-btn-icon">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Computed Cells Summary */}
          {computedCells.size > 0 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap',padding:'4px 0',marginTop:4}}>
              {Array.from(computedCells.values()).map(cc => (
                <span key={`${cc.col},${cc.row}`} style={{
                  fontSize:9, padding:'2px 6px', borderRadius:4,
                  background: cc.error ? '#fee' : '#e8f4e8', color: cc.error ? '#c0392b' : '#27ae60',
                  border: `1px solid ${cc.error ? '#f5c6cb' : '#b7e4b7'}`, fontWeight:600,
                }}>
                  {indexToColLetter(cc.col)}{cc.row+1} = {cc.error ? `#ERR` : cc.displayValue}
                </span>
              ))}
            </div>
          )}

          <div className="wc-grid-footer">
            <button onClick={addTableRow} className="wc-btn wc-btn-add">+ Adicionar Linha</button>
          </div>

          {/* ═══ CHART DATA BINDING ═══ */}
          {tableColumns.length >= 2 && tableRows.length > 0 && (
            <div style={{marginTop:12,padding:12,background:'linear-gradient(135deg,#f8faff,#f0f4ff)',borderRadius:8,border:'1px solid #d0dbe8'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <span style={{fontSize:13}}>📊</span>
                <span style={{fontSize:11,fontWeight:800,color:'#333'}}>Usar como Dados do Gráfico</span>
              </div>
              <p style={{fontSize:10,color:'#666',margin:'0 0 10px',lineHeight:1.5}}>
                Selecione a coluna de rótulos e a coluna de valores (pode conter fórmulas calculadas) para gerar os dados do gráfico.
              </p>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:9,fontWeight:700,color:'#555',display:'block',marginBottom:3}}>Coluna Rótulos</label>
                  <select
                    value={chartBindLabelCol}
                    onChange={e => setChartBindLabelCol(Number(e.target.value))}
                    style={{width:'100%',padding:'4px 6px',fontSize:10,borderRadius:4,border:'1px solid #ccd'}}
                  >
                    {tableColumns.map((c, i) => <option key={i} value={i}>{indexToColLetter(i)}: {c}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:9,fontWeight:700,color:'#555',display:'block',marginBottom:3}}>Coluna Valores</label>
                  <select
                    value={chartBindValueCol}
                    onChange={e => setChartBindValueCol(Number(e.target.value))}
                    style={{width:'100%',padding:'4px 6px',fontSize:10,borderRadius:4,border:'1px solid #ccd'}}
                  >
                    {tableColumns.map((c, i) => <option key={i} value={i}>{indexToColLetter(i)}: {c}</option>)}
                  </select>
                </div>
              </div>
              {/* Preview */}
              {(() => {
                const preview = extractChartData(chartBindLabelCol, chartBindValueCol, tableColumns, tableRows, computedCells, CHART_COLORS);
                const validData = preview.filter(d => d.value > 0);
                if (!validData.length) return <p style={{fontSize:10,color:'#999',fontStyle:'italic',margin:0}}>Sem dados numéricos na coluna selecionada.</p>;
                const maxV = Math.max(...validData.map(d => d.value), 1);
                return (
                  <div>
                    <div style={{display:'flex',gap:4,alignItems:'flex-end',height:56,marginBottom:6}}>
                      {validData.map((d, i) => (
                        <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1,flex:1}}>
                          <span style={{fontSize:7,color:'#666',fontWeight:700}}>{d.value}</span>
                          <div style={{width:'100%',maxWidth:28,height: (d.value/maxV)*42, background:d.color, borderRadius:2, minHeight:2}} />
                          <span style={{fontSize:7,color:'#999',maxWidth:40,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>{d.label}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        const chartDataFromTable = extractChartData(chartBindLabelCol, chartBindValueCol, tableColumns, tableRows, computedCells, CHART_COLORS);
                        onUpdate({
                          chartData: chartDataFromTable,
                          serviceId: 'WIDGETS',
                          dataConfig: { ...widget.dataConfig!, sourceType: 'MANUAL', manualChartData: chartDataFromTable },
                        });
                      }}
                      className="wc-btn wc-btn-primary"
                      style={{width:'100%',fontSize:10,padding:'5px 0',marginTop:4}}
                    >📊 Aplicar como Gráfico</button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="wc-footer">
        <button onClick={handleSave} className="wc-btn wc-btn-primary" style={{flex:1}}>💾 Aplicar Dados</button>
        <button onClick={onClose} className="wc-btn" style={{flex:'none'}}>Cancelar</button>
      </div>
    </div>
  );
};

export default WidgetConfigurator;
