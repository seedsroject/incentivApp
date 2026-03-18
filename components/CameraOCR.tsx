
import React, { useRef, useState, useEffect } from 'react';
import { extractStudentData } from '../services/geminiService';
import { StudentDraft, DeclaracaoUniformes, DeclaracaoProntidao, PreCadastroData } from '../types';
import { SmartCamera } from './SmartCamera';
import { DeclaracaoUniformesForm } from './DeclaracaoUniformesForm';
import { DeclaracaoProntidaoForm } from './DeclaracaoProntidaoForm';

interface CameraOCRProps {
  onBack: () => void;
  onSave: (data: StudentDraft) => void;
  savedStudents?: StudentDraft[];
  initialMode?: Mode; // Adicionado para pular menu
  nucleoId?: string; // ID do núcleo atual para associar ao aluno
  onUpdateStudent?: (studentId: string, updates: Partial<StudentDraft>) => void;
  onInactivateStudent?: (studentId: string, checklist: { id: string; name: string; returned: boolean }[], replacementId?: string, replacementName?: string) => void;
  onReactivateStudent?: (studentId: string) => void;
  collectedDocuments?: any[];
  onSaveDeclaracao?: (studentIdOrNome: string, declaracao: DeclaracaoUniformes) => void;
  onSaveDeclaracaoProntidao?: (studentIdOrNome: string, declaracao: DeclaracaoProntidao) => void;
  baseUrl?: string; // Para gerar o link externo da declaração
  preCadastros?: PreCadastroData[]; // Fila de espera inteligente
}

type Mode = 'MENU' | 'FORM_DIGITAL' | 'CAMERA_SCAN' | 'SCAN_REVIEW' | 'SUCCESS' | 'LIST_VIEW' | 'DETAIL_VIEW';
type ReportType = 'REPORT_7' | 'REPORT_8';

// --- CONSTANTS ---
const legalTextParagraphs = [
  "Declaro que o aluno acima identificado está freqüentando a escola regularmente e está ciente que como critério de permanência no projeto será exigido do aluno, o bom rendimento escolar em regular instituição de ensino da região, através da apresentação freqüente do boletim escolar, declaro ainda que o atestado médico do aluno está regularmente válido e atestou que está apto a realizar atividades físicas como natação, ciclismo e corrida.",
  "Os uniformes que serão entregues aos alunos, são de responsabilidade do aluno, e em caso de desistência do projeto antes do período de execução do mesmo, deverão ser devolvidos ao coordenador do projeto para que outro aluno possa fazer uso, por isso a boa conservação e cuidado são fundamentais.",
  "O(a) Responsável legal, infra assinados(s), com fundamento no art. 5o, X e XXVIII da Constituição Federal/ 1988, e no art. 18, da Lei 10.406, de 10/01/2002, AUTORIZA o uso da imagem e/ou nome do aluno inscrito do projeto, para fins de divulgação das atividades e propaganda, podendo, para tanto, reproduzi-la e/ou divulgá-la pela internet, mídia eletrônica, por jornais, revistas, folders; bem como por todo e qualquer material e veículo de comunicação, público e/ou privado, por parceiros e patrocinadores do projeto, com finalidade informativa, de utilidade pública e de marketing, por tempo indeterminado. O(a) Cedente declara ainda que não há nada a ser reclamado, a título de direitos conexos; referentes ao uso de sua imagem e/ou nome. A presente autorização é concedida a título gratuito.",
  "1. Anexar cópia do último boletim escolar do aluno e declaração de matricula em escola regular;"
];

// --- SUB-COMPONENTE: PAD DE ASSINATURA ---
const SignaturePad: React.FC<{ onEnd: (base64: string) => void, onClear: () => void }> = ({ onEnd, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
      }
    }
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(pos.x, pos.y);
    ctx?.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (canvasRef.current) {
        onEnd(canvasRef.current.toDataURL());
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onClear();
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-400 rounded bg-white relative">
      <canvas
        ref={canvasRef}
        className="touch-none w-full cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={clearCanvas}
        className="absolute top-2 right-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
      >
        Limpar
      </button>
      <div className="absolute bottom-2 left-2 pointer-events-none text-xs text-gray-400">
        Assine neste espaço
      </div>
    </div>
  );
};

// --- SUB-COMPONENTE: LAYOUT DA FICHA (USADO NA TELA E IMPRESSÃO) ---
const FormTemplate: React.FC<{ data: StudentDraft, reportType: ReportType }> = ({ data, reportType }) => {

  // Calculates Age for display
  const calculateAge = (dob: string) => {
    if (!dob) return '';
    const parts = dob.split('/');
    if (parts.length !== 3) return '';
    const birth = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Preload Logo as Base64 for reliable printing
  const [logoBase64, setLogoBase64] = React.useState('/logo.png');

  React.useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setLogoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Error loading logo for print", e);
      }
    };
    loadLogo();
  }, []);

  // Preload Header as Base64 for reliable printing
  const [headerBase64, setHeaderBase64] = React.useState('/header_full.png');

  React.useEffect(() => {
    const loadHeader = async () => {
      try {
        const response = await fetch('/header_full.png');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setHeaderBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("Error loading header for print", e);
      }
    };
    loadHeader();
  }, []);

  return (
    <div className="text-black font-serif h-full flex flex-col justify-between">
      <div>
        {/* Header Logos — Banner com 3 logos */}
        <div className="flex justify-center mb-4">
          <img src={headerBase64} alt="Header" className="w-full object-contain" style={{ maxHeight: '110px' }} />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold uppercase border-b border-black inline-block pb-1">FICHA DE INSCRIÇÃO</h1>
          <h2 className="text-xl font-bold uppercase mt-2">PROJETO {data.nome_projeto?.toUpperCase() || 'ESCOLINHA DE TRIATHLON'}</h2>
        </div>

        <div className="space-y-4 text-xs leading-relaxed">
          <div className="border-b border-black pb-1">
            <span className="font-normal mr-2">Nome do aluno(a):</span>
            <span className="font-bold text-lg">{data.nome}</span>
          </div>

          <div className="flex gap-4 border-b border-black pb-1">
            <div>
              <span className="font-normal mr-2">Data de Nascimento:</span>
              <span className="font-bold">{data.data_nascimento}</span>
            </div>
            <div>
              <span className="font-normal mr-2">/   Idade no dia da inscrição:</span>
              <span className="font-bold">{calculateAge(data.data_nascimento)}</span>
            </div>
          </div>

          <div className="border-b border-black pb-1">
            <span className="font-normal mr-2">RG/CPF do aluno(a):</span>
            <span className="font-bold mr-4">{data.rg_cpf}</span>
          </div>

          <div className="border-b border-black pb-1">
            <span className="font-normal mr-2">Nome do(a) Responsável legal:</span>
            <span className="font-bold">{data.nome_responsavel}</span>
          </div>

          <div className="border-b border-black pb-1">
            <span className="font-normal mr-2">Telefone de contato:</span>
            <span className="font-bold">({data.telefone ? data.telefone.replace(/\D/g, '').slice(0, 2) : ''}) {data.telefone ? data.telefone.replace(/\D/g, '').slice(2) : ''}</span>
          </div>

          <div className="border-b border-black pb-1">
            <span className="font-normal mr-2">Endereço Completo (Rua, nº, cep, cidade/estado):</span>
            <span className="font-bold">{data.endereco}</span>
          </div>

          <div className="border-b border-black pb-1 flex items-center justify-between">
            <div>
              <span className="font-normal mr-2">Escola em que estuda é: </span>
              <span className="font-normal mr-2">Pública ( {data.escola_tipo === 'PUBLICA' ? 'X' : ' '} )</span>
              <span className="font-normal mr-2">Particular ( {data.escola_tipo === 'PARTICULAR' ? 'X' : ' '} )</span>
            </div>
          </div>

          <div className="border-b border-black pb-1">
            <span className="font-normal mr-2">Email:</span>
            <span className="font-bold">{data.email_contato}</span>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="font-bold">Nº SLI:</span> {data.n_sli}</div>
              <div><span className="font-bold">Proponente:</span> {data.proponente}</div>
              <div className="col-span-2"><span className="font-bold">Responsável da Organização:</span> {data.nome_responsavel_organizacao}</div>
            </div>
          </div>

          {/* TEXTOS LEGAIS IMPRESSOS */}
          <div className="text-justify text-[11px] leading-snug mt-6 space-y-3 font-serif">
            {legalTextParagraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>

          <div className="mt-8">
            <p>Data: <span className="underline decoration-1 decoration-black inline-block min-w-[150px] font-bold">{data.data_assinatura}</span> .</p>
          </div>
        </div>
      </div>

      {/* ASSINATURA NO RODAPÉ */}
      <div className="mt-8 flex flex-col items-center justify-center page-break-inside-avoid">
        <div className="w-80 border-b border-black mb-2 flex justify-center h-20 items-end">
          {data.assinatura ? (
            <img src={data.assinatura} alt="Assinatura" className="h-full object-contain mb-1" />
          ) : (
            <div className="h-full w-full"></div>
          )}
        </div>
        <p className="text-sm font-bold text-black text-center w-80">Assinatura do (a) responsável legal</p>
      </div>
    </div>
  );
};


