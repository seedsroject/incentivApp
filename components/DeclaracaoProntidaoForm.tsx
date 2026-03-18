
import React, { useRef, useState, useEffect } from 'react';
import { DocumentHeader } from './DocumentHeader';
import { DeclaracaoProntidao } from '../types';

interface DeclaracaoProntidaoFormProps {
    studentName: string;
    responsavelName: string;
    existingDeclaracao?: DeclaracaoProntidao;
    onSave: (declaracao: DeclaracaoProntidao) => void;
    onClose?: () => void;
    isPublic?: boolean;
}

const PERGUNTAS = [
    'Algum médico já disse que você possui algum problema de coração ou pressão arterial, e que somente deveria realizar atividade física supervisionado por profissionais de saúde?',
    'Você sente dores no peito quando pratica atividade física?',
    'No último mês, você sentiu dores no peito ao praticar atividade física?',
    'Você apresenta algum desequilíbrio devido à tontura e/ou perda momentânea da consciência?',
    'Você possui algum problema ósseo ou articular, que pode ser afetado ou agravado pela atividade física?',
    'Você toma atualmente algum tipo de medicação de uso contínuo?',
    'Você realiza algum tipo de tratamento médico para pressão arterial ou problemas cardíacos?',
    'Você realiza algum tratamento médico contínuo, que possa ser afetado ou prejudicado com a atividade física?',
    'Você já se submeteu a algum tipo de cirurgia, que comprometa de alguma forma a atividade física?',
    'Sabe de alguma outra razão pela qual a atividade física possa eventualmente comprometer sua saúde?',
];

// --------------- SIGNATURE PAD ---------------
const CANVAS_HEIGHT = 200;

const SignaturePad: React.FC<{ onEnd: (base64: string) => void; onClear: () => void }> = ({ onEnd, onClear }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    const setCanvasSize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = canvas.parentElement?.clientWidth || 340;
        // Set the canvas internal resolution to match physical pixels
        canvas.width = cssWidth * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#1e293b';
        }
    };

    useEffect(() => {
        setCanvasSize();
        const handleResize = () => setCanvasSize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Converts a mouse or touch event coordinate to canvas CSS-space position
    const getPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        // Scale factor: CSS pixel size vs canvas element layout size
        const scaleX = canvas.width / (window.devicePixelRatio || 1) / rect.width;
        const scaleY = canvas.height / (window.devicePixelRatio || 1) / rect.height;
        if ('touches' in e && e.touches.length > 0) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        const me = e as MouseEvent;
        return {
            x: (me.clientX - rect.left) * scaleX,
            y: (me.clientY - rect.top) * scaleY,
        };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDrawingRef.current = true;
        const ctx = canvasRef.current?.getContext('2d');
        const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent);
        if (ctx) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent);
        if (ctx) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
    };

    const endDraw = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        if (canvasRef.current) onEnd(canvasRef.current.toDataURL('image/png'));
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        onClear();
    };

    return (
        <div>
            <div
                className="border-2 border-dashed border-blue-300 rounded-xl overflow-hidden bg-blue-50/20 touch-none select-none"
                style={{ height: CANVAS_HEIGHT }}
            >
                <canvas
                    ref={canvasRef}
                    className="w-full cursor-crosshair"
                    style={{ display: 'block', height: CANVAS_HEIGHT, touchAction: 'none' }}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={endDraw}
                    onTouchCancel={endDraw}
                />
            </div>
            <button type="button" onClick={clear}
                className="mt-2 text-xs text-red-500 font-semibold hover:text-red-700 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpar Assinatura
            </button>
        </div>
    );
};

