
import React, { useRef, useState, useEffect } from 'react';
import { AutorizacaoViagem, StudentDraft } from '../types';

interface Props {
  studentName?: string;
  studentData?: StudentDraft; // Dados já preenchidos na ficha de inscrição
  onSave: (data: AutorizacaoViagem) => void;
  isPublic?: boolean;
}

// ─── SIGNATURE PAD ──────────────────────────────────────────────────────────
const CANVAS_H = 160;
const SignaturePad: React.FC<{ label: string; onEnd: (b64: string) => void; onClear: () => void; value?: string }> = ({ label, onEnd, onClear, value }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const setup = () => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.parentElement?.clientWidth || 300;
    c.width = w * dpr; c.height = CANVAS_H * dpr;
    const ctx = c.getContext('2d');
    if (ctx) { ctx.scale(dpr, dpr); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1e293b'; }
  };
  useEffect(() => { setup(); window.addEventListener('resize', setup); return () => window.removeEventListener('resize', setup); }, []);

  const pos = (e: MouseEvent | TouchEvent) => {
    const c = ref.current; if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const sx = c.width / dpr / r.width, sy = c.height / dpr / r.height;
    if ('touches' in e && e.touches.length) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    const m = e as MouseEvent; return { x: (m.clientX - r.left) * sx, y: (m.clientY - r.top) * sy };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); drawing.current = true; const ctx = ref.current?.getContext('2d'); const p = pos(e.nativeEvent as any); if (ctx) { ctx.beginPath(); ctx.moveTo(p.x, p.y); } };
  const move = (e: React.MouseEvent | React.TouchEvent) => { if (!drawing.current) return; e.preventDefault(); const ctx = ref.current?.getContext('2d'); const p = pos(e.nativeEvent as any); if (ctx) { ctx.lineTo(p.x, p.y); ctx.stroke(); } };
  const end = () => { if (!drawing.current) return; drawing.current = false; if (ref.current) onEnd(ref.current.toDataURL('image/png')); };
  const clear = () => { const c = ref.current; if (c) { const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); } onClear(); };

  return (
    <div className="mt-1">
      <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
      <div className="border-2 border-dashed border-blue-300 rounded-xl overflow-hidden bg-blue-50/20 touch-none select-none" style={{ height: CANVAS_H }}>
        <canvas ref={ref} className="w-full cursor-crosshair" style={{ display: 'block', height: CANVAS_H, touchAction: 'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <button type="button" onClick={clear} className="text-xs text-red-500 font-semibold hover:text-red-700 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Limpar
        </button>
        {value && <span className="text-xs text-green-600 font-bold flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Assinatura registrada
        </span>}
      </div>
    </div>
  );
};

// ─── FORM INPUT ─────────────────────────────────────────────────────────────
const F: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder?: string; span?: boolean; type?: string }> =
  ({ label, value, onChange, placeholder, span, type }) => (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label className="block text-[11px] font-bold text-gray-500 mb-1">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''}
        className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-colors" />
    </div>
  );

const QUALIDADES = [
  { value: 'MAE', label: 'Mãe' }, { value: 'PAI', label: 'Pai' },
  { value: 'TUTOR', label: 'Tutor(a)' }, { value: 'GUARDIAO', label: 'Guardião(ã)' },
] as const;

