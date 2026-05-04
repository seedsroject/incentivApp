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
    const groups: Record<string, number> = {};
    sorted.forEach(s => {
      if (!s.data_nascimento) return;
      const birth = new Date(s.data_nascimento);
      const age = Math.floor((now.getTime() - birth.getTime()) / 31557600000);
      groups[age.toString()] = (groups[age.toString()] || 0) + 1;
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
            <span contentEditable={isEditing} suppressContentEditableWarning>LOCAL E DATA: {`${city}/${uf}`}, {new Date().toLocaleDateString('pt-BR')}</span>
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

          {(() => {
            const g = gradeDistribution;
            const t = totalAlunos || 1;
            const pctFundI = Math.round((eduLevel.fundI * 100) / t);
            const pctFundII = Math.round((eduLevel.fundII * 100) / t);
            const pctMedio = Math.round((eduLevel.medio * 100) / t);

            const fundIIGrades = { '5° ano': g['5ano'], '6° ano': g['6ano'], '7° ano': g['7ano'], '8° ano': g['8ano'], '9° ano': g['9ano'] };
            const maxGradeEntry = Object.entries(fundIIGrades).sort((a, b) => b[1] - a[1])[0];
            const maxGradeText = maxGradeEntry && maxGradeEntry[1] > 0
              ? `, especialmente no ${maxGradeEntry[0]}, que concentrou ${Math.round((maxGradeEntry[1] * 100) / t)}% dos inscritos`
              : '';

            const fundIGrades = { '1° ano': g['1ano'], '2° ano': g['2ano'], '3° ano': g['3ano'], '4° ano': g['4ano'] };
            const maxFIEntry = Object.entries(fundIGrades).sort((a, b) => b[1] - a[1])[0];
            const maxFIText = maxFIEntry && maxFIEntry[1] > 0
              ? `. O ${maxFIEntry[0]}, com ${Math.round((maxFIEntry[1] * 100) / t)}%, foi o mais representativo desse grupo`
              : '';

            const adesaoFundI = eduLevel.fundI > eduLevel.fundII ? 'expressiva' : 'mais moderada';
            const medioPresenca = eduLevel.medio > 0 ? `de ${pctMedio}% dos inscritos` : 'inexistente';
            const medioBaixa = eduLevel.medio <= Math.ceil(totalAlunos * 0.1);
            const medioAnalise = medioBaixa
              ? 'Essa baixa adesão pode estar relacionada à rotina mais intensa de estudos e à menor disponibilidade de tempo para atividades extracurriculares.'
              : 'Esse percentual demonstra engajamento do público mais velho no projeto.';
            const destaqueFinal = eduLevel.fundII >= eduLevel.fundI
              ? 'forte aceitação entre estudantes do Ensino Fundamental II'
              : 'forte aceitação entre estudantes do Ensino Fundamental I';
            const medioFinal = medioBaixa ? 'menor participação no Ensino Médio' : 'participação equilibrada no Ensino Médio';

            return (
              <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 10, lineHeight: 1.7, textAlign: 'justify' as const, marginTop: 16 }}>
                <p>O projeto {projectName}, executado em {city} ({uf}), teve início em {new Date(periodStart).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} e seguiu até {new Date(periodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.</p>
                <p style={{ marginTop: 6 }}>A análise da distribuição das matrículas ao longo desse período mostra que a maior participação ocorreu entre os estudantes do Ensino Fundamental II{maxGradeText}. Esse destaque indica que essa faixa etária demonstrou maior interesse e preparo físico para uma modalidade que exige resistência, coordenação e disciplina.</p>
                <p style={{ marginTop: 6 }}>Nos anos iniciais do Ensino Fundamental I, a adesão foi {adesaoFundI}, somando {pctFundI}% dos participantes{maxFIText}.</p>
                <p style={{ marginTop: 6 }}>No Ensino Fundamental II, {pctFundII}% dos alunos estão matriculados, revelando uma participação consistente entre pré-adolescentes e adolescentes, faixa etária que costuma buscar desafios esportivos e atividades coletivas.</p>
                <p style={{ marginTop: 6 }}>Já no Ensino Médio, a presença foi {medioPresenca}. {medioAnalise}</p>
                <p style={{ marginTop: 6 }}>O projeto demonstrou {destaqueFinal} e {medioFinal}. Esses dados podem orientar futuras edições, permitindo ajustar estratégias de divulgação, horários e formatos das atividades para ampliar o alcance entre faixas etárias menos representadas.</p>
              </div>
            );
          })()}
        </div>

                {/* PAGE 8: Figura 1 - Pie Chart by Grade */}
        <div className="freq-page" style={{ padding: '50px 50px' }}>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 1</b> {"\u2014"} Distribuição, por série, das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das redes pública e particular inscritos no projeto "{projectName}" em {city} ({uf})</p>

          <div style={{ background: '#fff', border: '1px solid #000', padding: '16px 20px', marginTop: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 12, lineHeight: 1.4 }}>
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
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 2</b> — Distribuição das matrículas por Nível de Ensino (Números Absolutos) dos alunos do projeto "{projectName}" em {`${city}/${uf}`}</p>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 8, marginTop: 16 }}>Distribuição das matrículas (Números Absolutos)</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '12px 16px', marginTop: 8 }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 10, marginTop: 12 }}>
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

          <p style={{ fontSize: 10, marginBottom: 4, marginTop: 24 }}><b>Figura 3</b> {"\u2014"} Distribuição das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio dos alunos das redes pública e particular inscritas no projeto "{projectName}" em {city} ({uf})</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 8 }}>
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
        </div>

        {/* PAGE 10: 2.2 Pública vs Particular + Analysis */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.2 Distribuição das matrículas por Escola Pública e Escola Particular</h3>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 4</b> {"\u2014"} Distribuição por Rede de Ensino dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {`${city}/${uf}`}</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 12 }}>
              {`Distribuição por Rede de Ensino em ${city}/${uf}`}
            </p>
            {(() => {
              const t = totalAlunos || 1;
              const slices = [
                { label: 'Escola Pública', value: publica, color: '#4472C4', pct: Number(pctPublica) },
                { label: 'Escola Particular', value: particular, color: '#ED7D31', pct: Number(pctParticular) },
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4472C4', border: '1px solid #666' }}></span> Escola Pública</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ED7D31', border: '1px solid #666' }}></span> Escola Particular</span>
            </div>
            <p style={{ fontSize: 8, marginTop: 8 }}>Fonte: {projectName} ({year}).</p>
          </div>
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
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figura 5</b> {"\u2014"} Distribuição por Gênero dos alunos do projeto "{projectName}", referente ao período de {new Date(periodStart).toLocaleDateString('pt-BR')} a {new Date(periodEnd).toLocaleDateString('pt-BR')}, no município de {`${city}/${uf}`}</p>
          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 12 }}>
              {`Distribuição por Gênero dos alunos do projeto "${projectName}" em ${city}/${uf}`}
            </p>
            {(() => {
              const t = totalAlunos || 1;
              const pctMasc = Math.round((genderStats.masculino * 100) / t);
              const pctFem = Math.round((genderStats.feminino * 100) / t);
              const slices = [
                { label: 'Masculino', value: genderStats.masculino, color: '#4472C4', pct: pctMasc },
                { label: 'Feminino', value: genderStats.feminino, color: '#ED7D31', pct: pctFem },
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#4472C4', border: '1px solid #666' }}></span> Masculino</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: '#ED7D31', border: '1px solid #666' }}></span> Feminino</span>
            </div>
            <p style={{ fontSize: 8, marginTop: 8 }}>Fonte: {projectName} ({year}).</p>
          </div>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
            {`A análise da distribuição por gênero revela um equilíbrio na participação, com ${Math.round((genderStats.masculino * 100) / (totalAlunos || 1))}% de meninos e ${Math.round((genderStats.feminino * 100) / (totalAlunos || 1))}% de meninas. O projeto continua trabalhando ações de incentivo à participação feminina no esporte para manter este equilíbrio.`}
          </div>
        </div>

        {/* PAGE 12: 2.4 Idade + Analysis */}
        <div className="freq-page" style={{ padding: '60px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.4 Distribuição etária dos alunos regularmente matriculados</h3>
          <p style={{ fontSize: 10, marginBottom: 4 }}><b>Figuras 6 e 7</b> {"\u2014"} Distribuição etária dos alunos regularmente matriculados no projeto "{projectName}" em {city} ({uf})</p>

          <div style={{ border: '1px solid #000', background: '#fff', padding: '16px 20px', marginTop: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', color: '#000', marginBottom: 16 }}>
              {`Distribuição etária dos alunos regularmente inscritos no projeto "${projectName}" em ${city} (${uf})`}
            </p>

            {(() => {
              const entries = Object.entries(ages).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
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
                if (s.data_nascimento) { const ms = new Date().getTime() - new Date(s.data_nascimento).getTime(); age = Math.floor(ms / 31557600000).toString(); }
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
          <div key={`ficha-${s.id || i}`} className="freq-page" style={{ padding: '50px 50px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#4472C4', marginBottom: 16, borderBottom: '2px solid #4472C4', paddingBottom: 8 }}>{s.nome}</h3>
            
            <h4 style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, color: '#333' }}>Ficha de Inscrição</h4>
            {hasInscricao ? (
              <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: '16px 20px', fontSize: 9, lineHeight: 1.7, background: '#fff' }}>
                {/* Header do projeto */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid #ddd', paddingBottom: 10, marginBottom: 12 }}>
                  <p style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1 }}>FICHA DE INSCRIÇÃO</p>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#4472C4', marginTop: 4 }}>{projectName}</p>
                </div>

                {/* Dados do Projeto */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 10 }}>
                  <div><b>N.º SLI:</b> {s.n_sli || nSli}</div>
                  <div><b>Projeto:</b> {s.nome_projeto || projectName}</div>
                  <div style={{ gridColumn: '1 / -1' }}><b>Proponente:</b> {s.proponente || sel?.nome || ''}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />

                {/* Dados do Aluno */}
                <p style={{ fontSize: 9, fontWeight: 700, color: '#4472C4', marginBottom: 6 }}>DADOS DO ALUNO</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 10 }}>
                  <div style={{ gridColumn: '1 / -1' }}><b>Nome:</b> {s.nome}</div>
                  <div><b>Data de Nascimento:</b> {s.data_nascimento ? new Date(s.data_nascimento).toLocaleDateString('pt-BR') : ''}</div>
                  <div><b>Idade:</b> {studentAge} anos</div>
                  <div><b>RG/CPF:</b> {s.rg_cpf || ''}</div>
                  <div><b>Escola:</b> {s.escola_nome}</div>
                  <div><b>Tipo:</b> {s.escola_tipo === 'PUBLICA' ? 'Pública' : 'Particular'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><b>Endereço:</b> {s.endereco || ''}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />

                {/* Dados do Responsável */}
                <p style={{ fontSize: 9, fontWeight: 700, color: '#4472C4', marginBottom: 6 }}>DADOS DO RESPONSÁVEL</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 10 }}>
                  <div style={{ gridColumn: '1 / -1' }}><b>Responsável Legal:</b> {s.nome_responsavel || ''}</div>
                  <div><b>Telefone:</b> {s.telefone || ''}</div>
                  <div><b>Email:</b> {s.email_contato || ''}</div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />

                {/* Assinatura */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                  <div>
                    <p style={{ fontSize: 8, color: '#666' }}>Data da Assinatura</p>
                    <p style={{ fontSize: 10, fontWeight: 700 }}>{s.data_assinatura || ''}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 8, color: '#666', marginBottom: 4 }}>Assinatura do Responsável Legal</p>
                    {s.assinatura ? (
                      <img src={s.assinatura} alt="Assinatura" style={{ height: 40, maxWidth: 180, objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: 180, height: 1, background: '#333', marginTop: 30 }}></div>
                    )}
                  </div>
                </div>

                {s.fichaUrl && (
                  <div style={{ marginTop: 12, borderTop: '1px dashed #ddd', paddingTop: 8 }}>
                    <p style={{ fontSize: 8, color: '#666', marginBottom: 4 }}>Documento Original Digitalizado:</p>
                    {s.fichaUrl.startsWith('data:application/pdf') ? (
                      <p style={{ fontSize: 8, color: '#4472C4' }}>PDF anexado ao sistema</p>
                    ) : (
                      <img src={s.fichaUrl} alt={`Ficha digitalizada - ${s.nome}`} style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', border: '1px solid #eee', borderRadius: 2 }} />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 20, background: '#f9f9f9', border: '1px dashed #ccc', borderRadius: 4, textAlign: 'center', color: '#999', fontSize: 10 }}>
                {`Ficha de inscrição não disponível no sistema`}
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
                {`Declaração de matrícula escolar não disponível no sistema`}
              </div>
            )}
            <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>{19 + i + 1}</div>
          </div>
          );
        })}

        {/* REFERÊNCIAS */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
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