// --------------- MAIN COMPONENT ---------------
export const DeclaracaoProntidaoForm: React.FC<DeclaracaoProntidaoFormProps> = ({
    studentName,
    responsavelName,
    existingDeclaracao,
    onSave,
    onClose,
    isPublic = false,
}) => {
    const today = new Date().toLocaleDateString('pt-BR');
    const isViewMode = !!existingDeclaracao;

    const [respostas, setRespostas] = useState<Record<number, 'SIM' | 'NAO'>>(
        existingDeclaracao?.respostas || {}
    );
    const [dataAssinatura, setDataAssinatura] = useState(
        existingDeclaracao?.data_assinatura || today
    );
    const [assinatura, setAssinatura] = useState(existingDeclaracao?.assinatura || '');
    const [isSaving, setIsSaving] = useState(false);

    const answeredCount = Object.keys(respostas).length;
    const allAnswered = answeredCount === PERGUNTAS.length;
    const progress = Math.round((answeredCount / PERGUNTAS.length) * 100);

    const handleSave = async () => {
        if (!allAnswered) { alert('Por favor, responda todas as perguntas antes de assinar.'); return; }
        if (!assinatura) { alert('Por favor, adicione sua assinatura antes de enviar.'); return; }
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 500));
        onSave({
            assinatura,
            data_assinatura: dataAssinatura,
            respostas,
            timestamp: new Date().toISOString(),
        });
        setIsSaving(false);
    };

    // ---------- VIEW MODE (read-only) ----------
    if (isViewMode) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-40 border-b border-gray-200">
                    {onClose && (
                        <button onClick={onClose} className="text-blue-600 p-1 rounded hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    )}
                    <div>
                        <h1 className="font-bold text-base text-gray-800 leading-tight">Questionário de Prontidão — ANEXO I</h1>
                        <p className="text-xs text-green-600 font-bold mt-0.5">✓ Respondido em {existingDeclaracao?.data_assinatura}</p>
                    </div>
                </div>

                <div className="p-4 flex-1 max-w-2xl mx-auto w-full pb-10 space-y-4">
                    {/* Info Banner */}
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-green-800">
                        <p><b>Questionário assinado pelo responsável</b> do aluno <b>{studentName}</b>.</p>
                    </div>

                    {/* Questions */}
                    {PERGUNTAS.map((pergunta, idx) => {
                        const num = idx + 1;
                        const resposta = existingDeclaracao?.respostas[num];
                        return (
                            <div key={num} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                                <p className="font-bold text-gray-800 mb-3 text-sm">{num}. {pergunta}</p>
                                <div className="flex gap-3">
                                    <span className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border-2 font-bold text-sm
                    ${resposta === 'SIM' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                        Sim
                                    </span>
                                    <span className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg border-2 font-bold text-sm
                    ${resposta === 'NAO' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                        Não
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Signature */}
                    {existingDeclaracao?.assinatura && (
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assinatura do Responsável</p>
                            <img src={existingDeclaracao.assinatura} alt="Assinatura" className="max-h-24 object-contain" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ---------- FILL MODE ----------
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-40 border-b border-gray-200">
                {onClose && !isPublic && (
                    <button onClick={onClose} className="text-blue-600 p-1 rounded hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                )}
                <div className="flex-1">
                    <h1 className="font-bold text-base text-gray-800 leading-tight">Questionário de Prontidão — ANEXO I</h1>
                    <div className="flex items-center gap-2 mt-1">
                        {/* Progress bar */}
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 font-bold whitespace-nowrap">{answeredCount}/{PERGUNTAS.length}</span>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 max-w-2xl mx-auto w-full pb-32 space-y-4">

                {/* Official Header (for print) */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <DocumentHeader className="mb-3" />
                    <div className="text-center border-t pt-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ANEXO I</p>
                        <h2 className="font-black text-gray-800 text-sm uppercase">Questionário de Prontidão para Atividade Física</h2>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800 leading-relaxed">
                    <p>
                        <b>Prezado(a) Responsável,</b> este questionário tem por objetivo identificar a necessidade de avaliação por um médico
                        antes do início da atividade física do(a) aluno(a) <b className="underline">{studentName || '________________________'}</b>.
                        Por favor, assinale "Sim" ou "Não" para cada pergunta abaixo.
                    </p>
                </div>

                {/* Questions */}
                {PERGUNTAS.map((pergunta, idx) => {
                    const num = idx + 1;
                    const resposta = respostas[num];
                    return (
                        <div
                            key={num}
                            className={`bg-white p-5 rounded-lg shadow-sm border-2 transition-all ${resposta === undefined
                                    ? 'border-gray-200'
                                    : resposta === 'SIM'
                                        ? 'border-red-200 bg-red-50/30'
                                        : 'border-green-200 bg-green-50/30'
                                }`}
                        >
                            <label className="block font-bold text-gray-800 mb-4 text-sm leading-relaxed">
                                {num}. {pergunta}
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRespostas(prev => ({ ...prev, [num]: 'SIM' }))}
                                    className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 font-bold text-sm transition-all
                    ${resposta === 'SIM'
                                            ? 'bg-red-500 border-red-500 text-white shadow-md scale-[1.02]'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Sim
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRespostas(prev => ({ ...prev, [num]: 'NAO' }))}
                                    className={`flex-1 flex items-center justify-center py-3 rounded-xl border-2 font-bold text-sm transition-all
                    ${resposta === 'NAO'
                                            ? 'bg-green-500 border-green-500 text-white shadow-md scale-[1.02]'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-500'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Não
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Date */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <label className="block font-bold text-gray-800 mb-2 text-sm">Data</label>
                    <input
                        type="text"
                        value={dataAssinatura}
                        onChange={e => setDataAssinatura(e.target.value)}
                        placeholder="DD/MM/AAAA"
                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors outline-none"
                    />
                </div>

                {/* Signature */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <label className="block font-bold text-gray-800 mb-1 text-sm">Assinatura do(a) Responsável Legal</label>
                    <p className="text-xs text-gray-400 mb-3">Assine com o dedo ou mouse no espaço abaixo</p>
                    <SignaturePad
                        onEnd={base64 => setAssinatura(base64)}
                        onClear={() => setAssinatura('')}
                    />
                    {assinatura && (
                        <p className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Assinatura registrada
                        </p>
                    )}
                </div>
            </div>

            {/* Fixed Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
                <div className="max-w-2xl mx-auto flex gap-3">
                    {onClose && !isPublic && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 text-gray-600 font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !assinatura || !allAnswered}
                        className={`flex-1 py-3.5 rounded-xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2
              ${isSaving || !assinatura || !allAnswered
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Enviando...
                            </>
                        ) : !allAnswered ? (
                            `Responda mais ${PERGUNTAS.length - answeredCount} pergunta${PERGUNTAS.length - answeredCount !== 1 ? 's' : ''}`
                        ) : !assinatura ? (
                            'Adicione sua assinatura'
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Assinar e Enviar Questionário
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
