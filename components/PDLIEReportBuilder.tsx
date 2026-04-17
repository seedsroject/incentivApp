import React, { useState, useMemo, useRef } from 'react';
import { Nucleo, EvidenceLog } from '../types';

interface Props {
  nucleos: Nucleo[];
  evidences: EvidenceLog[];
  onBack: () => void;
}

const SECTIONS = [
  { id: 'UNIFORMES', num: '2', title: 'AÇÃO: UNIFORMES', subs: [
    { num: '2.1', title: 'Bermuda treino' },
    { num: '2.2', title: 'Camiseta treino' },
    { num: '2.3', title: 'Agasalho calça e casaco' },
    { num: '2.4', title: 'Boné esportivo' },
    { num: '2.5', title: 'Sacola Esportiva' },
    { num: '2.6', title: 'Sunga/Maiô' },
    { num: '2.7', title: 'Macaquinho triathlon' },
  ]},
  { id: 'MATERIAIS_CONSUMO', num: '3', title: 'MATERIAL DE CONSUMO / ESPORTIVO', subs: [
    { num: '3.1', title: 'Bicicleta Mountain Bike' },
    { num: '3.2', title: 'Rolo de Ciclismo indor' },
    { num: '3.3', title: 'Bicicleta Road (estrada)' },
    { num: '3.4', title: 'Óculos de Natação' },
    { num: '3.5', title: 'Touca de Natação' },
    { num: '3.6', title: 'Capacete ciclismo' },
  ]},
  { id: 'HOSPEDAGEM', num: '4', title: 'HOSPEDAGEM / ALIMENTAÇÃO', subs: [
    { num: '4.1', title: 'Kit lanche' },
  ]},
  { id: 'DIVULGACAO', num: '5', title: 'MATERIAL DE DIVULGAÇÃO', subs: [
    { num: '5.1', title: 'Rollbanner' },
    { num: '5.2', title: 'Windbanners' },
  ]},
];

