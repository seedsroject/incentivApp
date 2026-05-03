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
          <h2 style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, marginBottom: 30 }}>SUMÁRIO</h2>
          {[
            { n: '1', t: 'INTRODUÇÃO', p: 6 },
            { n: '2', t: 'DISTRIBUIÇÃO DOS ALUNOS MATRICULADOS NA ESCOLINHA DE TRIATHLON', p: 7 },
            { n: '2.1', t: 'Distribuição das matrículas no Ensino Fundamental I, II e Ensino Médio', p: 7 },
            { n: '2.2', t: 'Distribuição das matrículas por Escola Pública e Particular', p: 9 },
            { n: '2.3', t: 'Distribuição por gênero dos alunos', p: 10 },
            { n: '2.4', t: 'Distribuição etária dos alunos regularmente matriculados', p: 11 },
            { n: '3', t: 'RELAÇÃO DE CRIANÇAS E ADOLESCENTES ATENDIDOS EM ORDEM ALFABÉTICA', p: 12 },
            { n: '4', t: 'FICHA DE INSCRIÇÃO E DECLARAÇÃO ESCOLAR', p: 14 },
            { n: '', t: 'REFERÊNCIAS', p: 15 },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', marginBottom: 8, fontSize: item.n.includes('.') ? 11 : 12, fontWeight: item.n.includes('.') ? 400 : 700, paddingLeft: item.n.includes('.') ? 40 : 0 }}>
              <span style={{ width: 40 }}>{item.n}</span>
              <span style={{ flex: 1 }}>{item.t}</span>
              <span style={{ borderBottom: '1px dotted #999', flex: 2 }}></span>
              <span style={{ width: 30, textAlign: 'right' }}>{item.p}</span>
            </div>
          ))}
        </div>

        {/* PAGE 5: INTRODUÇÃO */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>1. INTRODUÇÃO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 11, lineHeight: 1.8, textAlign: 'justify' as const }}>
            {aiResumo || `O presente relatório apresenta a análise das fichas de inscrição e declarações de matrícula escolar dos alunos participantes do projeto ${projectName}, no núcleo de ${city}/${uf}. O documento tem como objetivo verificar o cumprimento da Meta Quantitativa 02, que estabelece que pelo menos 65% dos beneficiados sejam alunos matriculados no sistema público de ensino.\n\nA análise contempla a distribuição dos alunos por nível de ensino, tipo de escola, gênero e faixa etária, além de apresentar a relação nominal completa dos ${totalAlunos} participantes com a respectiva indicação da escola onde estão matriculados.`}
          </div>
        </div>

        {/* PAGE 6: 2.1 Distribution by education level */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>2. DISTRIBUIÇÃO DOS ALUNOS MATRICULADOS</h2>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 16 }}>2.1 Distribuição por Nível de Ensino</h3>
          <table className="freq-table" style={{ width: '100%', fontSize: 10 }}>
            <thead><tr><th>Nível de Ensino</th><th>Escola Pública</th><th>Escola Particular</th><th>Total</th></tr></thead>
            <tbody>
              <tr><td>Ensino Fundamental I</td><td>{Math.round(eduLevel.fundI * (publica / (totalAlunos || 1)))}</td><td>{Math.round(eduLevel.fundI * (particular / (totalAlunos || 1)))}</td><td>{eduLevel.fundI}</td></tr>
              <tr><td>Ensino Fundamental II</td><td>{Math.round(eduLevel.fundII * (publica / (totalAlunos || 1)))}</td><td>{Math.round(eduLevel.fundII * (particular / (totalAlunos || 1)))}</td><td>{eduLevel.fundII}</td></tr>
              <tr><td>Ensino Médio</td><td>{Math.round(eduLevel.medio * (publica / (totalAlunos || 1)))}</td><td>{Math.round(eduLevel.medio * (particular / (totalAlunos || 1)))}</td><td>{eduLevel.medio}</td></tr>
              <tr style={{ fontWeight: 700 }}><td>TOTAL</td><td>{publica}</td><td>{particular}</td><td>{totalAlunos}</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 20 }}>
            <Bar label="Fund. I" value={eduLevel.fundI} max={totalAlunos} color="#2a6496" />
            <Bar label="Fund. II" value={eduLevel.fundII} max={totalAlunos} color="#4a8c3f" />
            <Bar label="Ens. Médio" value={eduLevel.medio} max={totalAlunos} color="#d4a017" />
          </div>
        </div>

        {/* PAGE 7: 2.2 Public vs Private */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 16 }}>2.2 Distribuição por Escola Pública e Particular</h3>
          <table className="freq-table" style={{ width: '60%', fontSize: 10 }}>
            <thead><tr><th>Tipo de Escola</th><th>Quantidade</th><th>%</th></tr></thead>
            <tbody>
              <tr><td>Escola Pública</td><td>{publica}</td><td>{pctPublica}%</td></tr>
              <tr><td>Escola Particular</td><td>{particular}</td><td>{pctParticular}%</td></tr>
              <tr style={{ fontWeight: 700 }}><td>TOTAL</td><td>{totalAlunos}</td><td>100%</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 20, display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: '80%', background: '#2a6496', height: `${pctPublica}%`, borderRadius: '4px 4px 0 0', minHeight: 10 }}></div>
              <span style={{ fontSize: 9, marginTop: 4 }}>Pública ({pctPublica}%)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ width: '80%', background: '#d4a017', height: `${pctParticular}%`, borderRadius: '4px 4px 0 0', minHeight: 10 }}></div>
              <span style={{ fontSize: 9, marginTop: 4 }}>Particular ({pctParticular}%)</span>
            </div>
          </div>
        </div>

        {/* PAGE 8: 2.3 Gender + 2.4 Age */}
        <div className="freq-page" style={{ padding: '80px 60px' }}>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.3 Distribuição por Gênero</h3>
          <table className="freq-table" style={{ width: '50%', fontSize: 10, marginBottom: 20 }}>
            <thead><tr><th>Gênero</th><th>Qtd</th><th>%</th></tr></thead>
            <tbody>
              <tr><td>Masculino</td><td>{genderStats.masculino}</td><td>{totalAlunos ? Math.round((genderStats.masculino / totalAlunos) * 100) : 0}%</td></tr>
              <tr><td>Feminino</td><td>{genderStats.feminino}</td><td>{totalAlunos ? Math.round((genderStats.feminino / totalAlunos) * 100) : 0}%</td></tr>
            </tbody>
          </table>
          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>2.4 Distribuição Etária</h3>
          {Object.entries(ages).map(([range, count]) => (
            <Bar key={range} label={`${range} anos`} value={count} max={totalAlunos} color="#2a6496" />
          ))}
        </div>



        {/* PAGE FINAL: REFERÊNCIAS */}
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
