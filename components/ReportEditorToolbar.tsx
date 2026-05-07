/**
 * ReportEditorToolbar.tsx
 * Barra de ferramentas de edição rica — fixa no topo, acompanha scroll.
 * Modo de posicionamento com cursor de cruz para tabela e caixa de texto.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface Props { isEditing: boolean; }

const FONTS = ['Times New Roman','Arial','Calibri','Verdana','Georgia','Courier New','Trebuchet MS','Palatino','Garamond','Inter','Roboto'];
const SIZES = [8,9,10,11,12,14,16,18,20,24,28,32,36,48];

type PlaceMode = null | 'textbox' | 'table';

export const ReportEditorToolbar: React.FC<Props> = ({ isEditing }) => {
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [activeFont, setActiveFont] = useState('Times New Roman');
  const [activeFontSize, setActiveFontSize] = useState(12);
  const [activeStates, setActiveStates] = useState({ bold: false, italic: false, underline: false });
  const [activeAlign, setActiveAlign] = useState('justifyFull');
  const [placeMode, setPlaceMode] = useState<PlaceMode>(null);
  const pendingTableRef = useRef<string>('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Sync toolbar state with current selection
  const syncState = useCallback(() => {
    try {
      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
      const fn = document.queryCommandValue('fontName')?.replace(/['"]/g, '');
      if (fn) setActiveFont(fn);
      const fs = document.queryCommandValue('fontSize');
      if (fs) {
        const m: Record<string,number> = {'1':8,'2':10,'3':12,'4':14,'5':18,'6':24,'7':36};
        setActiveFontSize(m[fs] || 12);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('selectionchange', syncState);
      return () => document.removeEventListener('selectionchange', syncState);
    }
  }, [isEditing, syncState]);

  // --- Placement mode: click on page to insert element ---
  useEffect(() => {
    if (!placeMode) return;

    // Add crosshair cursor to all pages
    const pages = document.querySelectorAll('.freq-page');
    pages.forEach(p => (p as HTMLElement).style.cursor = 'crosshair');

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const page = target.closest('.freq-page') as HTMLElement | null;
      if (!page || target.closest('.report-editor-toolbar') || target.closest('.no-print')) return;

      e.preventDefault();
      e.stopPropagation();

      if (placeMode === 'textbox') {
        const box = document.createElement('div');
        box.contentEditable = 'true';
        box.className = 'ret-placed-box ret-placed-box-active';
        box.style.cssText = 'border:2px solid #4472c4;padding:12px 16px;margin:8px 0;min-height:50px;border-radius:4px;background:#f8faff;font-size:12px;line-height:1.8;color:#333;cursor:text;outline:none;transition:border-color 0.2s;';
        box.innerHTML = '<p style="margin:0">Clique para editar</p>';
        // Insert near click position
        const children = Array.from(page.children);
        let inserted = false;
        for (const child of children) {
          const rect = child.getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) {
            page.insertBefore(box, child);
            inserted = true;
            break;
          }
        }
        if (!inserted) page.appendChild(box);
        box.focus();
        // Deactivate border on blur
        box.addEventListener('blur', () => { box.classList.remove('ret-placed-box-active'); box.style.borderColor = 'transparent'; });
        box.addEventListener('focus', () => { box.classList.add('ret-placed-box-active'); box.style.borderColor = '#4472c4'; });
      } else if (placeMode === 'table') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = pendingTableRef.current;
        const table = wrapper.firstElementChild as HTMLElement;
        if (table) {
          const children = Array.from(page.children);
          let inserted = false;
          for (const child of children) {
            const rect = child.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
              page.insertBefore(table, child);
              inserted = true;
              break;
            }
          }
          if (!inserted) page.appendChild(table);
        }
      }

      // Reset placement mode
      setPlaceMode(null);
      pages.forEach(p => (p as HTMLElement).style.cursor = '');
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlaceMode(null);
        pages.forEach(p => (p as HTMLElement).style.cursor = '');
      }
    };

    // Delay to avoid capturing the button click itself
    setTimeout(() => {
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleEsc);
    }, 100);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEsc);
      pages.forEach(p => (p as HTMLElement).style.cursor = '');
    };
  }, [placeMode]);

  const exec = useCallback((cmd: string, val?: string) => { document.execCommand(cmd, false, val); }, []);

  const handleFontChange = (f: string) => { setActiveFont(f); exec('fontName', f); };

  const handleFontSizeChange = (size: number) => {
    setActiveFontSize(size);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      try { range.surroundContents(span); } catch { exec('fontSize', '3'); }
    }
  };

  const handleInsertTextBox = () => { setPlaceMode('textbox'); };

  const handleInsertTable = () => {
    let html = '<table style="width:100%;border-collapse:collapse;font-size:11px;margin:12px 0;border:2px solid #4472c4">';
    html += '<thead><tr style="background:#4472c4;color:#fff">';
    for (let c = 0; c < tableCols; c++) html += `<th style="border:1px solid #3a63a8;padding:6px 8px;font-weight:700;text-align:center" contenteditable="true">Coluna ${c+1}</th>`;
    html += '</tr></thead><tbody>';
    for (let r = 0; r < tableRows; r++) {
      html += `<tr style="background:${r%2===0?'#e9f0f9':'#fff'}">`;
      for (let c = 0; c < tableCols; c++) html += '<td style="border:1px solid #ccc;padding:5px 8px;text-align:center" contenteditable="true">&nbsp;</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    pendingTableRef.current = html;
    setShowTableModal(false);
    setPlaceMode('table');
  };

  if (!isEditing) return null;

  const Div = () => <div style={{ width: 1, height: 24, background: '#444', margin: '0 4px' }} />;

  return (
    <>
      {/* ═══ Placement Mode Banner ═══ */}
      {placeMode && (
        <div className="no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10001,
          background: 'linear-gradient(90deg, #4472c4, #2856a0)', color: '#fff',
          padding: '10px 24px', textAlign: 'center', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>{placeMode === 'textbox' ? '📝' : '📊'}</span>
          Clique na página para posicionar {placeMode === 'textbox' ? 'a caixa de texto' : 'a tabela'}
          <button onClick={() => setPlaceMode(null)} style={{
            marginLeft: 16, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
            color: '#fff', borderRadius: 6, padding: '4px 16px', fontSize: 11, cursor: 'pointer', fontWeight: 700,
          }}>✕ Cancelar (Esc)</button>
        </div>
      )}

      {/* ═══ Main Editor Toolbar ═══ */}
      <div
        ref={toolbarRef}
        className="report-editor-toolbar no-print"
        style={{
          position: 'fixed', top: 56, left: 0, right: 0,
          zIndex: 999,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderBottom: '2px solid #4472c4',
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        {/* Font Family */}
        <select value={activeFont} onChange={e => handleFontChange(e.target.value)} title="Fonte"
          style={{ background:'#2a2a4a',color:'#e0e0e0',border:'1px solid #444',borderRadius:4,padding:'4px 6px',fontSize:11,fontFamily:activeFont,maxWidth:140,cursor:'pointer' }}>
          {FONTS.map(f => <option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
        </select>
        <Div/>
        {/* Font Size */}
        <select value={activeFontSize} onChange={e => handleFontSizeChange(Number(e.target.value))} title="Tamanho"
          style={{ background:'#2a2a4a',color:'#e0e0e0',border:'1px solid #444',borderRadius:4,padding:'4px 6px',fontSize:11,width:52,cursor:'pointer' }}>
          {SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
        </select>
        <Div/>
        {/* B / I / U */}
        <button onClick={() => exec('bold')} title="Negrito" className={`ret-btn ${activeStates.bold?'ret-btn-active':''}`}><strong>B</strong></button>
        <button onClick={() => exec('italic')} title="Itálico" className={`ret-btn ${activeStates.italic?'ret-btn-active':''}`}><em>I</em></button>
        <button onClick={() => exec('underline')} title="Sublinhado" className={`ret-btn ${activeStates.underline?'ret-btn-active':''}`}><u>U</u></button>
        <Div/>
        {/* Alignment */}
        <button onClick={() => {exec('justifyLeft');setActiveAlign('justifyLeft');}} title="Esquerda" className={`ret-btn ${activeAlign==='justifyLeft'?'ret-btn-active':''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button onClick={() => {exec('justifyCenter');setActiveAlign('justifyCenter');}} title="Centro" className={`ret-btn ${activeAlign==='justifyCenter'?'ret-btn-active':''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button onClick={() => {exec('justifyRight');setActiveAlign('justifyRight');}} title="Direita" className={`ret-btn ${activeAlign==='justifyRight'?'ret-btn-active':''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button onClick={() => {exec('justifyFull');setActiveAlign('justifyFull');}} title="Justificar" className={`ret-btn ${activeAlign==='justifyFull'?'ret-btn-active':''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <Div/>
        {/* Colors */}
        <label title="Cor do texto" style={{position:'relative',cursor:'pointer'}}>
          <span className="ret-btn" style={{display:'flex',alignItems:'center',gap:3}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3L4 21h16L12 3z"/></svg>
            <span style={{fontSize:8,display:'block',width:14,height:3,background:'#e74c3c',borderRadius:1}}/>
          </span>
          <input type="color" defaultValue="#000000" onChange={e => exec('foreColor',e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}}/>
        </label>
        <label title="Destaque" style={{position:'relative',cursor:'pointer'}}>
          <span className="ret-btn" style={{display:'flex',alignItems:'center',gap:3}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71 4.04c-.18-.18-.43-.29-.71-.29H4c-.28 0-.53.11-.71.29C3.11 4.22 3 4.47 3 4.75v14.5c0 .28.11.53.29.71.18.18.43.29.71.29h16c.28 0 .53-.11.71-.29.18-.18.29-.43.29-.71V4.75c0-.28-.11-.53-.29-.71z" opacity="0.3"/><path d="M17 7H7v2h10V7zM7 11h10v2H7v-2zM7 15h7v2H7v-2z"/></svg>
          </span>
          <input type="color" defaultValue="#ffff00" onChange={e => exec('hiliteColor',e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}}/>
        </label>
        <Div/>
        {/* Lists */}
        <button onClick={() => exec('insertUnorderedList')} title="Marcadores" className="ret-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
        </button>
        <button onClick={() => exec('insertOrderedList')} title="Numerada" className="ret-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" fontSize="7" fill="currentColor" fontWeight="700">1</text><text x="3" y="14" fontSize="7" fill="currentColor" fontWeight="700">2</text><text x="3" y="20" fontSize="7" fill="currentColor" fontWeight="700">3</text></svg>
        </button>
        <Div/>
        {/* Text Box */}
        <button onClick={handleInsertTextBox} title="Caixa de texto" className={`ret-btn ${placeMode==='textbox'?'ret-btn-active':''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <span style={{fontSize:9,marginLeft:3}}>Caixa</span>
        </button>
        {/* Table */}
        <button onClick={() => setShowTableModal(true)} title="Tabela" className={`ret-btn ${placeMode==='table'?'ret-btn-active':''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          <span style={{fontSize:9,marginLeft:3}}>Tabela</span>
        </button>
        <Div/>
        {/* Clear / Undo / Redo */}
        <button onClick={() => exec('removeFormat')} title="Limpar" className="ret-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="20"/><path d="M6 4h12l-4 16"/></svg>
        </button>
        <button onClick={() => exec('undo')} title="Desfazer" className="ret-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H9"/><polyline points="7 6 3 10 7 14"/></svg>
        </button>
        <button onClick={() => exec('redo')} title="Refazer" className="ret-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 000 8h7"/><polyline points="17 6 21 10 17 14"/></svg>
        </button>
      </div>

      {/* ═══ Table Modal ═══ */}
      {showTableModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000}} onClick={() => setShowTableModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',border:'1px solid #4472c4',borderRadius:12,padding:28,minWidth:380,boxShadow:'0 20px 60px rgba(0,0,0,0.5)',color:'#e0e0e0'}}>
            <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',gap:8}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4472c4" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              Inserir Tabela
            </h3>
            <div style={{display:'flex',gap:24,marginBottom:24}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#aaa',marginBottom:6,display:'block'}}>Linhas</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={() => setTableRows(Math.max(1,tableRows-1))} style={{width:32,height:32,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{fontSize:20,fontWeight:700,color:'#4472c4',minWidth:32,textAlign:'center'}}>{tableRows}</span>
                  <button onClick={() => setTableRows(Math.min(50,tableRows+1))} style={{width:32,height:32,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#aaa',marginBottom:6,display:'block'}}>Colunas</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={() => setTableCols(Math.max(1,tableCols-1))} style={{width:32,height:32,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{fontSize:20,fontWeight:700,color:'#4472c4',minWidth:32,textAlign:'center'}}>{tableCols}</span>
                  <button onClick={() => setTableCols(Math.min(20,tableCols+1))} style={{width:32,height:32,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
              </div>
            </div>
            <div style={{marginBottom:20,padding:12,background:'#0d0d1a',borderRadius:8,border:'1px solid #333'}}>
              <p style={{fontSize:10,color:'#888',marginBottom:8}}>Prévia ({tableRows}×{tableCols})</p>
              <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(tableCols,10)},1fr)`,gap:2,maxWidth:300}}>
                {Array(Math.min(tableRows,6)*Math.min(tableCols,10)).fill(null).map((_,i) => (
                  <div key={i} style={{height:14,borderRadius:2,background:i<Math.min(tableCols,10)?'#4472c4':(Math.floor(i/Math.min(tableCols,10))%2===0?'#2a3a5a':'#1a2a4a')}}/>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={() => setShowTableModal(false)} style={{padding:'8px 20px',borderRadius:6,border:'1px solid #555',background:'transparent',color:'#ccc',fontSize:12,cursor:'pointer'}}>Cancelar</button>
              <button onClick={handleInsertTable} style={{padding:'8px 24px',borderRadius:6,border:'none',background:'linear-gradient(135deg,#4472c4,#2856a0)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(68,114,196,0.4)'}}>Posicionar na Página</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ret-btn { display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;border:1px solid transparent;border-radius:4px;background:transparent;color:#ccc;font-size:13px;cursor:pointer;padding:0 5px;transition:all .15s; }
        .ret-btn:hover { background:rgba(68,114,196,0.25);border-color:#4472c4;color:#fff; }
        .ret-btn-active { background:rgba(68,114,196,0.4)!important;border-color:#4472c4!important;color:#fff!important;box-shadow:0 0 6px rgba(68,114,196,0.3); }
        .ret-placed-box-active { border-color:#4472c4!important; }
        @media print { .report-editor-toolbar,.ret-placed-box { display:none!important; } }
      `}</style>
    </>
  );
};