// ─── RESPONSAVEL SECTION ────────────────────────────────────────────────────
const ResponsavelSection: React.FC<{
  n: number; prefix: string; data: any; onChange: (field: string, value: string) => void;
  sigValue: string; onSig: (b64: string) => void; onSigClear: () => void;
}> = ({ n, prefix, data, onChange, sigValue, onSig, onSigClear }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
      <h3 className="text-white font-bold text-sm">{n === 1 ? 'Responsável 1' : 'Responsável 2 (opcional)'}</h3>
    </div>
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <F label="Nome Completo" value={data[`${prefix}_nome`] || ''} onChange={v => onChange(`${prefix}_nome`, v)} placeholder="Nome completo" span />
      <F label="Cédula de Identidade / Passaporte" value={data[`${prefix}_identidade`] || ''} onChange={v => onChange(`${prefix}_identidade`, v)} placeholder="Nº do documento" />
      <F label="Órgão Expedidor" value={data[`${prefix}_orgao_expedidor`] || ''} onChange={v => onChange(`${prefix}_orgao_expedidor`, v)} placeholder="SSP, SRF, etc." />
      <F label="Data de Expedição" value={data[`${prefix}_data_expedicao`] || ''} onChange={v => onChange(`${prefix}_data_expedicao`, v)} placeholder="DD/MM/AAAA" />
      <F label="CPF" value={data[`${prefix}_cpf`] || ''} onChange={v => onChange(`${prefix}_cpf`, v)} placeholder="000.000.000-00" />
      <F label="Endereço de Domicílio" value={data[`${prefix}_endereco`] || ''} onChange={v => onChange(`${prefix}_endereco`, v)} placeholder="Rua, Nº, Bairro" span />
      <F label="Cidade" value={data[`${prefix}_cidade`] || ''} onChange={v => onChange(`${prefix}_cidade`, v)} placeholder="Cidade" />
      <F label="UF" value={data[`${prefix}_uf`] || ''} onChange={v => onChange(`${prefix}_uf`, v)} placeholder="BA" />
      <F label="País" value={data[`${prefix}_pais`] || ''} onChange={v => onChange(`${prefix}_pais`, v)} placeholder="Brasil" />
      <F label="Telefone de Contato" value={data[`${prefix}_telefone`] || ''} onChange={v => onChange(`${prefix}_telefone`, v)} placeholder="(00) 00000-0000" />
      <div className="sm:col-span-2">
        <label className="block text-[11px] font-bold text-gray-500 mb-2">Na qualidade de</label>
        <div className="flex flex-wrap gap-2">
          {QUALIDADES.map(q => (
            <button key={q.value} type="button" onClick={() => onChange(`${prefix}_qualidade`, q.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${data[`${prefix}_qualidade`] === q.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <SignaturePad label={`Assinatura — Responsável ${n}`} onEnd={onSig} onClear={onSigClear} value={sigValue} />
      </div>
    </div>
  </div>
);

// ─── PDF GENERATOR ──────────────────────────────────────────────────────────
const generatePDF = (d: any) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Autorização de Viagem Nacional</title>
<style>body{font-family:Arial,sans-serif;font-size:11pt;line-height:1.6;margin:40px 50px;color:#111}
h1{text-align:center;font-size:14pt;margin-bottom:5px}
.sub{text-align:center;font-size:9pt;color:#555;margin-bottom:20px}
.field{border-bottom:1px solid #333;min-width:80px;display:inline-block;padding:0 4px;font-weight:bold}
.check{font-weight:bold} .sig-area{margin-top:40px;display:flex;gap:40px;justify-content:center}
.sig-block{text-align:center;flex:1;max-width:300px}
.sig-line{border-top:1px solid #333;margin-top:60px;padding-top:5px;font-size:10pt}
.sig-img{max-height:60px;margin-top:10px}
p{margin:6px 0}</style></head><body>
<h1>FORMULÁRIO DE AUTORIZAÇÃO DE VIAGEM NACIONAL</h1>
<p class="sub">(Res. Nº 295/2019 – CNJ) Válida até <span class="field">${d.validade_data || '____/____/20_____'}</span></p>
<p>Eu, <span class="field">${d.resp1_nome || ''}</span>, Cédula de Identidade/passaporte nº <span class="field">${d.resp1_identidade || ''}</span>, expedida(o) pela(o) <span class="field">${d.resp1_orgao_expedidor || ''}</span>, na data de <span class="field">${d.resp1_data_expedicao || ''}</span>.</p>
<p>CPF nº <span class="field">${d.resp1_cpf || ''}</span>.</p>
<p>Endereço de domicílio <span class="field">${d.resp1_endereco || ''}</span>. Cidade <span class="field">${d.resp1_cidade || ''}</span>. UF: <span class="field">${d.resp1_uf || ''}</span>. País: <span class="field">${d.resp1_pais || ''}</span>.</p>
<p>Telefone de contato: <span class="field">${d.resp1_telefone || ''}</span></p>
<p>na qualidade de <span class="check">(${d.resp1_qualidade === 'MAE' ? 'X' : ' '}) MÃE / (${d.resp1_qualidade === 'PAI' ? 'X' : ' '}) PAI / (${d.resp1_qualidade === 'TUTOR' ? 'X' : ' '}) TUTOR(A) / (${d.resp1_qualidade === 'GUARDIAO' ? 'X' : ' '}) GUARDIÃ(O)</span></p>
${d.resp2_nome ? `<p>E Eu, <span class="field">${d.resp2_nome}</span>, Cédula de Identidade/passaporte nº <span class="field">${d.resp2_identidade || ''}</span>, expedida(o) pela(o) <span class="field">${d.resp2_orgao_expedidor || ''}</span>, na data de <span class="field">${d.resp2_data_expedicao || ''}</span>.</p>
<p>CPF nº <span class="field">${d.resp2_cpf || ''}</span>.</p>
<p>Endereço de domicílio <span class="field">${d.resp2_endereco || ''}</span>. Cidade <span class="field">${d.resp2_cidade || ''}</span>. UF: <span class="field">${d.resp2_uf || ''}</span>. País: <span class="field">${d.resp2_pais || ''}</span>.</p>
<p>Telefone de contato: <span class="field">${d.resp2_telefone || ''}</span></p>
<p>na qualidade de <span class="check">(${d.resp2_qualidade === 'MAE' ? 'X' : ' '}) MÃE / (${d.resp2_qualidade === 'PAI' ? 'X' : ' '}) PAI / (${d.resp2_qualidade === 'TUTOR' ? 'X' : ' '}) TUTOR(A) / (${d.resp2_qualidade === 'GUARDIAO' ? 'X' : ' '}) GUARDIÃ(O)</span></p>` : ''}
<p><b>AUTORIZO(AMOS)</b> a circular livremente, dentro do território nacional, desacompanhada(o) <span class="field">${d.crianca_nome || ''}</span> nascida(o) em <span class="field">${d.crianca_nascimento || ''}</span>, natural de <span class="field">${d.crianca_naturalidade || ''}</span>, Cédula de Identidade/passaporte nº <span class="field">${d.crianca_identidade || ''}</span>, expedida(o) pela(o) <span class="field">${d.crianca_orgao_expedidor || ''}</span>, na data de <span class="field">${d.crianca_data_expedicao || ''}</span>.</p>
<p>CPF nº <span class="field">${d.crianca_cpf || ''}</span>.</p>
<p>Endereço de domicílio <span class="field">${d.crianca_endereco || ''}</span>. Cidade <span class="field">${d.crianca_cidade || ''}</span>. UF: <span class="field">${d.crianca_uf || ''}</span>. País: <span class="field">${d.crianca_pais || ''}</span>.</p>
<p style="margin-top:20px">Assinatura(s) (reconhecer firmas por semelhança ou autenticidade):</p>
<div class="sig-area">
<div class="sig-block">${d.resp1_assinatura ? `<img src="${d.resp1_assinatura}" class="sig-img"/>` : ''}<div class="sig-line">1) ${d.resp1_nome || ''}</div></div>
${d.resp2_assinatura ? `<div class="sig-block"><img src="${d.resp2_assinatura}" class="sig-img"/><div class="sig-line">2) ${d.resp2_nome || ''}</div></div>` : `<div class="sig-block"><div class="sig-line">2) ________________________</div></div>`}
</div>
<p style="text-align:center;margin-top:10px;font-size:9pt;color:#555">(Reconhecimento da(s) assinatura(s) abaixo e no verso)</p>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
};

// ─── HELPERS: extract city/UF from endereco string ─────────────────────────
const parseEndereco = (endereco?: string): { rua: string; cidade: string; uf: string } => {
  if (!endereco) return { rua: '', cidade: '', uf: '' };
  // Try common patterns: "Rua X, 123, Bairro, Cidade - UF" or "Rua X, Cidade | UF"
  const parts = endereco.split(',').map(s => s.trim());
  const last = parts[parts.length - 1] || '';
  // Check for "Cidade - UF" or "Cidade | UF"
  const dashMatch = last.match(/^(.+?)\s*[-|]\s*([A-Z]{2})$/i);
  if (dashMatch) {
    return { rua: parts.slice(0, -1).join(', '), cidade: dashMatch[1].trim(), uf: dashMatch[2].trim().toUpperCase() };
  }
  // Fallback: whole string is the address
  return { rua: endereco, cidade: '', uf: '' };
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export const AutorizacaoViagemForm: React.FC<Props> = ({ studentName, studentData, onSave, isPublic = false }) => {
  // Pre-fill from enrollment data
  const parsed = parseEndereco(studentData?.endereco);

  const [data, setData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {
      crianca_pais: 'Brasil', resp1_pais: 'Brasil', resp2_pais: 'Brasil',
    };
    // ── Criança (aluno) ──
    initial.crianca_nome = studentData?.nome || studentName || '';
    if (studentData?.data_nascimento) initial.crianca_nascimento = studentData.data_nascimento;
    if (studentData?.rg_cpf) initial.crianca_cpf = studentData.rg_cpf;
    if (parsed.rua) initial.crianca_endereco = parsed.rua;
    if (parsed.cidade) initial.crianca_cidade = parsed.cidade;
    if (parsed.uf) initial.crianca_uf = parsed.uf;
    // ── Responsável 1 ──
    if (studentData?.nome_responsavel) initial.resp1_nome = studentData.nome_responsavel;
    if (studentData?.telefone) initial.resp1_telefone = studentData.telefone;
    if (parsed.rua) initial.resp1_endereco = parsed.rua;
    if (parsed.cidade) initial.resp1_cidade = parsed.cidade;
    if (parsed.uf) initial.resp1_uf = parsed.uf;
    return initial;
  });
  const [showResp2, setShowResp2] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: string, value: string) => setData(prev => ({ ...prev, [field]: value }));

  const isValid = !!(data.resp1_nome && data.resp1_identidade && data.resp1_cpf && data.resp1_qualidade && data.resp1_assinatura && data.crianca_nome && data.crianca_nascimento);

  const handleSave = async () => {
    if (!isValid) { alert('Preencha os campos obrigatórios e assine o formulário.'); return; }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 500));
    onSave({
      ...data as any,
      timestamp: new Date().toISOString(),
    });
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <h1 className="font-bold text-base text-gray-800 leading-tight text-center">Autorização de Viagem Nacional</h1>
        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-wider mt-0.5">Res. Nº 295/2019 – CNJ</p>
      </div>

      <div className="p-4 flex-1 max-w-2xl mx-auto w-full pb-32 space-y-4">
        {/* Legal Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            <b>FORMULÁRIO DE AUTORIZAÇÃO DE VIAGEM NACIONAL</b> — Este documento autoriza a criança/adolescente a circular livremente
            dentro do território nacional desacompanhado(a), conforme Resolução Nº 295/2019 do Conselho Nacional de Justiça (CNJ).
          </p>
        </div>

        {/* Validade */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <F label="Válida até (DD/MM/AAAA)" value={data.validade_data || ''} onChange={v => set('validade_data', v)} placeholder="DD/MM/AAAA" />
        </div>

        {/* Responsável 1 */}
        <ResponsavelSection n={1} prefix="resp1" data={data} onChange={set}
          sigValue={data.resp1_assinatura || ''} onSig={b64 => set('resp1_assinatura', b64)} onSigClear={() => set('resp1_assinatura', '')} />

        {/* Toggle Responsável 2 */}
        {!showResp2 ? (
          <button type="button" onClick={() => setShowResp2(true)}
            className="w-full py-3 border-2 border-dashed border-blue-300 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Adicionar Responsável 2
          </button>
        ) : (
          <ResponsavelSection n={2} prefix="resp2" data={data} onChange={set}
            sigValue={data.resp2_assinatura || ''} onSig={b64 => set('resp2_assinatura', b64)} onSigClear={() => set('resp2_assinatura', '')} />
        )}

        {/* Dados da Criança/Adolescente */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-3">
            <h3 className="text-white font-bold text-sm">Criança / Adolescente Autorizado(a)</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <F label="Nome Completo" value={data.crianca_nome || ''} onChange={v => set('crianca_nome', v)} placeholder="Nome completo" span />
            <F label="Data de Nascimento" value={data.crianca_nascimento || ''} onChange={v => set('crianca_nascimento', v)} placeholder="DD/MM/AAAA" />
            <F label="Natural de" value={data.crianca_naturalidade || ''} onChange={v => set('crianca_naturalidade', v)} placeholder="Cidade/Estado" />
            <F label="Cédula de Identidade / Passaporte" value={data.crianca_identidade || ''} onChange={v => set('crianca_identidade', v)} placeholder="Nº do documento" />
            <F label="Órgão Expedidor" value={data.crianca_orgao_expedidor || ''} onChange={v => set('crianca_orgao_expedidor', v)} placeholder="SSP, SRF, etc." />
            <F label="Data de Expedição" value={data.crianca_data_expedicao || ''} onChange={v => set('crianca_data_expedicao', v)} placeholder="DD/MM/AAAA" />
            <F label="CPF" value={data.crianca_cpf || ''} onChange={v => set('crianca_cpf', v)} placeholder="000.000.000-00" />
            <F label="Endereço de Domicílio" value={data.crianca_endereco || ''} onChange={v => set('crianca_endereco', v)} placeholder="Rua, Nº, Bairro" span />
            <F label="Cidade" value={data.crianca_cidade || ''} onChange={v => set('crianca_cidade', v)} placeholder="Cidade" />
            <F label="UF" value={data.crianca_uf || ''} onChange={v => set('crianca_uf', v)} placeholder="BA" />
            <F label="País" value={data.crianca_pais || ''} onChange={v => set('crianca_pais', v)} placeholder="Brasil" />
          </div>
        </div>

        {/* Download PDF / GOV.BR */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Opções de Assinatura</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => generatePDF(data)}
              className="flex-1 py-3 px-4 bg-gray-800 text-white font-bold text-sm rounded-xl hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Baixar PDF para Assinatura GOV.BR
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">Caso precise assinar via GOV.BR, baixe o PDF, assine digitalmente e entregue ao coordenador.</p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button type="button" onClick={handleSave} disabled={isSaving || !isValid}
            className={`flex-1 py-3.5 rounded-xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2
              ${isSaving || !isValid ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'}`}>
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Enviando...
              </>
            ) : !isValid ? 'Preencha os campos obrigatórios e assine' : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Assinar e Enviar Autorização
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
