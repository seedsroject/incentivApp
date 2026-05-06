/**
 * ChartDataEditor.tsx
 * Componente compartilhado para edição inline de dados de gráficos.
 * Exibe um botão flutuante ✏️ que abre um mini modal estilo Excel
 * para editar valores numéricos dos gráficos dos relatórios.
 * 
 * Uso: <ChartDataEditor chartId="..." title="..." rows={[...]} onSave={...} isEditing={...} />
 * 
 * O componente é `.no-print` e não aparece na exportação PDF.
 */

import React, { useState } from 'react';

export interface ChartDataRow {
  key: string;
  label: string;
  value: number;
}

interface ChartDataEditorProps {
  /** Identificador único do gráfico (para controle do modal aberto) */
  chartId: string;
  /** Título exibido no cabeçalho do mini modal */
  title: string;
  /** Linhas de dados editáveis */
  rows: ChartDataRow[];
  /** Callback chamado ao clicar em "Aplicar" com os novos valores */
  onSave: (data: Record<string, number>) => void;
  /** Se true, o botão é exibido (apenas no modo edição) */
  isEditing: boolean;
}

// Estado global do editor aberto (compartilhado entre instâncias via closure)
let globalOpenId: string | null = null;
let globalSetOpenId: ((id: string | null) => void) | null = null;

export const ChartDataEditor: React.FC<ChartDataEditorProps> = ({ chartId, rows, onSave, title, isEditing }) => {
  const [localRows, setLocalRows] = useState(rows.map(r => ({ ...r })));
  const [isOpen, setIsOpen] = useState(false);

  // Sync local rows when rows prop changes
  React.useEffect(() => {
    if (!isOpen) {
      setLocalRows(rows.map(r => ({ ...r })));
    }
  }, [rows, isOpen]);

  if (!isEditing) return null;

  return (
    <>
      <button
        className="no-print"
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        title="Editar dados do gráfico"
        style={{
          position: 'absolute', top: 4, right: 4, zIndex: 20,
          width: 28, height: 28, borderRadius: '50%',
          background: isOpen ? '#4472C4' : 'rgba(68,114,196,0.15)',
          color: isOpen ? '#fff' : '#4472C4',
          border: `1.5px solid ${isOpen ? '#3461a8' : '#4472C4'}`,
          cursor: 'pointer', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
          boxShadow: isOpen ? '0 2px 8px rgba(0,0,0,.25)' : 'none',
        }}
        onMouseEnter={e => { if (!isOpen) { (e.target as HTMLElement).style.background = '#4472C4'; (e.target as HTMLElement).style.color = '#fff'; }}}
        onMouseLeave={e => { if (!isOpen) { (e.target as HTMLElement).style.background = 'rgba(68,114,196,0.15)'; (e.target as HTMLElement).style.color = '#4472C4'; }}}
      >✏️</button>
      {isOpen && (
        <div className="no-print" style={{
          position: 'absolute', top: 36, right: 4, zIndex: 30,
          background: '#fff', border: '2px solid #4472C4', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,.2)', padding: '12px 14px', minWidth: 280,
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#333' }}>{title}</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#999' }}>✕</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#4472C4', color: '#fff' }}>
                <th style={{ padding: '4px 6px', textAlign: 'left', borderRadius: '4px 0 0 0' }}>Item</th>
                <th style={{ padding: '4px 6px', textAlign: 'center', width: 70, borderRadius: '0 4px 0 0' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {localRows.map((row, i) => (
                <tr key={row.key} style={{ background: i % 2 === 0 ? '#f0f5fb' : '#fff' }}>
                  <td style={{ padding: '3px 6px', border: '1px solid #dde5f0', fontSize: 11, color: '#333' }}>{row.label}</td>
                  <td style={{ padding: '2px 4px', border: '1px solid #dde5f0', textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      value={row.value}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        setLocalRows(prev => prev.map((r, j) => j === i ? { ...r, value: v } : r));
                      }}
                      style={{
                        width: '100%', textAlign: 'center', border: '1px solid #ccd', borderRadius: 3,
                        padding: '2px 4px', fontSize: 11, background: '#fff', outline: 'none',
                      }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#4472C4'}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#ccd'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#e8eef6', fontWeight: 700 }}>
                <td style={{ padding: '3px 6px', border: '1px solid #dde5f0', fontSize: 11 }}>Total</td>
                <td style={{ padding: '3px 6px', border: '1px solid #dde5f0', textAlign: 'center', fontSize: 11 }}>{localRows.reduce((s, r) => s + r.value, 0)}</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => { setIsOpen(false); }} style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', color: '#666', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
            <button onClick={() => {
              const data: Record<string, number> = {};
              localRows.forEach(r => { data[r.key] = r.value; });
              onSave(data);
              setIsOpen(false);
            }} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', background: '#4472C4', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Aplicar</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChartDataEditor;
