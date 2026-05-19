import React, { useState, useRef, useCallback, useMemo } from 'react';
import { StudentDraft, Nucleo, DocumentLog } from '../types';
import { ChartDataEditor as SharedChartDataEditor } from './ChartDataEditor';
import { ReportEditorToolbar } from './ReportEditorToolbar';

interface Props {
  students: StudentDraft[];
  nucleos: Nucleo[];
  onBack: () => void;
  headerImage?: string;
  projectName?: string;
  history?: DocumentLog[];
}

// Normalize name helper (inline to avoid circular dep)
const normName = (n: string) => n ? n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim() : '';

export const InscricaoReportBuilder: React.FC<Props> = ({
  students, nucleos, onBack, headerImage = '/header_completo.png', projectName = 'Escolinha de Triathlon', history = [],
}) => {
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(nucleos[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('2024-04-24');
  const [periodEnd, setPeriodEnd] = useState('2025-12-23');
  const [isEditing, setIsEditing] = useState(false);
  const [nSli, setNSli] = useState('2301005');
  const [aiResumo, setAiResumo] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- Draggable text box editing system ---
  type TextBlockLevel = 'h1' | 'h2' | 'h3' | 'body';
  interface TextBox { id: string; level: TextBlockLevel; content: string; fontFamily: string; fontSize: number; bold: boolean; italic: boolean; underline: boolean; x: number; y: number; w: number; h: number; pageIdx: number; }
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState<Omit<TextBox,'x'|'y'|'w'|'h'|'pageIdx'>>({ id: '', level: 'body', content: '', fontFamily: 'serif', fontSize: 11, bold: false, italic: false, underline: false });
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawState, setDrawState] = useState<{ pageEl: HTMLElement; pageIdx: number; startX: number; startY: number; curX: number; curY: number } | null>(null);
  const fontOptions = ['serif', 'sans-serif', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Inter', 'Roboto'];
  const levelLabels: Record<TextBlockLevel, string> = { h1: 'T\u00edtulo (H1)', h2: 'Subt\u00edtulo (H2)', h3: 'Se\u00e7\u00e3o (H3)', body: 'Corpo de texto' };
  const levelDefaults: Record<TextBlockLevel, { fontSize: number; bold: boolean }> = { h1: { fontSize: 18, bold: true }, h2: { fontSize: 14, bold: true }, h3: { fontSize: 12, bold: true }, body: { fontSize: 11, bold: false } };
  const customBlocks = textBoxes;
  const openEditBox = (b: TextBox) => { setEditingBlockId(b.id); setBlockForm({ id: b.id, level: b.level, content: b.content, fontFamily: b.fontFamily, fontSize: b.fontSize, bold: b.bold, italic: b.italic, underline: b.underline }); setShowBlockModal(true); };
  const saveBlock = () => { if (!blockForm.content.trim()) return; setTextBoxes(prev => prev.map(b => b.id === editingBlockId ? { ...b, ...blockForm } : b)); setShowBlockModal(false); setEditingBlockId(null); };
  const removeBox = (id: string) => { setTextBoxes(prev => prev.filter(b => b.id !== id)); };
  // Drag existing box
  const handleDragStart = (e: React.MouseEvent, id: string) => { const box = textBoxes.find(b => b.id === id); if (!box) return; e.preventDefault(); setDragState({ id, startX: e.clientX, startY: e.clientY, origX: box.x, origY: box.y }); };
  const handleDragMove = useCallback((e: MouseEvent) => { if (!dragState) return; const dx = e.clientX - dragState.startX; const dy = e.clientY - dragState.startY; setTextBoxes(prev => prev.map(b => b.id === dragState.id ? { ...b, x: Math.max(0, dragState.origX + dx), y: Math.max(0, dragState.origY + dy) } : b)); }, [dragState]);
  const handleDragEnd = useCallback(() => { setDragState(null); }, []);
  React.useEffect(() => { if (dragState) { window.addEventListener('mousemove', handleDragMove); window.addEventListener('mouseup', handleDragEnd); return () => { window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd); }; } }, [dragState, handleDragMove, handleDragEnd]);
  // Canvas draw: mousedown on page starts, mousemove updates preview, mouseup creates box
  const onDrawMouseDown = (e: React.MouseEvent) => { if (!drawMode || !isEditing) return; const pageEl = (e.target as HTMLElement).closest('.freq-page') as HTMLElement; if (!pageEl) return; const pages = reportRef.current?.querySelectorAll('.freq-page'); if (!pages) return; let pgIdx = -1; pages.forEach((p, i) => { if (p === pageEl) pgIdx = i; }); if (pgIdx < 0) return; const rect = pageEl.getBoundingClientRect(); const sx = e.clientX - rect.left; const sy = e.clientY - rect.top; setDrawState({ pageEl, pageIdx: pgIdx, startX: sx, startY: sy, curX: sx, curY: sy }); e.preventDefault(); };
  const onDrawMouseMove = useCallback((e: MouseEvent) => { if (!drawState) return; const rect = drawState.pageEl.getBoundingClientRect(); setDrawState(p => p ? { ...p, curX: e.clientX - rect.left, curY: e.clientY - rect.top } : null); }, [drawState]);
  const onDrawMouseUp = useCallback(() => { if (!drawState) return; const x = Math.min(drawState.startX, drawState.curX); const y = Math.min(drawState.startY, drawState.curY); const w = Math.abs(drawState.curX - drawState.startX); const h = Math.abs(drawState.curY - drawState.startY); if (w > 20 && h > 10) { const nb: TextBox = { id: `tb_${Date.now()}`, level: 'body', content: '', fontFamily: 'serif', fontSize: 11, bold: false, italic: false, underline: false, x, y, w, h, pageIdx: drawState.pageIdx }; setTextBoxes(prev => [...prev, nb]); } setDrawState(null); setDrawMode(false); }, [drawState]);
  React.useEffect(() => { if (drawState) { window.addEventListener('mousemove', onDrawMouseMove); window.addEventListener('mouseup', onDrawMouseUp); return () => { window.removeEventListener('mousemove', onDrawMouseMove); window.removeEventListener('mouseup', onDrawMouseUp); }; } }, [drawState, onDrawMouseMove, onDrawMouseUp]);

  const sel = nucleos.find(n => n.id === selectedNucleoId);
  const city = sel?.nome.split('|')[0]?.trim() || 'Núcleo';
  const rawSt = sel?.nome.split('|')[1]?.trim() || 'UF';
  const uf = rawSt.split(/[\s\-–]/)[0]?.trim() || 'UF';
  const year = new Date().getFullYear();
  const pName = projectName.toUpperCase();

  // Filter students by nucleo (includes students without nucleo assigned)
  const filtered = useMemo(() => {
    if (!selectedNucleoId) return students;
    return students.filter(s => s.nucleo_id === selectedNucleoId);
  }, [students, selectedNucleoId]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => a.nome.localeCompare(b.nome)), [filtered]);

  // Stats
  const totalAlunos = sorted.length;
  const publica = sorted.filter(s => s.escola_tipo === 'PUBLICA').length;
  const particular = sorted.filter(s => s.escola_tipo === 'PARTICULAR').length;
  const pctPublica = totalAlunos ? Math.round((publica / totalAlunos) * 100) : 0;
  const pctParticular = totalAlunos ? Math.round((particular / totalAlunos) * 100) : 0;

  // Age distribution
  const ages = useMemo(() => {
    const now = new Date();
    const groups: Record<string, number> = {};
    sorted.forEach(s => {
      if (!s.data_nascimento) return;
      const birth = new Date(s.data_nascimento);
      const age = Math.floor((now.getTime() - birth.getTime()) / 31557600000);
      groups[age.toString()] = (groups[age.toString()] || 0) + 1;
    });
    return groups;
  }, [sorted]);

  // Gender (infer from first name ending — much more reliable than surname)
  const genderStats = useMemo(() => {
    let m = 0, f = 0;
    sorted.forEach(s => {
      const first = s.nome.trim().split(' ')[0]?.toLowerCase() || '';
      if (first.endsWith('a') || first.endsWith('e')) f++; else m++;
    });
    return { masculino: m, feminino: f };
  }, [sorted]);

  // Detailed grade distribution (mapped from age to Brazilian school year)
  const autoGradeDistribution = useMemo(() => {
    const grades: Record<string, number> = {
      'ei': 0, '1ano': 0, '2ano': 0, '3ano': 0, '4ano': 0, '5ano': 0,
      '6ano': 0, '7ano': 0, '8ano': 0, '9ano': 0,
      'em1': 0, 'em2': 0, 'em3': 0,
    };
    const now = new Date();
    sorted.forEach(s => {
      if (!s.data_nascimento) { grades['ei']++; return; }
      const age = Math.floor((now.getTime() - new Date(s.data_nascimento).getTime()) / 31557600000);
      if (age <= 5) grades['ei']++;
      else if (age <= 6) grades['1ano']++;
      else if (age <= 7) grades['2ano']++;
      else if (age <= 8) grades['3ano']++;
      else if (age <= 9) grades['4ano']++;
      else if (age <= 10) grades['5ano']++;
      else if (age <= 11) grades['6ano']++;
      else if (age <= 12) grades['7ano']++;
      else if (age <= 13) grades['8ano']++;
      else if (age <= 14) grades['9ano']++;
      else if (age <= 15) grades['em1']++;
      else if (age <= 16) grades['em2']++;
      else grades['em3']++;
    });
    return grades;
  }, [sorted]);

  // --- Chart data override system ---
  const [gradeOverrides, setGradeOverrides] = useState<Record<string, number> | null>(null);
  const [redeOverrides, setRedeOverrides] = useState<{ publica: number; particular: number } | null>(null);
  const [genderOverrides, setGenderOverrides] = useState<{ masculino: number; feminino: number } | null>(null);
  const [ageOverrides, setAgeOverrides] = useState<Record<string, number> | null>(null);
  // Effective values: overrides > auto-computed
  const gradeDistribution = gradeOverrides || autoGradeDistribution;

  const effectivePublica = redeOverrides ? redeOverrides.publica : publica;
  const effectiveParticular = redeOverrides ? redeOverrides.particular : particular;
  const effectiveTotal = redeOverrides ? redeOverrides.publica + redeOverrides.particular : totalAlunos;
  const effectivePctPublica = effectiveTotal ? Math.round((effectivePublica / effectiveTotal) * 100) : 0;
  const effectivePctParticular = effectiveTotal ? Math.round((effectiveParticular / effectiveTotal) * 100) : 0;

  const effectiveGender = genderOverrides || genderStats;
  const effectiveAges = ageOverrides || ages;

  // Aggregated education levels from grade distribution
  const eduLevel = useMemo(() => {
    const g = gradeDistribution;
    return {
      fundI: g['1ano'] + g['2ano'] + g['3ano'] + g['4ano'] + g['5ano'],
      fundII: g['6ano'] + g['7ano'] + g['8ano'] + g['9ano'],
      medio: g['em1'] + g['em2'] + g['em3'],
      ei: g['ei'],
    };
  }, [gradeDistribution]);

  // --- ChartDataEditor: wrapper around shared component that passes isEditing ---
  const ChartDataEditor = ({ chartId, rows, onSave, title }: { chartId: string; rows: { key: string; label: string; value: number }[]; onSave: (data: Record<string, number>) => void; title: string }) => (
    <SharedChartDataEditor chartId={chartId} rows={rows} onSave={onSave} title={title} isEditing={isEditing} />
  );

  const handlePrint = useCallback(() => window.print(), []);

  const handleGenerateAI = useCallback(async () => {
    setIsGeneratingAI(true);
    try {
      setAiResumo(`O presente relatório apresenta a análise das fichas de inscrição e declarações de matrícula escolar dos alunos do projeto ${projectName}, no núcleo de ${city}/${uf}. Foram identificados ${totalAlunos} alunos matriculados, sendo ${publica} (${pctPublica}%) em escolas públicas e ${particular} (${pctParticular}%) em escolas particulares, atendendo à meta de 65% de participação de alunos do sistema público de ensino.`);
    } finally { setIsGeneratingAI(false); }
  }, [projectName, city, uf, totalAlunos, publica, particular, pctPublica, pctParticular]);

  // Simple bar renderer
  const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 120, fontSize: 10, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, background: '#eee', borderRadius: 4, height: 18 }}>
        <div style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color, borderRadius: 4, height: '100%', minWidth: value ? 20 : 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{value}</span>
        </div>
      </div>
    </div>
  );

  // Render draggable text boxes for a given page index
  const PageTextBoxes = ({ pageIdx }: { pageIdx: number }) => {
    const boxes = textBoxes.filter(b => b.pageIdx === pageIdx);
    return <>
      {/* Draw preview rectangle */}
      {drawState && drawState.pageIdx === pageIdx && (
        <div className="draw-preview" style={{ position: 'absolute', left: Math.min(drawState.startX, drawState.curX), top: Math.min(drawState.startY, drawState.curY), width: Math.abs(drawState.curX - drawState.startX), height: Math.abs(drawState.curY - drawState.startY), border: '2px dashed #4472C4', background: 'rgba(68,114,196,0.1)', borderRadius: 4, zIndex: 60, pointerEvents: 'none' }} />
      )}
      {boxes.map(box => (
        <div key={box.id} className="no-print-border" style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, minHeight: box.h || 30, zIndex: 50, border: isEditing ? '2px dashed #4472C4' : 'none', borderRadius: 4, background: isEditing ? 'rgba(68,114,196,0.05)' : 'transparent', cursor: dragState?.id === box.id ? 'grabbing' : 'default', userSelect: dragState ? 'none' : 'auto', pointerEvents: 'auto' }}>
          {isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#4472C4', color: '#fff', padding: '2px 6px', borderRadius: '4px 4px 0 0', fontSize: 9, cursor: 'grab' }} onMouseDown={e => { e.stopPropagation(); handleDragStart(e, box.id); }}>
              <span style={{ flex: 1 }}>☰ Arraste</span>
              <button onClick={e => { e.stopPropagation(); openEditBox(box); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: 9, cursor: 'pointer' }}>✏️</button>
              <button onClick={e => { e.stopPropagation(); removeBox(box.id); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 3, padding: '1px 6px', fontSize: 9, cursor: 'pointer' }}>✕</button>
            </div>
          )}
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ padding: isEditing ? 8 : 0, fontSize: box.fontSize, fontFamily: box.fontFamily, fontWeight: box.bold ? 700 : 400, fontStyle: box.italic ? 'italic' : 'normal', textDecoration: box.underline ? 'underline' : 'none', color: box.level === 'h1' || box.level === 'h2' ? '#4472C4' : '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap', outline: 'none', minHeight: 20 }}>
            {box.content || (isEditing ? 'Clique para digitar...' : '')}
          </div>
        </div>
      ))}
    </>;
  };

  return (
    <div className="freq-report-root">
      {/* TOOLBAR - FIXED at top */}
      <div className="freq-report-toolbar no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="freq-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Anexo Meta Quantitativa 02 — Ficha de Inscrição</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Relatório editável • {city}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={selectedNucleoId} onChange={e => setSelectedNucleoId(e.target.value)} className="freq-select">
            {nucleos.map(n => (<option key={n.id} value={n.id}>{n.nome.split('-')[0].trim()}{n.address ? ` - ${n.address}` : ''}</option>))}
          </select>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="freq-input-date" />
          <span style={{ fontSize: 12, color: '#999' }}>a</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="freq-input-date" />
          <input type="text" value={nSli} onChange={e => setNSli(e.target.value)} className="freq-input-sli" placeholder="Nº SLIE" />
          <button onClick={() => setIsEditing(!isEditing)} className={`freq-btn ${isEditing ? 'freq-btn-active' : ''}`}>{'✏️'} {isEditing ? 'Salvar' : 'Editar'}</button>
          <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="freq-btn freq-btn-ai">{isGeneratingAI ? <span className="freq-spinner"></span> : '🤖'} Gerar Resumo IA</button>
          <button onClick={handlePrint} className="freq-btn freq-btn-print">{'🖨️'} Exportar PDF</button>
        </div>
        {/* ═══ EDITOR TOOLBAR (inside fixed toolbar) ═══ */}
        <ReportEditorToolbar isEditing={isEditing} />
      </div>

      {/* MODAL: Inserir / Editar Bloco de Texto */}
      {showBlockModal && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowBlockModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: '90%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ background: '#4472C4', color: '#fff', padding: '16px 24px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{editingBlockId ? '✏️ Editar Bloco' : '＋ Novo Bloco de Texto'}</h3>
              <button onClick={() => setShowBlockModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            {/* Modal Body */}
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nível do título */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>Nível / Tipo</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(Object.keys(levelLabels) as TextBlockLevel[]).map(lv => (
                    <button key={lv} onClick={() => { const d = levelDefaults[lv]; setBlockForm(p => ({ ...p, level: lv, fontSize: d.fontSize, bold: d.bold })); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 6, border: blockForm.level === lv ? '2px solid #4472C4' : '1px solid #ddd', background: blockForm.level === lv ? '#EBF0FA' : '#fff', color: blockForm.level === lv ? '#4472C4' : '#666', fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>{levelLabels[lv]}</button>
                  ))}
                </div>
              </div>
              {/* Fonte e Tamanho */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>Fonte</label>
                  <select value={blockForm.fontFamily} onChange={e => setBlockForm(p => ({ ...p, fontFamily: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12, fontFamily: blockForm.fontFamily }}>
                    {fontOptions.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>Tamanho (px)</label>
                  <input type="number" min={8} max={36} value={blockForm.fontSize} onChange={e => setBlockForm(p => ({ ...p, fontSize: Number(e.target.value) }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }} />
                </div>
              </div>
              {/* Formatação */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>Formatação</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setBlockForm(p => ({ ...p, bold: !p.bold }))} style={{ padding: '6px 16px', borderRadius: 6, border: blockForm.bold ? '2px solid #4472C4' : '1px solid #ddd', background: blockForm.bold ? '#EBF0FA' : '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>B</button>
                  <button onClick={() => setBlockForm(p => ({ ...p, italic: !p.italic }))} style={{ padding: '6px 16px', borderRadius: 6, border: blockForm.italic ? '2px solid #4472C4' : '1px solid #ddd', background: blockForm.italic ? '#EBF0FA' : '#fff', fontStyle: 'italic', fontSize: 14, cursor: 'pointer' }}><i>I</i></button>
                  <button onClick={() => setBlockForm(p => ({ ...p, underline: !p.underline }))} style={{ padding: '6px 16px', borderRadius: 6, border: blockForm.underline ? '2px solid #4472C4' : '1px solid #ddd', background: blockForm.underline ? '#EBF0FA' : '#fff', textDecoration: 'underline', fontSize: 14, cursor: 'pointer' }}>U</button>
                </div>
              </div>
              {/* Conteúdo */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4, textTransform: 'uppercase' }}>Conteúdo</label>
                <textarea value={blockForm.content} onChange={e => setBlockForm(p => ({ ...p, content: e.target.value }))} placeholder="Digite o texto aqui..." rows={6} style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: blockForm.fontSize, fontFamily: blockForm.fontFamily, fontWeight: blockForm.bold ? 700 : 400, fontStyle: blockForm.italic ? 'italic' : 'normal', textDecoration: blockForm.underline ? 'underline' : 'none', resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              {/* Preview */}
              <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 6, padding: 16 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#999', marginBottom: 6, textTransform: 'uppercase' }}>Preview</label>
                <div style={{ fontSize: blockForm.fontSize, fontFamily: blockForm.fontFamily, fontWeight: blockForm.bold ? 700 : 400, fontStyle: blockForm.italic ? 'italic' : 'normal', textDecoration: blockForm.underline ? 'underline' : 'none', color: blockForm.level === 'h1' ? '#4472C4' : blockForm.level === 'h2' ? '#4472C4' : '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {blockForm.content || '(vazio)'}
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fafafa', borderRadius: '0 0 12px 12px' }}>
              <button onClick={() => setShowBlockModal(false)} style={{ padding: '10px 20px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#666', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveBlock} disabled={!blockForm.content.trim()} style={{ padding: '10px 24px', borderRadius: 6, border: 'none', background: blockForm.content.trim() ? '#4472C4' : '#ccc', color: '#fff', fontWeight: 700, fontSize: 12, cursor: blockForm.content.trim() ? 'pointer' : 'not-allowed' }}>{editingBlockId ? 'Salvar Alterações' : 'Adicionar Bloco'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Inject style for page positioning */}
      <style>{`
        .freq-page { position: relative !important; }
        .freq-report-content.draw-active .freq-page { cursor: crosshair !important; }
        .freq-report-content.draw-active .freq-page * { pointer-events: none; }
        .freq-report-content.draw-active .freq-page .draw-preview { pointer-events: none; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* REPORT */}
      <div ref={reportRef} className={`freq-report-content ${drawMode ? 'draw-active' : ''}`} onMouseDown={onDrawMouseDown}>

        {/* PAGE 0: COVER */}
        <div className="freq-page freq-cover-page">
          <PageTextBoxes pageIdx={0} />
          <div className="freq-cover-logos">
            <img src={headerImage} alt="Header" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className="freq-cover-block">
            <div className="freq-cover-inner">
              <div className="freq-cover-spacer" style={{ height: 60 }}></div>
              <h1 contentEditable={isEditing} suppressContentEditableWarning className="freq-cover-title">
                ANEXO META QUANTITATIVA 02 - FICHA DE<br/>INSCRIÇÃO DECLARAÇÃO DE MATRÍCULA ESCOLAR
              </h1>
            </div>
          </div>
          <div className="freq-cover-bottom" style={{ paddingBottom: 90 }}>
            <div className="freq-cover-bottom-project" contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 800, color: '#4472C4', marginBottom: 12 }}>
              {pName} {city.toUpperCase()}
            </div>
            <div className="freq-cover-bottom-citybox" contentEditable={isEditing} suppressContentEditableWarning>
              {city} | {uf}<br/>{year}
            </div>
            <div className="freq-cover-bottom-ref" contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 9, lineHeight: 1.6, textAlign: 'justify' as const, maxWidth: '60%' }}>
              RELATÓRIO BASEADO EM ANÁLISE DA FICHA DE INSCRIÇÃO E DECLARAÇÃO DA ESCOLA REGULAR DO ALUNO AO INICIAR NA {pName}
            </div>
          </div>
          <svg className="freq-cover-wave" viewBox="0 0 900 80" preserveAspectRatio="none">
            <path d="M0,40 C200,80 400,0 600,40 C700,60 800,30 900,50 L900,80 L0,80 Z" fill="#4a8c3f" opacity="0.7"/>
            <path d="M0,50 C150,20 350,70 550,40 C700,15 800,50 900,35 L900,80 L0,80 Z" fill="#2d6a2e" opacity="0.5"/>
          </svg>
        </div>

        {/* PAGE 2: CONTRACAPA */}
        <div className="freq-page freq-cover-page">
          <div className="freq-cover-logos">
            <img src={headerImage} alt="Header" style={{ width: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const }}>PROJETO {pName}</p>
          </div>
          <div style={{ margin: '120px auto', width: '85%', textAlign: 'center' }}>
            <h1 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 28, fontWeight: 900, color: '#4472C4', lineHeight: 1.3, textTransform: 'uppercase' as const }}>
              ANEXO META QUANTITATIVA 02<br/>FICHA DE INSCRIÇÃO E DECLARAÇÃO<br/>DE MATRÍCULA ESCOLAR
            </h1>
            <p style={{ color: '#666', fontSize: 11, marginTop: 12 }}>PROJETO {pName} {city.toUpperCase()}</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: 100 }}>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 700 }}>{city.toUpperCase()} | {uf}</p>
            <p style={{ fontSize: 14, color: '#4472C4', fontWeight: 700 }}>{year}</p>
          </div>
        </div>

        {/* PAGE 3: META DEFINITION */}
        <div className="freq-page" style={{ padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <PageTextBoxes pageIdx={1} />
          <hr style={{ border: '1px solid #333', marginBottom: 16 }}/>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const }}>ANEXO META QUANTITATIVA 02 FICHA DE INSCRIÇÃO DECLARAÇÃO DE MATRÍCULA ESCOLAR</p>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 700, margin: '8px 0 4px' }}>Meta Quantitativa 02:</h2>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, fontWeight: 700 }}>Meta:</p>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11 }}>Atender 65% dos beneficiados do projeto matriculados no sistema público de ensino.</p>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, fontWeight: 700, marginTop: 10 }}>Indicador:</p>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11 }}>Participação nos pólos de no mínimo 65% das vagas ofertadas de crianças e adolescentes serem de alunos matriculados no sistema público de ensino.</p>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, fontWeight: 700, marginTop: 10 }}>Instrumento de Verificação:</p>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11 }}>Ficha de inscrição do projeto com indicação de escola pública ou privada.</p>
          <hr style={{ border: '1px solid #333', marginTop: 16 }}/>
        </div>

        {/* STUDENT LIST TABLE (Moved before Sumário) */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={2} />

          {/* Header: Logo + Título */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #000', paddingBottom: 8 }}>
            <img src="/lei_do_incentivo.png" alt="Lei de Incentivo ao Esporte" style={{ width: 70, height: 'auto', marginRight: 16 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <h3 style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', flex: 1, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>RELAÇÃO DE ALUNOS COM INDICAÇÃO DE ESCOLA</h3>
          </div>

          {/* Info do Projeto */}
          <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px 6px', fontSize: 9 }}>
            <b>NOME DO PROJETO:</b> {' '} {pName} {' '} — N.º SLI: {' '} {nSli}
          </div>
          <div style={{ border: '1px solid #000', borderBottom: 'none', padding: '4px 6px', fontSize: 9 }}>
            <b>PROPONENTE:</b> {' '} {sel?.nome || ''}
          </div>

          {/* Tabela com bordas */}
          <table style={{ width: '100%', fontSize: 8, textAlign: 'left' as const, borderCollapse: 'collapse', border: '1px solid #000' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 3px', fontWeight: 700, borderRight: '1px solid #000', borderBottom: '1px solid #000', width: 22 }}>Nº</th>
                <th style={{ padding: '4px 3px', fontWeight: 700, borderRight: '1px solid #000', borderBottom: '1px solid #000', width: 60 }}>Evento/<br/>modalidade</th>
                <th style={{ padding: '4px 3px', fontWeight: 700, borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>Nome (ordem alfabética)</th>
                <th style={{ padding: '4px 3px', fontWeight: 700, borderRight: '1px solid #000', borderBottom: '1px solid #000', width: 75, textAlign: 'center' }}>Escola Pública ou<br/>Particular</th>
                <th style={{ padding: '4px 3px', fontWeight: 700, borderBottom: '1px solid #000' }}>Nome da Escola</th>
              </tr>
            </thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              {sorted.map((s, i) => (
                <tr key={s.id || i}>
                  <td style={{ padding: '3px', borderRight: '1px solid #000', borderBottom: '1px solid #ccc', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '3px', borderRight: '1px solid #000', borderBottom: '1px solid #ccc' }}>Triathlon</td>
                  <td style={{ padding: '3px', borderRight: '1px solid #000', borderBottom: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.nome}</td>
                  <td style={{ padding: '3px', borderRight: '1px solid #000', borderBottom: '1px solid #ccc', textAlign: 'center' }}>{s.escola_tipo === 'PUBLICA' ? 'Pública' : s.escola_tipo === 'PARTICULAR' ? 'Particular' : '—'}</td>
                  <td style={{ padding: '3px', borderBottom: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.escola_nome || '—'}</td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#999' }}>Nenhum aluno encontrado para este núcleo</td></tr>}
            </tbody>
          </table>

          {/* Rodapé oficial */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 9, borderTop: '1px solid #000', paddingTop: 8 }}>
            <span contentEditable={isEditing} suppressContentEditableWarning>LOCAL E DATA: {' '} {`${city}/${uf}`}, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span contentEditable={isEditing} suppressContentEditableWarning>NOME E ASSINATURA DO RESPONSÁVEL: {' '} _________________________</span>
          </div>
        </div>

                {/* PAGE 4: SUMÁRIO */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={3} />
          <h2 style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, marginBottom: 30, color: '#4472C4' }}>SUMÁRIO</h2>
          {(() => {
            const baseItems = [
              { n: '1', t: 'INTRODUÇÃO', p: 6 },
              { n: '2', t: 'DISTRIBUIÇÃO DOS ALUNOS MATRICULADOS NA ESCOLINHA DE TRIATHLON', p: 7 },
              { n: '2.1', t: 'Distribuição das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio', p: 7 },
              { n: '2.2', t: 'Distribuição das matrículas por Escola Pública e Escola Particular', p: 11 },
              { n: '2.3', t: 'Distribuição por gênero dos (as) alunos (as)', p: 13 },
              { n: '2.4', t: 'Distribuição etária dos alunos regularmente matriculados', p: 15 },
              { n: '3', t: 'RELAÇÃO DO NÚMERO DE CRIANÇAS E ADOLESCENTES ATENDIDAS', p: 17 },
              { n: '4', t: 'FICHA DE INSCRIÇÃO E DECLARAÇÃO ESCOLAR', p: 19 },
            ];
            // Add custom heading blocks to sumário
            const customHeadings = customBlocks.filter(b => b.level === 'h1' || b.level === 'h2').map((b, idx) => ({
              n: b.level === 'h1' ? `${5 + idx}` : `  •`,
              t: b.content.split('\n')[0].substring(0, 80),
              p: 20 + idx,
              isSub: b.level === 'h2'
            }));
            const allItems = [...baseItems.map(i => ({ ...i, isSub: i.n.includes('.') })), ...customHeadings, { n: '', t: 'REFERÊNCIAS', p: 20 + customHeadings.length, isSub: false }];
            return allItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8, fontSize: item.isSub ? 11 : 12, fontWeight: item.isSub ? 400 : 700, paddingLeft: item.isSub ? 40 : 0 }}>
                <span style={{ width: 40 }}>{item.n}</span>
                <span style={{ flex: 1 }}>{item.t}</span>
                <span style={{ borderBottom: '1px dotted #999', flex: 2 }}></span>
                <span style={{ width: 30, textAlign: 'right' }}>{item.p}</span>
              </div>
            ));
          })()}
        </div>

        {/* PAGE 6: INTRODUÇÃO */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={5} />
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: '#4472C4' }}>1. INTRODUÇÃO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            {(() => {
              // --- Compute all dynamic data from system ---
              const proponente = sorted[0]?.proponente || sel?.nome || 'Proponente';
              const startDate = periodStart ? new Date(periodStart) : new Date();
              const endDate = periodEnd ? new Date(periodEnd) : new Date();
              const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
              const monthsDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

              // Grade percentages
              const g = gradeDistribution;
              const t = totalAlunos || 1;
              const fundITotal = eduLevel.fundI;
              const fundIITotal = eduLevel.fundII;
              const medioTotal = eduLevel.medio;
              const pctFundI = Math.round((fundITotal / t) * 100);
              const pctFundII = Math.round((fundIITotal / t) * 100);
              const pctMedio = Math.round((medioTotal / t) * 100);

              // Find top grade in Fund II
              const fundIIGrades = [
                { name: '6º ano', val: g['6ano'] },
                { name: '7º ano', val: g['7ano'] },
                { name: '8º ano', val: g['8ano'] },
                { name: '9º ano', val: g['9ano'] },
              ].sort((a, b) => b.val - a.val);
              const topFundII = fundIIGrades[0];
              const pctTopFundII = Math.round((topFundII.val / t) * 100);

              // Find top grade in Fund I
              const fundIGrades = [
                { name: '1º ano', val: g['1ano'] },
                { name: '2º ano', val: g['2ano'] },
                { name: '3º ano', val: g['3ano'] },
                { name: '4º ano', val: g['4ano'] },
                { name: '5º ano', val: g['5ano'] },
              ].sort((a, b) => b.val - a.val);
              const topFundI = fundIGrades[0];
              const pctTopFundI = Math.round((topFundI.val / t) * 100);

              // Find top medio year
              const medioGrades = [
                { name: '1º ano', val: g['em1'] },
                { name: '2º ano', val: g['em2'] },
                { name: '3º ano', val: g['em3'] },
              ].sort((a, b) => b.val - a.val);
              const topMedio = medioGrades[0];

              // Gender
              const pctMasc = totalAlunos ? Math.round((effectiveGender.masculino / t) * 100) : 0;
              const pctFem = totalAlunos ? Math.round((effectiveGender.feminino / t) * 100) : 0;
              const genPredominante = pctMasc >= pctFem ? 'masculina' : 'feminina';
              const genOutro = pctMasc >= pctFem ? 'feminino' : 'masculino';
              const pctPredominante = Math.max(pctMasc, pctFem);
              const pctOutro = Math.min(pctMasc, pctFem);

              // Age range
              const ageKeys = Object.keys(effectiveAges).map(Number).filter(a => !isNaN(a)).sort((a, b) => a - b);
              const minAge = ageKeys[0] || 6;
              const maxAge = ageKeys[ageKeys.length - 1] || 17;

              // Age concentration (8-12)
              const ages8to12 = ageKeys.filter(a => a >= 8 && a <= 12).reduce((sum, a) => sum + (effectiveAges[a.toString()] || 0), 0);
              const pctAges8to12 = Math.round((ages8to12 / t) * 100);

              // Top 2 ages
              const ageEntries = Object.entries(effectiveAges).map(([a, c]) => ({ age: Number(a), count: c })).sort((a, b) => b.count - a.count);
              const topAge1 = ageEntries[0];
              const topAge2 = ageEntries[1];
              const pctTopAge1 = topAge1 ? Math.round((topAge1.count / t) * 100) : 0;
              const pctTopAge2 = topAge2 ? Math.round((topAge2.count / t) * 100) : 0;

              return (
                <>
                  <p style={{ marginBottom: 12 }}>
                    O presente relatório tem como objetivo apresentar o Anexo Meta Quantitativa 02 – Ficha de Inscrição / Declaração de Matrícula Escolar da {projectName}, executada pela {proponente} e viabilizada pela Lei de Incentivo ao Esporte, programa do Ministério do Esporte e Governo Federal, cujo projeto foi executado entre {fmtDate(startDate)} a {fmtDate(endDate)}.
                  </p>
                  <p style={{ marginBottom: 12 }}>
                    O perfil dos alunos do projeto "{projectName}", executado em {city} ({uf}), evidenciou que a iniciativa atendeu de forma consistente e alinhada ao objeto proposto crianças e adolescentes matriculados na rede oficial de ensino, ao longo de {monthsDiff} meses de execução.
                    {pctFundII > 0
                      ? ` A distribuição das matrículas demonstrou predomínio de estudantes do Ensino Fundamental II, que representaram ${pctFundII}% dos participantes, com destaque para o ${topFundII.name}, que concentrou ${pctTopFundII}% dos inscritos, indicando maior interesse e preparo físico de adolescentes para uma modalidade que exigiu resistência, coordenação, autonomia e disciplina.`
                      : ' O Ensino Fundamental II representou 0% das matrículas.'}
                    {pctFundI > 0
                      ? ` O Ensino Fundamental I correspondeu a ${pctFundI}% das matrículas, revelando adesão equilibrada entre as séries iniciais, com maior representatividade no ${topFundI.name}, que reuniu ${pctTopFundI}% dos alunos, o que demonstrou que o projeto também alcançou crianças mais novas, mesmo diante da complexidade técnica do triathlon.`
                      : ' O Ensino Fundamental I representou 0% das matrículas.'}
                    {pctMedio > 0
                      ? ` O Ensino Médio apresentou participação ${pctMedio <= 10 ? 'reduzida' : 'moderada'}, com ${pctMedio}% dos inscritos${topMedio.val > 0 ? `, concentrados no ${topMedio.name}` : ''}, cenário que esteve possivelmente relacionado à maior carga de estudos e à menor disponibilidade para atividades extracurriculares.`
                      : ' O Ensino Médio representou 0% das matrículas.'}
                  </p>
                  <p style={{ marginBottom: 12 }}>
                    Quanto à origem escolar,
                    {effectivePctPublica > 0 && effectivePctParticular > 0
                      ? ` a maioria dos alunos pertenceu à rede ${effectivePctPublica >= effectivePctParticular ? 'pública' : 'particular'} de ensino, que representou ${Math.max(effectivePctPublica, effectivePctParticular)}% do total de inscritos, enquanto a rede ${effectivePctPublica >= effectivePctParticular ? 'particular' : 'pública'} correspondeu a ${Math.min(effectivePctPublica, effectivePctParticular)}%, ${effectivePctPublica >= 65 ? 'superando a meta quantitativa mínima de 65% de atendimento ao público da rede pública e confirmando o cumprimento integral do indicador previsto' : 'aproximando-se da meta quantitativa mínima de 65% de atendimento ao público da rede pública'}.`
                      : effectivePctPublica > 0
                        ? ` 100% dos alunos pertenceram à rede pública de ensino, enquanto a rede particular representou 0%.`
                        : effectivePctParticular > 0
                          ? ` 100% dos alunos pertenceram à rede particular de ensino, enquanto a rede pública representou 0%.`
                          : ' não há dados disponíveis sobre a origem escolar.'}
                    {pctPredominante > 0 && pctOutro > 0
                      ? ` A distribuição por gênero revelou predominância ${genPredominante}, com ${pctPredominante}% dos participantes, enquanto o público ${genOutro} representou ${pctOutro}%, percentual expressivo que indicou inserção relevante em uma modalidade esportiva de endurance.`
                      : pctPredominante > 0
                        ? ` A distribuição por gênero indicou 100% de participação ${genPredominante}, enquanto o público ${genOutro} representou 0%.`
                        : ''}
                    {ageKeys.length > 0
                      ? <> Em relação à faixa etária, todos os alunos estiveram compreendidos entre {minAge} e {maxAge} anos, conforme estabelecido no objeto do projeto{pctAges8to12 > 0 ? `, com maior concentração entre 8 e 12 anos, que somaram ${pctAges8to12}% dos inscritos` : ''}{topAge1 && topAge2 && pctTopAge1 > 0 ? `, destacando-se as idades de ${topAge1.age} e ${topAge2.age} anos, com ${pctTopAge1}% e ${pctTopAge2}% respectivamente` : ''}.</>
                      : ''}
                    {' '}De forma geral, o perfil dos alunos confirmou que o projeto cumpriu plenamente suas metas e objetivos, consolidando-se como uma ação educacional bem-sucedida, com forte impacto entre estudantes do Ensino Fundamental, especialmente do Fundamental II, e ampla aderência ao público prioritário definido no planejamento.
                  </p>
                </>
              );
            })()}
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>6</div>
        </div>

        {/* PAGE 7: 2.1 Distribution Table - Detailed by Grade */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={6} />
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>2 DISTRIBUIÇÃO DAS ALUNAS MATRICULADAS NA {pName}</h2>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, fontWeight: 700, marginBottom: 10 }}>2.1 Distribuição das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio das alunas das escolas públicas e particulares participantes do projeto "{projectName}"</h3>
          <p style={{ fontSize: 9, textAlign: 'center', marginBottom: 8 }}>Tabela 1 — Nº de crianças/Adolescente por matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio</p>

          {(() => {
            const g = gradeDistribution;
            const t = totalAlunos || 1;
            const pct = (v: number) => t ? (v / t * 100).toFixed(2) + '%' : '0,00%';
            const fundITotal = eduLevel.fundI;
            const fundIITotal = eduLevel.fundII;
            const medioTotal = eduLevel.medio;
            const thStyle: React.CSSProperties = { padding: '4px 2px', border: '1px solid #999', textAlign: 'center', fontWeight: 700, fontSize: 7, background: '#4472C4', color: '#fff' };
            const thSub: React.CSSProperties = { ...thStyle, background: '#D6E4F0', color: '#000', writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)', height: 70, fontSize: 7, whiteSpace: 'nowrap' as const, padding: '4px 1px' };
            const thSubLong: React.CSSProperties = { ...thSub, whiteSpace: 'normal' as const, height: 70, width: 28, lineHeight: 1.1, wordBreak: 'break-word' as const };
            const tdS: React.CSSProperties = { padding: '3px 2px', border: '1px solid #ccc', textAlign: 'center', fontSize: 7 };
            const tdB: React.CSSProperties = { ...tdS, fontWeight: 700 };
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 7 }}>
                <thead>
                  <tr>
                    <th colSpan={16} style={thStyle}>Ensino</th>
                  </tr>
                  <tr>
                    <th rowSpan={2} style={thStyle}></th>
                    <th colSpan={9} style={thStyle}>Ensino fundamental</th>
                    <th colSpan={3} style={thStyle}>Ensino Médio</th>
                    <th colSpan={2} style={thStyle}>Escola</th>
                  </tr>
                  <tr>
                    <th colSpan={4} style={{...thStyle, background: '#B4C6E7'}}>Ensino fundamental I</th>
                    <th colSpan={5} style={{...thStyle, background: '#B4C6E7'}}>Ensino fundamental II</th>
                    <th colSpan={3} style={{...thStyle, background: '#B4C6E7'}}></th>
                    <th colSpan={2} style={{...thStyle, background: '#B4C6E7'}}></th>
                  </tr>
                  <tr>
                    <th style={thSubLong}>Ed. Infantil/ Classe Especial</th>
                    <th style={thSub}>1° ano</th>
                    <th style={thSub}>2° ano</th>
                    <th style={thSub}>3° ano</th>
                    <th style={thSub}>4° ano</th>
                    <th style={thSub}>5° ano</th>
                    <th style={thSub}>6° ano</th>
                    <th style={thSub}>7° ano</th>
                    <th style={thSub}>8° ano</th>
                    <th style={thSub}>9° ano</th>
                    <th style={thSub}>1° ano</th>
                    <th style={thSub}>2° ano</th>
                    <th style={thSub}>3° ano</th>
                    <th style={thSub}>Pública</th>
                    <th style={thSub}>Particular</th>
                  </tr>
                </thead>
                <tbody contentEditable={isEditing} suppressContentEditableWarning>
                  <tr>
                    <td style={tdS}>{g['ei']}</td>
                    <td style={tdS}>{g['1ano']}</td>
                    <td style={tdS}>{g['2ano']}</td>
                    <td style={tdS}>{g['3ano']}</td>
                    <td style={tdS}>{g['4ano']}</td>
                    <td style={tdS}>{g['5ano']}</td>
                    <td style={tdS}>{g['6ano']}</td>
                    <td style={tdS}>{g['7ano']}</td>
                    <td style={tdS}>{g['8ano']}</td>
                    <td style={tdS}>{g['9ano']}</td>
                    <td style={tdS}>{g['em1']}</td>
                    <td style={tdS}>{g['em2']}</td>
                    <td style={tdS}>{g['em3']}</td>
                    <td style={tdS}>{publica}</td>
                    <td style={tdS}>{particular}</td>
                  </tr>
                  <tr>
                    <td style={tdS}>{pct(g['ei'])}</td>
                    <td style={tdS}>{pct(g['1ano'])}</td>
                    <td style={tdS}>{pct(g['2ano'])}</td>
                    <td style={tdS}>{pct(g['3ano'])}</td>
                    <td style={tdS}>{pct(g['4ano'])}</td>
                    <td style={tdS}>{pct(g['5ano'])}</td>
                    <td style={tdS}>{pct(g['6ano'])}</td>
                    <td style={tdS}>{pct(g['7ano'])}</td>
                    <td style={tdS}>{pct(g['8ano'])}</td>
                    <td style={tdS}>{pct(g['9ano'])}</td>
                    <td style={tdS}>{pct(g['em1'])}</td>
                    <td style={tdS}>{pct(g['em2'])}</td>
                    <td style={tdS}>{pct(g['em3'])}</td>
                    <td style={tdS}>{effectivePctPublica}%</td>
                    <td style={tdS}>{effectivePctParticular}%</td>
                  </tr>
                  <tr style={{ background: '#E9EDF4' }}>
                    <td style={tdB}>{pct(g['ei'])}</td>
                    <td colSpan={4} style={tdB}>{totalAlunos ? (fundITotal / t * 100).toFixed(2) : '0,00'}%</td>
                    <td colSpan={5} style={tdB}>{totalAlunos ? (fundIITotal / t * 100).toFixed(2) : '0,00'}%</td>
                    <td colSpan={3} style={tdB}>{totalAlunos ? (medioTotal / t * 100).toFixed(2) : '0,00'}%</td>
                    <td colSpan={2} style={tdB}>100,00%</td>
                  </tr>
                </tbody>
              </table>
            );
          })()}
          <p style={{ fontSize: 7, marginTop: 4 }}>Fonte: {projectName} ({year}).</p>

          {(() => {
            const g = gradeDistribution;
            const t = totalAlunos || 1;
            const pctFundI = Math.round((eduLevel.fundI * 100) / t);
            const pctFundII = Math.round((eduLevel.fundII * 100) / t);
            const pctMedio = Math.round((eduLevel.medio * 100) / t);

            // Dates
            const startD = periodStart ? new Date(periodStart) : new Date();
            const endD = periodEnd ? new Date(periodEnd) : new Date();
            const fmtLong = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
            const totalMonths = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

            // Top grade Fund II
            const fundIIGrades = [
              { name: '6º ano', val: g['6ano'] },
              { name: '7º ano', val: g['7ano'] },
              { name: '8º ano', val: g['8ano'] },
              { name: '9º ano', val: g['9ano'] },
            ].sort((a, b) => b.val - a.val);
            const topFII = fundIIGrades[0];
            const pctTopFII = Math.round((topFII.val / t) * 100);

            // Other Fund II grades (not the top one)
            const otherFII = fundIIGrades.slice(1).filter(gr => gr.val > 0);
            const otherFIIRange = otherFII.length > 0
              ? `${Math.min(...otherFII.map(gr => Math.round((gr.val / t) * 100)))}% e ${Math.max(...otherFII.map(gr => Math.round((gr.val / t) * 100)))}%`
              : '';

            // Top grade Fund I
            const fundIGrades = [
              { name: '1º ano', val: g['1ano'] },
              { name: '2º ano', val: g['2ano'] },
              { name: '3º ano', val: g['3ano'] },
              { name: '4º ano', val: g['4ano'] },
              { name: '5º ano', val: g['5ano'] },
            ].sort((a, b) => b.val - a.val);
            const topFI = fundIGrades[0];
            const pctTopFI = Math.round((topFI.val / t) * 100);

            const adesaoFundI = eduLevel.fundI > eduLevel.fundII ? 'expressiva' : 'mais moderada, embora equilibrada entre as séries';

            // Médio detail
            const medioGrades = [
              { name: '1º ano', val: g['em1'] },
              { name: '2º ano', val: g['em2'] },
              { name: '3º ano', val: g['em3'] },
            ].sort((a, b) => b.val - a.val);
            const topMedio = medioGrades[0];

            const destaqueFinal = eduLevel.fundII >= eduLevel.fundI
              ? 'forte aceitação entre estudantes do Ensino Fundamental II'
              : 'forte aceitação entre estudantes do Ensino Fundamental I';
            const medioFinal = pctMedio <= 10 ? 'menor participação no Ensino Médio' : 'participação equilibrada no Ensino Médio';

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.7, textAlign: 'justify' as const, marginTop: 16 }}>
                <p>
                  O projeto {projectName}, executado em {city} ({uf}), teve início em {fmtLong(startD)} e seguiu até {fmtLong(endD)}, completando {totalMonths} meses de execução.
                </p>
                {pctFundII > 0
                  ? <p style={{ marginTop: 6 }}>
                      A análise da distribuição das matrículas ao longo desse período mostra que a maior participação ocorreu entre os estudantes do Ensino Fundamental II, especialmente no {topFII.name}, que concentrou {pctTopFII}% dos inscritos. Esse destaque indica que essa faixa etária demonstrou maior interesse e preparo físico para uma modalidade que exige resistência, coordenação e disciplina.
                    </p>
                  : <p style={{ marginTop: 6 }}>O Ensino Fundamental II representou 0% das matrículas.</p>}
                {pctFundI > 0
                  ? <p style={{ marginTop: 6 }}>
                      Nos anos iniciais do Ensino Fundamental I, a adesão foi {adesaoFundI}, somando {pctFundI}% dos participantes. O {topFI.name}, com {pctTopFI}%, foi o mais representativo desse grupo. Esse cenário sugere que, embora o projeto tenha alcançado crianças mais novas, a complexidade do triathlon tende a atrair mais alunos a partir de uma maturidade motora mais consolidada.
                    </p>
                  : <p style={{ marginTop: 6 }}>O Ensino Fundamental I representou 0% das matrículas.</p>}
                {pctFundII > 0 && otherFII.length > 0
                  ? <p style={{ marginTop: 6 }}>
                      No Ensino Fundamental II, além do pico no {topFII.name}, os demais anos — {otherFII.map(gr => gr.name).join(', ')} — mantiveram percentuais entre {otherFIIRange}, revelando uma participação consistente entre pré-adolescentes e adolescentes, faixa etária que costuma buscar desafios esportivos e atividades coletivas.
                    </p>
                  : null}
                {pctMedio > 0
                  ? <p style={{ marginTop: 6 }}>
                      Já no Ensino Médio, a presença foi reduzida, com apenas {pctMedio}% dos inscritos{topMedio.val > 0 ? ` no ${topMedio.name}` : ''}. Essa baixa adesão pode estar relacionada à rotina mais intensa de estudos e à menor disponibilidade de tempo para atividades extracurriculares.
                    </p>
                  : <p style={{ marginTop: 6 }}>O Ensino Médio representou 0% das matrículas.</p>}
                <p style={{ marginTop: 6 }}>
                  Ao longo dos {totalMonths} meses de execução, o projeto demonstrou {destaqueFinal} e {medioFinal}. Esses dados podem orientar futuras edições, caso desejado, permitindo ajustar estratégias de divulgação, horários e formatos das atividades para ampliar o alcance entre faixas etárias menos representadas.
                </p>
              </div>
            );
          })()}
        </div>

                {/* PAGE 8: Figura 1 - Pie Chart by Grade */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={7} />
          <p style={{ fontSize: 11, marginBottom: 4 }}><b>Figura 1</b> {"\u2014"} Distribuição, por série, das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das redes pública e particular inscritos no projeto "{projectName}" em {city} ({uf})</p>

          <div style={{ background: '#fff', border: '1px solid #000', padding: '16px 20px', marginTop: 12, position: 'relative' }}>
            <ChartDataEditor chartId="fig1_grades" title="Distribuição por Série" rows={[
              { key: '1ano', label: '1º Ano', value: gradeDistribution['1ano'] },
              { key: '2ano', label: '2º Ano', value: gradeDistribution['2ano'] },
              { key: '3ano', label: '3º Ano', value: gradeDistribution['3ano'] },
              { key: '4ano', label: '4º Ano', value: gradeDistribution['4ano'] },
              { key: '5ano', label: '5º Ano', value: gradeDistribution['5ano'] },
              { key: '6ano', label: '6º Ano', value: gradeDistribution['6ano'] },
              { key: '7ano', label: '7º Ano', value: gradeDistribution['7ano'] },
              { key: '8ano', label: '8º Ano', value: gradeDistribution['8ano'] },
              { key: '9ano', label: '9º Ano', value: gradeDistribution['9ano'] },
              { key: 'em1', label: 'EM 1º', value: gradeDistribution['em1'] },
              { key: 'em2', label: 'EM 2º', value: gradeDistribution['em2'] },
              { key: 'em3', label: 'EM 3º', value: gradeDistribution['em3'] },
            ]} onSave={data => setGradeOverrides({ ...autoGradeDistribution, ...data })} />
            <p style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 12, lineHeight: 1.4 }}>
              {`Distribuição por série das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das escolas públicas e particulares inscritos no projeto "${projectName}" em ${city} (${uf})`}
            </p>

            {(() => {
              const g = gradeDistribution;
              const t = totalAlunos || 1;
              const COLORS = ['#4472C4', '#ED7D31', '#C9C9C9', '#70AD47'];
              const allSlices = [
                { key: '1ano', label: '1\u00b0 ano E.F.I' },
                { key: '2ano', label: '2\u00b0 ano E.F.I' },
                { key: '3ano', label: '3\u00b0 ano E.F.I' },
                { key: '4ano', label: '4\u00b0 ano E.F.I' },
                { key: '5ano', label: '5\u00b0 ano E.F.I' },
                { key: '6ano', label: '6\u00b0 ano E.F.II' },
                { key: '7ano', label: '7\u00b0 ano E.F.II' },
                { key: '8ano', label: '8\u00b0 ano E.F.II' },
                { key: '9ano', label: '9\u00b0 ano E.F.II' },
                { key: 'em1', label: '1\u00b0 ano E.M.' },
                { key: 'em2', label: '2\u00b0 ano E.M.' },
                { key: 'em3', label: '3\u00b0 ano E.M.' },
              ];
              const slices = allSlices
                .map((s, idx) => ({ ...s, value: g[s.key], color: COLORS[idx % COLORS.length], pct: Math.round((g[s.key] * 100) / t) }))
                .filter(s => s.value > 0);

              const CX = 160; const CY = 125; const R = 95;
              let cumAngle = -90;
              const paths = slices.map((s) => {
                const pctE = (s.value * 100) / t;
                const angle = (pctE * 360) / 100;
                const startA = cumAngle;
                const endA = cumAngle + angle;
                const midA = startA + angle / 2;
                cumAngle = endA;

                const toRad = (a: number) => (a * Math.PI) / 180;
                const largeArc = angle > 180 ? 1 : 0;
                const x1 = CX + R * Math.cos(toRad(startA));
                const y1 = CY + R * Math.sin(toRad(startA));
                const x2 = CX + R * Math.cos(toRad(endA));
                const y2 = CY + R * Math.sin(toRad(endA));
                const labelR = R * 0.62;
                const lx = CX + labelR * Math.cos(toRad(midA));
                const ly = CY + labelR * Math.sin(toRad(midA));
                const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                return { ...s, d, lx, ly };
              });

              return (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width={320} height={270} viewBox="0 0 320 270">
                    {paths.map((p, i) => (
                      <path key={`s${i}`} d={p.d} fill={p.color} stroke="#fff" strokeWidth={1.5} />
                    ))}
                    {paths.map((p, i) => (
                      <g key={`l${i}`}>
                        <text x={p.lx} y={p.ly - 3} textAnchor="middle" fontSize={6.5} fill="#000" fontWeight={700}>{p.label}</text>
                        <text x={p.lx} y={p.ly + 8} textAnchor="middle" fontSize={8} fill="#000" fontWeight={800}>{p.pct}%</text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 18px', marginTop: 10 }}>
              {(() => {
                const g = gradeDistribution;
                const COLORS = ['#4472C4', '#ED7D31', '#C9C9C9', '#70AD47'];
                const items = [
                  { label: '1\u00b0 ano E.F.I', key: '1ano', idx: 0 }, { label: '2\u00b0 ano E.F.I', key: '2ano', idx: 1 },
                  { label: '3\u00b0 ano E.F.I', key: '3ano', idx: 2 }, { label: '4\u00b0 ano E.F.I', key: '4ano', idx: 3 },
                  { label: '5\u00b0 ano E.F.I', key: '5ano', idx: 4 }, { label: '6\u00b0 ano E.F.II', key: '6ano', idx: 5 },
                  { label: '7\u00b0 ano E.F.II', key: '7ano', idx: 6 }, { label: '8\u00b0 ano E.F.II', key: '8ano', idx: 7 },
                  { label: '9\u00b0 ano E.F.II', key: '9ano', idx: 8 }, { label: '1\u00b0 ano E.M.', key: 'em1', idx: 9 },
                  { label: '2\u00b0 ano E.M.', key: 'em2', idx: 10 }, { label: '3\u00b0 ano E.M.', key: 'em3', idx: 11 },
                ];
                return items.filter(it => g[it.key] > 0).map((it, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: COLORS[it.idx % COLORS.length], border: '1px solid #666' }}></span>
                    {it.label}
                  </span>
                ));
              })()}
            </div>
          </div>

          <p style={{ fontSize: 8, marginTop: 10 }}>Fonte: {projectName} ({year}).</p>
        </div>

        {/* PAGE 9: Bar Chart + Analysis */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={8} />
          <p style={{ fontSize: 11, marginBottom: 4 }}><b>Figura 2</b> — Distribuição das matrículas por Nível de Ensino (Números Absolutos) dos alunos do projeto "{projectName}" em {`${city}/${uf}`}</p>
          <p style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', marginBottom: 8, marginTop: 16 }}>Distribuição das matrículas (Números Absolutos)</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '12px 16px', marginTop: 8, position: 'relative' }}>
          <ChartDataEditor chartId="fig2_levels" title="Níveis de Ensino" rows={[
            { key: 'fundI', label: 'Fund. I', value: eduLevel.fundI },
            { key: 'fundII', label: 'Fund. II', value: eduLevel.fundII },
            { key: 'medio', label: 'Ens. Médio', value: eduLevel.medio },
          ]} onSave={data => {
            const prev = { ...gradeDistribution };
            // Distribute proportionally if needed - simple override
            setGradeOverrides({ ...prev });
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 40, height: 180, padding: '16px 40px 0', position: 'relative' }}>
            {[
              { label: 'Ensino Fundamental I', value: eduLevel.fundI, color: '#4472C4' },
              { label: 'Ensino Fundamental II', value: eduLevel.fundII, color: '#ED7D31' },
              { label: 'Ensino Médio', value: eduLevel.medio, color: '#A5A5A5' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }}>
                <span style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{item.value}</span>
                <div style={{ width: 50, background: item.color, height: `${Math.max(((item.value * 160) / (totalAlunos||1)), 8)}px`, borderRadius: '2px 2px 0 0' }}></div>
                <span style={{ fontSize: 8, marginTop: 6, textAlign: 'center' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, marginTop: 12 }}>
            <span><span style={{ color: '#4472C4' }}>■</span> Ensino Fundamental I</span>
            <span><span style={{ color: '#ED7D31' }}>■</span> Ensino Fundamental II</span>
            <span><span style={{ color: '#A5A5A5' }}>■</span> Ensino Médio</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 8 }}>Fonte: {projectName} ({year}).</p>
          </div>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <p>Observa-se que a maioria dos alunos matriculados ({Math.round((eduLevel.fundII * 100) / (totalAlunos||1))}%) cursam o Ensino Fundamental II, seguido de {Math.round((eduLevel.fundI * 100) / (totalAlunos||1))}% no Ensino Fundamental I.</p>
            <p style={{ marginTop: 8 }}>Estes dados evidenciam o alinhamento do projeto com o público-alvo prioritário das categorias de base.</p>
          </div>

          <p style={{ fontSize: 11, marginBottom: 4, marginTop: 24 }}><b>Figura 3</b> {"\u2014"} Distribuição das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das redes pública e particular inscritas no projeto "{projectName}" em {city} ({uf})</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 8, position: 'relative' }}>
            <ChartDataEditor chartId="fig3_levels" title="Distribuição por Nível" rows={[
              { key: 'fundI', label: 'Fund. I', value: eduLevel.fundI },
              { key: 'fundII', label: 'Fund. II', value: eduLevel.fundII },
              { key: 'medio', label: 'Ens. Médio', value: eduLevel.medio },
            ]} onSave={data => {
              const prev = { ...gradeDistribution };
              setGradeOverrides({ ...prev });
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 60, height: 170, padding: '16px 20px 0', position: 'relative' }}>
              {[
                { label: 'Fundamental I', value: eduLevel.fundI, color: '#4472C4', pct: ((eduLevel.fundI * 100) / (totalAlunos||1)).toFixed(2).replace('.', ',') },
                { label: 'Fundamental II', value: eduLevel.fundII, color: '#ED7D31', pct: ((eduLevel.fundII * 100) / (totalAlunos||1)).toFixed(2).replace('.', ',') },
                { label: 'Ensino Médio', value: eduLevel.medio, color: '#A5A5A5', pct: ((eduLevel.medio * 100) / (totalAlunos||1)).toFixed(2).replace('.', ',') },
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }}>
                  <div style={{ background: item.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', border: '1px solid #fff', marginBottom: 2 }}>{item.value}</div>
                  <div style={{ width: 45, background: item.color, height: `${Math.max(((item.value * 120) / (totalAlunos||1)), 10)}px`, border: '1px solid #333', borderBottom: 'none' }}></div>
                  <div style={{ background: '#ED7D31', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', border: '1px solid #fff', zIndex: 2, transform: 'translateY(2px)' }}>{item.pct}%</div>
                  <span style={{ fontSize: 9, marginTop: 8, textAlign: 'center', color: '#000' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 8, marginTop: 16 }}>Fonte: {projectName} ({year}).</p>
          </div>

          {/* Analysis text below Figura 3 */}
          {(() => {
            const t = totalAlunos || 1;
            const pctFII = Math.round((eduLevel.fundII * 100) / t);
            const pctFI = Math.round((eduLevel.fundI * 100) / t);
            const pctEM = Math.round((eduLevel.medio * 100) / t);
            const destaqueMaior = pctFII >= pctFI ? 'Ensino Fundamental II' : 'Ensino Fundamental I';
            const destaqueMenor = pctFII >= pctFI ? 'Ensino Fundamental I' : 'Ensino Fundamental II';
            const pctMaior = Math.max(pctFII, pctFI);
            const pctMenor = Math.min(pctFII, pctFI);

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.7, textAlign: 'justify' as const, marginTop: 16 }}>
                {pctMaior > 0
                  ? <p style={{ marginBottom: 8 }}>
                      A distribuição das matrículas no projeto "{projectName}" em {city} ({uf}) revelou um predomínio claro de estudantes do {destaqueMaior}, que representaram {pctMaior}% dos participantes. Esse resultado indicou que {pctFII >= pctFI ? 'adolescentes dos anos finais do ensino fundamental demonstraram maior interesse e disponibilidade para participar de uma modalidade esportiva que exigiu autonomia, resistência física e regularidade nos treinos' : 'crianças dos anos iniciais demonstraram maior interesse e adesão ao projeto, indicando boa aceitação entre famílias e escolas'}.
                    </p>
                  : <p style={{ marginBottom: 8 }}>O {destaqueMaior} representou 0% das matrículas.</p>}
                {pctMenor > 0
                  ? <p style={{ marginBottom: 8 }}>
                      O {destaqueMenor} apareceu como o segundo grupo mais representativo, com {pctMenor}% das matrículas. Esse percentual mostrou que o projeto também atraiu {pctFII >= pctFI ? 'crianças mais novas, o que sugeriu boa aceitação entre famílias e escolas, além de indicar que a proposta esportiva foi acessível e motivadora para essa faixa etária, mesmo diante das demandas motoras e de coordenação envolvidas no triathlon' : 'adolescentes dos anos finais, revelando interesse crescente à medida que a maturidade motora e a autonomia se consolidam'}.
                    </p>
                  : <p style={{ marginBottom: 8 }}>O {destaqueMenor} representou 0% das matrículas.</p>}
                {pctEM > 0
                  ? <p style={{ marginBottom: 8 }}>
                      Já o Ensino Médio registrou participação {pctEM <= 10 ? 'bastante reduzida' : 'moderada'}, com {pctEM}% dos inscritos. Esse cenário pode ter estado relacionado à rotina mais intensa de estudos, à preparação para vestibulares e ao menor tempo disponível para atividades extracurriculares, fatores comuns entre adolescentes dessa etapa escolar.
                    </p>
                  : <p style={{ marginBottom: 8 }}>O Ensino Médio representou 0% das matrículas.</p>}
                <p>
                  De forma geral, a distribuição evidenciou que o projeto teve maior impacto entre estudantes do Ensino Fundamental, especialmente no {destaqueMaior}, consolidando-se como uma iniciativa bem recebida por crianças e pré-adolescentes. Esses dados permitiram orientar reflexões sobre futuras ações, caso se desejasse ampliar o alcance entre alunos do Ensino Médio ou fortalecer ainda mais a participação nos anos iniciais.
                </p>
              </div>
            );
          })()}
        </div>

        {/* PAGE 10: 2.2 Pública vs Particular + Analysis */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.2 Distribuição das matrículas por Escola Pública e Escola Particular</h3>
          <p style={{ fontSize: 11, marginBottom: 4 }}><b>Figura 4</b> {"\u2014"} Distribuição por Rede de Ensino dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {`${city}/${uf}`}</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 8, position: 'relative' }}>
            <ChartDataEditor chartId="fig4_rede" title="Rede de Ensino" rows={[
              { key: 'publica', label: 'Escola Pública', value: effectivePublica },
              { key: 'particular', label: 'Escola Particular', value: effectiveParticular },
            ]} onSave={data => setRedeOverrides({ publica: data.publica || 0, particular: data.particular || 0 })} />
            <p style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 12 }}>
              {`Distribuição por Rede de Ensino em ${city}/${uf}`}
            </p>
            {(() => {
              const t = totalAlunos || 1;
              const slices = [
                { label: 'Escola Pública', value: effectivePublica, color: '#4472C4', pct: effectivePctPublica },
                { label: 'Escola Particular', value: effectiveParticular, color: '#ED7D31', pct: effectivePctParticular },
              ].filter(s => s.value > 0);
              const CX = 160; const CY = 110; const R = 85;
              let cumAngle = -90;
              const paths = slices.map((s) => {
                const angle = (s.pct * 360) / 100;
                const startA = cumAngle;
                const endA = cumAngle + angle;
                const midA = startA + angle / 2;
                cumAngle = endA;
                const toRad = (a: number) => (a * Math.PI) / 180;
                const largeArc = angle > 180 ? 1 : 0;
                const x1 = CX + R * Math.cos(toRad(startA));
                const y1 = CY + R * Math.sin(toRad(startA));
                const x2 = CX + R * Math.cos(toRad(endA));
                const y2 = CY + R * Math.sin(toRad(endA));
                const labelR = R * 0.55;
                const lx = CX + labelR * Math.cos(toRad(midA));
                const ly = CY + labelR * Math.sin(toRad(midA));
                const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                return { ...s, d, lx, ly };
              });
              return (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width={320} height={240} viewBox="0 0 320 240">
                    {paths.map((p, i) => (<path key={`s${i}`} d={p.d} fill={p.color} stroke="#fff" strokeWidth={1.5} />))}
                    {paths.map((p, i) => (
                      <g key={`l${i}`}>
                        <text x={p.lx} y={p.ly - 3} textAnchor="middle" fontSize={8} fill="#000" fontWeight={700}>{p.label}</text>
                        <text x={p.lx} y={p.ly + 10} textAnchor="middle" fontSize={10} fill="#000" fontWeight={800}>{p.pct}%</text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4472C4', border: '1px solid #666' }}></span> Escola Pública</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ED7D31', border: '1px solid #666' }}></span> Escola Particular</span>
            </div>
            <p style={{ fontSize: 8, marginTop: 8 }}>Fonte: {projectName} ({year}).</p>
          </div>
          {/* Analysis text below Figura 4 */}
          {(() => {
            const metaMin = 65;
            const diffMeta = effectivePctPublica - metaMin;
            const ageKeys = Object.keys(effectiveAges).map(Number).filter(a => !isNaN(a)).sort((a, b) => a - b);
            const minAge = ageKeys[0] || 8;
            const maxAge = ageKeys[ageKeys.length - 1] || 16;
            const metaCumprida = effectivePctPublica >= metaMin;
            const redeMaior = effectivePctPublica >= effectivePctParticular ? 'pública' : 'particular';
            const redeMenor = effectivePctPublica >= effectivePctParticular ? 'particular' : 'pública';
            const pctRedeMaior = Math.max(effectivePctPublica, effectivePctParticular);
            const pctRedeMenor = Math.min(effectivePctPublica, effectivePctParticular);

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
                {pctRedeMaior > 0 && pctRedeMenor > 0
                  ? <p style={{ marginBottom: 8 }}>
                      A distribuição dos alunos participantes do projeto "{projectName}" em {city} ({uf}) evidenciou que a maior parte dos beneficiados esteve matriculada na rede {redeMaior} de ensino, que representou {pctRedeMaior}% do total de inscritos, enquanto a rede {redeMenor} correspondeu a {pctRedeMenor}%. Esses resultados demonstraram que o projeto alcançou de forma efetiva o público-alvo definido em sua Meta Quantitativa, que estabeleceu atender no mínimo {metaMin}% de alunos provenientes do sistema público de ensino. {metaCumprida
                        ? `O indicador previsto — participação mínima de ${metaMin}% de crianças e adolescentes da rede pública — foi plenamente atendido, já que o percentual registrado superou a meta em ${diffMeta} pontos percentuais.`
                        : `O indicador previsto — participação mínima de ${metaMin}% de crianças e adolescentes da rede pública — ficou ${Math.abs(diffMeta)} pontos percentuais abaixo da meta.`} A verificação dessa informação ocorreu por meio das fichas de inscrição, nas quais cada participante informou sua vinculação escolar.
                    </p>
                  : pctRedeMaior > 0
                    ? <p style={{ marginBottom: 8 }}>
                        A totalidade dos alunos participantes (100%) pertenceu à rede {redeMaior} de ensino, enquanto a rede {redeMenor} representou 0%.
                      </p>
                    : <p style={{ marginBottom: 8 }}>Não há dados disponíveis sobre a distribuição por rede de ensino.</p>}
                <p style={{ marginBottom: 8 }}>
                  Além disso, o projeto cumpriu integralmente o objeto proposto, que previu a realização de aulas de triathlon (natação, ciclismo e corrida) para crianças e adolescentes de {minAge} a {maxAge} anos regularmente matriculados na rede oficial de ensino. Todos os participantes se enquadraram na faixa etária estabelecida, o que confirmou a aderência total ao público definido. A execução garantiu que as atividades esportivas fossem ofertadas exclusivamente a estudantes da rede oficial, conforme previsto no planejamento.
                </p>
                <p style={{ marginBottom: 8 }}>
                  Quanto ao estado de cumprimento das metas, o projeto alcançou plenamente os objetivos estabelecidos, tanto no que diz respeito ao perfil dos beneficiários quanto à proporção de alunos da rede pública. A execução demonstrou coerência com o propósito educacional da iniciativa, promovendo vivências esportivas estruturadas e integradas às práticas de formação cidadã.
                </p>
                <p style={{ marginBottom: 4, fontWeight: 700 }}>Entre os pontos positivos, destacaram-se:</p>
                <ul style={{ paddingLeft: 24, marginBottom: 8 }}>
                  <li>o atendimento integral ao público-alvo definido no objeto;</li>
                  <li>o {metaCumprida ? 'cumprimento e superação' : 'acompanhamento'} da meta de participação de alunos da rede pública;</li>
                  <li>a efetiva oferta de aulas nas três modalidades do triathlon, garantindo a natureza educacional e formativa do projeto;</li>
                  <li>a ampla adesão de crianças e adolescentes dentro da faixa etária prevista.</li>
                </ul>
                {pctRedeMenor > 0
                  ? <p style={{ marginBottom: 8 }}>
                      Como ponto negativo, observou-se apenas a menor participação de estudantes da rede {redeMenor}, o que, embora não tenha comprometido o cumprimento das metas, indicou uma adesão menos equilibrada entre os dois segmentos de ensino. Ainda assim, esse aspecto não afetou o desempenho global do projeto, que se manteve alinhado às diretrizes e objetivos estabelecidos.
                    </p>
                  : null}
                <p>
                  De modo geral, os dados confirmaram que o projeto cumpriu plenamente o objeto e atingiu as metas previstas, consolidando-se como uma ação educacional bem-sucedida e socialmente direcionada ao público prioritário.
                </p>
              </div>
            );
          })()}
        </div>

        {/* PAGE 11: 2.3 Gênero + Analysis */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.3 Distribuição por gênero dos (as) alunos (as)</h3>
          <p style={{ fontSize: 11, marginBottom: 4 }}><b>Figura 5</b> {"\u2014"} Distribuição por Gênero dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {`${city}/${uf}`}</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 8, position: 'relative' }}>
            <ChartDataEditor chartId="fig5_gender" title="Distribuição por Gênero" rows={[
              { key: 'masculino', label: 'Masculino', value: effectiveGender.masculino },
              { key: 'feminino', label: 'Feminino', value: effectiveGender.feminino },
            ]} onSave={data => setGenderOverrides({ masculino: data.masculino || 0, feminino: data.feminino || 0 })} />
            <p style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 12 }}>
              {`Distribuição por Gênero dos alunos do projeto "${projectName}" em ${city}/${uf}`}
            </p>
            {(() => {
              const t = totalAlunos || 1;
              const pctMasc = Math.round((effectiveGender.masculino * 100) / t);
              const pctFem = Math.round((effectiveGender.feminino * 100) / t);
              const slices = [
                { label: 'Masculino', value: effectiveGender.masculino, color: '#4472C4', pct: pctMasc },
                { label: 'Feminino', value: effectiveGender.feminino, color: '#ED7D31', pct: pctFem },
              ].filter(s => s.value > 0);
              const CX = 160; const CY = 110; const R = 85;
              let cumAngle = -90;
              const paths = slices.map((s) => {
                const angle = (s.pct * 360) / 100;
                const startA = cumAngle;
                const endA = cumAngle + angle;
                const midA = startA + angle / 2;
                cumAngle = endA;
                const toRad = (a: number) => (a * Math.PI) / 180;
                const largeArc = angle > 180 ? 1 : 0;
                const x1 = CX + R * Math.cos(toRad(startA));
                const y1 = CY + R * Math.sin(toRad(startA));
                const x2 = CX + R * Math.cos(toRad(endA));
                const y2 = CY + R * Math.sin(toRad(endA));
                const labelR = R * 0.55;
                const lx = CX + labelR * Math.cos(toRad(midA));
                const ly = CY + labelR * Math.sin(toRad(midA));
                const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                return { ...s, d, lx, ly };
              });
              return (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width={320} height={240} viewBox="0 0 320 240">
                    {paths.map((p, i) => (<path key={`s${i}`} d={p.d} fill={p.color} stroke="#fff" strokeWidth={1.5} />))}
                    {paths.map((p, i) => (
                      <g key={`l${i}`}>
                        <text x={p.lx} y={p.ly - 3} textAnchor="middle" fontSize={8} fill="#000" fontWeight={700}>{p.label}</text>
                        <text x={p.lx} y={p.ly + 10} textAnchor="middle" fontSize={10} fill="#000" fontWeight={800}>{p.pct}%</text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4472C4', border: '1px solid #666' }}></span> Masculino</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ED7D31', border: '1px solid #666' }}></span> Feminino</span>
            </div>
            <p style={{ fontSize: 8, marginTop: 8 }}>Fonte: {projectName} ({year}).</p>
          </div>
          {/* Analysis text below Figura 5 */}
          {(() => {
            const t = totalAlunos || 1;
            const pctMasc = Math.round((effectiveGender.masculino * 100) / t);
            const pctFem = Math.round((effectiveGender.feminino * 100) / t);
            const genMaior = pctMasc >= pctFem ? 'masculino' : 'feminino';
            const genMenor = pctMasc >= pctFem ? 'feminino' : 'masculino';
            const genMaiorLabel = pctMasc >= pctFem ? 'meninos' : 'meninas';
            const genMenorLabel = pctMasc >= pctFem ? 'meninas' : 'meninos';
            const pctGenMaior = Math.max(pctMasc, pctFem);
            const pctGenMenor = Math.min(pctMasc, pctFem);

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
                {pctGenMaior > 0 && pctGenMenor > 0
                  ? <>
                      <p style={{ marginBottom: 8 }}>
                        A distribuição por gênero dos alunos participantes do projeto "{projectName}" em {city} ({uf}) evidenciou uma predominância do público {genMaior}, que correspondeu a {pctGenMaior}% dos inscritos. Esse resultado indicou que {genMaiorLabel === 'meninos' ? 'os meninos aderiram em maior número às atividades propostas, possivelmente por maior identificação inicial com modalidades esportivas de endurance ou por maior estímulo à participação em práticas esportivas competitivas' : 'as meninas aderiram em maior número às atividades propostas, demonstrando crescente interesse por modalidades esportivas de endurance e práticas esportivas diversificadas'}.
                      </p>
                      <p style={{ marginBottom: 8 }}>
                        O público {genMenor}, por sua vez, representou {pctGenMenor}% das matrículas, demonstrando que o projeto também atraiu de forma significativa {genMenorLabel} interessad{genMenor === 'feminino' ? 'a' : 'o'}s em vivências esportivas diversificadas. Esse percentual mostrou que, embora a participação {genMenor === 'feminino' ? 'feminina' : 'masculina'} tenha sido menor, ela foi expressiva e refletiu um movimento importante de inserção {genMenor === 'feminino' ? 'das meninas' : 'dos meninos'} em modalidades {genMenor === 'feminino' ? 'tradicionalmente mais frequentadas por meninos' : 'com crescente participação feminina'}.
                      </p>
                    </>
                  : pctGenMaior > 0
                    ? <p style={{ marginBottom: 8 }}>
                        A totalidade dos alunos participantes (100%) correspondeu ao público {genMaior}, enquanto o público {genMenor} representou 0%.
                      </p>
                    : null}
                <p>
                  De modo geral, os dados revelaram que o projeto conseguiu alcançar ambos os gêneros{pctGenMaior > 0 && pctGenMenor > 0 ? `, ainda que com maior participação ${genMaior === 'masculino' ? 'masculina' : 'feminina'}` : ''}. Essa distribuição permitiu observar tendências de engajamento e contribuiu para orientar estratégias futuras voltadas ao incentivo da participação {genMenor === 'feminino' ? 'feminina' : 'masculina'}, caso se desejasse promover maior equilíbrio entre os públicos.
                </p>
              </div>
            );
          })()}
        </div>

        {/* PAGE 12: 2.4 Idade + Analysis */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.4 Distribuição etária dos alunos regularmente matriculados</h3>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figuras 6 e 7</b> {"\u2014"} Distribuição etária dos alunos regularmente matriculados no projeto "{projectName}" em {city} ({uf})</p>

          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 12, position: 'relative' }}>
            <ChartDataEditor chartId="fig67_age" title="Distribuição Etária" rows={
              Object.entries(effectiveAges).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([age, count]) => ({ key: age, label: `${age} anos`, value: count }))
            } onSave={data => setAgeOverrides(data)} />
            <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 16 }}>
              {`Distribuição etária dos alunos regularmente inscritos no projeto "${projectName}" em ${city} (${uf})`}
            </p>

            {(() => {
              const entries = Object.entries(effectiveAges).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
              const t = totalAlunos || 1;
              const COLORS = ['#4472C4', '#ED7D31', '#C9C9C9', '#70AD47', '#5B9BD5', '#FFC000', '#264478', '#43682B', '#B4C6E7', '#F4B183', '#D9D9D9'];
              
              // Map to chart slice format
              const slices = entries.map(([age, count], idx) => ({
                label: `${age} anos`,
                value: count,
                color: COLORS[idx % COLORS.length],
                pct: Math.round((count * 100) / t)
              })).filter(s => s.value > 0);

              // 1. Pie Chart (Figura 6 equivalent)
              const CX = 160; const CY = 100; const R = 80;
              let cumAngle = -90;
              const paths = slices.map((s) => {
                const angle = (s.pct * 360) / 100;
                const startA = cumAngle;
                const endA = cumAngle + angle;
                const midA = startA + angle / 2;
                cumAngle = endA;
                const toRad = (a: number) => (a * Math.PI) / 180;
                const largeArc = angle > 180 ? 1 : 0;
                const x1 = CX + R * Math.cos(toRad(startA));
                const y1 = CY + R * Math.sin(toRad(startA));
                const x2 = CX + R * Math.cos(toRad(endA));
                const y2 = CY + R * Math.sin(toRad(endA));
                const labelR = R * 0.65;
                const lx = CX + labelR * Math.cos(toRad(midA));
                const ly = CY + labelR * Math.sin(toRad(midA));
                const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                return { ...s, d, lx, ly };
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Pie Chart Section */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <svg width={320} height={200} viewBox="0 0 320 200">
                        {paths.map((p, i) => (<path key={`s${i}`} d={p.d} fill={p.color} stroke="#fff" strokeWidth={1} />))}
                        {paths.map((p, i) => (
                          <g key={`l${i}`}>
                            <text x={p.lx} y={p.ly - 2} textAnchor="middle" fontSize={6} fill="#000" fontWeight={700}>{p.label}</text>
                            <text x={p.lx} y={p.ly + 6} textAnchor="middle" fontSize={7} fill="#000" fontWeight={800}>{p.pct}%</text>
                          </g>
                        ))}
                      </svg>
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 12px', marginTop: 10 }}>
                      {slices.map((it, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 8 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, background: it.color, border: '1px solid #666' }}></span>
                          {it.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px dashed #ccc' }} />

                  {/* Column Chart Section (Figura 7 equivalent) */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 16 }}>
                      {`DISTRIBUIÇÃO ETÁRIA DOS ALUNOS REGULARMENTE INSCRITOS NO PROJETO "${projectName}" EM ${city} (${uf})`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, height: 160, padding: '16px 10px 0', position: 'relative' }}>
                      {slices.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 40 }}>
                          <div style={{ background: item.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 4px', border: '1px solid #fff', marginBottom: 2 }}>{item.value}</div>
                          <div style={{ width: '100%', background: item.color, height: `${Math.max(((item.value * 120) / (Math.max(...slices.map(s => s.value)) || 1)), 10)}px`, border: '1px solid #333', borderBottom: 'none' }}></div>
                          <span style={{ fontSize: 8, marginTop: 6, textAlign: 'center', color: '#000' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <p style={{ fontSize: 8, marginTop: 16 }}>Fonte: {projectName} ({year}).</p>
          </div>

          {/* Analysis text below Figuras 6 e 7 */}
          {(() => {
            const t = totalAlunos || 1;
            const ageKeys = Object.keys(effectiveAges).map(Number).filter(a => !isNaN(a)).sort((a, b) => a - b);
            const minAge = ageKeys[0] || 8;
            const maxAge = ageKeys[ageKeys.length - 1] || 16;

            // Concentration 8-12
            const ages8to12 = ageKeys.filter(a => a >= 8 && a <= 12).reduce((sum, a) => sum + (effectiveAges[a.toString()] || 0), 0);
            const pctAges8to12 = Math.round((ages8to12 / t) * 100);

            // Top ages sorted by count
            const ageEntries = Object.entries(effectiveAges)
              .map(([a, c]) => ({ age: Number(a), count: c, pct: Math.round((c / t) * 100) }))
              .sort((a, b) => b.count - a.count);

            // Build top ages description (top 4)
            const topAges = ageEntries.slice(0, 4);
            const topAgesText = topAges.length > 0
              ? topAges.map((a, i) => `${i === 0 ? 'As idades de' : ''} ${a.age} anos${i < topAges.length - 1 ? '' : ''} (${a.pct}%)`).join(', ').replace('As idades de ', '')
              : '';

            // Older teens (14-16)
            const olderTeens = ageKeys.filter(a => a >= 14 && a <= 16).reduce((sum, a) => sum + (effectiveAges[a.toString()] || 0), 0);
            const pctOlderTeens = Math.round((olderTeens / t) * 100);

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
                <p style={{ marginBottom: 8 }}>
                  A distribuição etária dos alunos inscritos no projeto "{projectName}" em {city} ({uf}) comprovou que o público atendido esteve totalmente alinhado ao objeto do projeto, que previu a realização de aulas de triathlon — natação, ciclismo e corrida — para crianças e adolescentes de {minAge} a {maxAge} anos matriculados na rede oficial de ensino. Todos os participantes se enquadraram na faixa etária estabelecida, o que confirmou o cumprimento integral desse requisito.
                </p>
                {pctAges8to12 > 0
                  ? <p style={{ marginBottom: 8 }}>
                      Os dados etários mostraram uma maior concentração de alunos entre 8 e 12 anos, que representaram {pctAges8to12}% dos inscritos.{topAges.length >= 2 ? ` As idades de ${topAges[0].age} e ${topAges[1].age} anos foram as mais expressivas, cada uma com ${topAges[0].pct}% e ${topAges[1].pct}% do total${topAges.length >= 3 ? `, seguidas por ${topAges[2].age} anos (${topAges[2].pct}%)` : ''}${topAges.length >= 4 ? ` e ${topAges[3].age} anos (${topAges[3].pct}%)` : ''}.` : ''}{pctOlderTeens > 0 ? ` Já as faixas de 14 a 16 anos somaram ${pctOlderTeens}%, indicando que o projeto também alcançou adolescentes mais velhos, ainda que em menor proporção.` : ''}
                    </p>
                  : <p style={{ marginBottom: 8 }}>A faixa de 8 a 12 anos representou 0% dos inscritos.</p>}
                <p style={{ marginBottom: 8 }}>
                  Quanto ao estado de cumprimento das metas, o projeto atendeu plenamente ao perfil previsto, tanto em relação à idade quanto à condição de matrícula na rede oficial de ensino. A execução garantiu que todas as vagas fossem ocupadas por crianças e adolescentes dentro dos critérios estabelecidos, o que reforçou a aderência ao planejamento inicial.
                </p>
                <p style={{ marginBottom: 4, fontWeight: 700 }}>Entre os pontos positivos, destacaram-se:</p>
                <ul style={{ paddingLeft: 24, marginBottom: 8 }}>
                  <li>o cumprimento integral do objeto, com atendimento exclusivo à faixa etária prevista;</li>
                  <li>a forte participação de crianças mais novas, que demonstraram grande interesse pelas atividades;</li>
                  <li>a diversidade etária, que permitiu integrar diferentes níveis de desenvolvimento físico e social.</li>
                </ul>
                {pctOlderTeens > 0 && pctOlderTeens < 30
                  ? <p style={{ marginBottom: 8 }}>
                      Como ponto negativo, observou-se a menor participação de adolescentes de 14 a {maxAge} anos, o que indicou a necessidade de estratégias específicas para atrair esse público, que costuma enfrentar maior carga escolar e menor disponibilidade de tempo.
                    </p>
                  : pctOlderTeens === 0
                    ? <p style={{ marginBottom: 8 }}>
                        Não houve participação de adolescentes na faixa de 14 a 16 anos, representando 0% dos inscritos.
                      </p>
                    : null}
                <p>
                  De modo geral, a execução cumpriu o objeto e alcançou as metas previstas, consolidando o projeto como uma ação educacional bem-sucedida, coerente com seus objetivos e capaz de promover a prática esportiva entre crianças e adolescentes da rede oficial de ensino.
                </p>
              </div>
            );
          })()}
        </div>

        {/* PAGE 17: RELAÇÃO DOS ALUNOS */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <PageTextBoxes pageIdx={11} />
          <h3 style={{ fontSize: 11, fontWeight: 800, textAlign: 'center', marginBottom: 16, textTransform: 'uppercase' as const }}>3 RELAÇÃO DO NÚMERO DE CRIANÇAS E ADOLESCENTES ATENDIDAS PELA {pName} EM ORDEM ALFABÉTICA</h3>
          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              {/* ROW 1: Group headers */}
              <tr style={{ background: '#4472C4', color: '#000', fontWeight: 800 }}>
                <th rowSpan={3} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', width: 65 }}>Núcleo</th>
                <th colSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', textAlign: 'center' }}>Gênero</th>
                <th rowSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const, width: 22, textAlign: 'center' }}>Número de alunos</th>
                <th rowSpan={3} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom' }}>Nome (ordem alfabética)</th>
                <th rowSpan={3} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', textAlign: 'center', width: 35 }}>Idade</th>
                <th colSpan={1} style={{ padding: '4px 2px', border: '1px solid #fff', textAlign: 'center' }}>Ensino Fundamental I, Ensino<br/>Fundamental II e Ensino Médio</th>
                <th colSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', textAlign: 'center' }}>Escola</th>
              </tr>
              {/* ROW 2: Sub-headers */}
              <tr style={{ background: '#4472C4', color: '#000', fontWeight: 800 }}>
                <th rowSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const, width: 22, textAlign: 'center' }}>Masculino</th>
                <th rowSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const, width: 22, textAlign: 'center' }}>Feminino</th>
                <th rowSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', textAlign: 'center' }}>Ensino</th>
                <th rowSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const, width: 22, textAlign: 'center' }}>Pública</th>
                <th rowSpan={2} style={{ padding: '4px 2px', border: '1px solid #fff', verticalAlign: 'bottom', writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const, width: 22, textAlign: 'center' }}>Particular</th>
              </tr>
              {/* ROW 3: empty row to complete rowSpans */}
              <tr style={{ background: '#4472C4', color: '#000', fontWeight: 800 }}>
                {/* Número de alunos */}
                <th style={{ padding: '2px', border: '1px solid #fff', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody contentEditable={isEditing} suppressContentEditableWarning>
              {sorted.map((s, i) => {
                // Calculate age
                let age = '';
                if (s.data_nascimento) {
                  const ms = new Date().getTime() - new Date(s.data_nascimento).getTime();
                  age = Math.floor(ms / 31557600000).toString();
                }
                // Get socioeconomic data for gender and school grade
                const socioDoc = history.filter(d => d.type === 'INDICADORES_SAUDE').find(d => normName(d.metaData?.nome || '') === normName(s.nome));
                const genero = socioDoc?.metaData?.genero || '';
                const escolaridade = socioDoc?.metaData?.escolaridade || '';
                const isMasc = genero.toUpperCase().startsWith('M') || (!genero && !(s.nome.trim().split(' ')[0]?.toLowerCase() || '').endsWith('a'));
                const isFem = genero.toUpperCase().startsWith('F') || (!genero && (s.nome.trim().split(' ')[0]?.toLowerCase() || '').endsWith('a'));
                const isPub = s.escola_tipo === 'PUBLICA';
                const isPart = s.escola_tipo === 'PARTICULAR';

                return (
                  <tr key={s.id || i} style={{ background: i % 2 === 0 ? '#D6E4F0' : '#fff' }}>
                    <td style={{ padding: '4px 3px', border: '1px solid #ccc', fontSize: 7 }}>{`${city}/${uf}`}</td>
                    <td style={{ padding: '4px 1px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{isMasc ? 'X' : ''}</td>
                    <td style={{ padding: '4px 1px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{isFem ? 'X' : ''}</td>
                    <td style={{ padding: '4px 1px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '4px 3px', border: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.nome}</td>
                    <td style={{ padding: '4px 2px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{age}</td>
                    <td style={{ padding: '4px 3px', border: '1px solid #ccc', textAlign: 'center', fontSize: 7 }} contentEditable={isEditing} suppressContentEditableWarning>{escolaridade || '—'}</td>
                    <td style={{ padding: '4px 1px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{isPub ? 'X' : ''}</td>
                    <td style={{ padding: '4px 1px', border: '1px solid #ccc', textAlign: 'center', fontWeight: 700 }}>{isPart ? 'X' : ''}</td>
                  </tr>
                );
              })}
              {sorted.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 20, color: '#999' }}>Nenhum aluno encontrado</td></tr>}
            </tbody>
          </table>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>17</div>
        </div>

        {/* PAGE 19: FICHAS DE INSCRIÇÃO E DECLARAÇÃO - Dynamically per student */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#4472C4', marginBottom: 20, textAlign: 'center' }}>4. FICHA DE INSCRIÇÃO E DECLARAÇÃO ESCOLAR</h2>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.6, textAlign: 'justify' as const, color: '#444' }}>
            A seguir são apresentadas as fichas de inscrição e declarações de matrícula escolar de cada aluno(a) participante do projeto, em ordem alfabética.
          </p>
        </div>

        {/* Individual student ficha + declaração pages */}
        {sorted.map((s, i) => {
          const hasInscricao = !!(s.assinatura || s.data_assinatura || s.fichaUrl);
          const studentAge = (() => {
            if (!s.data_nascimento) return '';
            const birth = new Date(s.data_nascimento);
            const today = new Date();
            let a = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
            return a.toString();
          })();
          return (
          <React.Fragment key={`student-${s.id || i}`}>
          {/* PAGE: Ficha de Inscrição */}
          <div className="freq-page" style={{ padding: '40px 40px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#4472C4', marginBottom: 16, borderBottom: '2px solid #4472C4', paddingBottom: 8 }}>{s.nome}</h3>
            
            <h4 style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: '#333' }}>Ficha de Inscrição</h4>
            {hasInscricao ? (
              <div style={{ border: '1px solid #000', background: '#fff', padding: '30px 40px', fontSize: 10, lineHeight: 1.8, fontFamily: 'serif' }}>
                {/* Banner do projeto */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img src={headerImage} alt="Header" style={{ width: '100%', maxHeight: 70, objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>

                {/* Títulos centralizados */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>FICHA DE INSCRIÇÃO</p>
                  <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>PROJETO {pName}</p>
                </div>

                {/* Campo: Nome do aluno */}
                <div style={{ marginBottom: 6 }}>
                  <span>Nome do aluno(a): </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.nome} </span>
                </div>

                {/* Campo: Data Nasc + Idade */}
                <div style={{ marginBottom: 6, display: 'flex', gap: 20 }}>
                  <span>Data de Nascimento: <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.data_nascimento || ''} </span></span>
                  <span> / Idade no dia da inscrição: <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {studentAge} </span></span>
                </div>

                {/* Campo: RG/CPF */}
                <div style={{ marginBottom: 6 }}>
                  <span>RG/CPF do aluno(a): </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.rg_cpf || ''} </span>
                </div>

                {/* Campo: Responsável */}
                <div style={{ marginBottom: 6 }}>
                  <span>Nome do(a) Responsável legal: </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.nome_responsavel || ''} </span>
                </div>

                {/* Campo: Telefone */}
                <div style={{ marginBottom: 6 }}>
                  <span>Telefone de contato: </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.telefone || ''} </span>
                </div>

                {/* Campo: Endereço */}
                <div style={{ marginBottom: 6 }}>
                  <span>Endereço Completo (Rua, nº, cep, cidade/estado): </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.endereco || ''} </span>
                </div>

                {/* Campo: Escola */}
                <div style={{ marginBottom: 6 }}>
                  <span>Escola em que estuda é: </span>
                  <span style={{ fontWeight: 700 }}>
                    Pública ({s.escola_tipo === 'PUBLICA' ? 'X' : ' '}) {' '} Particular ({s.escola_tipo === 'PARTICULAR' ? 'X' : ' '})
                  </span>
                </div>

                {/* Campo: Email */}
                <div style={{ marginBottom: 6 }}>
                  <span>Email: </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.email_contato || ''} </span>
                </div>

                {/* Linha: SLI + Proponente */}
                <div style={{ marginBottom: 6, display: 'flex', gap: 30 }}>
                  <span>N° SLI: <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.n_sli || nSli} </span></span>
                  <span>Proponente: <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.proponente || sel?.nome || ''} </span></span>
                </div>

                {/* Campo: Responsável da Organização */}
                <div style={{ marginBottom: 16 }}>
                  <span>Responsável da Organização: </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}> {s.nome_responsavel_organizacao || ''} </span>
                </div>

                {/* Termos legais */}
                <div style={{ fontSize: 11, lineHeight: 1.6, textAlign: 'justify' as const, color: '#000', marginBottom: 16 }}>
                  <p style={{ marginBottom: 6 }}>Declaro que o aluno acima identificado está frequentando a escola regularmente e está ciente que como critério de permanência no projeto será exigido do aluno, o bom rendimento escolar em regular instituição de ensino da região, através da apresentação frequente do boletim escolar, declaro ainda que o atestado médico do aluno está regularmente válido e atestou que está apto a realizar atividades físicas como natação, ciclismo e corrida.</p>
                  <p style={{ marginBottom: 6 }}>Os uniformes que serão entregues aos alunos, são de responsabilidade do aluno, e em caso de desistência do projeto antes do período de execução do mesmo, deverão ser devolvidos ao coordenador do projeto para que outro aluno possa fazer uso, por isso a boa conservação e cuidado são fundamentais.</p>
                  <p style={{ marginBottom: 6 }}>O(a) Responsável legal, infra assinados(s), com fundamento no art. 5º, X e XXVIII da Constituição Federal/ 1988, e no art. 18, da Lei 10.406, de 10/01/2002, AUTORIZA o uso da imagem e/ou nome do aluno inscrito do projeto, para fins de divulgação das atividades e propaganda, podendo, para tanto, reproduzi-la e/ou divulgá-la pela internet, mídia eletrônica, por jornais, revistas, folders; bem como por todo e qualquer material e veículo de comunicação, público e/ou privado, por parceiros e patrocinadores do projeto, com finalidade informativa, de utilidade pública e de marketing, por tempo indeterminado. O(a) Cedente declara ainda que não há nada a ser reclamado, a título de direitos conexos; referentes ao uso de sua imagem e/ou nome. A presente autorização é concedida a título gratuito.</p>
                  <p>1. Anexar cópia do último boletim escolar do aluno e declaração de matrícula em escola regular.</p>
                </div>

                {/* Data */}
                <div style={{ marginBottom: 30 }}>
                  <span>Data: </span>
                  <span style={{ fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 1 }}>{s.data_assinatura || ''}</span>
                </div>

                {/* Linha de assinatura */}
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  {s.assinatura ? (
                    <div>
                      <img src={s.assinatura} alt="Assinatura" style={{ height: 50, maxWidth: 250, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                      <div style={{ width: 280, height: 1, background: '#000', margin: '0 auto' }}></div>
                    </div>
                  ) : (
                    <div style={{ width: 280, height: 1, background: '#000', margin: '40px auto 0' }}></div>
                  )}
                  <p style={{ fontSize: 10, marginTop: 6 }}>Assinatura do (a) responsável legal</p>
                </div>
              </div>
            ) : (
              <div style={{ padding: 20, background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 4, textAlign: 'center', color: '#999', fontSize: 10 }}>
                {`Ficha de inscrição não disponível no sistema`}
              </div>
            )}
          </div>

          {/* PAGE: Declaração de Matrícula Escolar */}
          <div className="freq-page" style={{ padding: '40px 40px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#4472C4', marginBottom: 16, borderBottom: '2px solid #4472C4', paddingBottom: 8 }}>{s.nome}</h3>
            
            <h4 style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: '#333' }}>Declaração de Matrícula Escolar</h4>
            {(() => {
              const directUrl = s.declaracao_matricula?.url;
              const matchedDoc = !directUrl ? history.filter(d => d.type === 'DECLARACAO_MATRICULA').find(d => normName(d.metaData?.studentName || '') === normName(s.nome)) : null;
              const docUrl = directUrl || matchedDoc?.metaData?.imageUrl;
              if (docUrl) {
                return (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    {docUrl.startsWith('data:application/pdf') ? (
                      <iframe src={docUrl} style={{ width: '100%', height: 700, border: '1px solid #ddd', borderRadius: 4 }} title={`Declaração - ${s.nome}`}></iframe>
                    ) : (
                      <img src={docUrl} alt={`Declaração de ${s.nome}`} style={{ maxWidth: '100%', maxHeight: 700, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4, display: 'block', margin: '0 auto' }} />
                    )}
                  </div>
                );
              }
              return (
                <div style={{ padding: 40, background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 4, textAlign: 'center', color: '#999', fontSize: 10 }}>
                  {`Declaração de matrícula escolar não disponível no sistema`}
                </div>
              );
            })()}
          </div>
          </React.Fragment>
          );
        })}

        {/* REFERÊNCIAS */}
        <div className="freq-page" style={{ padding: '40px 40px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>REFERÊNCIAS</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8 }}>
            <p>BRASIL. Lei nº 11.438, de 29 de dezembro de 2006. Dispõe sobre incentivos e benefícios para fomentar as atividades de caráter desportivo.</p>
            <p style={{ marginTop: 8 }}>MINISTÉRIO DO ESPORTE. Manual de orientação para execução de projetos de incentivo ao esporte. Brasília, 2023.</p>
            <p style={{ marginTop: 8 }}>Fichas de inscrição e declarações de matrícula escolar dos alunos do projeto {projectName}, {`${city}/${uf}`}, {year}.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
