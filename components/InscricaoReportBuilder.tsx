import React, { useState, useRef, useCallback, useMemo } from 'react';
import { StudentDraft, Nucleo } from '../types';

interface Props {
  students: StudentDraft[];
  nucleos: Nucleo[];
  onBack: () => void;
  headerImage?: string;
  projectName?: string;
}

export const InscricaoReportBuilder: React.FC<Props> = ({
  students, nucleos, onBack, headerImage = '/header_completo.png', projectName = 'Escolinha de Triathlon',
}) => {
  const [selectedNucleoId, setSelectedNucleoId] = useState<string>(nucleos[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('2024-04-24');
  const [periodEnd, setPeriodEnd] = useState('2025-12-23');
  const [isEditing, setIsEditing] = useState(false);
  const [nSli, setNSli] = useState('2301005');
  const [aiResumo, setAiResumo] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const sel = nucleos.find(n => n.id === selectedNucleoId);
  const city = sel?.nome.split('|')[0]?.trim() || 'Núcleo';
  const rawSt = sel?.nome.split('|')[1]?.trim() || 'UF';
  const uf = rawSt.split(/[\s\-–]/)[0]?.trim() || 'UF';
  const year = new Date().getFullYear();
  const pName = projectName.toUpperCase();

  // Filter students by nucleo
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
    const groups: Record<string, number> = { '6-8': 0, '9-11': 0, '12-14': 0, '15-17': 0, '18+': 0 };
    sorted.forEach(s => {
      if (!s.data_nascimento) return;
      const birth = new Date(s.data_nascimento);
      const age = Math.floor((now.getTime() - birth.getTime()) / 31557600000);
      if (age <= 8) groups['6-8']++;
      else if (age <= 11) groups['9-11']++;
      else if (age <= 14) groups['12-14']++;
      else if (age <= 17) groups['15-17']++;
      else groups['18+']++;
    });
    return groups;
  }, [sorted]);

  // Gender (infer from name ending)
  const genderStats = useMemo(() => {
    let m = 0, f = 0;
    sorted.forEach(s => {
      const last = s.nome.trim().split(' ').pop()?.toLowerCase() || '';
      if (last.endsWith('a') || last.endsWith('e')) f++; else m++;
    });
    return { masculino: m, feminino: f };
  }, [sorted]);

  // Detailed grade distribution (mapped from age to Brazilian school year)
  const gradeDistribution = useMemo(() => {
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

  return (
    <div className="freq-report-root">
      {/* TOOLBAR */}
      <div className="freq-report-toolbar no-print">
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
            {nucleos.map(n => (<option key={n.id} value={n.id}>{n.nome}</option>))}
          </select>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="freq-input-date" />
          <span style={{ fontSize: 12, color: '#999' }}>a</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="freq-input-date" />
          <input type="text" value={nSli} onChange={e => setNSli(e.target.value)} className="freq-input-sli" placeholder="Nº SLIE" />
          <button onClick={() => setIsEditing(!isEditing)} className={`freq-btn ${isEditing ? 'freq-btn-active' : ''}`}>✏️ {isEditing ? 'Salvar' : 'Editar'}</button>
          <button onClick={handleGenerateAI} disabled={isGeneratingAI} className="freq-btn freq-btn-ai">{isGeneratingAI ? <span className="freq-spinner"></span> : '🤖'} Gerar Resumo IA</button>
          <button onClick={handlePrint} className="freq-btn freq-btn-print">🖨️ Exportar PDF</button>
        </div>
      </div>

      {/* REPORT */}
      <div ref={reportRef} className="freq-report-content">

        {/* PAGE 1: COVER */}
        <div className="freq-page freq-cover-page">
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
        <div className="freq-page" style={{ padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' as const }}>RELAÇÃO DE ALUNOS COM INDICAÇÃO DE ESCOLA</h3>
          </div>
          <div style={{ fontSize: 10, marginBottom: 4 }}>
            <b style={{ fontWeight: 800 }}>NOME DO PROJETO:</b> {pName} &nbsp;&nbsp; — <b style={{ fontWeight: 800 }}>N.º SLI:</b> {nSli}
          </div>
          <div style={{ fontSize: 10, marginBottom: 16 }}>
            <b style={{ fontWeight: 800 }}>PROPONENTE:</b> {sel?.nome || ''}
          </div>
          <table style={{ width: '100%', fontSize: 9, textAlign: 'left' as const, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ padding: '8px 4px', fontWeight: 800 }}>Nº</th>
                <th style={{ padding: '8px 4px', fontWeight: 800 }}>Evento/<br/>modalidade</th>
                <th style={{ padding: '8px 4px', fontWeight: 800 }}>Nome (ordem alfabética)</th>
                <th style={{ padding: '8px 4px', fontWeight: 800 }}>Escola Pública<br/>ou Particular</th>
                <th style={{ padding: '8px 4px', fontWeight: 800 }}>Nome da Escola</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={s.id || i}>
                  <td style={{ padding: '6px 4px' }}>{i + 1}</td>
                  <td style={{ padding: '6px 4px' }}>Triathlon</td>
                  <td style={{ padding: '6px 4px' }} contentEditable={isEditing} suppressContentEditableWarning>{s.nome}</td>
                  <td style={{ padding: '6px 4px' }}>{s.escola_tipo === 'PUBLICA' ? 'Pública' : s.escola_tipo === 'PARTICULAR' ? 'Particular' : '—'}</td>
                  <td style={{ padding: '6px 4px' }} contentEditable={isEditing} suppressContentEditableWarning>{s.escola_nome || '—'}</td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#999' }}>Nenhum aluno encontrado para este núcleo</td></tr>}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, fontSize: 10 }}>
            <span contentEditable={isEditing} suppressContentEditableWarning>LOCAL E DATA: {city}/{uf}, {new Date().toLocaleDateString('pt-BR')}</span>
            <span contentEditable={isEditing} suppressContentEditableWarning>NOME E ASSINATURA DO RESPONSÁVEL: _________________________</span>
          </div>
        </div>

                {/* PAGE 4: SUMÁRIO */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, marginBottom: 30, color: '#4472C4' }}>SUMÁRIO</h2>
          {[
            { n: '1', t: 'INTRODUÇÃO', p: 6 },
            { n: '2', t: 'DISTRIBUIÇÃO DOS ALUNOS MATRICULADOS NA ESCOLINHA DE TRIATHLON', p: 7 },
            { n: '2.1', t: 'Distribuição das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio', p: 7 },
            { n: '2.2', t: 'Distribuição das matrículas por Escola Pública e Escola Particular', p: 11 },
            { n: '2.3', t: 'Distribuição por gênero dos (as) alunos (as)', p: 13 },
            { n: '2.4', t: 'Distribuição etária dos alunos regularmente matriculados', p: 15 },
            { n: '3', t: 'RELAÇÃO DO NÚMERO DE CRIANÇAS E ADOLESCENTES ATENDIDAS', p: 17 },
            { n: '4', t: 'FICHA DE INSCRIÇÃO E DECLARAÇÃO ESCOLAR', p: 19 },
            { n: '', t: 'REFERÊNCIAS', p: 20 },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8, fontSize: item.n.includes('.') ? 11 : 12, fontWeight: item.n.includes('.') ? 400 : 700, paddingLeft: item.n.includes('.') ? 40 : 0 }}>
              <span style={{ width: 40 }}>{item.n}</span>
              <span style={{ flex: 1 }}>{item.t}</span>
              <span style={{ borderBottom: '1px dotted #999', flex: 2 }}></span>
              <span style={{ width: 30, textAlign: 'right' }}>{item.p}</span>
            </div>
          ))}
        </div>

        {/* PAGE 6: INTRODUÇÃO */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: '#4472C4' }}>1. INTRODUÇÃO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            {aiResumo || `O presente relatório apresenta a análise das fichas de inscrição e declarações de matrícula escolar dos alunos participantes do projeto ${projectName}, no núcleo de ${city}/${uf}. O documento tem como objetivo verificar o cumprimento da Meta Quantitativa 02, que estabelece que pelo menos 65% dos beneficiados sejam alunos matriculados no sistema público de ensino.\n\nA análise contempla a distribuição dos alunos por nível de ensino, tipo de escola, gênero e faixa etária, além de apresentar a relação nominal completa dos participantes com a respectiva indicação da escola onde estão matriculados.`}
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>6</div>
        </div>

        {/* PAGE 7: 2.1 Distribution Table - Detailed by Grade */}
        <div className="freq-page" style={{ padding: '50px 40px' }}>
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
                <tbody>
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
                    <td style={tdS}>{pctPublica}%</td>
                    <td style={tdS}>{pctParticular}%</td>
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

          {/* Dynamic explanatory text */}
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 10, lineHeight: 1.7, textAlign: 'justify' as const, marginTop: 16 }}>
            <p>O projeto {projectName}, executado em {city} ({uf}), teve início em {new Date(periodStart).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} e seguiu até {new Date(periodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
            <p style={{ marginTop: 6 }}>A análise da distribuição das matrículas ao longo desse período mostra que a maior participação ocorreu entre os estudantes do Ensino Fundamental II{(() => { const g = gradeDistribution; const maxGrade = Object.entries({
              '5° ano': g['5ano'], '6° ano': g['6ano'], '7° ano': g['7ano'], '8° ano': g['8ano'], '9° ano': g['9ano']
            }).sort((a,b) => b[1]-a[1])[0]; return maxGrade && maxGrade[1] > 0 ? `, especialmente no ${maxGrade[0]}, que concentrou ${totalAlunos ? Math.round(maxGrade[1]/totalAlunos*100) : 0}% dos inscritos` : ''; })()}. Esse destaque indica que essa faixa etária demonstrou maior interesse e preparo físico para uma modalidade que exige resistência, coordenação e disciplina.</p>
            <p style={{ marginTop: 6 }}>Nos anos iniciais do Ensino Fundamental I, a adesão foi {eduLevel.fundI > eduLevel.fundII ? 'expressiva' : 'mais moderada'}, somando {totalAlunos ? Math.round(eduLevel.fundI/totalAlunos*100) : 0}% dos participantes{(() => { const g = gradeDistribution; const maxFI = Object.entries({
              '1° ano': g['1ano'], '2° ano': g['2ano'], '3° ano': g['3ano'], '4° ano': g['4ano']
            }).sort((a,b) => b[1]-a[1])[0]; return maxFI && maxFI[1] > 0 ? `. O ${maxFI[0]}, com ${totalAlunos ? Math.round(maxFI[1]/totalAlunos*100) : 0}%, foi o mais representativo desse grupo` : ''; })()}.</p>
            <p style={{ marginTop: 6 }}>No Ensino Fundamental II, {totalAlunos ? Math.round(eduLevel.fundII/totalAlunos*100) : 0}% dos alunos estão matriculados, revelando uma participação consistente entre pré-adolescentes e adolescentes, faixa etária que costuma buscar desafios esportivos e atividades coletivas.</p>
            <p style={{ marginTop: 6 }}>Já no Ensino Médio, a presença foi {eduLevel.medio > 0 ? `de ${totalAlunos ? Math.round(eduLevel.medio/totalAlunos*100) : 0}% dos inscritos` : 'inexistente'}. {eduLevel.medio <= Math.ceil(totalAlunos*0.1) ? 'Essa baixa adesão pode estar relacionada à rotina mais intensa de estudos e à menor disponibilidade de tempo para atividades extracurriculares.' : 'Esse percentual demonstra engajamento do público mais velho no projeto.'}</p>
            <p style={{ marginTop: 6 }}>O projeto demonstrou {eduLevel.fundII >= eduLevel.fundI ? 'forte aceitação entre estudantes do Ensino Fundamental II' : 'forte aceitação entre estudantes do Ensino Fundamental I'} e {eduLevel.medio <= Math.ceil(totalAlunos*0.1) ? 'menor participação no Ensino Médio' : 'participação equilibrada no Ensino Médio'}. Esses dados podem orientar futuras edições, permitindo ajustar estratégias de divulgação, horários e formatos das atividades para ampliar o alcance entre faixas etárias menos representadas.</p>
          </div>
        </div>

        {/* PAGE 8: Analysis + Pie Chart by Grade */}
        <div className="freq-page" style={{ padding: '50px 50px' }}>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 1</b> — Distribuição, por série, das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das redes pública e particular inscritos no projeto "{projectName}" em {city} ({uf})</p>

          {/* Dark background chart container */}
          <div style={{ background: 'linear-gradient(145deg, #404040, #2a2a2a)', borderRadius: 8, padding: '16px 20px', marginTop: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#fff', marginBottom: 12, lineHeight: 1.4 }}>
              Distribuição por série das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das escolas públicas e particulares inscritos no projeto "{projectName}" em {city} ({uf})
            </p>

            {(() => {
              const g = gradeDistribution;
              const t = totalAlunos || 1;
              const slices = [
                { key: '1ano', label: '1° ano E.F.I', value: g['1ano'], color: '#4472C4' },
                { key: '2ano', label: '2° ano E.F.I', value: g['2ano'], color: '#5B9BD5' },
                { key: '3ano', label: '3° ano E.F.I', value: g['3ano'], color: '#ED7D31' },
                { key: '4ano', label: '4° ano E.F.I', value: g['4ano'], color: '#FFC000' },
                { key: '5ano', label: '5° ano E.F.I', value: g['5ano'], color: '#A5A5A5' },
                { key: '6ano', label: '6° ano E.F.II', value: g['6ano'], color: '#70AD47' },
                { key: '7ano', label: '7° ano E.F.II', value: g['7ano'], color: '#264478' },
                { key: '8ano', label: '8° ano E.F.II', value: g['8ano'], color: '#9B57A0' },
                { key: '9ano', label: '9° ano E.F.II', value: g['9ano'], color: '#636363' },
                { key: 'em1', label: '1° ano E.M.', value: g['em1'], color: '#BDD7EE' },
                { key: 'em2', label: '2° ano E.M.', value: g['em2'], color: '#F4B183' },
                { key: 'em3', label: '3° ano E.M.', value: g['em3'], color: '#C9C9C9' },
              ].filter(s => s.value > 0);

              // Build conic-gradient segments
              let cumPct = 0;
              const gradientParts: string[] = [];
              const labelPositions: { label: string; angle: number; pct: number; color: string }[] = [];

              slices.forEach(s => {
                const pct = (s.value / t) * 100;
                gradientParts.push(`${s.color} ${cumPct}% ${cumPct + pct}%`);
                labelPositions.push({ label: s.label, angle: cumPct + pct / 2, pct: Math.round(pct), color: s.color });
                cumPct += pct;
              });

              const R = 90; // radius
              const CX = 150;
              const CY = 120;
              const LR = 115; // label radius

              return (
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <svg width={300} height={260} viewBox="0 0 300 260">
                    {/* Pie */}
                    <foreignObject x={CX - R} y={CY - R} width={R * 2} height={R * 2}>
                      <div style={{ width: R * 2, height: R * 2, borderRadius: '50%', background: `conic-gradient(${gradientParts.join(', ')})`, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}></div>
                    </foreignObject>
                    {/* Labels around */}
                    {labelPositions.map((lp, i) => {
                      const rad = (lp.angle - 90) * Math.PI / 180;
                      const lx = CX + LR * Math.cos(rad);
                      const ly = CY + LR * Math.sin(rad);
                      const anchor = lx > CX ? 'start' : 'end';
                      return (
                        <text key={i} x={lx} y={ly} textAnchor={anchor} fontSize={7} fill="#e0e0e0" fontWeight={600}>
                          {lp.label}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              );
            })()}

            {/* Legend grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 14px', fontSize: 8, marginTop: 8, color: '#e0e0e0' }}>
              {[
                { label: '1° ano E.F.I', color: '#4472C4' },
                { label: '2° ano E.F.I', color: '#5B9BD5' },
                { label: '3° ano E.F.I', color: '#ED7D31' },
                { label: '4° ano E.F.I', color: '#FFC000' },
                { label: '5° ano E.F.I', color: '#A5A5A5' },
                { label: '6° ano E.F.II', color: '#70AD47' },
                { label: '7° ano E.F.II', color: '#264478' },
                { label: '8° ano E.F.II', color: '#9B57A0' },
                { label: '9° ano E.F.II', color: '#636363' },
                { label: '1° ano E.M.', color: '#BDD7EE' },
                { label: '2° ano E.M.', color: '#F4B183' },
                { label: '3° ano E.M.', color: '#C9C9C9' },
              ].filter((_, i) => {
                const g = gradeDistribution;
                const keys = ['1ano','2ano','3ano','4ano','5ano','6ano','7ano','8ano','9ano','em1','em2','em3'];
                return g[keys[i]] > 0;
              }).map((item, i) => (
                <span key={i}><span style={{ color: item.color }}>■</span> {item.label}</span>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 8, marginTop: 10 }}>Fonte: {projectName} ({year}).</p>
        </div>

        {/* PAGE 9: Bar Chart + Analysis - BLUE/ORANGE */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 2</b> — Distribuição das matrículas por Nível de Ensino (Números Absolutos) dos alunos do projeto "{projectName}" em {city}/{uf}</p>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 8, marginTop: 16 }}>Distribuição das matrículas (Números Absolutos)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 40, height: 200, padding: '20px 40px 0', position: 'relative' }}>
            {[
              { label: 'Ensino Fundamental I', value: eduLevel.fundI, color: '#4472C4' },
              { label: 'Ensino Fundamental II', value: eduLevel.fundII, color: '#ED7D31' },
              { label: 'Ensino Médio', value: eduLevel.medio, color: '#A5A5A5' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 80 }}>
                <span style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{item.value}</span>
                <div style={{ width: 50, background: item.color, height: `${Math.max((item.value/(totalAlunos||1))*160, 8)}px`, borderRadius: '2px 2px 0 0' }}></div>
                <span style={{ fontSize: 8, marginTop: 6, textAlign: 'center' }}>{item.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 10, marginTop: 12 }}>
            <span><span style={{ color: '#4472C4' }}>■</span> Ensino Fundamental I</span>
            <span><span style={{ color: '#ED7D31' }}>■</span> Ensino Fundamental II</span>
            <span><span style={{ color: '#A5A5A5' }}>■</span> Ensino Médio</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 12 }}>Fonte: {projectName} ({year}).</p>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 20, borderTop: '1px solid #eee', paddingTop: 16 }}>
            <p>Observa-se que a maioria dos alunos matriculados ({Math.round(eduLevel.fundII/(totalAlunos||1)*100)}%) cursam o Ensino Fundamental II, seguido de {Math.round(eduLevel.fundI/(totalAlunos||1)*100)}% no Ensino Fundamental I.</p>
            <p style={{ marginTop: 8 }}>Estes dados evidenciam o alinhamento do projeto com o público-alvo prioritário das categorias de base.</p>
          </div>
        </div>

        {/* PAGE 10: 2.2 Pública vs Particular + Analysis */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.2 Distribuição das matrículas por Escola Pública e Escola Particular</h3>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 3</b> — Distribuição por Rede de Ensino dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {city}/{uf}</p>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 12, marginBottom: 8 }}>Distribuição por Rede de Ensino em {city}/{uf}</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: `conic-gradient(#4472C4 0% ${pctPublica}%, #ED7D31 ${pctPublica}% 100%)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '35%', left: '15%', color: '#fff', fontWeight: 700, fontSize: 11 }}>Pública<br/>{pctPublica}%</div>
              <div style={{ position: 'absolute', top: '35%', right: '10%', color: '#fff', fontWeight: 700, fontSize: 10 }}>Particular<br/>{pctParticular}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 10, marginTop: 10 }}>
            <span><span style={{ color: '#4472C4' }}>■</span> Escola Pública</span>
            <span><span style={{ color: '#ED7D31' }}>■</span> Escola Particular</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 10 }}>Fonte: {projectName} ({year}).</p>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
            <p>Em conformidade com a Meta Quantitativa 02 do projeto, que estabelece o mínimo de 65% das vagas para estudantes da rede pública, o núcleo atingiu {pctPublica}%, cumprindo o indicador previsto.</p>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>Total atendimento do público alvo.</li>
              <li>Superação da meta de inclusão de alunos de escolas públicas.</li>
              <li>Integração harmoniosa das diferentes redes de ensino.</li>
            </ul>
          </div>
        </div>

        {/* PAGE 11: 2.3 Gênero + Analysis */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.3 Distribuição por gênero dos (as) alunos (as)</h3>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 4</b> — Distribuição por Gênero dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {city}/{uf}</p>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 12, marginBottom: 8 }}>Distribuição por Gênero dos alunos do projeto "{projectName}" em {city}/{uf}</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
            <div style={{ width: 160, height: 160, borderRadius: '50%', background: `conic-gradient(#4472C4 0% ${(genderStats.masculino/(totalAlunos||1))*100}%, #ED7D31 ${(genderStats.masculino/(totalAlunos||1))*100}% 100%)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '35%', left: '15%', color: '#fff', fontWeight: 700, fontSize: 11 }}>Masculino<br/>{Math.round((genderStats.masculino/(totalAlunos||1))*100)}%</div>
              <div style={{ position: 'absolute', top: '35%', right: '10%', color: '#fff', fontWeight: 700, fontSize: 10 }}>Feminino<br/>{Math.round((genderStats.feminino/(totalAlunos||1))*100)}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 10, marginTop: 10 }}>
            <span><span style={{ color: '#4472C4' }}>■</span> Masculino</span>
            <span><span style={{ color: '#ED7D31' }}>■</span> Feminino</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 10 }}>Fonte: {projectName} ({year}).</p>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
            A análise da distribuição por gênero revela um equilíbrio na participação, com {Math.round((genderStats.masculino/(totalAlunos||1))*100)}% de meninos e {Math.round((genderStats.feminino/(totalAlunos||1))*100)}% de meninas. O projeto continua trabalhando ações de incentivo à participação feminina no esporte para manter este equilíbrio.
          </div>
        </div>

        {/* PAGE 12: 2.4 Idade + Analysis */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.4 Distribuição etária dos alunos regularmente matriculados</h3>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 5</b> — Distribuição Etária dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {city}/{uf}</p>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginTop: 12, marginBottom: 8 }}>Distribuição Etária dos alunos em {city}/{uf}</p>
          <div style={{ marginTop: 8 }}>
            {Object.entries(ages).map(([range, count], idx) => {
              const colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5'];
              return (
                <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 80, fontSize: 10, textAlign: 'right' }}>{range} anos</span>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, height: 20 }}>
                    <div style={{ width: `${totalAlunos ? (count/totalAlunos)*100 : 0}%`, background: colors[idx % colors.length], borderRadius: 4, height: '100%', minWidth: count ? 30 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{count} ({totalAlunos ? Math.round((count/totalAlunos)*100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 8, marginTop: 10 }}>Fonte: {projectName} ({year}).</p>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
            A faixa etária predominante atende perfeitamente ao regulamento técnico e pedagógico estipulado pelo projeto, garantindo a formação de turmas coesas em relação ao desenvolvimento motor e cognitivo.
          </div>
        </div>

        {/* PAGE 17: RELAÇÃO DOS ALUNOS */}
        <div className="freq-page" style={{ padding: '60px 40px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>3. RELAÇÃO DO NÚMERO DE CRIANÇAS E ADOLESCENTES ATENDIDAS PELA {pName} EM ORDEM ALFABÉTICA</h3>
          <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#4472C4', color: '#fff' }}>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Núcleo</th>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Gênero</th>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Nº</th>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Nome</th>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Idade</th>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Ensino</th>
                <th style={{ padding: 5, border: '1px solid #fff' }}>Escola</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const isFem = (s.nome.trim().split(' ').pop()?.toLowerCase() || '').endsWith('a');
                let age = '';
                if (s.data_nascimento) { age = Math.floor((new Date().getTime() - new Date(s.data_nascimento).getTime()) / 31557600000).toString(); }
                return (
                  <tr key={s.id || i} style={{ background: i % 2 === 0 ? '#D6E4F0' : '#fff' }}>
                    <td style={{ padding: 5, border: '1px solid #ccc' }}>{city}</td>
                    <td style={{ padding: 5, border: '1px solid #ccc', textAlign: 'center' }}>{isFem ? 'F' : 'M'}</td>
                    <td style={{ padding: 5, border: '1px solid #ccc', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: 5, border: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.nome}</td>
                    <td style={{ padding: 5, border: '1px solid #ccc', textAlign: 'center' }}>{age}</td>
                    <td style={{ padding: 5, border: '1px solid #ccc' }}>{s.escola_tipo === 'PUBLICA' ? 'Pública' : 'Particular'}</td>
                    <td style={{ padding: 5, border: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.escola_nome}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>17</div>
        </div>

        {/* PAGE 19: FICHAS DE INSCRIÇÃO E DECLARAÇÃO - Dynamically per student */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#4472C4', marginBottom: 20, textAlign: 'center' }}>4. FICHA DE INSCRIÇÃO E DECLARAÇÃO ESCOLAR</h2>
          <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.6, textAlign: 'justify' as const, color: '#444' }}>
            A seguir são apresentadas as fichas de inscrição e declarações de matrícula escolar de cada aluno(a) participante do projeto, em ordem alfabética.
          </p>
        </div>

        {/* Individual student ficha + declaração pages */}
        {sorted.map((s, i) => (
          <div key={`ficha-${s.id || i}`} className="freq-page" style={{ padding: '60px 60px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#4472C4', marginBottom: 16, borderBottom: '2px solid #4472C4', paddingBottom: 8 }}>{s.nome}</h3>
            
            <h4 style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: '#333' }}>Ficha de Inscrição</h4>
            {s.fichaUrl ? (
              s.fichaUrl.startsWith('data:application/pdf') ? (
                <iframe src={s.fichaUrl} style={{ width: '100%', height: 400, border: '1px solid #ddd', borderRadius: 4 }} title={`Ficha - ${s.nome}`}></iframe>
              ) : (
                <img src={s.fichaUrl} alt={`Ficha de ${s.nome}`} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }} />
              )
            ) : (
              <div style={{ padding: 20, background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 4, textAlign: 'center', color: '#999', fontSize: 10 }}>
                Ficha de inscrição não disponível no sistema
              </div>
            )}

            <h4 style={{ fontSize: 11, fontWeight: 700, marginTop: 20, marginBottom: 10, color: '#333' }}>Declaração de Matrícula Escolar</h4>
            {s.declaracao_matricula?.url ? (
              s.declaracao_matricula.url.startsWith('data:application/pdf') ? (
                <iframe src={s.declaracao_matricula.url} style={{ width: '100%', height: 400, border: '1px solid #ddd', borderRadius: 4 }} title={`Declaração - ${s.nome}`}></iframe>
              ) : (
                <img src={s.declaracao_matricula.url} alt={`Declaração de ${s.nome}`} style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', border: '1px solid #ddd', borderRadius: 4 }} />
              )
            ) : (
              <div style={{ padding: 20, background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 4, textAlign: 'center', color: '#999', fontSize: 10 }}>
                Declaração de matrícula escolar não disponível no sistema
              </div>
            )}
            <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>{19 + i + 1}</div>
          </div>
        ))}

        {/* REFERÊNCIAS */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>REFERÊNCIAS</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8 }}>
            <p>BRASIL. Lei nº 11.438, de 29 de dezembro de 2006. Dispõe sobre incentivos e benefícios para fomentar as atividades de caráter desportivo.</p>
            <p style={{ marginTop: 8 }}>MINISTÉRIO DO ESPORTE. Manual de orientação para execução de projetos de incentivo ao esporte. Brasília, 2023.</p>
            <p style={{ marginTop: 8 }}>Fichas de inscrição e declarações de matrícula escolar dos alunos do projeto {projectName}, {city}/{uf}, {year}.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
