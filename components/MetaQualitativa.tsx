
import React, { useState, useMemo } from 'react';
import { DocumentLog, PDFItemType } from '../types';
import { SmartCamera } from './SmartCamera';

interface MetaQualitativaProps {
  onBack: () => void;
  onSave: (data: DocumentLog) => void;
  defaultProfessorName?: string;
  history?: DocumentLog[];
  initialMode?: Mode; // Adicionado para pular menu
}

type Mode = 'MENU' | 'DIGITAL_FORM' | 'CAMERA_SCAN' | 'SCAN_PREVIEW' | 'SUCCESS' | 'HISTORY' | 'DETAIL_VIEW';
type Option = 'MUITO_BOM' | 'BOM' | 'REGULAR' | 'RUIM';

interface Question {
  id: string;
  text: string;
  target: string;
}

// --- SUB-COMPONENT: TEMPLATE DE IMPRESSÃO/VISUALIZAÇÃO ---
const MetaTemplate: React.FC<{ 
  studentName: string, 
  responsibleName: string, 
  professorName: string, 
  answers: Record<string, Option>,
  questions: Question[]
}> = ({ studentName, responsibleName, professorName, answers, questions }) => {
    
    const renderOption = (currentOpt: string, selectedOpt: string) => {
        const isSelected = currentOpt === selectedOpt;
        const label = currentOpt === 'MUITO_BOM' ? 'Muito Bom' : currentOpt.charAt(0) + currentOpt.slice(1).toLowerCase();
        return (
            <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">{isSelected ? '(x)' : '( )'}</span>
                <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{label}</span>
            </div>
        );
    };

    return (
        <div className="bg-white text-black font-sans h-full">
           {/* CABEÇALHO OFICIAL */}
           <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col items-center w-32">
                  <img src="/logo.svg" alt="Lei de Incentivo" className="h-14 object-contain mb-1" />
                  <p className="text-[9px] text-center font-bold text-blue-600 leading-tight">Lei de Incentivo<br/>ao Esporte</p>
              </div>
              <div className="flex flex-col items-center flex-1">
                  <img src="/logo.svg" alt="Triathlon" className="h-20 object-contain" />
              </div>
              <div className="flex flex-col items-center w-32 text-center">
                  <p className="text-[8px] uppercase font-bold text-gray-700 mb-1">Ministério do<br/>Esporte</p>
                  <p className="text-[8px] uppercase font-bold text-gray-700 mb-1">Governo Federal</p>
                  <div className="flex items-center justify-center gap-0.5 font-black text-xs">
                     <span className="text-green-600">BR</span><span className="text-yellow-500">A</span><span className="text-blue-700">SIL</span>
                  </div>
                  <p className="text-[6px] uppercase text-gray-500 mt-0.5">União e Reconstrução</p>
              </div>
           </div>

           {/* TÍTULO */}
           <div className="text-center mb-6">
              <h1 className="text-lg font-bold text-black uppercase underline decoration-2 underline-offset-4">QUESTIONÁRIO DE META QUALITATIVA</h1>
              <h2 className="text-lg font-bold text-black uppercase mt-1">ESCOLINHA DE TRIATHLON</h2>
           </div>

           {/* TABELA DE IDENTIFICAÇÃO */}
           <div className="border border-black mb-8">
              <div className="flex border-b border-black">
                 <div className="w-1/3 p-2 font-bold text-sm border-r border-black flex items-center">Nome completo do Aluno</div>
                 <div className="w-2/3 p-2 text-sm font-medium uppercase">{studentName}</div>
              </div>
              <div className="flex border-b border-black">
                 <div className="w-1/3 p-2 font-bold text-sm border-r border-black flex items-center">Nome do Responsável</div>
                 <div className="w-2/3 p-2 text-sm font-medium uppercase">{responsibleName}</div>
              </div>
              <div className="flex">
                 <div className="w-1/3 p-2 font-bold text-sm border-r border-black flex items-center">Nome do Professor</div>
                 <div className="w-2/3 p-2 text-sm font-medium uppercase">{professorName}</div>
              </div>
           </div>
           
           {/* PERGUNTAS */}
           <div className="space-y-6">
              {questions.map((q, idx) => (
                 <div key={q.id} className="pb-2 page-break-inside-avoid">
                    <p className="text-sm font-bold text-black uppercase mb-2 leading-tight">
                        {idx + 1}. <span className="text-red-600">{q.target}</span>, {q.text}
                    </p>
                    <div className="pl-4 space-y-1">
                       {['MUITO_BOM', 'BOM', 'REGULAR', 'RUIM'].map((opt) => (
                          <div key={opt}>
                             {renderOption(opt, answers[q.id])}
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
           
           {/* RODAPÉ */}
           <div className="mt-12 pt-8">
               <p className="text-xs text-gray-500 text-center">Documento gerado digitalmente via Sistema de Gestão Gov.br</p>
           </div>
        </div>
    );
}

export const MetaQualitativa: React.FC<MetaQualitativaProps> = ({ onBack, onSave, defaultProfessorName, history = [], initialMode }) => {
  const [mode, setMode] = useState<Mode>(initialMode || 'MENU');
  
  // Form State
  const [studentName, setStudentName] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [professorName, setProfessorName] = useState(defaultProfessorName || '');
  const [answers, setAnswers] = useState<Record<string, Option>>({});
  
  // File/Scan State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Viewer State
  const [selectedDoc, setSelectedDoc] = useState<DocumentLog | null>(null);

  // Filters for History
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const questions: Question[] = [
    { id: 'q1', target: 'ALUNO', text: 'O QUE VOCÊ ACHOU DAS ATIVIDADES ESPORTIVAS OFERECIDAS NO PROJETO "ESCOLINHA DE TRIATHLON"?' },
    { id: 'q2', target: 'SR(A). RESPONSÁVEL PELO ALUNO', text: 'VOCÊ PERCEBEU MELHORIA NA QUALIDADE DE VIDA/SAÚDE DA CRIANÇA/ADOLESCENTE DURANTE O PROJETO?' },
    { id: 'q3', target: 'SR(A). RESPONSÁVEL PELO ALUNO', text: 'VOCÊ PERCEBEU MELHORA NO DESEMPENHO ESCOLAR DA CRIANÇA/ADOLESCENTE DURANTE O PROJETO?' },
    { id: 'q4', target: 'PROFESSOR', text: 'VOCÊ PERCEBEU MELHORA NO CONVÍVIO SOCIAL DESTE ALUNO DURANTE O PROJETO?' }
  ];

  const handleSmartCapture = (base64: string) => {
    setCapturedImage(base64);
    setMode('SCAN_PREVIEW');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapturedImage(ev.target?.result as string);
        setMode('SCAN_PREVIEW');
      };
      reader.readAsDataURL(f);
    }
  };

  const handleSave = () => {
    const docData: DocumentLog = {
      id: `meta_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'PESQUISA_META',
      title: '6. Pesquisa Meta Qualitativa',
      description: mode === 'DIGITAL_FORM' 
        ? `Digital: Aluno ${studentName} - Resp. ${responsibleName}` 
        : `Digitalizado: ${file ? file.name : 'Foto Câmera Avançada'}`,
      fileUrl: capturedImage || undefined,
      metaData: mode === 'DIGITAL_FORM' ? {
        studentName,
        responsibleName,
        professorName,
        answers // Store all answers
      } : undefined
    };
    onSave(docData);
    setMode('SUCCESS');
  };

  const handleViewDetails = (doc: DocumentLog) => {
      setSelectedDoc(doc);
      setMode('DETAIL_VIEW');
  };

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    // Use selectedDoc data if in Detail View, otherwise current form data
    const name = selectedDoc?.metaData?.studentName || studentName;
    const dateFormatted = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const safeName = name ? name.replace(/[^a-zA-Z0-9 ]/g, "").trim() : 'Aluno';
    const fileName = `META QUALITATIVA - ${safeName} - ${dateFormatted}`;
    document.title = fileName;
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    }, 100);
  };

  // --- DRAG HANDLER ---
  const handleDragStart = (e: React.DragEvent, item: DocumentLog) => {
      const payload = { 
          type: 'META_QUALITATIVA_ITEM', 
          data: {
              studentName: item.metaData?.studentName || "Sem Nome",
              responsibleName: item.metaData?.responsibleName || "-",
              professorName: item.metaData?.professorName || "-",
              answers: item.metaData?.answers || {},
              date: item.timestamp
          }, 
          title: `Meta: ${item.metaData?.studentName || 'Item'}` 
      };
      e.dataTransfer.setData('application/json', JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredHistory = useMemo(() => {
      return history.filter(doc => {
          const mName = doc.metaData?.studentName?.toLowerCase() || '';
          const mDate = doc.timestamp || '';
          
          const matchName = !filterName || mName.includes(filterName.toLowerCase());
          const matchDate = !filterDate || mDate.startsWith(filterDate);
          
          return matchName && matchDate;
      });
  }, [history, filterName, filterDate]);

  const inputStyle = "w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:bg-white focus:border-blue-500 py-2 px-3 transition-colors text-gray-800";

  // --- DETAIL VIEW (MODAL) ---
  if (mode === 'DETAIL_VIEW' && selectedDoc) {
      const data = selectedDoc.metaData || {};
      const isDigital = !!data.answers;

      return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
            <div className="relative w-full max-w-[210mm] my-8 mx-4 print:mx-0 print:my-0 print:w-full">
                {/* Controles Flutuantes */}
                <div className="absolute top-0 -right-16 flex flex-col gap-3 print:hidden">
                    <button onClick={() => setMode('HISTORY')} className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors" title="Fechar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <button onClick={handleDownloadPDF} className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors" title="Imprimir">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                </div>

                <div className="bg-white min-h-[297mm] p-10 shadow-2xl print:shadow-none print:p-0 box-border">
                    {isDigital ? (
                        <MetaTemplate 
                            studentName={data.studentName} 
                            responsibleName={data.responsibleName} 
                            professorName={data.professorName} 
                            answers={data.answers}
                            questions={questions}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            {selectedDoc.fileUrl ? (
                                <img src={selectedDoc.fileUrl} alt="Scan" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <p>Imagem não disponível.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`@media print { body { background-color: white !important; margin: 0 !important; } .fixed { position: static !important; overflow: visible !important; background: none !important; } body > *:not(.fixed) { display: none !important; } .print\\:hidden { display: none !important; } }`}</style>
        </div>
      );
  }

  // --- SUCCESS MODE ---
  if (mode === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-white flex flex-col relative print:block">
        <div className="print:hidden flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
             <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Questionário Salvo!</h2>
          <p className="text-center text-gray-600 mb-8 max-w-md">O documento foi gerado. Você pode salvá-lo como PDF agora.</p>
          <div className="flex flex-col w-full max-w-xs gap-4">
             <button onClick={handleDownloadPDF} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>Baixar PDF</button>
             <button onClick={onBack} className="w-full py-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">Voltar ao Menu</button>
          </div>
        </div>
        
        {/* LAYOUT DE IMPRESSÃO (BACKGROUND) */}
        <div className="hidden print:block p-8 bg-white max-w-[210mm] mx-auto h-full text-black">
           <MetaTemplate 
                studentName={studentName} 
                responsibleName={responsibleName} 
                professorName={professorName} 
                answers={answers}
                questions={questions}
           />
        </div>
        <style>{`@media print { body { background-color: white !important; margin: 0 !important; } @page { size: A4 portrait; margin: 10mm; } .print\\:hidden { display: none !important; } .print\\:block { display: block !important; } .no-print { display: none !important; } html { height: 100%; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`}</style>
      </div>
    );
  }

  if (mode === 'CAMERA_SCAN') {
    return <SmartCamera onCapture={handleSmartCapture} onClose={() => setMode('MENU')} title="Digitalizar Questionário" />;
  }

  if (mode === 'SCAN_PREVIEW') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="bg-white p-4 shadow-sm flex items-center gap-4">
          <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
          <h1 className="font-bold text-lg text-gray-800">Revisar Digitalização</h1>
        </div>
        <div className="p-4 flex-1 flex flex-col items-center">
          <img src={capturedImage || ''} alt="Scan" className="w-full max-w-md rounded shadow mb-6 object-contain bg-gray-200" />
          <div className="w-full max-w-md space-y-4">
            <button onClick={handleSave} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold shadow-lg hover:bg-green-700">Salvar Digitalização</button>
            <button onClick={() => setMode('CAMERA_SCAN')} className="w-full text-blue-600 font-bold py-2">Tirar outra foto</button>
          </div>
        </div>
      </div>
    );
  }

  // --- HISTORY MODE ---
  if (mode === 'HISTORY') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
           <div className="bg-white p-4 shadow-sm flex items-center gap-4 border-b">
             <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
             <h1 className="font-bold text-lg text-gray-800">Histórico de Pesquisas</h1>
           </div>
           
           <div className="p-4 md:p-8 flex-1 overflow-auto">
              {/* FILTROS */}
              <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                 <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar por Aluno</label>
                    <input 
                       type="text" 
                       value={filterName} 
                       onChange={(e) => setFilterName(e.target.value)} 
                       placeholder="Nome do aluno..." 
                       className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" 
                    />
                 </div>
                 <div className="w-48">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                    <input 
                       type="date" 
                       value={filterDate} 
                       onChange={(e) => setFilterDate(e.target.value)} 
                       className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none" 
                    />
                 </div>
                 <button onClick={() => { setFilterName(''); setFilterDate(''); }} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded hover:bg-gray-200">Limpar</button>
              </div>

              {/* LISTA DE CARDS DRAGGABLE & CLICKABLE */}
              <div className="max-w-4xl mx-auto space-y-4">
                 {filteredHistory.length === 0 && (
                    <div className="text-center py-10 text-gray-500 italic">Nenhuma pesquisa encontrada no histórico.</div>
                 )}
                 {filteredHistory.map((item) => (
                    <div 
                       key={item.id} 
                       draggable 
                       onDragStart={(e) => handleDragStart(e, item)}
                       onClick={() => handleViewDetails(item)}
                       className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative"
                    >
                       <div className="flex justify-between items-start">
                          <div>
                             <h3 className="font-bold text-gray-800">{item.metaData?.studentName || "Aluno não identificado"}</h3>
                             <p className="text-xs text-gray-500 mt-1">
                                Resp: {item.metaData?.responsibleName} • Data: {new Date(item.timestamp).toLocaleDateString()}
                             </p>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                                {item.metaData?.answers ? 'Digital' : 'Scan'}
                             </span>
                             <span className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 group-hover:text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                                Arraste ou Clique
                             </span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      );
  }

  // --- MENU MODE ---
  if (mode === 'MENU') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="bg-white p-4 shadow-sm flex items-center gap-4">
          <button onClick={onBack} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
          <h1 className="font-bold text-lg text-gray-800">Meta Qualitativa</h1>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-center gap-6 max-w-md mx-auto w-full">
           <div className="text-center mb-4">
             <h2 className="text-xl font-bold text-blue-900">Como deseja preencher?</h2>
             <p className="text-gray-600 text-sm mt-2">Escolha o formato da pesquisa.</p>
           </div>

           <button 
             onClick={() => setMode('DIGITAL_FORM')}
             className="flex flex-col items-center justify-center p-6 bg-white border-2 border-blue-100 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group"
           >
             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <span className="font-bold text-gray-800">Formulário Digital</span>
             <span className="text-xs text-gray-500 mt-1">Preencher agora no App</span>
           </button>

           <div className="relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
               <div className="w-full border-t border-gray-300"></div>
             </div>
             <div className="relative flex justify-center">
               <span className="px-2 bg-gray-50 text-sm text-gray-500">OU</span>
             </div>
           </div>

           <button 
             onClick={() => setMode('CAMERA_SCAN')}
             className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-100 rounded-xl shadow-sm hover:border-green-500 hover:shadow-md transition-all group"
           >
             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
             <span className="font-bold text-gray-800">Digitalizar Papel</span>
             <span className="text-xs text-gray-500 mt-1">Usar Câmera Inteligente</span>
           </button>

           {/* Botão de Histórico */}
           <div className="relative mt-2"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div></div>
           <button onClick={() => setMode('HISTORY')} className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:bg-white hover:border-gray-400 transition-all text-gray-700 font-bold text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Histórico de Cadastros
           </button>
           
           <label className="text-center text-blue-600 text-sm font-semibold mt-2 cursor-pointer">
             Carregar foto do dispositivo
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
           </label>
        </div>
      </div>
    );
  }

  // --- DIGITAL FORM ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <div className="bg-white p-4 shadow-sm flex items-center gap-4">
        <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
        <h1 className="font-bold text-lg text-gray-800 leading-tight">Questionário de Meta Qualitativa</h1>
      </div>
      <div className="p-4 flex-1 max-w-2xl mx-auto w-full pb-24 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
           <h3 className="font-bold text-gray-800 border-b pb-2">Identificação</h3>
           <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome completo do Aluno</label><input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className={inputStyle} /></div>
           <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Responsável</label><input type="text" value={responsibleName} onChange={e => setResponsibleName(e.target.value)} className={inputStyle} /></div>
           <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Professor</label><input type="text" value={professorName} onChange={e => setProfessorName(e.target.value)} className={inputStyle} /></div>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
               <p className="text-xs font-bold text-blue-600 uppercase mb-1">{idx + 1}. {q.target}</p>
               <p className="font-bold text-gray-800 text-sm mb-4">{q.text}</p>
               <div className="space-y-2">
                 {['MUITO_BOM', 'BOM', 'REGULAR', 'RUIM'].map((opt) => (
                   <label key={opt} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200">
                     <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers({...answers, [q.id]: opt as Option})} className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                     <span className="text-sm text-gray-700 font-medium">{opt === 'MUITO_BOM' ? 'Muito Bom' : opt.charAt(0) + opt.slice(1).toLowerCase()}</span>
                   </label>
                 ))}
               </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={!studentName || Object.keys(answers).length < 4} className={`w-full py-4 rounded-lg font-bold shadow-lg text-lg transition-all ${!studentName || Object.keys(answers).length < 4 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'}`}>Salvar Questionário</button>
      </div>
    </div>
  );
};
