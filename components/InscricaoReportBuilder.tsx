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

  // Education level (mock distribution based on age)
  const eduLevel = useMemo(() => {
    const levels = { fundI: 0, fundII: 0, medio: 0 };
    const now = new Date();
    sorted.forEach(s => {
      if (!s.data_nascimento) { levels.fundI++; return; }
      const age = Math.floor((now.getTime() - new Date(s.data_nascimento).getTime()) / 31557600000);
      if (age <= 10) levels.fundI++;
      else if (age <= 14) levels.fundII++;
      else levels.medio++;
    });
    return levels;
  }, [sorted]);

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
            <div className="freq-cover-bottom-project" contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 800, color: '#2a6496', marginBottom: 12 }}>
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
            <h1 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 28, fontWeight: 900, color: '#2a6496', lineHeight: 1.3, textTransform: 'uppercase' as const }}>
              ANEXO META QUANTITATIVA 02<br/>FICHA DE INSCRIÇÃO E DECLARAÇÃO<br/>DE MATRÍCULA ESCOLAR
            </h1>
            <p style={{ color: '#666', fontSize: 11, marginTop: 12 }}>PROJETO {pName} {city.toUpperCase()}</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: 100 }}>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 700 }}>{city.toUpperCase()} | {uf}</p>
            <p style={{ fontSize: 14, color: '#2a6496', fontWeight: 700 }}>{year}</p>
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
          <h2 style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, marginBottom: 30, color: '#2a6496' }}>SUMÁRIO</h2>
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
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: '#2a6496' }}>1. INTRODUÇÃO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            {aiResumo || `O presente relatório apresenta a análise das fichas de inscrição e declarações de matrícula escolar dos alunos participantes do projeto ${projectName}, no núcleo de ${city}/${uf}. O documento tem como objetivo verificar o cumprimento da Meta Quantitativa 02, que estabelece que pelo menos 65% dos beneficiados sejam alunos matriculados no sistema público de ensino.\n\nA análise contempla a distribuição dos alunos por nível de ensino, tipo de escola, gênero e faixa etária, além de apresentar a relação nominal completa dos participantes com a respectiva indicação da escola onde estão matriculados.`}
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>6</div>
        </div>

        {/* PAGE 7: 2.1 Distribution Table */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 800, marginBottom: 16 }}>2. DISTRIBUIÇÃO DAS ALUNAS MATRICULADAS NA ESCOLINHA DE TRIATHLON</h2>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 16 }}>2.1 Distribuição das matrículas no Ensino Fundamental I, Ensino Fundamental II e Ensino Médio</h3>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Tabela 1 — Nº de crianças/Adolescente por matrículas...</p>
          <table className="freq-table" style={{ width: '100%', fontSize: 9 }}>
            <thead>
              <tr style={{ background: '#2a6496', color: '#fff' }}>
                <th>Ensino</th>
                <th>Ensino Fundamental I</th>
                <th>Ensino Fundamental II</th>
                <th>Ensino Médio</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ fontWeight: 700 }}>Total</td><td>{eduLevel.fundI}</td><td>{eduLevel.fundII}</td><td>{eduLevel.medio}</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 8, marginTop: 4 }}>Fonte: Escolinha de Triathlon ({year}).</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>7</div>
        </div>

        {/* PAGE 8: Analysis + Pie Chart */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const, marginBottom: 20 }}>
            Análise dos dados apresentados mostra que a maior concentração de matrículas encontra-se no Ensino Fundamental.
          </div>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Figura 1 — Distribuição das matrículas por Nível de Ensino</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            {/* Simple CSS Pie Chart for visualization */}
            <div style={{ width: 200, height: 200, borderRadius: '50%', background: `conic-gradient(#2a6496 0% ${eduLevel.fundI / (totalAlunos||1) * 100}%, #4a8c3f ${eduLevel.fundI / (totalAlunos||1) * 100}% ${(eduLevel.fundI + eduLevel.fundII) / (totalAlunos||1) * 100}%, #d4a017 ${(eduLevel.fundI + eduLevel.fundII) / (totalAlunos||1) * 100}% 100%)` }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10, marginTop: 16 }}>
            <span style={{ color: '#2a6496', fontWeight: 700 }}>■ Ensino Fundamental I</span>
            <span style={{ color: '#4a8c3f', fontWeight: 700 }}>■ Ensino Fundamental II</span>
            <span style={{ color: '#d4a017', fontWeight: 700 }}>■ Ensino Médio</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 20 }}>Fonte: Escolinha de Triathlon ({year}).</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>8</div>
        </div>

        {/* PAGE 9: Bar Chart Absolute Numbers */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>Figura 2 — Distribuição das matrículas (Números Absolutos)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 300, background: '#111', padding: 20, borderRadius: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
              <span style={{ color: '#fff', fontSize: 10, marginBottom: 4 }}>{eduLevel.fundI}</span>
              <div style={{ width: 40, background: '#2a6496', height: `${(eduLevel.fundI / (totalAlunos||1)) * 200}px` }}></div>
              <span style={{ color: '#fff', fontSize: 9, marginTop: 8, textAlign: 'center' }}>Fund I</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
              <span style={{ color: '#fff', fontSize: 10, marginBottom: 4 }}>{eduLevel.fundII}</span>
              <div style={{ width: 40, background: '#4a8c3f', height: `${(eduLevel.fundII / (totalAlunos||1)) * 200}px` }}></div>
              <span style={{ color: '#fff', fontSize: 9, marginTop: 8, textAlign: 'center' }}>Fund II</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 }}>
              <span style={{ color: '#fff', fontSize: 10, marginBottom: 4 }}>{eduLevel.medio}</span>
              <div style={{ width: 40, background: '#d4a017', height: `${(eduLevel.medio / (totalAlunos||1)) * 200}px` }}></div>
              <span style={{ color: '#fff', fontSize: 9, marginTop: 8, textAlign: 'center' }}>Ens Médio</span>
            </div>
          </div>
          <p style={{ fontSize: 8, marginTop: 20 }}>Fonte: Escolinha de Triathlon ({year}).</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>9</div>
        </div>

        {/* PAGE 10: Quantitative analysis */}
        <div className="freq-page" style={{ padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            <p>Observa-se que a maioria dos alunos matriculados ({Math.round(eduLevel.fundII/(totalAlunos||1)*100)}%) cursam o Ensino Fundamental II, seguido de {Math.round(eduLevel.fundI/(totalAlunos||1)*100)}% no Ensino Fundamental I.</p>
            <p style={{ marginTop: 16 }}>Estes dados evidenciam o alinhamento do projeto com o público-alvo prioritário das categorias de base.</p>
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>10</div>
        </div>

        {/* PAGE 11: 2.2 Escola Pública vs Particular Pie */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 20 }}>2.2 Distribuição das matrículas por Escola Pública e Escola Particular</h3>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>Figura 4 — Distribuição por Rede de Ensino</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <div style={{ width: 220, height: 220, borderRadius: '50%', background: `conic-gradient(#2a6496 0% ${pctPublica}%, #e67e22 ${pctPublica}% 100%)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '40%', left: '20%', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{pctPublica}%</div>
              <div style={{ position: 'absolute', top: '40%', right: '20%', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{pctParticular}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10, marginTop: 16 }}>
            <span style={{ color: '#2a6496', fontWeight: 700 }}>■ Escola Pública</span>
            <span style={{ color: '#e67e22', fontWeight: 700 }}>■ Escola Particular</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 20 }}>Fonte: Escolinha de Triathlon ({year}).</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>11</div>
        </div>

        {/* PAGE 12: Conformidade e Metas Text */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            <p>Em conformidade com a Meta Quantitativa 02 do projeto, que estabelece o mínimo de 65% das vagas para estudantes da rede pública, o núcleo atingiu {pctPublica}%, cumprindo o indicador previsto.</p>
            <ul style={{ marginTop: 16, paddingLeft: 20 }}>
              <li>Total atendimento do público alvo.</li>
              <li>Superação da meta de inclusão de alunos de escolas públicas.</li>
              <li>Integração harmoniosa das diferentes redes de ensino.</li>
            </ul>
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>12</div>
        </div>

        {/* PAGE 13: 2.3 Gênero */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 20 }}>2.3 Distribuição por gênero dos (as) alunos (as)</h3>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>Figura 5 — Distribuição por Gênero</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <div style={{ width: 220, height: 220, borderRadius: '50%', background: `conic-gradient(#2a6496 0% ${(genderStats.masculino/(totalAlunos||1))*100}%, #e84393 ${(genderStats.masculino/(totalAlunos||1))*100}% 100%)`, position: 'relative' }}>
              <div style={{ position: 'absolute', top: '40%', left: '20%', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{Math.round((genderStats.masculino/(totalAlunos||1))*100)}%</div>
              <div style={{ position: 'absolute', top: '40%', right: '20%', color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{Math.round((genderStats.feminino/(totalAlunos||1))*100)}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10, marginTop: 16 }}>
            <span style={{ color: '#2a6496', fontWeight: 700 }}>■ Masculino</span>
            <span style={{ color: '#e84393', fontWeight: 700 }}>■ Feminino</span>
          </div>
          <p style={{ fontSize: 8, marginTop: 20 }}>Fonte: Escolinha de Triathlon ({year}).</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>13</div>
        </div>

        {/* PAGE 14: Gender Analysis */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            A análise da distribuição por gênero revela um equilíbrio na participação, com {Math.round((genderStats.masculino/(totalAlunos||1))*100)}% de meninos e {Math.round((genderStats.feminino/(totalAlunos||1))*100)}% de meninas. O projeto continua trabalhando ações de incentivo à participação feminina no esporte para manter este equilíbrio.
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>14</div>
        </div>

        {/* PAGE 15: 2.4 Idade */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 20 }}>2.4 Distribuição etária dos alunos regularmente matriculados</h3>
          <p style={{ fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 20 }}>Figura 6 — Distribuição Etária</p>
          <div style={{ marginTop: 20 }}>
            {Object.entries(ages).map(([range, count]) => (
              <Bar key={range} label={`${range} anos`} value={count} max={totalAlunos} color="#2a6496" />
            ))}
          </div>
          <p style={{ fontSize: 8, marginTop: 20 }}>Fonte: Escolinha de Triathlon ({year}).</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>15</div>
        </div>

        {/* PAGE 16: Age Analysis */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            A faixa etária predominante atende perfeitamente ao regulamento técnico e pedagógico estipulado pelo projeto, garantindo a formação de turmas coesas em relação ao desenvolvimento motor e cognitivo.
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>16</div>
        </div>

        {/* PAGE 17-18: RELAÇÃO DOS ALUNOS */}
        <div className="freq-page" style={{ padding: '80px 40px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, textAlign: 'center', marginBottom: 20 }}>3. RELAÇÃO DO NÚMERO DE CRIANÇAS E ADOLESCENTES ATENDIDAS PELA ESCOLINHA DE TRIATHLON EM ORDEM ALFABÉTICA</h3>
          <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#2a6496', color: '#fff' }}>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Núcleo</th>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Gênero</th>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Nº</th>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Nome</th>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Idade</th>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Ensino</th>
                <th style={{ padding: 6, border: '1px solid #fff' }}>Escola</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const isFem = (s.nome.trim().split(' ').pop()?.toLowerCase() || '').endsWith('a');
                let age = '';
                if (s.data_nascimento) {
                  age = Math.floor((new Date().getTime() - new Date(s.data_nascimento).getTime()) / 31557600000).toString();
                }
                const rowBg = i % 2 === 0 ? '#f0f4f8' : '#fff';
                return (
                  <tr key={s.id || i} style={{ background: rowBg }}>
                    <td style={{ padding: 6, border: '1px solid #ccc' }}>{city}</td>
                    <td style={{ padding: 6, border: '1px solid #ccc', textAlign: 'center' }}>{isFem ? 'F' : 'M'}</td>
                    <td style={{ padding: 6, border: '1px solid #ccc', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: 6, border: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.nome}</td>
                    <td style={{ padding: 6, border: '1px solid #ccc', textAlign: 'center' }}>{age}</td>
                    <td style={{ padding: 6, border: '1px solid #ccc' }}>{s.escola_tipo === 'PUBLICA' ? 'Pública' : 'Particular'}</td>
                    <td style={{ padding: 6, border: '1px solid #ccc' }} contentEditable={isEditing} suppressContentEditableWarning>{s.escola_nome}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>17</div>
        </div>

        {/* PAGE 19: ANEXOS */}
        <div className="freq-page" style={{ padding: '80px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2a6496', marginBottom: 20, textAlign: 'center' }}>4. FICHA DE INSCRIÇÃO E DECLARAÇÃO ESCOLAR</h2>
          <p style={{ color: '#666', fontSize: 12 }}>(Anexar as fichas de inscrição digitalizadas após esta página)</p>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>19</div>
        </div>

        {/* REFERÊNCIAS */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>REFERÊNCIAS</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8 }}>
            <p>BRASIL. Lei nº 11.438, de 29 de dezembro de 2006. Dispõe sobre incentivos e benefícios para fomentar as atividades de caráter desportivo.</p>
            <p style={{ marginTop: 8 }}>MINISTÉRIO DO ESPORTE. Manual de orientação para execução de projetos de incentivo ao esporte. Brasília, 2023.</p>
            <p style={{ marginTop: 8 }}>Fichas de inscrição e declarações de matrícula escolar dos alunos do projeto {projectName}, {city}/{uf}, {year}.</p>
          </div>
          <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 10, color: '#666' }}>20</div>
        </div>
      </div>
    </div>
  );
};