export const CameraOCR: React.FC<CameraOCRProps> = ({
  onBack,
  onSave,
  savedStudents = [],
  initialMode,
  nucleoId,
  onUpdateStudent,
  onInactivateStudent,
  onReactivateStudent,
  collectedDocuments = [],
  onSaveDeclaracao,
  onSaveDeclaracaoProntidao,
  baseUrl = '',
  preCadastros = []
}) => {
  const [mode, setMode] = useState<Mode>(initialMode || 'MENU');
  const [reportType, setReportType] = useState<ReportType>('REPORT_8');

  // State para o modal de Declaração de Uniformes
  const [declaracaoModalStudent, setDeclaracaoModalStudent] = useState<StudentDraft | null>(null);
  // State para o modal de Prontidão Física
  const [prontidaoModalStudent, setProntidaoModalStudent] = useState<StudentDraft | null>(null);
  // State para o popup de pendências de material (alunos inativos)
  const [pendingItemsStudent, setPendingItemsStudent] = useState<StudentDraft | null>(null);
  // State para o painel de detalhes/edição do aluno (aberto ao clicar no ≡)
  const [detailStudent, setDetailStudent] = useState<StudentDraft | null>(null);
  const [detailEdits, setDetailEdits] = useState<StudentDraft | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);

  // States para Filtros na LIST_VIEW
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // State para alternar visualização (Original vs Transcrição Digital)
  const [showOriginal, setShowOriginal] = useState(true);
  // State para alternar entre ficha e laudo no DETAIL_VIEW
  const [showLaudo, setShowLaudo] = useState(false);

  const [formData, setFormData] = useState<StudentDraft>({
    nome: '',
    data_nascimento: '',
    rg_cpf: '',
    nome_responsavel: '',
    endereco: '',
    telefone: '',
    email_contato: '',
    escola_nome: '',
    escola_tipo: '',
    fichaUrl: '',
    assinatura: '',
    n_sli: '2201254',
    nome_projeto: 'Escolinha de Triathlon',
    proponente: 'Associação de Pais e Amigos da Natação Ituana',
    nome_responsavel_organizacao: '', // Responsável da Associação/Federação
    data_assinatura: new Date().toLocaleDateString('pt-BR'),
    portador_necessidade_especial: false,
    laudo_url: ''
  });

  // State local para laudos de alunos já salvos (quando onUpdateStudent não é fornecido)
  const [localLaudoMap, setLocalLaudoMap] = useState<Record<string, string>>({});

  const handleLaudoUploadForSaved = (student: StudentDraft, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const studentKey = student.id || student.nome;
      if (onUpdateStudent && student.id) {
        onUpdateStudent(student.id, { laudo_url: base64, portador_necessidade_especial: true });
      } else {
        setLocalLaudoMap(prev => ({ ...prev, [studentKey]: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const getStudentLaudo = (student: StudentDraft): string => {
    const key = student.id || student.nome;
    return student.laudo_url || localLaudoMap[key] || '';
  };

  const [agreed, setAgreed] = useState(false);

  const handleSmartCapture = (base64: string) => {
    setFormData(prev => ({ ...prev, fichaUrl: base64 }));
    setMode('SCAN_REVIEW');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, fichaUrl: base64 }));
        setMode('SCAN_REVIEW');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDigitalSubmit = () => {
    // Validação Comum
    if (!formData.nome) return alert("O nome do aluno é obrigatório.");
    if (!formData.nome_responsavel_organizacao) return alert("O nome do responsável da organização (Associação/Federação) é obrigatório.");
    if (!agreed) return alert("É necessário concordar com os termos.");
    if (!formData.assinatura) return alert("A assinatura do responsável legal é obrigatória.");
    if (!formData.data_assinatura) return alert("A data da assinatura é obrigatória.");

    // Validação Específica Report 7 (Beneficiados)
    if (reportType === 'REPORT_7') {
      if (!formData.endereco) return alert("Endereço completo é obrigatório para Beneficiados.");
      if (!formData.telefone) return alert("Telefone é obrigatório para Beneficiados.");
      if (!formData.data_nascimento) return alert("Data de nascimento (para cálculo da idade) é obrigatória.");
    }

    // Validação Específica Report 8 (Escolas)
    if (reportType === 'REPORT_8') {
      if (!formData.escola_nome) return alert("Nome da escola é obrigatório.");
      if (!formData.escola_tipo) return alert("Tipo da escola é obrigatório.");
    }

    onSave({ ...formData, reportType, nucleo_id: nucleoId });
    setMode('SUCCESS');
  };

  const handleScanSubmit = () => {
    if (!formData.nome) return alert("Por favor, identifique o nome do aluno da ficha.");
    // Garante que a imagem original está salva no formData antes de enviar
    onSave({ ...formData, reportType: 'REPORT_7', nucleo_id: nucleoId }); // Assume Report 7 for scans default
    setMode('SUCCESS');
  };

  const handleViewDetails = (student: StudentDraft) => {
    setFormData(student);
    setReportType(student.reportType || 'REPORT_8');
    // Se tiver fichaUrl, mostra o original por padrão
    setShowOriginal(!!student.fichaUrl);
    setShowLaudo(false); // Reset laudo view
    setMode('DETAIL_VIEW');
  };

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    const dateFormatted = formData.data_assinatura?.replace(/\//g, '-') || new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const safeName = formData.nome ? formData.nome.replace(/[^a-zA-Z0-9 ]/g, "").trim() : 'Aluno';
    const fileName = `FICHA - ${safeName} - ${dateFormatted}`;
    document.title = fileName;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 2000);
  };

  const inputStyle = "w-full bg-gray-50 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:bg-white focus:border-blue-500 py-3 px-4 transition-colors text-gray-800";

  // Helper para comparar datas (DD/MM/AAAA) com YYYY-MM-DD
  const isDateInRange = (dateStr: string, start?: string, end?: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

    if (start && isoDate < start) return false;
    if (end && isoDate > end) return false;
    return true;
  };

  // States para Inativação
  const [activeTab, setActiveTab] = useState<'ATIVOS' | 'INATIVOS'>('ATIVOS');
  const [inactivateModalStudent, setInactivateModalStudent] = useState<StudentDraft | null>(null);
  const [inactivateChecklist, setInactivateChecklist] = useState<{ id: string; name: string; returned: boolean }[]>([
    { id: 'uniforme', name: 'Uniforme / Camiseta', returned: false },
    { id: 'mochila', name: 'Mochila', returned: false },
    { id: 'oculos', name: 'Óculos', returned: false },
    { id: 'touca', name: 'Touca', returned: false },
    { id: 'squeeze', name: 'Squeeze', returned: false },
  ]);

  // --- LIST VIEW ---
  if (mode === 'LIST_VIEW') {
    const listByTab = savedStudents.filter(s => {
      const isInactive = s.status === 'INATIVO';
      if (activeTab === 'ATIVOS') return !isInactive;
      return isInactive;
    });

    const filteredList = listByTab.filter(s => {
      const matchName = !filterName || s.nome.toLowerCase().includes(filterName.toLowerCase());
      const matchDate = isDateInRange(s.data_assinatura || '', filterStartDate, filterEndDate);
      return matchName && matchDate;
    });

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setMode('MENU')} className="p-1 rounded hover:bg-gray-100 text-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="font-bold text-lg text-gray-800">{activeTab === 'ATIVOS' ? 'Inscrições Salvas' : 'Histórico de Inativados'}</h1>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg mr-12">
            <button
              onClick={() => setActiveTab('ATIVOS')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'ATIVOS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Alunos Ativos
            </button>
            <button
              onClick={() => setActiveTab('INATIVOS')}
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'INATIVOS' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Histórico Inativos
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 flex-1 max-w-5xl mx-auto w-full">
          {/* FILTROS */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Aluno</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Nome do aluno..."
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">De (Data)</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Até (Data)</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => { setFilterName(''); setFilterStartDate(''); setFilterEndDate(''); }}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-bold rounded hover:bg-gray-200"
            >
              Limpar
            </button>
          </div>

          {/* INACTIVATION MODAL */}
          {inactivateModalStudent && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-600 to-teal-500 p-4 flex justify-between items-center">
                  <h2 className="text-white font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Dar Baixa em Inscrição
                  </h2>
                  <button onClick={() => setInactivateModalStudent(null)} className="text-gray-400 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded text-sm">
                    Você está inativando o aluno(a) <strong>{inactivateModalStudent.nome}</strong>. Esta ação não apaga os dados, apenas move o estudante para o Histórico de Inativos.
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Checklist de Devolução (Materiais)</h3>
                    <p className="text-xs text-gray-500 mb-3">Marque os materiais que o aluno devolveu. Se houver pendências, o cadastro ficará marcado no histórico.</p>

                    <div className="space-y-2">
                      {inactivateChecklist.map((item, i) => (
                        <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-100">
                          <input
                            type="checkbox"
                            checked={item.returned}
                            onChange={(e) => {
                              const nw = [...inactivateChecklist];
                              nw[i].returned = e.target.checked;
                              setInactivateChecklist(nw);
                            }}
                            className="h-4 w-4 text-red-600 rounded bg-gray-100 border-gray-300 focus:ring-red-500"
                          />
                          <span className={`text-sm ${item.returned ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>{item.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                    <div className="pt-4 flex flex-col gap-3">
                      {/* AUTO-SELECTED REPLACEMENT FROM SMART QUEUE */}
                      {(() => {
                        const studentNucleoId = inactivateModalStudent.nucleo_id || nucleoId;
                        const autoReplacement = [...preCadastros]
                          .filter(c => c.status === 'AGUARDANDO' && c.nucleo_id === studentNucleoId)
                          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

                        if (!autoReplacement) {
                          return (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500 text-center">
                              Nenhum candidato aguardando neste núcleo. A frequência não será transferida.
                            </div>
                          );
                        }

                        return (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                              Substituto Automático — Fila Inteligente
                            </p>
                            <p className="text-sm font-bold text-blue-900">{autoReplacement.nome_aluno}</p>
                            <p className="text-xs text-blue-600 mt-0.5">As presenças históricas serão transferidas para este aluno.</p>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => setInactivateModalStudent(null)} className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-50 rounded border border-gray-200 text-sm">Cancelar</button>
                              <button
                                onClick={() => {
                                  if (onInactivateStudent) {
                                    const key = inactivateModalStudent.id || inactivateModalStudent.nome;
                                    onInactivateStudent(key, inactivateChecklist);
                                    setInactivateModalStudent(null);
                                  }
                                }}
                                className="py-2 px-3 text-gray-500 hover:text-gray-700 font-medium text-xs rounded border border-gray-200 hover:bg-gray-50"
                              >
                                Sem transferência
                              </button>
                              <button
                                onClick={() => {
                                  if (onInactivateStudent) {
                                    const key = inactivateModalStudent.id || inactivateModalStudent.nome;
                                    onInactivateStudent(key, inactivateChecklist, autoReplacement.id, autoReplacement.nome_aluno);
                                    setInactivateModalStudent(null);
                                  }
                                }}
                                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm"
                              >
                                ✅ Confirmar com Transferência
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL DE PENDÊNCIAS DE MATERIAL */}
          {pendingItemsStudent && (
            <div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setPendingItemsStudent(null)}
            >
              <div
                className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-amber-200"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-amber-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-white font-bold text-sm">Pendências de Devolução</p>
                      <p className="text-amber-100 text-xs">{pendingItemsStudent.nome}</p>
                    </div>
                  </div>
                  <button onClick={() => setPendingItemsStudent(null)} className="text-white/80 hover:text-white p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-3">Materiais registrados no momento da inativação:</p>
                  {pendingItemsStudent.materiais_checklist && (pendingItemsStudent.materiais_checklist as { id: string; name: string; returned: boolean }[]).length > 0 ? (
                    <ul className="space-y-2">
                      {(pendingItemsStudent.materiais_checklist as { id: string; name: string; returned: boolean }[]).map(item => (
                        <li key={item.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${item.returned
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                          {item.returned ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className="text-sm font-medium flex-1">{item.name}</span>
                          <span className="text-xs font-bold">{item.returned ? 'Devolvido' : 'Pendente'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic text-center py-4">Sem registro de checklist para este aluno.</p>
                  )}

                  {/* Summary totals */}
                  {pendingItemsStudent.materiais_checklist && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-green-600 font-bold">
                        ✓ {(pendingItemsStudent.materiais_checklist as { returned: boolean }[]).filter(i => i.returned).length} devolvido(s)
                      </span>
                      <span className="text-red-600 font-bold">
                        ✗ {(pendingItemsStudent.materiais_checklist as { returned: boolean }[]).filter(i => !i.returned).length} pendente(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ PAINEL DE DETALHES / EDIÇÃO DO ALUNO ═══════════════ */}
          {detailStudent && detailEdits && (() => {
            const field = (label: string, key: keyof StudentDraft, type: 'text' | 'date' | 'select' = 'text', opts?: string[]) => (
              <div key={key} className="grid grid-cols-[160px_1fr] items-start gap-2 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-1.5">{label}</span>
                {type === 'select' ? (
                  <select
                    value={(detailEdits[key] as string) || ''}
                    onChange={e => setDetailEdits({ ...detailEdits, [key]: e.target.value })}
                    className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 w-full"
                  >
                    {opts?.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                  </select>
                ) : (
                  <input
                    type={type}
                    value={(detailEdits[key] as string) || ''}
                    onChange={e => setDetailEdits({ ...detailEdits, [key]: e.target.value })}
                    className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 w-full"
                  />
                )}
              </div>
            );

            const hasChanges = JSON.stringify(detailEdits) !== JSON.stringify(detailStudent);

            return (
              <div className="fixed inset-0 z-[60] flex">
                {/* Backdrop */}
                <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => { setDetailStudent(null); setDetailEdits(null); }} />

                {/* Panel */}
                <div className="w-full max-w-xl bg-gray-50 flex flex-col shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-5 py-4 flex items-center gap-3 flex-shrink-0">
                    <div className="flex-1">
                      <p className="text-white font-bold text-base">{detailStudent.nome}</p>
                      <p className="text-blue-100 text-xs mt-0.5">
                        {detailStudent.status === 'INATIVO' ? '🔴 Inativo' : '🟢 Ativo'} · Inscrito em {detailStudent.data_assinatura || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setDetailStudent(null); setDetailEdits(null); }}
                      className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable body */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Status of Docs */}
                    <div className="bg-white mx-4 mt-4 rounded-xl border border-gray-200 shadow-sm p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📄 Documentos</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${detailStudent.assinatura ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {detailStudent.assinatura ? '✓' : '✗'} Ficha de Inscrição
                        </span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${detailStudent.declaracao_uniformes ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                          {detailStudent.declaracao_uniformes ? '✓' : '✗'} Decl. Uniformes
                        </span>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${detailStudent.declaracao_prontidao ? 'bg-green-50 text-green-700 border-green-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                          {detailStudent.declaracao_prontidao ? '✓' : '✗'} Questionário PAR-Q
                        </span>
                        {detailStudent.laudo_url && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                            ✓ Laudo Médico
                          </span>
                        )}
                        {detailStudent.portador_necessidade_especial && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-purple-100 text-purple-800 border-purple-300">
                            ⚡ PNE
                          </span>
                        )}
                        {detailStudent.materiais_pendentes && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-amber-50 text-amber-700 border-amber-300 animate-pulse">
                            ⚠ Devolução Pendente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Section: Dados Pessoais */}
                    <div className="bg-white mx-4 mt-3 rounded-xl border border-gray-200 shadow-sm p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">👤 Dados Pessoais</p>
                      {field('Nome do Aluno', 'nome')}
                      {field('Data Nascimento', 'data_nascimento')}
                      {field('RG / CPF', 'rg_cpf')}
                      {field('Responsável', 'nome_responsavel')}
                      {field('Tipo de Escola', 'escola_tipo', 'select', ['', 'PUBLICA', 'PARTICULAR'])}
                      {field('Nome da Escola', 'escola_nome')}
                      {field('PNE', 'portador_necessidade_especial' as keyof StudentDraft, 'select', ['false', 'true'])}
                    </div>

                    {/* Section: Contato */}
                    <div className="bg-white mx-4 mt-3 rounded-xl border border-gray-200 shadow-sm p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">📞 Contato</p>
                      {field('Telefone', 'telefone')}
                      {field('E-mail', 'email_contato')}
                      {field('Endereço', 'endereco')}
                    </div>

                    {/* Section: Dados Projeto */}
                    <div className="bg-white mx-4 mt-3 mb-4 rounded-xl border border-gray-200 shadow-sm p-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">🏊 Projeto / Inscrição</p>
                      {field('Data de Inscrição', 'data_assinatura')}
                      {field('Nº SLI', 'n_sli')}
                      {field('Nome Projeto', 'nome_projeto')}
                      {field('Proponente', 'proponente')}
                      {field('Resp. Organização', 'nome_responsavel_organizacao')}

                      {/* Assinatura */}
                      {detailStudent.assinatura && (
                        <div className="py-2.5 border-b border-gray-100">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Assinatura</span>
                          <img src={detailStudent.assinatura} alt="Assinatura" className="h-14 object-contain border border-gray-200 rounded-lg bg-white p-1" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer: Save button */}
                  <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
                    <button
                      onClick={() => { setDetailStudent(null); setDetailEdits(null); }}
                      className="flex-1 py-2.5 text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-sm transition-colors"
                    >
                      Fechar
                    </button>
                    <button
                      disabled={!hasChanges || detailSaving}
                      onClick={() => {
                        if (!detailEdits || !onUpdateStudent) return;
                        setDetailSaving(true);
                        const key = detailEdits.id || detailEdits.nome;
                        // Convert the escola_tipo field back to expected type
                        const updates: Partial<StudentDraft> = { ...detailEdits };
                        if (typeof updates.portador_necessidade_especial === 'string') {
                          updates.portador_necessidade_especial = (updates.portador_necessidade_especial as string) === 'true';
                        }
                        onUpdateStudent(key, updates);
                        setDetailStudent({ ...detailEdits, ...updates });
                        setTimeout(() => setDetailSaving(false), 600);
                      }}
                      className={`flex-1 py-2.5 font-bold rounded-xl text-sm transition-colors shadow-sm ${hasChanges && !detailSaving
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {detailSaving ? '💾 Salvando...' : hasChanges ? '💾 Salvar Alterações' : '✓ Sem alterações'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* DECLARAÇÃO DE UNIFORMES MODAL */}
          {declaracaoModalStudent && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col overflow-y-auto">
              {/* Barra Superior do Modal */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 flex-shrink-0 shadow-md">
                <div>
                  <p className="font-bold text-sm">{declaracaoModalStudent.declaracao_uniformes ? 'Declaração Assinada' : 'Declaração de Recebimento de Uniformes'}</p>
                  <p className="text-blue-100 text-xs mt-0.5">{declaracaoModalStudent.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botão Enviar link ao Responsável */}
                  {!declaracaoModalStudent.declaracao_uniformes && (
                    <button
                      onClick={() => {
                        const key = declaracaoModalStudent.id || declaracaoModalStudent.nome;
                        const url = `${baseUrl}?service=declaracao&studentId=${encodeURIComponent(key)}&token=nucleo`;
                        navigator.clipboard.writeText(url).then(() => {
                          alert(`✅ Link copiado!\n\nEnvie para o responsável assinar:\n${url}`);
                        }).catch(() => {
                          prompt('Copie o link abaixo:', url);
                        });
                      }}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Enviar Link ao Responsável
                    </button>
                  )}
                  <button
                    onClick={() => setDeclaracaoModalStudent(null)}
                    className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Formulário / Visualização */}
              <div className="flex-1 overflow-y-auto">
                <DeclaracaoUniformesForm
                  studentName={declaracaoModalStudent.nome}
                  responsavelName={declaracaoModalStudent.nome_responsavel}
                  cpfResponsavel={declaracaoModalStudent.rg_cpf}
                  existingDeclaracao={declaracaoModalStudent.declaracao_uniformes}
                  onClose={() => setDeclaracaoModalStudent(null)}
                  onSave={(declaracao) => {
                    const key = declaracaoModalStudent.id || declaracaoModalStudent.nome;
                    if (onSaveDeclaracao) onSaveDeclaracao(key, declaracao);
                    setDeclaracaoModalStudent(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* QUESTIONÁRIO DE PRONTIDÃO MODAL */}
          {prontidaoModalStudent && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 flex-shrink-0 shadow-md">
                <div>
                  <p className="font-bold text-sm">{prontidaoModalStudent.declaracao_prontidao ? 'Questionário Respondido' : 'Questionário de Prontidão para Atividade Física'}</p>
                  <p className="text-blue-100 text-xs mt-0.5">{prontidaoModalStudent.nome} • ANEXO I</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botão Enviar link ao Responsável */}
                  {!prontidaoModalStudent.declaracao_prontidao && (
                    <button
                      onClick={() => {
                        const key = prontidaoModalStudent.id || prontidaoModalStudent.nome;
                        const url = `${baseUrl}?service=declaracao_prontidao&studentId=${encodeURIComponent(key)}&token=nucleo`;
                        navigator.clipboard.writeText(url).then(() => {
                          alert(`✅ Link copiado!\n\nEnvie para o responsável responder:\n${url}`);
                        }).catch(() => {
                          prompt('Copie o link abaixo:', url);
                        });
                      }}
                      className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Enviar Link ao Responsável
                    </button>
                  )}
                  <button
                    onClick={() => setProntidaoModalStudent(null)}
                    className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DeclaracaoProntidaoForm
                  studentName={prontidaoModalStudent.nome}
                  responsavelName={prontidaoModalStudent.nome_responsavel}
                  existingDeclaracao={prontidaoModalStudent.declaracao_prontidao}
                  onClose={() => setProntidaoModalStudent(null)}
                  onSave={(declaracao) => {
                    const key = prontidaoModalStudent.id || prontidaoModalStudent.nome;
                    if (onSaveDeclaracaoProntidao) onSaveDeclaracaoProntidao(key, declaracao);
                    setProntidaoModalStudent(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* LISTA */}
          <div className="bg-white shadow-lg rounded-sm overflow-hidden border border-gray-300 relative z-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-xs uppercase tracking-wide">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Nome do Aluno</th>
                    <th className="py-3 px-4 w-32 text-center">Data Inscrição</th>
                    <th className="py-3 px-4 w-40">Responsável</th>
                    <th className="py-3 px-4 w-20 text-center">PNE</th>
                    <th className="py-3 px-4 w-48 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {filteredList.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-500 italic">Nenhuma inscrição encontrada na aba selecionada.</td></tr>
                  ) : (
                    filteredList.map((student, idx) => {
                      const laudoExistente = getStudentLaudo(student);
                      const isInactive = student.status === 'INATIVO';
                      const hasPendingMats = isInactive && student.materiais_pendentes;

                      const hasDocPending = !isInactive && (!student.declaracao_uniformes || !student.declaracao_prontidao);

                      return (
                        <tr
                          key={idx}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-move group ${hasPendingMats ? 'bg-amber-50/30' : hasDocPending ? 'bg-yellow-50/20' : ''}`}
                          style={hasPendingMats ? { borderLeft: '4px solid #F59E0B' } : hasDocPending ? { borderLeft: '4px solid #EAB308' } : {}}
                          draggable
                          onDragStart={(e) => {
                            const laudoUrl = getStudentLaudo(student);
                            // Se há laudo, envia como array batch contendo ficha + laudo
                            if (laudoUrl) {
                              const payload = {
                                type: 'BATCH',
                                items: [
                                  {
                                    type: 'STUDENT_CARD',
                                    data: student,
                                    title: `Ficha: ${student.nome}`
                                  },
                                  {
                                    type: 'IMAGE',
                                    data: { url: laudoUrl },
                                    title: `Laudo PNE: ${student.nome}`
                                  }
                                ]
                              };
                              e.dataTransfer.setData('application/json', JSON.stringify(payload));
                            } else {
                              const payload = {
                                type: 'STUDENT_CARD',
                                data: student,
                                title: `Ficha: ${student.nome}`
                              };
                              e.dataTransfer.setData('application/json', JSON.stringify(payload));
                            }
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                        >
                          <td className="py-3 px-4 text-center text-gray-500 relative">
                            {idx + 1}
                            {hasPendingMats && (
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 group-hover:block" title="Materiais Pendentes">
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-800 group-hover:text-blue-700">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); setDetailStudent(student); setDetailEdits({ ...student }); }}
                                  className="p-0.5 rounded hover:bg-blue-100 transition-colors flex-shrink-0"
                                  title="Ver / editar dados completos do aluno"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </button>
                                {student.nome}
                                {student.portador_necessidade_especial && (
                                  <span className="ml-1 text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full border border-purple-200 flex-shrink-0">PNE</span>
                                )}
                              </div>
                              {hasPendingMats && (
                                <span className="text-[10px] text-amber-600 font-bold ml-6 mt-0.5 uppercase tracking-wider">Devolução Pendente</span>
                              )}
                              {/* Status badges das Declarações */}
                              {!isInactive && (
                                <div className="flex items-center gap-1.5 ml-6 mt-1 flex-wrap">
                                  {/* Uniformes */}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                                    ${student.declaracao_uniformes
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {student.declaracao_uniformes ? '✓' : '✗'} Uniformes
                                  </span>
                                  {/* PAR-Q Prontidão */}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                                    ${student.declaracao_prontidao
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {student.declaracao_prontidao ? '✓' : '✗'} Prontidão
                                  </span>
                                  {/* Questionário Quantitativo */}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                                    ${student.questionario_quantitativo
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {student.questionario_quantitativo ? '✓' : '✗'} Quantitativo
                                  </span>
                                  {/* Pesquisa Socioeconômica */}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                                    ${student.pesquisa_socioeconomica
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {student.pesquisa_socioeconomica ? '✓' : '✗'} Socioeconômica
                                  </span>
                                  {/* Boletim Escolar */}
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                                    ${student.boletim_escolar && !student.boletim_escolar.parcial
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : student.boletim_escolar?.parcial
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                    {student.boletim_escolar && !student.boletim_escolar.parcial ? '✓' : student.boletim_escolar?.parcial ? '~' : '✗'} Boletim
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">{student.data_assinatura}</td>
                          <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]">{student.nome_responsavel}</td>
                          {/* Coluna PNE */}
                          <td className="py-3 px-4 text-center">
                            {student.portador_necessidade_especial ? (
                              <span className="inline-flex items-center gap-1 text-purple-700 font-bold text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Sim
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">–</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {/* Row 1: ações principais */}
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap sr-only">
                                Ações
                              </span>

                              {/* VIEW DETAILS */}
                              <button
                                onClick={() => handleViewDetails(student)}
                                className="text-gray-600 hover:text-blue-800 bg-gray-100 hover:bg-blue-100 p-2 rounded-full border border-gray-200 transition-colors"
                                title="Ver Detalhes"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>

                              {/* CONDITIONAL ACTION: INACTIVATE OR REACTIVATE */}
                              {!isInactive ? (
                                <button
                                  onClick={() => {
                                    // Monta checklist dinâmico com os materiais que esse aluno recebeu
                                    const received: { id: string; name: string; returned: boolean }[] = [];
                                    const seen = new Set<string>();
                                    for (const doc of collectedDocuments) {
                                      const items = doc?.metaData?.distributedItems as { studentName: string; itemName: string; itemId: string }[] | undefined;
                                      if (!items) continue;
                                      for (const it of items) {
                                        if (it.studentName === student.nome && !seen.has(it.itemId)) {
                                          seen.add(it.itemId);
                                          received.push({ id: it.itemId, name: it.itemName, returned: false });
                                        }
                                      }
                                    }
                                    // Se nenhum item foi registrado via chamada, mostra checklist padrão
                                    const checklist = received.length > 0 ? received : [
                                      { id: 'uniforme', name: 'Uniforme / Camiseta', returned: false },
                                      { id: 'mochila', name: 'Mochila', returned: false },
                                      { id: 'oculos', name: 'Óculos', returned: false },
                                      { id: 'touca', name: 'Touca', returned: false },
                                      { id: 'squeeze', name: 'Squeeze', returned: false },
                                    ];
                                    setInactivateChecklist(checklist);
                                    setInactivateModalStudent(student);
                                  }}
                                  className="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 p-2 rounded-full border border-red-200 transition-colors"
                                  title="Dar Baixa"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (onReactivateStudent) {
                                      const key = student.id || student.nome;
                                      if (window.confirm(`Deseja realmente reativar o(a) aluno(a) ${student.nome}?`)) {
                                        onReactivateStudent(key);
                                      }
                                    }
                                  }}
                                  className="text-green-600 hover:text-white bg-green-50 hover:bg-green-600 p-2 rounded-full border border-green-200 transition-colors"
                                  title="Reativar Aluno"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                              )}

                              {/* Botão Pendências (somente inativos com mat. pendentes) */}
                              {hasPendingMats && (
                                <button
                                  onClick={() => setPendingItemsStudent(student)}
                                  className="p-2 rounded-full border border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors animate-pulse"
                                  title="Ver pendências de devolução de materiais"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </button>
                              )}

                              {/* Botão Enviar Laudo */}
                              <label
                                className={`cursor-pointer p-2 rounded-full border transition-colors flex items-center justify-center ${laudoExistente
                                  ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                  }`}
                                title={laudoExistente ? 'Laudo já enviado – clique para substituir' : 'Enviar Laudo Médico'}
                              >
                                {laudoExistente ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                )}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleLaudoUploadForSaved(student, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            {/* Row 2: Declarações + Documentos Extras */}
                            {!isInactive && (
                              <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                                {/* Botão Declaração de Uniformes */}
                                <button
                                  onClick={() => setDeclaracaoModalStudent(student)}
                                  className={`p-2 rounded-full border transition-colors flex items-center justify-center
                                    ${student.declaracao_uniformes
                                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                      : 'bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-100'
                                    }`}
                                  title={student.declaracao_uniformes ? 'Declaração de Uniformes assinada – clique para ver' : 'Declaração de Uniformes pendente'}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                </button>

                                {/* Botão Questionário de Prontidão */}
                                <button
                                  onClick={() => setProntidaoModalStudent(student)}
                                  className={`p-2 rounded-full border transition-colors flex items-center justify-center
                                    ${student.declaracao_prontidao
                                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                      : 'bg-indigo-50 border-indigo-200 text-indigo-500 hover:bg-indigo-100'
                                    }`}
                                  title={student.declaracao_prontidao ? 'Questionário de Prontidão respondido – clique para ver' : 'Questionário de Prontidão pendente (ANEXO I)'}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>

                                {/* Botão Questionário Quantitativo */}
                                <button
                                  onClick={() => {
                                    const key = student.id || student.nome;
                                    if (student.questionario_quantitativo) {
                                      window.open(student.questionario_quantitativo.url, '_blank');
                                    } else {
                                      const url = `${baseUrl}?service=meta&studentId=${encodeURIComponent(key)}&token=nucleo`;
                                      navigator.clipboard.writeText(url).then(() => {
                                        alert(`✅ Link copiado!\n\nEnvie para o aluno/responsável preencher o Questionário Quantitativo:\n${url}`);
                                      }).catch(() => { prompt('Copie o link abaixo:', url); });
                                    }
                                  }}
                                  className={`p-2 rounded-full border transition-colors flex items-center justify-center
                                    ${student.questionario_quantitativo
                                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                      : 'bg-blue-50 border-blue-200 text-blue-500 hover:bg-blue-100'
                                    }`}
                                  title={student.questionario_quantitativo ? 'Questionário Quantitativo enviado – clique para ver' : 'Questionário Quantitativo pendente – clique para copiar link'}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </button>

                                {/* Botão Pesquisa Socioeconômica */}
                                <button
                                  onClick={() => {
                                    const key = student.id || student.nome;
                                    if (student.pesquisa_socioeconomica) {
                                      window.open(student.pesquisa_socioeconomica.url, '_blank');
                                    } else {
                                      const url = `${baseUrl}?service=socio&studentId=${encodeURIComponent(key)}&token=nucleo`;
                                      navigator.clipboard.writeText(url).then(() => {
                                        alert(`✅ Link copiado!\n\nEnvie para o aluno/responsável preencher a Pesquisa Socioeconômica:\n${url}`);
                                      }).catch(() => { prompt('Copie o link abaixo:', url); });
                                    }
                                  }}
                                  className={`p-2 rounded-full border transition-colors flex items-center justify-center
                                    ${student.pesquisa_socioeconomica
                                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                      : 'bg-teal-50 border-teal-200 text-teal-500 hover:bg-teal-100'
                                    }`}
                                  title={student.pesquisa_socioeconomica ? 'Pesquisa Socioeconômica enviada – clique para ver' : 'Pesquisa Socioeconômica pendente – clique para copiar link'}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </button>

                                {/* Botão Boletim Escolar */}
                                <button
                                  onClick={() => {
                                    const key = student.id || student.nome;
                                    if (student.boletim_escolar) {
                                      window.open(student.boletim_escolar.url, '_blank');
                                    } else {
                                      const url = `${baseUrl}?service=boletim&studentId=${encodeURIComponent(key)}&token=nucleo`;
                                      navigator.clipboard.writeText(url).then(() => {
                                        alert(`✅ Link copiado!\n\nEnvie para o aluno/responsável enviar o Boletim Escolar:\n${url}`);
                                      }).catch(() => { prompt('Copie o link abaixo:', url); });
                                    }
                                  }}
                                  className={`p-2 rounded-full border transition-colors flex items-center justify-center
                                    ${student.boletim_escolar && !student.boletim_escolar.parcial
                                      ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                                      : student.boletim_escolar?.parcial
                                        ? 'bg-yellow-50 border-yellow-300 text-yellow-600 hover:bg-yellow-100'
                                        : 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                                    }`}
                                  title={
                                    student.boletim_escolar && !student.boletim_escolar.parcial
                                      ? 'Boletim completo enviado – clique para ver'
                                      : student.boletim_escolar?.parcial
                                        ? 'Boletim parcial enviado – clique para ver'
                                        : 'Boletim Escolar pendente – clique para copiar link'
                                  }
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center mt-4 text-gray-500 text-xs">Arraste uma linha para adicionar a Ficha ao Relatório PDF.</p>
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW (MODAL OVERLAY) ---
  if (mode === 'DETAIL_VIEW') {
    const isPdf = formData.fichaUrl?.startsWith('data:application/pdf');

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
        {/* Container do Papel A4 */}
        <div className="relative w-full max-w-[210mm] my-12 mx-4 print:mx-0 print:my-0 print:w-full">

          {/* Controles Flutuantes (Fora da área de impressão) */}
          <div className="absolute top-0 -right-16 flex flex-col gap-3 print:hidden">
            <button
              onClick={() => setMode('LIST_VIEW')}
              className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              title="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              title="Imprimir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>
            {/* Laudo button in DETAIL_VIEW */}
            {(formData.laudo_url || getStudentLaudo(formData)) ? (
              <button
                onClick={() => setShowLaudo(!showLaudo)}
                className={`p-3 rounded-full shadow-lg transition-colors flex items-center justify-center ${showLaudo
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                title={showLaudo ? 'Ocultar Laudo' : 'Ver Laudo Médico'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            ) : null}
            {/* Botão de Alternância (Só aparece se tiver scan) */}
            {formData.fichaUrl && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`p-3 rounded-full shadow-lg transition-colors text-xs font-bold flex flex-col items-center justify-center w-12 h-12 ${showOriginal ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                title={showOriginal ? "Ver Transcrição" : "Ver Original"}
              >
                {showOriginal ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </button>
            )}
          </div>

          {/* Folha de Papel */}
          <div className="bg-white min-h-[297mm] p-10 shadow-2xl print:shadow-none print:p-0 box-border flex flex-col">
            {/* Lógica de Visualização: Se tiver url e showOriginal ativo, mostra a imagem/pdf. Senão, mostra o template */}
            {showOriginal && formData.fichaUrl ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 print:border-none print:bg-white">
                {isPdf ? (
                  <iframe src={formData.fichaUrl} className="w-full h-[290mm] border-none" title="Ficha Original PDF"></iframe>
                ) : (
                  <img src={formData.fichaUrl} alt="Ficha Original" className="max-w-full max-h-[290mm] object-contain" />
                )}
                <p className="text-center text-xs text-gray-500 mt-2 print:hidden">Visualizando arquivo original digitalizado</p>
              </div>
            ) : (
              <FormTemplate data={formData} reportType={reportType} />
            )}
            {/* Informação de Laudo no rodapé da ficha */}
            {(formData.portador_necessidade_especial || formData.laudo_url || getStudentLaudo(formData)) && (
              <div className="mt-4 pt-4 border-t border-purple-200 bg-purple-50 rounded p-3 print:hidden">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="font-bold text-purple-800 text-sm">Portador de Necessidade Especial (PNE)</span>
                </div>
                {(formData.laudo_url || getStudentLaudo(formData)) && (
                  <p className="text-xs text-purple-600 mt-1 ml-7">Laudo médico anexado. Use o botão roxo ao lado para visualizá-lo.</p>
                )}
              </div>
            )}
          </div>

          {/* LAUDO INLINE VIEWER (Aparece abaixo da ficha quando showLaudo = true) */}
          {showLaudo && (formData.laudo_url || getStudentLaudo(formData)) && (() => {
            const laudoSrc = formData.laudo_url || getStudentLaudo(formData);
            const isLaudoPdf = laudoSrc.startsWith('data:application/pdf');
            return (
              <div className="bg-white mt-4 rounded-lg shadow-2xl overflow-hidden border-2 border-purple-300 print:hidden">
                <div className="bg-purple-700 text-white px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="font-bold text-sm">Laudo Médico – {formData.nome}</span>
                  </div>
                  <a
                    href={laudoSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded font-bold"
                  >
                    Abrir em nova aba
                  </a>
                </div>
                <div className="p-4 bg-gray-50">
                  {isLaudoPdf ? (
                    <iframe
                      src={laudoSrc}
                      className="w-full border-none rounded"
                      style={{ height: '60vh' }}
                      title="Laudo Médico PDF"
                    />
                  ) : (
                    <img
                      src={laudoSrc}
                      alt="Laudo Médico"
                      className="max-w-full max-h-[60vh] object-contain mx-auto block rounded shadow"
                    />
                  )}
                </div>
              </div>
            );
          })()}
        </div>
        {/* Estilos de Impressão */}
        <style>{`
            @media print { 
                body { background-color: white !important; margin: 0 !important; } 
                .fixed { position: static !important; overflow: visible !important; background: none !important; }
                @page { size: A4 portrait; margin: 0; }
                .print\\:hidden { display: none !important; }
                /* Ocultar tudo que não seja o modal durante a impressão */
                body > *:not(.fixed) { display: none !important; }
                /* Ajuste para imagens grandes na impressão */
                img { max-height: 290mm !important; width: auto !important; max-width: 100% !important; page-break-inside: avoid; }
            }
         `}</style>
      </div>
    );
  }

  // --- SUCCESS MODE ---
  if (mode === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-white flex flex-col relative print:block">
        <div className="print:hidden flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Inscrição Confirmada!</h2>
          <p className="text-center text-gray-600 mb-8 max-w-md">Os dados foram salvos com sucesso. Você pode baixar a ficha assinada agora.</p>

          <div className="flex flex-col w-full max-w-xs gap-4">
            <button onClick={handleDownloadPDF} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12" /></svg>
              Baixar Ficha PDF
            </button>
            <button onClick={onBack} className="w-full py-4 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50">Voltar ao Menu</button>
          </div>
        </div>

        {/* FICHA OCULTA PARA IMPRESSÃO EM BACKGROUND */}
        <div className="hidden print:block p-10 bg-white max-w-[210mm] mx-auto h-full text-black font-serif relative">
          {/* Se tiver ficha original, imprime ela, senão imprime o template */}
          {formData.fichaUrl ? (
            formData.fichaUrl.startsWith('data:application/pdf') ? (
              <iframe src={formData.fichaUrl} className="w-full h-full" title="PDF"></iframe>
            ) : (
              <img src={formData.fichaUrl} className="w-full h-full object-contain" alt="Ficha Scan" />
            )
          ) : (
            <FormTemplate data={formData} reportType={reportType} />
          )}
        </div>
        <style>{`@media print { body { background-color: white !important; margin: 0 !important; } @page { size: A4 portrait; margin: 10mm; } .print\\:hidden { display: none !important; } .print\\:block { display: block !important; } html { height: 100%; } }`}</style>
      </div>
    );
  }

  if (mode === 'CAMERA_SCAN') {
    return <SmartCamera onCapture={handleSmartCapture} onClose={() => setMode('MENU')} title="Digitalizar Ficha" />;
  }

  if (mode === 'MENU') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="bg-white p-4 shadow-sm flex items-center gap-4">
          <button onClick={onBack} className="text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="font-bold text-lg text-gray-800">Ficha de Inscrição</h1>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center gap-6 max-w-md mx-auto w-full">
          <div className="text-center mb-4"><h2 className="text-xl font-bold text-blue-900">Tipo de Inscrição</h2><p className="text-gray-600 text-sm mt-2">Escolha como deseja registrar o aluno.</p></div>

          <button onClick={() => setMode('FORM_DIGITAL')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-blue-100 rounded-xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
            <span className="font-bold text-gray-800">Preencher Digitalmente</span><span className="text-xs text-gray-500 mt-1">Digitar dados e assinar na tela</span>
          </button>

          <div className="relative"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center"><span className="px-2 bg-gray-50 text-sm text-gray-500">OU</span></div></div>

          <button onClick={() => setMode('CAMERA_SCAN')} className="flex flex-col items-center justify-center p-6 bg-white border-2 border-green-100 rounded-xl shadow-sm hover:border-green-500 hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
            <span className="font-bold text-gray-800">Digitalizar Ficha Física</span><span className="text-xs text-gray-500 mt-1">Usar Câmera Inteligente</span>
          </button>

          {/* NEW BUTTON: VISUALIZAR INSCRIÇÕES */}
          <div className="relative mt-2"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div></div>

          <button onClick={() => setMode('LIST_VIEW')} className="flex items-center justify-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm hover:bg-white hover:border-gray-400 transition-all text-gray-700 font-bold text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Visualizar Inscrições Salvas
          </button>

          <label className="text-center text-blue-600 text-sm font-semibold mt-2 cursor-pointer">Carregar foto do dispositivo<input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} /></label>
        </div>
      </div>
    );
  }

  // --- SCAN REVIEW ---
  if (mode === 'SCAN_REVIEW') {
    const isPdf = formData.fichaUrl?.startsWith('data:application/pdf');
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white p-4 shadow-sm flex items-center gap-4">
          <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
          <h1 className="font-bold text-lg text-gray-800">Revisar Ficha</h1>
        </div>
        <div className="flex-1 p-4 max-md mx-auto w-full space-y-4">
          <div className="bg-white p-2 rounded border shadow-sm">
            {isPdf ? (
              <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-500 font-bold">PDF Anexado</span>
              </div>
            ) : (
              <img src={formData.fichaUrl} alt="Scan" className="w-full h-64 object-contain bg-gray-100 rounded" />
            )}
            <button onClick={() => setMode('CAMERA_SCAN')} className="w-full mt-2 text-sm text-blue-600 font-medium py-1">Tirar outra foto</button>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border space-y-4">
            <p className="text-sm text-gray-600">A ficha física foi capturada. Por favor, identifique os dados principais.</p>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Aluno</label><input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Digite o nome completo" className={inputStyle} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Data da Assinatura</label><input type="text" value={formData.data_assinatura} onChange={e => setFormData({ ...formData, data_assinatura: e.target.value })} placeholder="DD/MM/AAAA" className={inputStyle} /></div>
          </div>
          <button onClick={handleScanSubmit} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all">Salvar Ficha Física</button>
        </div>
      </div>
    );
  }

  // --- FORM DIGITAL MODE ---
  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-4">
        <button onClick={() => setMode('MENU')} className="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg></button>
        <h1 className="font-bold text-lg text-gray-800">Ficha do Aluno</h1>
      </div>
      <div className="p-4 max-w-2xl mx-auto w-full flex-1 pb-24 space-y-8">

        {/* MODELO SELECTION */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label className="block text-sm font-bold text-blue-800 mb-2">Modelo de Cadastro</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full bg-white border border-blue-200 rounded p-2 text-gray-800 font-medium focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="REPORT_8">Relação de Alunos com Indicação de Escola</option>
            <option value="REPORT_7">Relação Diretamente Beneficiados</option>
          </select>
          <p className="text-xs text-blue-600 mt-2">
            {reportType === 'REPORT_8' ? 'Preencha dados da escola, SLI e projeto.' : 'Preencha endereço completo, telefone e dados do projeto.'}
          </p>
        </div>

        {/* DADOS DO PROJETO (COMUM) */}
        <div className="space-y-4 border-b border-gray-100 pb-6">
          <h3 className="font-bold text-lg text-gray-800">Dados do Projeto (Comum)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nº SLI</label><input type="text" value={formData.n_sli} onChange={e => setFormData({ ...formData, n_sli: e.target.value })} className={inputStyle} /></div>
            <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Projeto</label><input type="text" value={formData.nome_projeto} onChange={e => setFormData({ ...formData, nome_projeto: e.target.value })} className={inputStyle} /></div>
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Proponente</label><input type="text" value={formData.proponente} onChange={e => setFormData({ ...formData, proponente: e.target.value })} className={inputStyle} /></div>
            <div className="col-span-2"><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nome Responsável (Organização)</label><input type="text" value={formData.nome_responsavel_organizacao} onChange={e => setFormData({ ...formData, nome_responsavel_organizacao: e.target.value })} className={inputStyle} placeholder="Associação/Federação" /></div>
          </div>
        </div>

        {/* DADOS DO ALUNO (DINAMICO) - Unificado conforme solicitação */}
        <div className="space-y-4 border-b border-gray-100 pb-6">
          <h3 className="font-bold text-lg text-gray-800">Dados do Aluno</h3>

          {/* Nome */}
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome do aluno(a)</label><input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className={inputStyle} /></div>

          {/* Data Nascimento & Idade & RG/CPF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Nascimento</label>
              <input type="text" value={formData.data_nascimento} placeholder="DD/MM/AAAA" onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })} className={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">RG/CPF do aluno(a)</label>
              <input type="text" value={formData.rg_cpf} onChange={e => setFormData({ ...formData, rg_cpf: e.target.value })} className={inputStyle} />
            </div>
          </div>

          {/* Escola */}
          <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Escola em que estuda</label>
                <input type="text" value={formData.escola_nome} onChange={e => setFormData({ ...formData, escola_nome: e.target.value })} className={inputStyle} placeholder="Nome da Escola" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Escola</label>
                <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="escola_tipo" checked={formData.escola_tipo === 'PUBLICA'} onChange={() => setFormData({ ...formData, escola_tipo: 'PUBLICA' })} className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Pública</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="escola_tipo" checked={formData.escola_tipo === 'PARTICULAR'} onChange={() => setFormData({ ...formData, escola_tipo: 'PARTICULAR' })} className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Particular</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço Completo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço Completo (Rua, nº, cep, cidade/estado)</label>
            <input type="text" value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} className={inputStyle} />
          </div>

          {/* NECESSIDADE ESPECIAL */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <label className="block text-sm font-bold text-purple-900">Portador de Necessidade Especial (PNE)?</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, portador_necessidade_especial: false, laudo_url: '' }))}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm border-2 transition-all ${!formData.portador_necessidade_especial
                  ? 'bg-gray-200 border-gray-400 text-gray-800'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                  }`}
              >
                Não
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, portador_necessidade_especial: true }))}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm border-2 transition-all ${formData.portador_necessidade_especial
                  ? 'bg-purple-600 border-purple-700 text-white shadow-md'
                  : 'bg-white border-purple-200 text-purple-500 hover:border-purple-400'
                  }`}
              >
                Sim
              </button>
            </div>
            {/* Upload do Laudo (aparece apenas se PNE = Sim) */}
            {formData.portador_necessidade_especial && (
              <div className="mt-3 animate-pulse-once">
                <label className="block text-sm font-semibold text-purple-800 mb-2">Laudo Médico (opcional)</label>
                {formData.laudo_url ? (
                  <div className="flex items-center gap-3 bg-white rounded-lg border border-purple-300 p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-green-700">✓ Laudo Anexado</p>
                      <p className="text-xs text-gray-500 truncate">Arquivo carregado com sucesso</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, laudo_url: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-purple-300 rounded-lg bg-white hover:bg-purple-50 cursor-pointer transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    <span className="text-sm font-semibold text-purple-700">Clique para anexar o Laudo</span>
                    <span className="text-xs text-gray-400">Imagem ou PDF aceitos</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onloadend = () => setFormData(prev => ({ ...prev, laudo_url: reader.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 border-b border-gray-100 pb-6">
          <h3 className="font-bold text-lg text-gray-800">Dados do Responsável</h3>

          {/* Responsável */}
          <div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome do(a) Responsável legal</label><input type="text" value={formData.nome_responsavel} onChange={e => setFormData({ ...formData, nome_responsavel: e.target.value })} className={inputStyle} /></div>

          {/* Contato (Tel / Email) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Telefone de contato</label><input type="text" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} className={inputStyle} placeholder="( )" /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Email</label><input type="email" value={formData.email_contato} onChange={e => setFormData({ ...formData, email_contato: e.target.value })} className={inputStyle} /></div>
          </div>
        </div>

        <div className="space-y-6 pt-2">
          <h3 className="font-bold text-lg text-gray-800">Termos e Assinatura</h3>
          <div className="bg-gray-50 p-4 rounded text-xs text-justify text-gray-600 space-y-2 h-40 overflow-y-auto border border-gray-200 font-serif">
            {legalTextParagraphs.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded border border-blue-100">
            <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 h-5 w-5" />
            <label htmlFor="terms" className="text-sm font-bold text-blue-900">Aceite os termos</label>
          </div>
          {agreed && (
            <div className="mt-4 animate-fade-in space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Data da Assinatura</label>
                <input type="text" value={formData.data_assinatura} onChange={e => setFormData({ ...formData, data_assinatura: e.target.value })} placeholder="DD/MM/AAAA" className={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Assinatura do Responsável Legal</label>
                <SignaturePad onEnd={(base64) => setFormData(prev => ({ ...prev, assinatura: base64 }))} onClear={() => setFormData(prev => ({ ...prev, assinatura: '' }))} />
              </div>
            </div>
          )}
        </div>

        <button onClick={handleDigitalSubmit} disabled={!agreed || !formData.assinatura} className={`w-full py-4 rounded-lg font-bold shadow-lg text-lg transition-all ${!agreed || !formData.assinatura ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white'}`}>Confirmar Inscrição</button>
      </div>
    </div>
  );
};
