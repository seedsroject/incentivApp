/**
 * ReportEditorToolbar.tsx
 * Barra de edição rica — renderizada DENTRO da toolbar principal (sem position próprio).
 * Modo de posicionamento com cursor cruz para tabela e caixa de texto.
 * Elementos posicionados são arrastáveis e têm botão de lixeira.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';

interface Props { isEditing: boolean; }

const FONTS = ['Times New Roman','Arial','Calibri','Verdana','Georgia','Courier New','Trebuchet MS','Palatino','Garamond','Inter','Roboto'];
const SIZES = [8,9,10,11,12,14,16,18,20,24,28,32,36,48];

type PlaceMode = null | 'textbox' | 'table';

/** Make an element draggable within its parent .freq-page */
function makeDraggable(el: HTMLElement) {
  el.style.position = 'relative';
  el.style.cursor = 'move';
  let startX = 0, startY = 0, origLeft = 0, origTop = 0;
  const onDown = (e: MouseEvent) => {
    // Only drag from the wrapper itself or the drag handle, not from inner editable content
    const t = e.target as HTMLElement;
    if (t.closest('[contenteditable="true"]') && !t.classList.contains('ret-drag-handle')) return;
    e.preventDefault();
    startX = e.clientX; startY = e.clientY;
    origLeft = parseInt(el.style.left || '0'); origTop = parseInt(el.style.top || '0');
    const onMove = (ev: MouseEvent) => {
      el.style.left = `${origLeft + ev.clientX - startX}px`;
      el.style.top = `${origTop + ev.clientY - startY}px`;
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  el.addEventListener('mousedown', onDown);
}

/** Add a delete button to top-right of element */
function addDeleteBtn(el: HTMLElement) {
  const btn = document.createElement('button');
  btn.className = 'ret-delete-btn no-print';
  btn.innerHTML = '🗑';
  btn.title = 'Remover';
  btn.style.cssText = 'position:absolute;top:-8px;right:-8px;width:24px;height:24px;border-radius:50%;border:1px solid #e74c3c;background:#fff;color:#e74c3c;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,0.2);opacity:0;transition:opacity .2s;padding:0;';
  el.style.position = 'relative';
  el.appendChild(btn);
  el.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
  el.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });
  btn.addEventListener('click', (e) => { e.stopPropagation(); el.remove(); });
}

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

  const syncState = useCallback(() => {
    try {
      setActiveStates({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic'), underline: document.queryCommandState('underline') });
      const fn = document.queryCommandValue('fontName')?.replace(/['"]/g, '');
      if (fn) setActiveFont(fn);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('selectionchange', syncState);
      return () => document.removeEventListener('selectionchange', syncState);
    }
  }, [isEditing, syncState]);

  // Placement mode handler
  useEffect(() => {
    if (!placeMode) return;
    const pages = document.querySelectorAll('.freq-page');
    pages.forEach(p => (p as HTMLElement).style.cursor = 'crosshair');

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const page = target.closest('.freq-page') as HTMLElement | null;
      if (!page || target.closest('.freq-report-toolbar') || target.closest('.no-print:not(.freq-page *)')) return;
      e.preventDefault(); e.stopPropagation();

      // Find insertion point based on click Y
      const insertBefore = (() => {
        for (const child of Array.from(page.children)) {
          const r = child.getBoundingClientRect();
          if (e.clientY < r.top + r.height / 2) return child;
        }
        return null;
      })();

      if (placeMode === 'textbox') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ret-placed-element';
        wrapper.style.cssText = 'position:relative;margin:8px 0;';
        const box = document.createElement('div');
        box.contentEditable = 'true';
        box.className = 'ret-placed-box';
        box.style.cssText = 'border:2px solid #4472c4;padding:12px 16px;min-height:50px;border-radius:4px;background:#f8faff;font-size:12px;line-height:1.8;color:#333;cursor:text;outline:none;transition:border-color .2s;';
        box.innerHTML = '<p style="margin:0">Clique para editar</p>';
        box.addEventListener('focus', () => { box.style.borderColor = '#4472c4'; });
        box.addEventListener('blur', () => { box.style.borderColor = 'transparent'; });
        wrapper.appendChild(box);
        addDeleteBtn(wrapper);
        makeDraggable(wrapper);
        if (insertBefore) page.insertBefore(wrapper, insertBefore); else page.appendChild(wrapper);
        box.focus();
      } else if (placeMode === 'table') {
        const wrapper = document.createElement('div');
        wrapper.className = 'ret-placed-element';
        wrapper.style.cssText = 'position:relative;margin:8px 0;';
        wrapper.innerHTML = pendingTableRef.current;
        addDeleteBtn(wrapper);
        makeDraggable(wrapper);
        if (insertBefore) page.insertBefore(wrapper, insertBefore); else page.appendChild(wrapper);
      }

      setPlaceMode(null);
      pages.forEach(p => (p as HTMLElement).style.cursor = '');
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPlaceMode(null); pages.forEach(p => (p as HTMLElement).style.cursor = ''); }
    };

    const t = setTimeout(() => {
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleEsc);
    }, 100);

    return () => {
      clearTimeout(t);
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

  const handleInsertTable = () => {
    let html = '<table style="width:100%;border-collapse:collapse;font-size:11px;border:2px solid #4472c4">';
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

  const D = () => <div style={{ width: 1, height: 22, background: '#555', margin: '0 2px' }} />;
  const ss: React.CSSProperties = { background:'#2a2a4a',color:'#e0e0e0',border:'1px solid #444',borderRadius:4,padding:'3px 5px',fontSize:10,cursor:'pointer' };

  return (
    <>
      {/* Placement Banner */}
      {placeMode && (
        <div className="no-print" style={{ position:'fixed',top:0,left:0,right:0,zIndex:10001,background:'linear-gradient(90deg,#4472c4,#2856a0)',color:'#fff',padding:'8px 24px',textAlign:'center',fontSize:12,fontWeight:700,boxShadow:'0 4px 20px rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',gap:12 }}>
          <span style={{fontSize:16}}>{placeMode==='textbox'?'📝':'📊'}</span>
          Clique na página para posicionar {placeMode==='textbox'?'a caixa de texto':'a tabela'}
          <button onClick={() => setPlaceMode(null)} style={{ marginLeft:16,background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',color:'#fff',borderRadius:6,padding:'3px 14px',fontSize:10,cursor:'pointer',fontWeight:700 }}>✕ Cancelar</button>
        </div>
      )}

      {/* Editor bar — NO position, rendered inside parent toolbar */}
      <div style={{ width:'100%',background:'rgba(0,0,0,0.25)',borderTop:'1px solid rgba(68,114,196,0.3)',marginTop:8,padding:'6px 0',display:'flex',alignItems:'center',gap:5,flexWrap:'wrap' }}>
        <select value={activeFont} onChange={e => handleFontChange(e.target.value)} title="Fonte" style={{...ss,fontFamily:activeFont,maxWidth:130}}>{FONTS.map(f => <option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}</select>
        <D/>
        <select value={activeFontSize} onChange={e => handleFontSizeChange(Number(e.target.value))} title="Tamanho" style={{...ss,width:48}}>{SIZES.map(s => <option key={s} value={s}>{s}px</option>)}</select>
        <D/>
        <button onClick={() => exec('bold')} title="Negrito" className={`ret-btn ${activeStates.bold?'ret-btn-active':''}`}><strong>B</strong></button>
        <button onClick={() => exec('italic')} title="Itálico" className={`ret-btn ${activeStates.italic?'ret-btn-active':''}`}><em>I</em></button>
        <button onClick={() => exec('underline')} title="Sublinhado" className={`ret-btn ${activeStates.underline?'ret-btn-active':''}`}><u>U</u></button>
        <D/>
        <button onClick={() => {exec('justifyLeft');setActiveAlign('justifyLeft');}} title="Esquerda" className={`ret-btn ${activeAlign==='justifyLeft'?'ret-btn-active':''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <button onClick={() => {exec('justifyCenter');setActiveAlign('justifyCenter');}} title="Centro" className={`ret-btn ${activeAlign==='justifyCenter'?'ret-btn-active':''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <button onClick={() => {exec('justifyRight');setActiveAlign('justifyRight');}} title="Direita" className={`ret-btn ${activeAlign==='justifyRight'?'ret-btn-active':''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <button onClick={() => {exec('justifyFull');setActiveAlign('justifyFull');}} title="Justificar" className={`ret-btn ${activeAlign==='justifyFull'?'ret-btn-active':''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        <D/>
        <label title="Cor do texto" style={{position:'relative',cursor:'pointer'}}>
          <span className="ret-btn" style={{display:'flex',alignItems:'center',gap:2}}>A<span style={{width:12,height:3,background:'#e74c3c',borderRadius:1,display:'block'}}/></span>
          <input type="color" defaultValue="#000000" onChange={e => exec('foreColor',e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0}}/>
        </label>
        <label title="Destaque" style={{position:'relative',cursor:'pointer'}}>
          <span className="ret-btn" style={{display:'flex',alignItems:'center',gap:2}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffff00" stroke="#999" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </span>
          <input type="color" defaultValue="#ffff00" onChange={e => exec('hiliteColor',e.target.value)} style={{position:'absolute',opacity:0,width:0,height:0}}/>
        </label>
        <D/>
        <button onClick={() => setPlaceMode('textbox')} title="Caixa de texto" className={`ret-btn ${placeMode==='textbox'?'ret-btn-active':''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <span style={{fontSize:8,marginLeft:2}}>Caixa</span>
        </button>
        <button onClick={() => setShowTableModal(true)} title="Tabela" className={`ret-btn ${placeMode==='table'?'ret-btn-active':''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          <span style={{fontSize:8,marginLeft:2}}>Tabela</span>
        </button>
        <D/>
        <button onClick={() => exec('removeFormat')} title="Limpar" className="ret-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="20"/><path d="M6 4h12l-4 16"/></svg></button>
        <button onClick={() => exec('undo')} title="Desfazer" className="ret-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h13a4 4 0 010 8H9"/><polyline points="7 6 3 10 7 14"/></svg></button>
        <button onClick={() => exec('redo')} title="Refazer" className="ret-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H8a4 4 0 000 8h7"/><polyline points="17 6 21 10 17 14"/></svg></button>
      </div>

      {/* Table Modal */}
      {showTableModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000}} onClick={() => setShowTableModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',border:'1px solid #4472c4',borderRadius:12,padding:28,minWidth:360,boxShadow:'0 20px 60px rgba(0,0,0,0.5)',color:'#e0e0e0'}}>
            <h3 style={{margin:'0 0 20px',fontSize:15,fontWeight:700,color:'#fff'}}>📊 Inserir Tabela</h3>
            <div style={{display:'flex',gap:24,marginBottom:24}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#aaa',marginBottom:6,display:'block'}}>Linhas</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={() => setTableRows(Math.max(1,tableRows-1))} style={{width:30,height:30,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{fontSize:18,fontWeight:700,color:'#4472c4',minWidth:28,textAlign:'center'}}>{tableRows}</span>
                  <button onClick={() => setTableRows(Math.min(50,tableRows+1))} style={{width:30,height:30,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:11,color:'#aaa',marginBottom:6,display:'block'}}>Colunas</label>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <button onClick={() => setTableCols(Math.max(1,tableCols-1))} style={{width:30,height:30,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                  <span style={{fontSize:18,fontWeight:700,color:'#4472c4',minWidth:28,textAlign:'center'}}>{tableCols}</span>
                  <button onClick={() => setTableCols(Math.min(20,tableCols+1))} style={{width:30,height:30,borderRadius:6,border:'1px solid #555',background:'#2a2a4a',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                </div>
              </div>
            </div>
            <div style={{marginBottom:20,padding:10,background:'#0d0d1a',borderRadius:8,border:'1px solid #333'}}>
              <p style={{fontSize:9,color:'#888',marginBottom:6}}>Prévia ({tableRows}×{tableCols})</p>
              <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(tableCols,10)},1fr)`,gap:2,maxWidth:280}}>
                {Array(Math.min(tableRows,5)*Math.min(tableCols,10)).fill(0).map((_,i) => <div key={i} style={{height:12,borderRadius:2,background:i<Math.min(tableCols,10)?'#4472c4':(Math.floor(i/Math.min(tableCols,10))%2===0?'#2a3a5a':'#1a2a4a')}}/>)}
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={() => setShowTableModal(false)} style={{padding:'7px 18px',borderRadius:6,border:'1px solid #555',background:'transparent',color:'#ccc',fontSize:11,cursor:'pointer'}}>Cancelar</button>
              <button onClick={handleInsertTable} style={{padding:'7px 22px',borderRadius:6,border:'none',background:'linear-gradient(135deg,#4472c4,#2856a0)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 12px rgba(68,114,196,0.4)'}}>Posicionar na Página</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ret-btn{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;border:1px solid transparent;border-radius:4px;background:transparent;color:#ccc;font-size:12px;cursor:pointer;padding:0 4px;transition:all .15s}
        .ret-btn:hover{background:rgba(68,114,196,0.25);border-color:#4472c4;color:#fff}
        .ret-btn-active{background:rgba(68,114,196,0.4)!important;border-color:#4472c4!important;color:#fff!important}
        .ret-placed-element:hover .ret-delete-btn{opacity:1!important}
        @media print{.report-editor-toolbar,.ret-placed-element .ret-delete-btn,.no-print{display:none!important} .ret-placed-box{border-color:transparent!important}}
      `}</style>
    </>
  );
};
