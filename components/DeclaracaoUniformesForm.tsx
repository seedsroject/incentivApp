
import React, { useRef, useState, useEffect } from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DeclaracaoUniformes } from '../types';

interface DeclaracaoUniformesFormProps {
    studentName: string;
    responsavelName: string;
    cpfResponsavel?: string;
    // Se já existir uma declaração assinada, renderiza em modo VIEW
    existingDeclaracao?: DeclaracaoUniformes;
    onSave: (declaracao: DeclaracaoUniformes) => void;
    onClose?: () => void;
    // Modo público (via link externo) oculta o botão fechar
    isPublic?: boolean;
}

const UNIFORME_ITEMS = [
    'Agasalho Calça e Casaco',
    'Macaquinho de Triathlon',
    'Boné',
    'Camiseta',
    'Bermuda',
    'Sacola Esportiva',
    'Sunga ou Maiô',
];

// --- SUB-COMPONENTE: PAD DE ASSINATURA (local, igual ao CameraOCR) ---
const SignaturePad: React.FC<{ onEnd: (base64: string) => void; onClear: () => void }> = ({ onEnd, onClear }) => {
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
        const touch = e.touches ? e.touches[0] : e;
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const startDraw = (e: any) => {
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        const pos = getPos(e);
        if (ctx) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
        e.preventDefault();
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext('2d');
        const pos = getPos(e);
        if (ctx) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
        e.preventDefault();
    };

    const endDraw = () => {
        setIsDrawing(false);
        if (canvasRef.current) onEnd(canvasRef.current.toDataURL('image/png'));
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        onClear();
    };

    return (
        <div>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white touch-none">
                <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                />
            </div>
            <button type="button" onClick={clear} className="mt-2 text-xs text-red-500 font-semibold hover:text-red-700">
                Limpar Assinatura
            </button>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const DeclaracaoUniformesForm: React.FC<DeclaracaoUniformesFormProps> = ({
    studentName,
    responsavelName,
    cpfResponsavel,
    existingDeclaracao,
    onSave,
    onClose,
    isPublic = false,
}) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const [selectedItems, setSelectedItems] = useState<string[]>(
        existingDeclaracao?.itens_recebidos || []
    );
    const [cpf, setCpf] = useState(cpfResponsavel || existingDeclaracao?.cpf_responsavel || '');
    const [dataAssinatura, setDataAssinatura] = useState(
        existingDeclaracao?.data_assinatura || today
    );
    const [assinatura, setAssinatura] = useState(existingDeclaracao?.assinatura || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isViewMode] = useState(!!existingDeclaracao);

    const toggleItem = (item: string) => {
        setSelectedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleSelectAll = () => {
        setSelectedItems(selectedItems.length === UNIFORME_ITEMS.length ? [] : [...UNIFORME_ITEMS]);
    };

    const handleSave = async () => {
        if (!assinatura) { alert('Por favor, assine o documento antes de salvar.'); return; }
        if (selectedItems.length === 0) { alert('Selecione ao menos um item recebido.'); return; }
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 500));
        onSave({
            assinatura,
            data_assinatura: dataAssinatura,
            itens_recebidos: selectedItems,
            cpf_responsavel: cpf,
            timestamp: new Date().toISOString(),
        });
        setIsSaving(false);
    };

    const handlePrint = () => window.print();

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 print:bg-white">
            {/* Controles fora da área de impressão */}
            {!isPublic && (
                <div className="print:hidden flex items-center justify-between p-3 bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        {onClose && (
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        <span className="font-bold text-gray-700 text-sm">Declaração de Recebimento de Uniformes</span>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir
                    </button>
                </div>
            )}

            {/* Área do Documento A4 */}
            <div className="flex-1 p-4 md:p-8 flex justify-center print:p-0">
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none p-10 print:p-8 flex flex-col font-serif text-[13px] text-black print:text-black">

                    {/* Cabeçalho com Banner Oficial (3 logos) */}
                    <div className="border-b-2 border-black pb-4 mb-6 print:mb-4">
                        <DocumentHeader className="mb-3" />
                        <h1 className="text-base font-black uppercase tracking-wider text-center mt-2">Declaração de Recebimento de Uniformes</h1>
                        <p className="text-xs text-center text-gray-500 mt-0.5">Projeto Escolinha de Triathlon - Formando Campeões</p>
                    </div>

                    {/* Corpo do Documento */}
                    <div className="flex-1 space-y-5">
                        {/* Texto principal */}
                        <p className="leading-relaxed">
                            Eu, <span className="font-bold underline">{responsavelName || '_______________________'}</span>
                            {cpf ? `, CPF ${cpf}` : ''}, responsável pelo(a) aluno(a){' '}
                            <span className="font-bold underline">{studentName || '_______________________'}</span>{' '}
                            que participa do Projeto "Escolinha de Triathlon", declaro ter recebido os uniformes de uso individual abaixo listados.
                        </p>

                        {/* Lista de Uniformes */}
                        <div className="py-2">
                            {!isViewMode && (
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-bold text-gray-700">Selecione os itens recebidos:</p>
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-xs text-blue-600 font-bold hover:underline print:hidden"
                                    >
                                        {selectedItems.length === UNIFORME_ITEMS.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                    </button>
                                </div>
                            )}
                            <ul className="space-y-1.5">
                                {UNIFORME_ITEMS.map(item => {
                                    const isSelected = selectedItems.includes(item);
                                    return (
                                        <li key={item} className="flex items-center gap-3">
                                            {isViewMode ? (
                                                <>
                                                    <span className={`w-4 h-4 flex-shrink-0 border rounded flex items-center justify-center text-[10px] ${isSelected ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                                                        {isSelected && '✓'}
                                                    </span>
                                                    <span className={isSelected ? 'font-semibold' : 'text-gray-400 line-through'}>{item}</span>
                                                </>
                                            ) : (
                                                <label className="flex items-center gap-3 cursor-pointer w-full hover:bg-blue-50 p-1.5 rounded transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleItem(item)}
                                                        className="w-4 h-4 rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className={`text-sm ${isSelected ? 'font-semibold text-black' : 'text-gray-600'}`}>{item}</span>
                                                </label>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Parágrafos do termo */}
                        <p className="leading-relaxed">
                            Responsabilizo-me por orientar meu (minha) filho(a) a zelar pelos materiais, mantendo-os
                            limpos e em bom estado, devendo o aluno estar uniformizado em todas as aulas.
                        </p>
                        <p className="leading-relaxed">
                            Para que o aluno permaneça no Projeto é necessária a presença em no mínimo 70% das
                            aulas. Faltas justificadas serão analisadas pelos professores.
                        </p>
                        <p className="leading-relaxed">
                            Caso meu filho(a) desista do projeto antes do término do mesmo, prometo devolver os
                            uniformes recebidos.
                        </p>

                        {/* CPF (apenas no modo formulário, se não foi pré-preenchido) */}
                        {!isViewMode && !cpfResponsavel && (
                            <div className="print:hidden">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF do Responsável (opcional)</label>
                                <input
                                    type="text"
                                    value={cpf}
                                    onChange={e => setCpf(e.target.value)}
                                    placeholder="000.000.000-00"
                                    className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Data */}
                        <div className="flex items-center gap-2 mt-2">
                            <span className="font-semibold">Data</span>
                            {isViewMode ? (
                                <span className="ml-1">{existingDeclaracao?.data_assinatura}</span>
                            ) : (
                                <input
                                    type="text"
                                    value={dataAssinatura}
                                    onChange={e => setDataAssinatura(e.target.value)}
                                    placeholder="DD/MM/AAAA"
                                    className="border-b border-black bg-transparent text-sm px-1 focus:outline-none w-32 print:border-black"
                                />
                            )}
                        </div>

                        {/* Assinatura */}
                        <div className="mt-6">
                            {isViewMode && existingDeclaracao?.assinatura ? (
                                <div className="flex flex-col items-center">
                                    <img
                                        src={existingDeclaracao.assinatura}
                                        alt="Assinatura"
                                        className="max-h-24 object-contain"
                                    />
                                    <div className="h-px bg-black w-64 mt-1" />
                                    <p className="text-xs tracking-widest uppercase mt-1 font-bold">Assinatura do Responsável</p>
                                </div>
                            ) : (
                                <div className="print:hidden">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Assinatura do Responsável</label>
                                    <SignaturePad onEnd={base64 => setAssinatura(base64)} onClear={() => setAssinatura('')} />
                                    {/* Área de assinatura visível na impressão */}
                                    <div className="hidden print:flex flex-col items-center mt-4">
                                        {assinatura && <img src={assinatura} alt="Assinatura" className="max-h-20 object-contain" />}
                                        <div className="h-px bg-black w-64 mt-2" />
                                        <p className="text-xs tracking-widest uppercase mt-1 font-bold">Assinatura do Responsável</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rodapé */}
                    <div className="mt-8 pt-4 border-t border-gray-300 text-center">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                            Sistema de Gestão Esportiva · Ministério do Esporte
                        </p>
                    </div>
                </div>
            </div>

            {/* Botão de Salvar (fora da área de impressão) */}
            {!isViewMode && (
                <div className="print:hidden sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-gray-600 font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !assinatura || selectedItems.length === 0}
                        className={`flex-1 py-3 rounded-lg font-bold text-base shadow-md transition-all flex items-center justify-center gap-2
              ${isSaving || !assinatura || selectedItems.length === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Assinar e Salvar Declaração
                            </>
                        )}
                    </button>
                </div>
            )}

            <style>{`
        @media print {
          body { background: white !important; margin: 0 !important; }
          @page { size: A4 portrait; margin: 10mm; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:flex { display: flex !important; }
          .shadow-xl { box-shadow: none !important; }
        }
      `}</style>
        </div>
    );
};