export const PDLIEReportBuilder: React.FC<Props> = ({ nucleos, evidences, onBack }) => {
  const [selectedNucleoId, setSelectedNucleoId] = useState(nucleos[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('2024-04-24');
  const [periodEnd, setPeriodEnd] = useState('2025-12-23');
  const [nSli, setNSli] = useState('2301005');
  const [isEditing, setIsEditing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const selectedNucleo = useMemo(() => nucleos.find(n => n.id === selectedNucleoId), [nucleos, selectedNucleoId]);
  const nucleoShort = selectedNucleo?.nome?.split('|')[0]?.trim() || selectedNucleo?.nome || '';
  const nucleoFull = selectedNucleo?.nome || '';
  const stateLabel = nucleoFull.match(/\|\s*(\w{2})/)?.[1] || 'PR';
  const year = new Date().getFullYear();

  // Group evidences by their description (used as sub-section title match)
  const filteredEvidences = useMemo(() => {
    return evidences.filter(ev => {
      if (!ev.imageUrl) return false;
      return true;
    });
  }, [evidences]);

  // Map evidence to sections by category type
  const getEvidencesForCategory = (categoryId: string) => {
    return filteredEvidences.filter(ev => ev.type === categoryId);
  };

  // Build figure numbering
  const allFigures = useMemo(() => {
    let figNum = 0;
    const figs: { figNum: number; ev: EvidenceLog; sectionNum: string; subTitle: string }[] = [];
    SECTIONS.forEach(sec => {
      const catEvs = getEvidencesForCategory(sec.id);
      catEvs.forEach((ev) => {
        figNum++;
        // Match to sub by description or just assign sequentially
        const subIdx = Math.min(Math.floor((figs.filter(f => f.sectionNum.startsWith(sec.num)).length) / Math.max(1, Math.ceil(catEvs.length / sec.subs.length))), sec.subs.length - 1);
        const sub = sec.subs[subIdx] || sec.subs[0];
        figs.push({ figNum, ev, sectionNum: sub.num, subTitle: sub.title });
      });
    });
    return figs;
  }, [filteredEvidences]);

  // TOC items
  const tocItems = useMemo(() => {
    const items: { num: string; title: string; page: number }[] = [];
    let pg = 8;
    items.push({ num: '1', title: 'INTRODUÇÃO', page: pg++ });
    SECTIONS.forEach(sec => {
      items.push({ num: sec.num, title: sec.title, page: pg++ });
      sec.subs.forEach(sub => {
        items.push({ num: sub.num, title: sub.title, page: pg++ });
      });
    });
    items.push({ num: '6', title: 'CONCLUSÃO', page: pg++ });
    items.push({ num: '', title: 'REFERÊNCIAS', page: pg++ });
    return items;
  }, []);

  // Figure list for "LISTA DE FIGURAS"
  const figureList = useMemo(() => {
    return allFigures.map(f => ({
      num: f.figNum,
      title: f.ev.description || f.subTitle,
    }));
  }, [allFigures]);

  const handlePrint = () => window.print();

  const introText = `Antes de iniciar a discussão, é necessário colocar que a Lei nº 11.438/06 – Lei de Incentivo ao Esporte (LIE) –, como é mais conhecida, permite que recursos provenientes de renúncia fiscal sejam aplicados em projetos das diversas manifestações desportivas e paradesportivas distribuídos por todo o território nacional. Por meio de doações e patrocínios, os projetos executados via Lei de Incentivo ao Esporte atendem crianças, adolescentes, jovens, adultos, pessoas com deficiência e idosos (MINISTÉRIO DO ESPORTE, 2024).

A partir disso, é que colocamos que o Relatório do Plano de divulgação da Lei de Incentivo ao Esporte – PDLIE da Escolinha de Triathlon ${nucleoShort} que tem execução da Federação Paranaense de Triathlon e é viabilizada pela Lei de Incentivo ao Esporte, programa do Ministério do Esporte e Governo Federal, cujo objetivo é realização de aulas de Triathlon (natação, ciclismo e corrida) para crianças e adolescentes de 08 a 17 anos, devidamente matriculados em escolas públicas e particulares. Objetivou-se apresentar um demonstrativo do layout das peças de divulgação que são utilizados na Escolinha de Triathlon ${nucleoShort}, localizada em ${nucleoShort}, ${stateLabel}, destacando a importância do apoio institucional da Lei de Incentivo ao Esporte, com inserção de seu selo e Bandeira Nacional, em todas as nossas atividades, bens ou serviços resultantes do projeto.

Foram selecionadas fotos, media e repor utilizadas nas peças de divulgação na Escolinha de Triathlon ${nucleoShort}. Buscamos, a cada apresentação, apontar o compromisso conjunto do Ministério do Esporte e do Governo Federal em ampliar o desenvolvimento e o acesso da população ao esporte.

O presente relatório está dividido em três partes. Na primeira parte, portanto, se apresenta as atividades da Escolinha de Triathlon ${nucleoShort}; em seguida a luz do Manual da Lei de Incentivo ao Esporte (2023) aponta-se os bens ou serviços resultantes do projeto; e, por fim, destaca-se o apêndice com as media e repor.`;

  const conclusionText = `A conclusão deste relatório sobre o Plano de Divulgação da Lei de Incentivo ao Esporte – PDLIE na Escolinha de Triathlon ${nucleoShort} destaca o compromisso conjunto do Ministério do Esporte e do Governo Federal em promover o desenvolvimento e acesso ao esporte, especialmente para crianças e jovens. Através do apoio institucional da Lei de Incentivo ao Esporte, este projeto tem conseguido oferecer oportunidades para o crescimento pessoal e social, além de contribuir para a formação de uma cultura esportiva inclusiva no Brasil.

Ao evidenciar a presença do selo e da Bandeira Nacional em todas as atividades do projeto, juntamente com as logomarcas do Ministério do Esporte e do Governo Federal, reforçamos o compromisso com a transparência e o uso responsável dos recursos destinados ao esporte.

Através deste relatório, espera-se não apenas demonstrar as ações realizadas pela Escolinha de Triathlon ${nucleoShort}, mas também inspirar outros projetos e instituições a aproveitarem os benefícios da Lei de Incentivo ao Esporte para promoverem o desenvolvimento e a inclusão social através do esporte em suas comunidades.

Em suma, este projeto é mais do que uma simples prática esportiva; é um instrumento poderoso de transformação social e construção de um futuro mais promissor para as crianças e jovens brasileiros.`;

  const pageStyle: React.CSSProperties = {
    width: '210mm', minHeight: '297mm', margin: '0 auto 24px', padding: '30mm 25mm',
    background: '#fff', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', fontFamily: "'Times New Roman', Times, serif",
    fontSize: 13, lineHeight: 1.8, color: '#222', position: 'relative', pageBreakAfter: 'always',
  };

  return (
    <div className="freq-report-root">
      {/* ═══ TOOLBAR ═══ */}
      <div className="freq-report-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="freq-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>Relatório PDLIE</h1>
            <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Relatório editável • {nucleoShort}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={selectedNucleoId} onChange={e => setSelectedNucleoId(e.target.value)} className="freq-select">
            {nucleos.map(n => <option key={n.id} value={n.id}>{n.nome.split('|')[0]?.trim()}</option>)}
          </select>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="freq-input-date" />
          <span style={{ fontSize: 12, color: '#999' }}>a</span>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="freq-input-date" />
          <input type="text" value={nSli} onChange={e => setNSli(e.target.value)} className="freq-input-sli" placeholder="Nº SLIE" />
          <button onClick={() => setIsEditing(!isEditing)} className={`freq-btn ${isEditing ? 'freq-btn-active' : ''}`}>
            ✏️ {isEditing ? 'Salvar' : 'Editar'}
          </button>
          <button onClick={handlePrint} className="freq-btn freq-btn-print">🖨️ Exportar PDF</button>
        </div>
      </div>

      {/* ═══ REPORT CONTENT ═══ */}
      <div ref={reportRef} className="freq-report-content">

        {/* ━━━ CAPA ━━━ */}
        <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 60 }}>
            <img src="/assets/lei_do_incentivo.png" alt="LIE" style={{ height: 70 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <img src="/logo.png" alt="Logo" style={{ height: 75 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: '#333', textAlign: 'center' }}>
              <div>MINISTÉRIO DO<br/>ESPORTE</div>
              <div style={{ fontSize: 8, color: '#555', marginTop: 4 }}>GOVERNO DO<br/>BRASIL</div>
            </div>
          </div>
          <h1 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 26, fontWeight: 900, color: '#1a1a2e', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>
            Relatório do Plano de Divulgação da Lei de Incentivo ao Esporte – PDLIE
          </h1>
          <h2 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 60 }}>
            Escolinha de Triathlon {nucleoShort}
          </h2>
          <div style={{ marginTop: 'auto', paddingTop: 80 }}>
            <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 15, fontWeight: 700, color: '#444' }}>{nucleoShort} – {stateLabel}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1a5276' }}>{year}</p>
          </div>
        </div>

        {/* ━━━ LISTA DE FIGURAS ━━━ */}
        <div style={pageStyle}>
          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 30, color: '#111' }}>LISTA DE FIGURAS</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {figureList.length > 0 ? figureList.map((f, i) => (
                <tr key={i}>
                  <td style={{ padding: '6px 0', fontSize: 12, color: '#333', borderBottom: '1px dotted #ccc' }}>
                    Figura {f.num} — {f.title}
                  </td>
                  <td style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#333', borderBottom: '1px dotted #ccc' }}>
                    {i + 9}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={2} style={{ padding: 20, textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                  Nenhuma evidência fotográfica cadastrada. Adicione fotos no serviço Evidências (Fotos) nas categorias: Uniformes, Material de Consumo, Hospedagem/Alimentação e Divulgação.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ━━━ SUMÁRIO ━━━ */}
        <div style={pageStyle}>
          <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, marginBottom: 30, color: '#111' }}>SUMÁRIO</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {tocItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ width: 50, fontWeight: 700, fontSize: 13, color: '#333', paddingRight: 12 }}>{item.num}</td>
                  <td style={{ fontSize: 13, color: '#333', borderBottom: '1px dotted #ccc', padding: '8px 0' }}>
                    <span contentEditable={isEditing} suppressContentEditableWarning>{item.title}</span>
                  </td>
                  <td style={{ width: 50, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#333' }}>{item.page}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ━━━ 1. INTRODUÇÃO ━━━ */}
        <div style={pageStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>1 INTRODUÇÃO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, lineHeight: 2, textAlign: 'justify', color: '#333', whiteSpace: 'pre-wrap' }}>
            {introText}
          </div>
        </div>

        {/* ━━━ SECTIONS 2-5: PHOTOS BY CATEGORY ━━━ */}
        {SECTIONS.map(sec => {
          const catEvs = getEvidencesForCategory(sec.id);
          return (
            <React.Fragment key={sec.id}>
              {/* Section header page */}
              <div style={pageStyle}>
                <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>{sec.num} {sec.title}</h2>

                {catEvs.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', border: '2px dashed #ddd', borderRadius: 12, marginTop: 30 }}>
                    <p style={{ color: '#999', fontSize: 14 }}>Nenhuma foto cadastrada nesta categoria.</p>
                    <p style={{ color: '#bbb', fontSize: 12, marginTop: 8 }}>Adicione fotos no serviço <strong>Evidências (Fotos)</strong> com a categoria "<strong>{sec.title}</strong>".</p>
                  </div>
                ) : (
                  /* Render each evidence as a figure page */
                  catEvs.map((ev, evIdx) => {
                    const globalFig = allFigures.find(f => f.ev.id === ev.id);
                    const figNum = globalFig?.figNum || (evIdx + 1);
                    const subIdx = Math.min(evIdx, sec.subs.length - 1);
                    const sub = sec.subs[subIdx];
                    const figTitle = ev.description || sub?.title || '';

                    return (
                      <div key={ev.id} style={{ ...(evIdx === 0 ? {} : pageStyle) }}>
                        {/* Sub-section title (only for first photo of each sub) */}
                        {sub && evIdx < sec.subs.length && (
                          <h3 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#222' }}>
                            {sub.num} {sub.title}
                          </h3>
                        )}

                        {/* Figure caption */}
                        <p contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, color: '#333', marginBottom: 12 }}>
                          <strong>Figura {figNum}</strong> — {figTitle}
                        </p>

                        {/* Photo */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                          {ev.imageUrl ? (
                            <img
                              src={ev.imageUrl}
                              alt={`Figura ${figNum}`}
                              style={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 4 }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: 300, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0', borderRadius: 4 }}>
                              <span style={{ color: '#ccc', fontSize: 14 }}>Sem imagem</span>
                            </div>
                          )}
                        </div>

                        {/* Source */}
                        <p style={{ fontSize: 11, color: '#888', textAlign: 'left' }}>
                          Fonte: Escolinha de Triathlon {nucleoShort} ({ev.date ? new Date(ev.date).getFullYear() : year})
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* ━━━ CONCLUSÃO ━━━ */}
        <div style={pageStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>CONCLUSÃO</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 13, lineHeight: 2, textAlign: 'justify', color: '#333', whiteSpace: 'pre-wrap' }}>
            {conclusionText}
          </div>
        </div>

        {/* ━━━ REFERÊNCIAS ━━━ */}
        <div style={pageStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#111' }}>REFERÊNCIAS</h2>
          <div contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 12, lineHeight: 2, textAlign: 'justify', color: '#333' }}>
            <p>ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. MANUAL DA LEI DE INCENTIVO AO ESPORTE. Diretoria de Programas e Políticas de Incentivo ao Esporte (DPPIE). Brasília, 2023.</p>
            <p style={{ marginTop: 16 }}>ESPORTE, Do. Lei nº 11.438, de 29 de dezembro de 2006. Dispõe sobre incentivos e benefícios para fomentar as atividades de caráter desportivo e dá outras providências, 2006.</p>
          </div>
        </div>

        {/* ━━━ APÊNDICE ━━━ */}
        <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h1 contentEditable={isEditing} suppressContentEditableWarning style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', textTransform: 'uppercase', lineHeight: 1.6 }}>
            APÊNDICE DO RELATÓRIO DO PLANO DE DIVULGAÇÃO<br/>DA LEI DE INCENTIVO AO ESPORTE – PDLIE DA<br/>ESCOLINHA DE TRIATHLON {nucleoShort.toUpperCase()}
          </h1>
          <div style={{ marginTop: 60 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#444' }}>{nucleoShort.toUpperCase()} - {stateLabel}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1a5276' }}>{year}</p>
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default PDLIEReportBuilder;
