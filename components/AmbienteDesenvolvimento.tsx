import React, { useState } from 'react';
import { generateReportCoverAndIntro, createFinalDossier, triggerPdfDownload } from '../utils/pdfGenerator';
import { Nucleo, PDFPage, StudentDraft, DocumentLog } from '../types';
import { PDFBuilderProvider, usePDFBuilder } from './PDFBuilderContext';
import { PDFBuilderPreview } from './PDFBuilderSidebar';
import { getReportTemplate } from '../utils/reportTemplates';

interface AmbienteDesenvolvimentoProps {
  nucleos: Nucleo[];
  students: StudentDraft[];
  history: DocumentLog[];
  onOpenBuilder: () => void;
  onOpenFrequencyReport?: () => void;
  onOpenPDLIEReport?: () => void;
  onBack?: () => void;
}

export default function AmbienteDesenvolvimento({ nucleos, students, history, onOpenBuilder, onOpenFrequencyReport, onOpenPDLIEReport, onBack }: AmbienteDesenvolvimentoProps) {
  const { loadTemplate } = usePDFBuilder();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedNucleo, setSelectedNucleo] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [aiSummaryText, setAiSummaryText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Filtros da listagem principal
  const [filterNucleo, setFilterNucleo] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  const reports = [
    {
      id: 'assiduidade',
      title: 'Anexo Meta Qualitativa 01 - Relatório de Assiduidade e Aproveitamento Escolar',
      coverType: 'blue',
      year: '2026',
      city: 'Horizonte – CE',
      proponente: 'ESCOLINHA DE TRIATHLON HORIZONTE'
    },
    {
      id: 'frequencia',
      title: 'Anexo Meta Quantitativa 01 - Lista de Frequência',
      coverType: 'blue',
      year: '2026',
      city: 'Ilhéus – BA',
      proponente: 'ESCOLINHA DE TRIATHLON'
    },
    {
      id: 'pdlie',
      title: 'Relatório do Plano de divulgação da Lei de Incentivo ao Esporte - PDLIE da Escolinha de Triathlon São José dos Pinhais',
      coverType: 'yellow',
      year: '2026',
      city: 'São José dos Pinhais – PR',
      proponente: 'ESCOLINHA DE TRIATHLON SÃO JOSÉ DOS PINHAIS'
    },
    { id: 'placeholder3', title: 'Relatório Modelo 3 (Em Breve)', coverType: 'gray', year: '2026', city: 'Cidade', proponente: 'Proponente' },
    { id: 'placeholder4', title: 'Relatório Modelo 4 (Em Breve)', coverType: 'gray', year: '2026', city: 'Cidade', proponente: 'Proponente' },
    { id: 'placeholder5', title: 'Relatório Modelo 5 (Em Breve)', coverType: 'gray', year: '2026', city: 'Cidade', proponente: 'Proponente' },
    { id: 'placeholder6', title: 'Relatório Modelo 6 (Em Breve)', coverType: 'gray', year: '2026', city: 'Cidade', proponente: 'Proponente' },
    { id: 'placeholder7', title: 'Relatório Modelo 7 (Em Breve)', coverType: 'gray', year: '2026', city: 'Cidade', proponente: 'Proponente' },
  ];

  const handleOpenBuilder = () => {
    if (!selectedReport) return;
    const reportDef = reports.find(r => r.id === selectedReport);
    if (!reportDef) return;

    // Se for o relatório de frequência, abrir o editor inline dedicado
    if (reportDef.id === 'frequencia') {
      setSelectedReport(null);
      if (onOpenFrequencyReport) onOpenFrequencyReport();
      return;
    }

    if (reportDef.id === 'pdlie') {
      setSelectedReport(null);
      if (onOpenPDLIEReport) onOpenPDLIEReport();
      return;
    }

    // Gerar o template inicial
    const pages = getReportTemplate(reportDef.id, {
      nucleo: selectedNucleo || 'Geral',
      year: selectedYear,
      proponente: reportDef.proponente,
      city: reportDef.city
    });

    // Se houver texto dinâmico gerado, a gente injeta no note de IA (content_body) usando um find, mas
    // por simplicidade a IA do Builder permite editar lá.
    if (aiSummaryText.trim()) {
      pages.forEach(p => {
        const bodyContent = p.items.find(i => i.id.startsWith('content_body_'));
        if (bodyContent) {
            bodyContent.data.text = aiSummaryText;
        }
      });
    }

    loadTemplate(pages);
    onOpenBuilder();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                title="Voltar ao Menu de Serviços"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">Ambiente de Desenvolvimento</h1>
          </div>
          <p className="text-gray-600 mt-2 ml-10">Geração automatizada de dossiês e prestação de contas governamental.</p>
        
        {/* Filtros da Listagem */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Filtrar por Núcleo</label>
            <select 
              value={filterNucleo}
              onChange={(e) => setFilterNucleo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Todos os Núcleos</option>
              {nucleos.map(n => {
                const displayName = n.nome.split('|')[0].trim();
                // We use the city name without the state for the value so it's easier to match
                return (
                  <option key={n.id} value={displayName}>
                    {n.nome}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="md:w-64">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ano Referência</label>
            <select 
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Todos os Anos</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reports
          .filter(report => {
            if (filterYear && report.year !== filterYear) return false;
            if (filterNucleo) {
              // reports.city tem o formato "Cidade - UF" ou "Cidade – UF"
              // Vamos comparar se o displayName do núcleo escolhido está contido na city do report
              // Como os placehoders tem city="Cidade", vamos limpar
              const normalizedReportCity = report.city.toLowerCase().replace(/–|-/g, '');
              const normalizedFilter = filterNucleo.toLowerCase();
              if (!normalizedReportCity.includes(normalizedFilter) && report.city !== 'Cidade') {
                  return false;
              }
            }
            return true;
          })
          .map((report) => (
          <div 
            key={report.id} 
            onClick={() => {
              if (report.coverType === 'gray') return;
              if (report.id === 'frequencia' && onOpenFrequencyReport) {
                onOpenFrequencyReport();
                return;
              }
              if (report.id === 'pdlie' && onOpenPDLIEReport) {
                onOpenPDLIEReport();
                return;
              }
              setSelectedReport(report.id);
            }}
            className={`
              relative bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-hidden group
              ${report.coverType !== 'gray' ? 'cursor-pointer hover:shadow-md hover:border-blue-400' : 'opacity-60 cursor-not-allowed border-gray-200'}
            `}
          >
            {/* Visual Cover Miniature */}
            <div className="h-48 w-full p-4 flex flex-col justify-between relative bg-white border-b border-gray-100">
              {/* Fake Header Logos */}
              <div className="w-full flex justify-center mb-2 px-2">
                <img src="/header_full.png" alt="Header" className="w-full object-contain" style={{ maxHeight: '30px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>

              {/* Cover Main Block */}
              <div className={`mt-4 flex-1 rounded-t-lg p-3 ${
                report.coverType === 'blue' ? 'bg-[#002855] text-white' : 
                report.coverType === 'yellow' ? 'bg-[#fbb034] text-[#002855]' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {report.coverType === 'yellow' && (
                  <div className="mb-2 w-full flex justify-center opacity-80">
                    <div className="w-16 h-10 bg-white/20 rounded"></div>
                  </div>
                )}
                <h3 className="text-[10px] font-bold leading-tight line-clamp-4 text-center mt-2">{report.title}</h3>
              </div>

              {/* Cover Footer */}
              <div className="absolute bottom-4 right-4 bg-black/80 text-white text-[8px] px-2 py-1 rounded">
                {report.city}<br/>{report.year}
              </div>
            </div>

            {/* Info Panel */}
            <div className="p-4">
              <h2 className="font-bold text-sm text-gray-800 line-clamp-2" title={report.title}>{report.title}</h2>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Formato PDF</span>
                {report.coverType !== 'gray' && (
                  <button className="text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Configurar &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Gerar Relatório: {reports.find(r => r.id === selectedReport)?.title}
              </h2>
              <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Núcleo Referência</label>
                  <select 
                    value={selectedNucleo} 
                    onChange={e => setSelectedNucleo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Selecione um Núcleo</option>
                    {nucleos.map(n => {
                      const displayName = n.nome.split('|')[0].trim();
                      return (
                        <option key={n.id} value={displayName}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Ano Base</label>
                  <select 
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Inteligência Artificial: Resumo Analítico
                </h3>
                <p className="text-sm text-blue-600 mb-3">
                  A IA pode gerar um texto formal de apresentação dos resultados com base nas métricas deste núcleo ou você pode escrever manualmente.
                </p>
                <textarea 
                  value={aiSummaryText}
                  onChange={e => setAiSummaryText(e.target.value)}
                  className="w-full h-32 border border-blue-200 rounded-lg p-3 text-gray-700 focus:border-blue-500 focus:outline-none"
                  placeholder="Escreva ou gere com IA o texto de introdução do dossiê..."
                ></textarea>
                <div className="mt-2 flex justify-end">
                  <button 
                    onClick={() => {
                      setAiSummaryText("Este dossiê detalha as metas e indicadores qualitativos coletados no núcleo durante o ano letivo. Os dados incluem assiduidade, aproveitamento e entrega de materiais previstos. As notas médias demonstram avanço de 15% em relação ao semestre anterior, com a maioria dos alunos matriculados e presentes.");
                    }}
                    className="bg-white border border-blue-300 text-blue-700 px-4 py-2 rounded shadow-sm text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    Gerar Texto Dinâmico
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-2">Composição do Dossiê</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">✓ Capa Oficial e Contracapa (Gerada dinamicamente)</li>
                  <li className="flex items-center gap-2">✓ Texto Analítico de Resultados</li>
                  <li className="flex items-center gap-2">✓ Tabela de Dados e Gráficos</li>
                  <li className="flex items-center gap-2">✓ {selectedReport === 'assiduidade' ? 'Anexos: Boletins Escolares (Mesclados)' : 'Anexos: Comprovantes PDLIE (Mesclados)'}</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-gray-200">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isGenerating}
              >
                Cancelar
              </button>
              <button 
                onClick={handleOpenBuilder}
                disabled={!selectedNucleo || isGenerating}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2"
              >
                {isGenerating ? (
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                )}
                Abrir no Editor Visual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
