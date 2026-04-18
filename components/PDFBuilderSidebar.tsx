
import React, { useState, useRef, useEffect } from 'react';
import { usePDFBuilder } from './PDFBuilderContext';
import { PDFItem, PDFItemType, PDFPage, TextStyle } from '../types';
import { refineText } from '../services/geminiService';

interface SidebarProps {
    onOpenPreview: () => void;
}

// --- CONSTANTS PARA RENDERIZAÇÃO FIEL ---
const LEGAL_TEXT_PARAGRAPHS = [
    "Declaro que o aluno acima identificado está freqüentando a escola regularmente e está ciente que como critério de permanência no projeto será exigido do aluno, o bom rendimento escolar em regular instituição de ensino da região, através da apresentação freqüente do boletim escolar, declaro ainda que o atestado médico do aluno está regularmente válido e atestou que está apto a realizar atividades físicas como natação, ciclismo e corrida.",
    "Os uniformes que serão entregues aos alunos, são de responsabilidade do aluno, e em caso de desistência do projeto antes do período de execução do mesmo, deverão ser devolvidos ao coordenador do projeto para que outro aluno possa fazer uso, por isso a boa conservação e cuidado são fundamentais.",
    "O(a) Responsável legal, infra assinados(s), com fundamento no art. 5o, X e XXVIII da Constituição Federal/ 1988, e no art. 18, da Lei 10.406, de 10/01/2002, AUTORIZA o uso da imagem e/ou nome do aluno inscrito do projeto, para fins de divulgação das atividades e propaganda, podendo, para tanto, reproduzi-la e/ou divulgá-la pela internet, mídia eletrônica, por jornais, revistas, folders; bem como por todo e qualquer material e veículo de comunicação, público e/ou privado, por parceiros e patrocinadores do projeto, com finalidade informativa, de utilidade pública e de marketing, por tempo indeterminado. O(a) Cedente declara ainda que não há nada a ser reclamado, a título de direitos conexos; referentes ao uso de sua imagem e/ou nome. A presente autorização é concedida a título gratuito.",
    "1. Anexar cópia do último boletim escolar do aluno e declaração de matricula em escola regular;"
];

const META_QUESTIONS = [
    { id: 'q1', target: 'ALUNO', text: 'O QUE VOCÊ ACHOU DAS ATIVIDADES ESPORTIVAS OFERECIDAS NO PROJETO "ESCOLINHA DE TRIATHLON"?' },
    { id: 'q2', target: 'SR(A). RESPONSÁVEL PELO ALUNO', text: 'VOCÊ PERCEBEU MELHORIA NA QUALIDADE DE VIDA/SAÚDE DA CRIANÇA/ADOLESCENTE DURANTE O PROJETO?' },
    { id: 'q3', target: 'SR(A). RESPONSÁVEL PELO ALUNO', text: 'VOCÊ PERCEBEU MELHORA NO DESEMPENHO ESCOLAR DA CRIANÇA/ADOLESCENTE DURANTE O PROJETO?' },
    { id: 'q4', target: 'PROFESSOR', text: 'VOCÊ PERCEBEU MELHORA NO CONVÍVIO SOCIAL DESTE ALUNO DURANTE O PROJETO?' }
];

const SOCIO_LABELS: Record<string, string> = {
    nome: '1. Nome completo',
    genero: '2. Gênero',
    cor_raca: '3. Cor ou Raça',
    faixa_etaria: '4. Faixa Etária',
    deficiencia: '5. Deficiência',
    responsavel_transporte: '6. Responsável Transporte',
    meio_transporte: '7. Meio de Transporte',
    freq_atividade_anterior: '8. Freq. Atividade Anterior',
    matricula_escola: '9. Matrícula',
    detalhe_escola_particular: '10. Detalhe Escola',
    escolaridade: '11. Escolaridade',
    periodo_estudo: '12. Período Estudo',
    area_residencia: '13. Área Residência',
    tipo_moradia: '14. Tipo Moradia',
    num_pessoas_casa: '15. Pessoas na Casa',
    renda_familiar: '16. Renda Familiar',
    resp_nucleo_familiar: '17. Resp. Núcleo Familiar',
    beneficio_social: '18. Benefício Social',
    tipo_beneficio: '19. Tipo Benefício',
    sistema_saude: '20. Sistema Saúde',
    acompanhamento_medico: '21. Acomp. Médico',
    vacinas_completas: '22. Vacinas',
    peso: '23. Peso',
    altura: '24. Altura'
};

// Helper Idade
const calculateAge = (dob: string) => {
    if (!dob) return '-';
    const parts = dob.split('/');
    if (parts.length !== 3) return '-';
    const birth = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// Default Styles for new Text Items - FORCE BLACK AND BOLD
const DEFAULT_TEXT_STYLE: TextStyle = {
    fontFamily: 'Arial',
    fontSize: 12,
    textAlign: 'left',
    lineHeight: 1.5,
    fontWeight: 'bold', // Default Bold
    fontStyle: 'normal',
    color: '#000000' // Default Black
};

// --- SIDEBAR FORMATTING CONTROLS (STATIC) ---
const SidebarFormatting: React.FC<{ item: PDFItem; pageId: string }> = ({ item, pageId }) => {
    const { updateItem } = usePDFBuilder();
    const style: any = item.data.style || DEFAULT_TEXT_STYLE; // Cast to any to support extended props
    const currentHeadingLevel = item.data.headingLevel || 'P'; // P, H1, H2, H3

    const handleStyleChange = (key: string, value: any) => {
        const newStyle = { ...style, [key]: value };
        updateItem(pageId, item.id, { data: { ...item.data, style: newStyle } });
    };

    const handleHeadingChange = (level: string) => {
        let newStyle = { ...style };

        // Aplicar estilos padrão para cada nível para facilitar
        if (level === 'H1') {
            newStyle.fontSize = 24;
            newStyle.fontWeight = 'bold';
            newStyle.color = '#000000';
        } else if (level === 'H2') {
            newStyle.fontSize = 18;
            newStyle.fontWeight = 'bold';
            newStyle.color = '#333333';
        } else if (level === 'H3') {
            newStyle.fontSize = 14;
            newStyle.fontWeight = 'bold';
            newStyle.color = '#555555';
        } else {
            // P (Parágrafo)
            newStyle.fontSize = 12;
            newStyle.fontWeight = 'normal';
        }

        updateItem(pageId, item.id, {
            data: {
                ...item.data,
                headingLevel: level,
                style: newStyle
            }
        });
    };

    return (
        <div className="flex flex-col gap-3 p-3 bg-white rounded-lg border border-gray-300 mb-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-1">
                <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar Texto
                </h4>
            </div>

            {/* Heading Level Selector (Sistema de Títulos) */}
            <div className="flex flex-col mb-2">
                <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 flex justify-between">
                    Estilo (Sumário)
                    <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded">Auto</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                    {['P', 'H1', 'H2', 'H3'].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => handleHeadingChange(lvl)}
                            className={`py-1.5 px-1 rounded text-[10px] font-bold border transition-all ${currentHeadingLevel === lvl ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            title={lvl === 'P' ? 'Texto Normal' : `Título ${lvl.replace('H', '')}`}
                        >
                            {lvl === 'P' ? 'Normal' : lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Font Family */}
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-black uppercase mb-1">Fonte</label>
                <select
                    value={style.fontFamily}
                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    className="w-full border border-gray-300 rounded text-xs p-2 text-black bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Roboto">Roboto</option>
                    <option value="'Rawline', sans-serif">Gov.br (Rawline)</option>
                </select>
            </div>

            {/* Size & Color & Style */}
            <div className="flex gap-2 items-end">
                <div className="flex flex-col w-16">
                    <label className="text-[10px] font-bold text-black uppercase mb-1">Tamanho</label>
                    <input
                        type="number"
                        value={style.fontSize}
                        onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
                        className="w-full border border-gray-300 rounded text-xs p-2 text-black text-center font-bold focus:border-black focus:outline-none"
                    />
                </div>
                <div className="flex flex-col flex-1">
                    <label className="text-[10px] font-bold text-black uppercase mb-1">Cor</label>
                    <div className="relative w-full h-9 rounded border border-gray-300 overflow-hidden cursor-pointer bg-white">
                        <input
                            type="color"
                            value={style.color || '#000000'}
                            onChange={(e) => handleStyleChange('color', e.target.value)}
                            className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                        />
                    </div>
                </div>
                <button
                    onClick={() => handleStyleChange('fontWeight', style.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`h-9 w-9 flex items-center justify-center rounded border shadow-sm transition-all ${style.fontWeight === 'bold' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                    title="Negrito"
                >
                    <span className="font-bold text-sm">B</span>
                </button>
                <button
                    onClick={() => handleStyleChange('fontStyle', style.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`h-9 w-9 flex items-center justify-center rounded border shadow-sm transition-all ${style.fontStyle === 'italic' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                    title="Itálico"
                >
                    <span className="italic font-serif text-sm">I</span>
                </button>
                <button
                    onClick={() => handleStyleChange('textDecoration', style.textDecoration === 'underline' ? 'none' : 'underline')}
                    className={`h-9 w-9 flex items-center justify-center rounded border shadow-sm transition-all ${style.textDecoration === 'underline' ? 'bg-black text-white border-black' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                    title="Sublinhado"
                >
                    <span className="font-bold text-sm underline decoration-2">U</span>
                </button>
            </div>

            {/* Alignment */}
            <div className="flex flex-col">
                <label className="text-[10px] font-bold text-black uppercase mb-1">Alinhamento</label>
                <div className="flex bg-gray-50 rounded p-1 justify-between border border-gray-300">
                    {[
                        { align: 'left', icon: 'M4 6h16M4 12h10M4 18h7' },
                        { align: 'center', icon: 'M4 6h16M4 12h16M4 18h16' },
                        { align: 'right', icon: 'M4 6h16M4 12h16M4 18h16' },
                        { align: 'justify', icon: 'M4 6h16M4 12h16M4 18h16' }
                    ].map((opt) => (
                        <button
                            key={opt.align}
                            onClick={() => handleStyleChange('textAlign', opt.align as any)}
                            className={`p-1.5 rounded flex-1 flex justify-center transition-colors ${style.textAlign === opt.align ? 'bg-white shadow text-black border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                            title={opt.align}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={opt.icon} /></svg>
                        </button>
                    ))}
                </div>
            </div>

            {/* Line Height */}
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded p-2 mt-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="3"
                    value={style.lineHeight}
                    onChange={(e) => handleStyleChange('lineHeight', Number(e.target.value))}
                    className="w-full text-xs text-black border-none focus:ring-0 p-0 font-medium bg-transparent"
                    title="Espaçamento entre linhas"
                />
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: RESIZE HANDLE ---
const ResizeHandle: React.FC<{
    direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    onMouseDown: (e: React.MouseEvent) => void
}> = ({ direction, onMouseDown }) => {
    let cursor = 'cursor-move';
    let positionClass = '';

    switch (direction) {
        case 'n': cursor = 'cursor-n-resize'; positionClass = 'top-[-4px] left-1/2 -translate-x-1/2 w-4 h-2'; break;
        case 's': cursor = 'cursor-s-resize'; positionClass = 'bottom-[-4px] left-1/2 -translate-x-1/2 w-4 h-2'; break;
        case 'e': cursor = 'cursor-e-resize'; positionClass = 'right-[-4px] top-1/2 -translate-y-1/2 h-4 w-2'; break;
        case 'w': cursor = 'cursor-w-resize'; positionClass = 'left-[-4px] top-1/2 -translate-y-1/2 h-4 w-2'; break;
        case 'ne': cursor = 'cursor-ne-resize'; positionClass = 'top-[-4px] right-[-4px] w-3 h-3'; break;
        case 'nw': cursor = 'cursor-nw-resize'; positionClass = 'top-[-4px] left-[-4px] w-3 h-3'; break;
        case 'se': cursor = 'cursor-se-resize'; positionClass = 'bottom-[-4px] right-[-4px] w-3 h-3'; break;
        case 'sw': cursor = 'cursor-sw-resize'; positionClass = 'bottom-[-4px] left-[-4px] w-3 h-3'; break;
    }

    return (
        <div
            className={`absolute bg-white border border-blue-600 z-50 print:hidden ${positionClass} ${cursor}`}
            onMouseDown={onMouseDown}
        />
    );
};

// --- SUB-COMPONENT: DRAGGABLE & RESIZABLE ITEM WRAPPER ---
const DraggableResizableItem: React.FC<{
    item: PDFItem;
    pageId: string;
    isSelected: boolean;
    onSelect: () => void;
    onDragStateChange?: (isDragging: boolean) => void;
    children: React.ReactNode;
}> = ({ item, pageId, isSelected, onSelect, onDragStateChange, children }) => {
    const { updateItem, removeItemFromPage } = usePDFBuilder();
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, w: 0, h: 0, mouseX: 0, mouseY: 0 });
    const [isEditingText, setIsEditingText] = useState(false);

    // Posições e Tamanhos iniciais (fallback seguro)
    const x = item.x ?? 20;
    const y = item.y ?? 20;
    const w = item.width ?? 400;
    const h = item.height || 50;

    // HANDLER: INICIAR ARRASTE (MOVE)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!ref.current) return;

        // Se estiver editando texto (duplo clique anterior), não arrasta ao clicar no input
        if (isEditingText) {
            // Permite clicar fora para sair do modo edição
            return;
        }

        onSelect();
        e.stopPropagation();

        setIsDragging(true);
        onDragStateChange?.(true);
        const rect = ref.current.getBoundingClientRect();
        // Offset do mouse em relação ao canto superior esquerdo do item
        setDragStart({
            x: x, y: y, w: w, h: h,
            mouseX: e.clientX - rect.left,
            mouseY: e.clientY - rect.top
        });
    };

    // HANDLER: INICIAR REDIMENSIONAMENTO
    const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setResizeDirection(direction);
        setDragStart({
            x: x, y: y, w: w, h: h,
            mouseX: e.clientX,
            mouseY: e.clientY
        });
    };

    // HANDLER: DUPLO CLIQUE (ATIVAR EDIÇÃO DE TEXTO)
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
        if (item.type === 'TEXT_NOTE') {
            setIsEditingText(true);
            const textarea = ref.current?.querySelector('textarea');
            if (textarea) textarea.focus();
        }
    };

    // EFEITO GLOBAL PARA MOUSE MOVE / UP
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!ref.current) return;
            const parentRect = ref.current.parentElement?.getBoundingClientRect();
            if (!parentRect) return;

            // --- LÓGICA DE ARRASTE ---
            if (isDragging) {
                const newX = e.clientX - parentRect.left - dragStart.mouseX;
                const newY = e.clientY - parentRect.top - dragStart.mouseY;

                // Snap básico (5px)
                const snapX = Math.round(newX / 5) * 5;
                const snapY = Math.round(newY / 5) * 5;

                updateItem(pageId, item.id, { x: snapX, y: snapY });
            }

            // --- LÓGICA DE REDIMENSIONAMENTO (8 DIREÇÕES) ---
            else if (resizeDirection) {
                const deltaX = e.clientX - dragStart.mouseX;
                const deltaY = e.clientY - dragStart.mouseY;

                let newX = dragStart.x;
                let newY = dragStart.y;
                let newW = dragStart.w;
                let newH = dragStart.h;

                // Horizontal
                if (resizeDirection.includes('e')) {
                    newW = Math.max(20, dragStart.w + deltaX);
                } else if (resizeDirection.includes('w')) {
                    const potentialW = dragStart.w - deltaX;
                    if (potentialW > 20) {
                        newW = potentialW;
                        newX = dragStart.x + deltaX;
                    }
                }

                // Vertical
                if (resizeDirection.includes('s')) {
                    newH = Math.max(20, dragStart.h + deltaY);
                } else if (resizeDirection.includes('n')) {
                    const potentialH = dragStart.h - deltaY;
                    if (potentialH > 20) {
                        newH = potentialH;
                        newY = dragStart.y + deltaY;
                    }
                }

                updateItem(pageId, item.id, { x: newX, y: newY, width: newW, height: newH });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            onDragStateChange?.(false);
            setResizeDirection(null);
        };

        // Click outside logic to stop editing text
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsEditingText(false);
            }
        };

        if (isDragging || resizeDirection) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        window.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDragging, resizeDirection, dragStart, pageId, item.id, updateItem]);

    // Calcula z-index: arrastrando > selecionado > normal (baseado no zIndex do item ou ordem)
    const getZIndex = () => {
        if (isDragging) return 1000; // Arrastrando fica acima de tudo
        if (isSelected) return 100; // Selecionado fica acima dos outros
        return item.zIndex ?? 10; // Usa zIndex do item ou padrão
    };

    return (
        <div
            ref={ref}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className="absolute group"
            style={{
                left: x,
                top: y,
                width: w,
                height: h,
                zIndex: getZIndex(),
                cursor: isDragging ? 'grabbing' : (isSelected && !isEditingText ? 'move' : 'default')
            }}
        >
            {/* Conteúdo com Borda Visual de Seleção */}
            <div className={`relative w-full h-full transition-all ${isSelected ? 'ring-1 ring-blue-500 ring-dashed' : 'hover:ring-1 hover:ring-blue-300 ring-transparent'}`}>

                {/* Botão de Remover (Topo Direito) */}
                {(isSelected && !isDragging && !resizeDirection) && (
                    <button
                        onClick={(e) => { e.stopPropagation(); removeItemFromPage(pageId, item.id); }}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 z-50 print:hidden transition-transform hover:scale-110"
                        title="Remover Item"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                )}

                {/* Área de conteúdo (Pointer events control allows drag unless editing) */}
                <div style={{ width: '100%', height: '100%', pointerEvents: isEditingText ? 'auto' : 'none' }}>
                    {children}
                </div>

                {/* ALÇAS DE REDIMENSIONAMENTO (8 DIREÇÕES) */}
                {isSelected && (
                    <>
                        <ResizeHandle direction="nw" onMouseDown={handleResizeStart('nw')} />
                        <ResizeHandle direction="n" onMouseDown={handleResizeStart('n')} />
                        <ResizeHandle direction="ne" onMouseDown={handleResizeStart('ne')} />
                        <ResizeHandle direction="e" onMouseDown={handleResizeStart('e')} />
                        <ResizeHandle direction="se" onMouseDown={handleResizeStart('se')} />
                        <ResizeHandle direction="s" onMouseDown={handleResizeStart('s')} />
                        <ResizeHandle direction="sw" onMouseDown={handleResizeStart('sw')} />
                        <ResizeHandle direction="w" onMouseDown={handleResizeStart('w')} />
                    </>
                )}
            </div>
        </div>
    );
};

// --- RENDERIZADORES DE CONTEÚDO (Extraídos para reuso) ---
const RenderItemContent = ({ item, pageId }: { item: PDFItem, pageId: string }) => {
    const { updateItem } = usePDFBuilder();

    // Handler para atualização de texto on-change
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateItem(pageId, item.id, { data: { ...item.data, text: e.target.value } });
    };

    switch (item.type) {
        case 'TEXT_NOTE':
            const style: any = item.data.style || DEFAULT_TEXT_STYLE;
            return (
                <textarea
                    className="w-full h-full p-2 bg-transparent resize-none focus:outline-none focus:bg-blue-50/10 overflow-hidden"
                    value={item.data.text}
                    onChange={handleTextChange}
                    style={{
                        fontFamily: style.fontFamily,
                        fontSize: `${style.fontSize}pt`,
                        textAlign: style.textAlign,
                        lineHeight: style.lineHeight,
                        fontWeight: style.fontWeight,
                        fontStyle: style.fontStyle,
                        color: style.color,
                        textDecoration: style.textDecoration,
                    }}
                    placeholder="Duplo clique para editar..."
                />
            );
        case 'IMAGE':
            return <img src={item.data.url} alt="Img" className="w-full h-full object-contain pointer-events-none" />;

        case 'EVIDENCE_CARD':
            return (
                <div className="w-full h-full bg-white border border-gray-300 p-2 flex flex-col overflow-hidden">
                    {/* Description above the image */}
                    <div className="w-full text-left border-b border-gray-200 pb-1 mb-1">
                        <div className="flex justify-between items-start gap-2">
                            <p className="text-[10px] font-sans text-black leading-tight flex-1">
                                <span className="font-bold text-blue-700">{item.data.figureLabel || `Figura ${item.data.number}`}:</span> {item.data.description}
                            </p>
                            {item.data.date && (
                                <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap">
                                    {new Date(item.data.date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        {item.data.categoryLabel && (
                            <p className="text-[8px] text-gray-500 mt-0.5 font-medium">Categoria: {item.data.categoryLabel}</p>
                        )}
                    </div>
                    {/* Image */}
                    <div className="flex-1 w-full relative">
                        <img
                            src={item.data.url}
                            alt="Evidência"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        />
                    </div>
                </div>
            );

        // --- TABELA DE BOLETINS ---
        case 'TABLE_BOLETIM':
            return (
                <div className="w-full h-full bg-white overflow-hidden text-[10px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white uppercase border-b border-slate-700">
                                <th className="p-1 border-r border-slate-600 text-center w-8">Nº</th>
                                <th className="p-1 border-r border-slate-600">Nome</th>
                                <th className="p-1 border-r border-slate-600 text-center">Data</th>
                                <th className="p-1 border-r border-slate-600 text-center">N1</th>
                                <th className="p-1 border-r border-slate-600 text-center">F1</th>
                                <th className="p-1 border-r border-slate-600 text-center">N2</th>
                                <th className="p-1 border-r border-slate-600 text-center">F2</th>
                                <th className="p-1 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-black font-bold">
                            {item.data.rows && item.data.rows.map((r: any, i: number) => (
                                <tr key={i} className="border-b border-gray-200">
                                    <td className="p-1 text-center border-r border-gray-200">{i + 1}</td>
                                    <td className="p-1 border-r border-gray-200 truncate">{r.studentName}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{r.originalDate ? new Date(r.originalDate).toLocaleDateString() : '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{r.grade1}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{r.attendance1}%</td>
                                    <td className="p-1 text-center border-r border-gray-200">{r.grade2}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{r.attendance2}%</td>
                                    <td className="p-1 text-center text-[9px]">{r.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        // --- TABELA ASSIDUIDADE (Resumo) ---
        case 'TABLE_ATTENDANCE':
            return (
                <div className="w-full h-full bg-white overflow-hidden text-[9px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-blue-600 text-white font-bold uppercase text-[8px]">
                            <tr>
                                <th className="p-1 border-r border-blue-500 text-center" rowSpan={2}>Nº</th>
                                <th className="p-1 border-r border-blue-500 text-center w-20" rowSpan={2}>Núcleo</th>
                                <th className="p-1 border-r border-blue-500" rowSpan={2}>Nome (ordem por núcleo/ordem alfabética)</th>
                                <th className="p-1 border-r border-blue-500 text-center w-8" rowSpan={2}>Idade</th>
                                <th className="p-1 border-r border-blue-500 text-center w-16" rowSpan={2}>Escola Pública ou Particular</th>
                                <th className="p-1 border-r border-blue-500 text-center" colSpan={2}>1º bimestre</th>
                                <th className="p-1 border-r border-blue-500 text-center" colSpan={2}>4º bimestre</th>
                                <th className="p-1 text-center w-16" rowSpan={2}>MELHORA / PIORA / MANTEVE</th>
                            </tr>
                            <tr>
                                <th className="p-1 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Média de notas 1º bimestre</th>
                                <th className="p-1 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Aproveitamento Escolar 1º</th>
                                <th className="p-1 border-r border-blue-500 border-t border-blue-500 text-center font-normal">Média de notas 4º bimestre</th>
                                <th className="p-1 border-t border-blue-500 text-center font-normal">Aproveitamento Escolar 4º</th>
                            </tr>
                        </thead>
                        <tbody className="text-black font-bold text-[8px]">
                            {item.data.rows && item.data.rows.map((r: any, i: number) => {
                                const getAvaliacaoConceito = (nota: number): 'Bom' | 'Regular' | 'Insatisfatório' | 'Péssimo' | undefined => {
                                    if (nota >= 6) return 'Bom';
                                    if (nota >= 5) return 'Regular';
                                    if (nota >= 3) return 'Insatisfatório';
                                    if (nota >= 0) return 'Péssimo';
                                    return undefined;
                                };

                                const renderPdfCell = (val: any, fallback = 'Pendente') => {
                                    if (!val) return <div className="border border-yellow-400 text-yellow-600 bg-yellow-50 px-1 py-0.5 text-center inline-block">{fallback}</div>;
                                    return <span>{val}</span>;
                                };

                                return (
                                    <tr key={i} className="border-b border-gray-200">
                                        <td className="p-1 border-r border-gray-200 text-center">{i + 1}</td>
                                        <td className="p-1 border-r border-gray-200 text-center truncate">{renderPdfCell(r.nucleo)}</td>
                                        <td className="p-1 border-r border-gray-200 truncate">{r.studentName}</td>
                                        <td className="p-1 border-r border-gray-200 text-center">{renderPdfCell(r.idade)}</td>
                                        <td className="p-1 border-r border-gray-200 text-center">
                                            {renderPdfCell(r.escolaTipo === 'PUBLICA' ? 'Pública' : r.escolaTipo === 'PARTICULAR' ? 'Particular' : null)}
                                        </td>
                                        <td className="p-1 border-r border-gray-200 text-center">{r.grade1?.toFixed(2) ?? '-'}</td>
                                        <td className="p-1 border-r border-gray-200 text-center">{r.grade1 ? getAvaliacaoConceito(r.grade1) : '-'}</td>
                                        <td className="p-1 border-r border-gray-200 text-center">{r.grade2?.toFixed(2) ?? '-'}</td>
                                        <td className="p-1 border-r border-gray-200 text-center">{r.grade2 ? getAvaliacaoConceito(r.grade2) : '-'}</td>
                                        <td className="p-1 text-center font-bold">
                                            <span className={`px-1 py-0.5 uppercase ${r.status === 'MELHORA' ? 'text-green-700' : r.status === 'PIORA' ? 'text-red-700' : 'text-gray-700'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );

        // --- TABELA ASSIDUIDADE DETALHADA ---    
        case 'TABLE_ATTENDANCE_DETAILED':
            const detailedItem = item.data.rows[0];
            return (
                <div className="w-full h-full bg-white overflow-hidden text-[9px] border border-gray-300 rounded">
                    <div className="bg-blue-600 text-white font-bold p-1 text-center truncate">Boletim Detalhado: {detailedItem?.studentName}</div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-blue-100 text-blue-900 font-bold text-[7px] uppercase">
                            <tr>
                                <th className="p-1 border-r border-blue-200 align-middle" rowSpan={2}>Disciplina</th>
                                <th className="p-1 text-center border-r border-blue-200" colSpan={2}>1º Bimestre</th>
                                <th className="p-1 text-center border-r border-blue-200" colSpan={2}>2º Bimestre</th>
                                <th className="p-1 text-center border-r border-blue-200" colSpan={2}>3º Bimestre</th>
                                <th className="p-1 text-center" colSpan={2}>4º Bimestre</th>
                            </tr>
                            <tr>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Nota</th>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Faltas</th>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Nota</th>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Faltas</th>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Nota</th>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Faltas</th>
                                <th className="p-1 border-r border-blue-200 border-t border-blue-200 text-center font-normal">Nota</th>
                                <th className="p-1 border-t border-blue-200 text-center font-normal">Faltas</th>
                            </tr>
                        </thead>
                        <tbody className="text-black font-bold text-[8px]">
                            {detailedItem?.subjects?.map((s: any, i: number) => (
                                <tr key={i} className="border-b border-gray-200">
                                    <td className="p-1 border-r border-gray-200 truncate">{s.discipline}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.b1 ?? '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.f1 ?? '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.b2 ?? '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.f2 ?? '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.b3 ?? '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.f3 ?? '-'}</td>
                                    <td className="p-1 text-center border-r border-gray-200">{s.b4 ?? '-'}</td>
                                    <td className="p-1 text-center">{s.f4 ?? '-'}</td>
                                </tr>
                            ))}
                            {(() => {
                                const calculateAverage = (values: (number | null | undefined)[]) => {
                                    const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];
                                    if (validValues.length === 0) return 0;
                                    const sum = validValues.reduce((a, b) => a + b, 0);
                                    return sum / validValues.length;
                                };
                                const getAvaliacaoConceito = (nota: number): 'Bom' | 'Regular' | 'Insatisfatório' | 'Péssimo' | undefined => {
                                    if (nota >= 6) return 'Bom';
                                    if (nota >= 5) return 'Regular';
                                    if (nota >= 3) return 'Insatisfatório';
                                    if (nota >= 0) return 'Péssimo';
                                    return undefined;
                                };
                                const avg1 = calculateAverage(detailedItem?.subjects?.map((s: any) => s.b1) || []);
                                const avg2 = calculateAverage(detailedItem?.subjects?.map((s: any) => s.b2) || []);
                                const avg3 = calculateAverage(detailedItem?.subjects?.map((s: any) => s.b3) || []);
                                const avg4 = calculateAverage(detailedItem?.subjects?.map((s: any) => s.b4) || []);
                                return (
                                    <>
                                        <tr className="bg-yellow-50 border-t-2 border-gray-300">
                                            <td className="p-1 text-right border-r border-gray-300">Média</td>
                                            <td className="p-1 text-center border-r border-gray-300" colSpan={2}>{avg1 > 0 ? avg1.toFixed(1) : '-'}</td>
                                            <td className="p-1 text-center border-r border-gray-300" colSpan={2}>{avg2 > 0 ? avg2.toFixed(1) : '-'}</td>
                                            <td className="p-1 text-center border-r border-gray-300" colSpan={2}>{avg3 > 0 ? avg3.toFixed(1) : '-'}</td>
                                            <td className="p-1 text-center" colSpan={2}>{avg4 > 0 ? avg4.toFixed(1) : '-'}</td>
                                        </tr>
                                        <tr className="bg-blue-50">
                                            <td className="p-1 text-right border-r border-gray-300 text-[6px]">Aproveitamento</td>
                                            <td className="p-1 text-center border-r border-gray-300 text-[7px]" colSpan={2}>{avg1 > 0 ? getAvaliacaoConceito(avg1) : '-'}</td>
                                            <td className="p-1 text-center border-r border-gray-300 text-[7px]" colSpan={2}>{avg2 > 0 ? getAvaliacaoConceito(avg2) : '-'}</td>
                                            <td className="p-1 text-center border-r border-gray-300 text-[7px]" colSpan={2}>{avg3 > 0 ? getAvaliacaoConceito(avg3) : '-'}</td>
                                            <td className="p-1 text-center text-[7px]" colSpan={2}>{avg4 > 0 ? getAvaliacaoConceito(avg4) : '-'}</td>
                                        </tr>
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            );

        // --- TABELA DE FREQUENCIA (Consolidada ou Simples) ---
        case 'TABLE_STUDENTS':
            const rows = item.data.rows || [];
            const isConsolidated = !!item.data.headers; // Verifica se é consolidado (mensal)

            return (
                <div className="w-full h-full bg-white overflow-hidden text-[9px]">
                    <table className="w-full text-left border-collapse table-fixed">
                        {isConsolidated ? (
                            <>
                                <thead>
                                    <tr className="bg-gray-100 border-b border-gray-300">
                                        <th className="w-24 p-1 text-left border-r border-gray-300">Aluno</th>
                                        {item.data.headers.map((h: any, i: number) => (
                                            <th key={i} className="text-center border-r border-gray-300 w-4">{h}</th>
                                        ))}
                                        <th className="w-6 text-center border-r bg-gray-50">P</th>
                                        <th className="w-6 text-center border-r bg-gray-50">F</th>
                                        <th className="w-8 text-center bg-gray-50">%</th>
                                    </tr>
                                </thead>
                                <tbody className="text-black font-bold">
                                    {rows.map((row: any, idx: number) => (
                                        <tr key={idx} className="border-b border-gray-200">
                                            <td className="p-1 truncate border-r border-gray-300">{row.student.nome}</td>
                                            {row.daysStatus.map((status: string, i: number) => (
                                                <td key={i} className={`text-center border-r border-gray-300 text-[8px] ${status === 'PP' ? 'text-green-600' : status === 'FF' ? 'text-red-600' : 'text-gray-300'}`}>
                                                    {status === 'PP' ? '•' : status === 'FF' ? 'F' : ''}
                                                </td>
                                            ))}
                                            <td className="text-center border-r bg-gray-50">{row.stats.presences}</td>
                                            <td className="text-center border-r bg-gray-50 text-red-600">{row.stats.absences}</td>
                                            <td className="text-center bg-gray-50">{row.stats.freqPercent}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        ) : (
                            // Simple List
                            <>
                                <thead className="bg-gray-100 text-black font-bold">
                                    <tr>
                                        <th className="p-1 border-b">Nome</th>
                                        <th className="p-1 border-b text-center">Mês</th>
                                        <th className="p-1 border-b text-center">Presenças</th>
                                    </tr>
                                </thead>
                                <tbody className="text-black font-bold">
                                    {rows.map((r: any, i: number) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-1 truncate">{r.studentName}</td>
                                            <td className="p-1 text-center">{r.month}</td>
                                            <td className="p-1 text-center">{r.totalPresences}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>
            );

        // --- RELATÓRIO 7: BENEFICIADOS ---
        case 'TABLE_REPORT_7':
            return (
                <div className="w-full h-full bg-white overflow-hidden text-[9px]">
                    <div className="border-b border-black mb-1 pb-1">
                        <h2 className="font-bold text-[10px] uppercase">7. Relação de Beneficiados</h2>
                        <div className="grid grid-cols-2 gap-1 text-[8px]">
                            <span>SLI: {item.data.sli}</span>
                            <span>Projeto: {item.data.projectName}</span>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white uppercase border-b border-slate-700">
                                <th className="p-1 border-r border-slate-600 text-center w-6">Nº</th>
                                <th className="p-1 border-r border-slate-600 text-center w-16">Mod.</th>
                                <th className="p-1 border-r border-slate-600">Nome</th>
                                <th className="p-1 border-r border-slate-600 w-1/3">Endereço</th>
                                <th className="p-1 border-r border-slate-600 w-16">Tel</th>
                                <th className="p-1 text-center w-8">Idade</th>
                            </tr>
                        </thead>
                        <tbody className="text-black font-bold text-[8px]">
                            {item.data.rows && item.data.rows.map((student: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="p-1 text-center border-r border-gray-200">{idx + 1}</td>
                                    <td className="p-1 text-center border-r border-gray-200">Triathlon</td>
                                    <td className="p-1 border-r border-gray-200 truncate">{student.nome}</td>
                                    <td className="p-1 border-r border-gray-200 truncate">{student.endereco || "-"}</td>
                                    <td className="p-1 border-r border-gray-200 truncate">{student.telefone}</td>
                                    <td className="p-1 text-center">{calculateAge(student.data_nascimento)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        // --- RELATÓRIO 8: ESCOLAS ---
        case 'TABLE_REPORT_8':
            return (
                <div className="w-full h-full bg-white overflow-hidden text-[9px]">
                    <div className="border-b border-black mb-1 pb-1">
                        <h2 className="font-bold text-[10px] uppercase">8. Relação de Escolas</h2>
                        <div className="grid grid-cols-2 gap-1 text-[8px]">
                            <span>SLI: {item.data.sli}</span>
                            <span>Projeto: {item.data.projectName}</span>
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800 text-white uppercase border-b border-slate-700">
                                <th className="p-1 border-r border-slate-600 text-center w-6">Nº</th>
                                <th className="p-1 border-r border-slate-600 text-center w-16">Mod.</th>
                                <th className="p-1 border-r border-slate-600">Nome</th>
                                <th className="p-1 border-r border-slate-600 text-center w-16">Tipo</th>
                                <th className="p-1">Escola</th>
                            </tr>
                        </thead>
                        <tbody className="text-black font-bold text-[8px]">
                            {item.data.rows && item.data.rows.map((student: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-200">
                                    <td className="p-1 text-center border-r border-gray-200">{idx + 1}</td>
                                    <td className="p-1 text-center border-r border-gray-200">Triathlon</td>
                                    <td className="p-1 border-r border-gray-200 truncate">{student.nome}</td>
                                    <td className="p-1 border-r border-gray-200 text-center">
                                        {student.escola_tipo === 'PUBLICA' ? 'Pública' : student.escola_tipo === 'PARTICULAR' ? 'Particular' : '-'}
                                    </td>
                                    <td className="p-1 truncate">{student.escola_nome || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );


        // --- RELATÓRIO DE ESTOQUE (NUCLEO) ---
        case 'NUCLEO_INVENTORY_TABLE':
            return (
                <div className="w-full h-full bg-white border-2 border-black flex flex-col overflow-hidden font-sans">
                    {/* Header Moderno */}
                    <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 flex justify-between items-center print:bg-gray-200 print:text-black shadow-sm">
                        <div>
                            <h1 className="text-xs font-black uppercase tracking-widest text-blue-100 mb-1">Relatório Oficial</h1>
                            <p className="text-sm font-bold uppercase">{item.data.nucleoName}</p>
                            <p className="text-[9px] text-blue-200 mt-0.5 max-w-[200px] leading-tight opacity-80">
                                {item.data.address || "Endereço vinculado ao cadastro do núcleo"}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 mb-1">
                                <span className="text-[10px] font-bold block text-blue-100">DATA EMISSÃO</span>
                                <span className="text-xs font-bold">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Situação do Estoque:</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.data.stockStatus === 'HIGH' ? 'bg-green-50 text-green-700 border-green-200' :
                                item.data.stockStatus === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                {item.data.stockStatus === 'HIGH' ? 'REGULAR / ABASTECIDO' : item.data.stockStatus === 'MEDIUM' ? 'ATENÇÃO NECESSÁRIA' : 'NÍVEL CRÍTICO'}
                            </span>
                        </div>
                        <div className="h-full w-px bg-gray-200 mx-2"></div>
                        <div className="text-[9px] text-gray-400">
                            Total de Itens: <span className="font-bold text-gray-700">{item.data.stockDetails?.length || 0}</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-hidden p-4 bg-white">
                        <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                                <tr className="bg-slate-800 text-white uppercase text-[9px] tracking-wider">
                                    <th className="p-3 font-semibold rounded-tl-lg">Item / Material</th>
                                    <th className="p-3 font-semibold text-center w-24">Quantidade</th>
                                    <th className="p-3 font-semibold text-center w-32 rounded-tr-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[11px]">
                                {item.data.stockDetails && item.data.stockDetails.map((d: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                                        <td className="p-3 font-bold text-gray-800 border-l border-gray-100">{d.item}</td>
                                        <td className="p-3 text-center font-mono text-gray-600">{d.qty} un</td>
                                        <td className="p-3 text-center border-r border-gray-100">
                                            <span className={`px-2 py-1 rounded text-[9px] font-bold inline-block w-full text-center ${d.status === 'LOW' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                                                }`}>
                                                {d.status === 'LOW' ? 'ABAIXO' : 'OK'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!item.data.stockDetails || item.data.stockDetails.length === 0) && (
                                    <tr>
                                        <td colSpan={3} className="p-6 text-center text-gray-400 italic bg-gray-50 rounded-b-lg border border-gray-100 border-t-0">
                                            Nenhum item registrado neste núcleo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
                        <p className="text-[8px] text-gray-400 uppercase tracking-widest">Sistema de Gestão - Formando Campeões</p>
                    </div>
                </div>
            );

        // --- RELATÓRIO DE ALUNOS POR NÚCLEO ---
        case 'STUDENTS_BY_NUCLEO_TABLE':
            const studentsList = item.data.students || [];
            return (
                <div className="w-full h-full bg-white border-2 border-black flex flex-col overflow-hidden font-sans">
                    {/* Header Moderno */}
                    <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-4 flex justify-between items-center print:bg-gray-200 print:text-black shadow-sm">
                        <div>
                            <h1 className="text-xs font-black uppercase tracking-widest text-green-100 mb-1">Relatório de Alunos</h1>
                            <p className="text-sm font-bold uppercase">{item.data.nucleoName}</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 mb-1">
                                <span className="text-[10px] font-bold block text-green-100">DATA EMISSÃO</span>
                                <span className="text-xs font-bold">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                                <span className="text-[10px] font-bold text-green-100">Total: </span>
                                <span className="text-xs font-bold">{studentsList.length} alunos</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-hidden p-4 bg-white">
                        <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                                <tr className="bg-slate-800 text-white uppercase text-[9px] tracking-wider">
                                    <th className="p-2 font-semibold rounded-tl-lg w-8 text-center">Nº</th>
                                    <th className="p-2 font-semibold">Nome do Aluno</th>
                                    <th className="p-2 font-semibold">Responsável</th>
                                    <th className="p-2 font-semibold">Escola</th>
                                    <th className="p-2 font-semibold text-center w-20 rounded-tr-lg">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[10px]">
                                {studentsList.map((s: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                                        <td className="p-2 text-center font-bold text-gray-500 border-l border-gray-100">{i + 1}</td>
                                        <td className="p-2 font-bold text-gray-800">{s.nome}</td>
                                        <td className="p-2 text-gray-600">{s.nome_responsavel || '-'}</td>
                                        <td className="p-2 text-gray-600 truncate max-w-[150px]">{s.escola_nome || '-'}</td>
                                        <td className="p-2 text-center border-r border-gray-100">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${s.escola_tipo === 'PUBLICA' ? 'bg-blue-50 text-blue-600 border border-blue-100' : s.escola_tipo === 'PARTICULAR' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                                                {s.escola_tipo === 'PUBLICA' ? 'Pública' : s.escola_tipo === 'PARTICULAR' ? 'Particular' : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {studentsList.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-400 italic bg-gray-50 rounded-b-lg border border-gray-100 border-t-0">
                                            Nenhum aluno cadastrado neste núcleo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
                        <p className="text-[8px] text-gray-400 uppercase tracking-widest">Sistema de Gestão - Formando Campeões</p>
                    </div>
                </div>
            );

        // --- TABELA DE DADOS CRUZADOS ---
        case 'CROSS_REFERENCE_TABLE':
            const crossProfiles = item.data.profiles || [];
            return (
                <div className="w-full h-full bg-white border-2 border-black flex flex-col overflow-hidden font-sans">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white p-4 flex justify-between items-center print:bg-gray-200 print:text-black shadow-sm">
                        <div>
                            <h1 className="text-xs font-black uppercase tracking-widest text-purple-100 mb-1">Relatório de Dados Cruzados</h1>
                            <p className="text-sm font-bold uppercase">{item.data.title || 'Dados Consolidados'}</p>
                        </div>
                        <div className="text-right">
                            <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20 mb-1">
                                <span className="text-[10px] font-bold block text-purple-100">DATA EMISSÃO</span>
                                <span className="text-xs font-bold">{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                                <span className="text-[10px] font-bold text-purple-100">Total: </span>
                                <span className="text-xs font-bold">{crossProfiles.length} alunos</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-hidden p-4 bg-white">
                        <table className="w-full text-left border-collapse text-[9px]">
                            <thead>
                                <tr className="bg-slate-800 text-white uppercase text-[8px] tracking-wider">
                                    <th className="p-2 font-semibold rounded-tl-lg w-6 text-center">Nº</th>
                                    <th className="p-2 font-semibold">Nome</th>
                                    <th className="p-2 font-semibold text-center w-16">Tipo</th>
                                    <th className="p-2 font-semibold">Escola</th>
                                    <th className="p-2 font-semibold text-center w-20">Notas</th>
                                    <th className="p-2 font-semibold text-center w-16 rounded-tr-lg">Fontes</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-[9px]">
                                {crossProfiles.map((p: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors">
                                        <td className="p-2 text-center font-bold text-gray-500 border-l border-gray-100">{i + 1}</td>
                                        <td className="p-2 font-bold text-gray-800">{p.enrollment?.nome || p.matchedName}</td>
                                        <td className="p-2 text-center">
                                            {p.relationType ? (
                                                <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${p.relationType === 'ESCOLAR'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : 'bg-green-50 text-green-600 border border-green-100'
                                                    }`}>
                                                    {p.relationType}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-2 text-gray-600 truncate max-w-[100px]">{p.enrollment?.escola_nome || '-'}</td>
                                        <td className="p-2 text-center">
                                            {p.grades ? (
                                                <span className="font-medium">
                                                    {p.grades.grade1}→{p.grades.grade2}
                                                    <span className={`ml-1 inline-block w-1.5 h-1.5 rounded-full ${p.grades.status === 'MELHORA' ? 'bg-green-500' :
                                                        p.grades.status === 'PIORA' ? 'bg-red-500' : 'bg-yellow-500'
                                                        }`}></span>
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-2 text-center border-r border-gray-100">
                                            <span className="text-[7px] font-bold text-gray-400">{p.sources?.length || 0}</span>
                                        </td>
                                    </tr>
                                ))}
                                {crossProfiles.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-gray-400 italic bg-gray-50 rounded-b-lg border border-gray-100 border-t-0">
                                            Nenhum dado cruzado disponível.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-2 bg-gray-50 border-t border-gray-200 text-center">
                        <p className="text-[8px] text-gray-400 uppercase tracking-widest">Sistema de Gestão - Formando Campeões</p>
                    </div>
                </div>
            );

        // META QUALITATIVA - RENDERIZAÇÃO COMPLETA
        case 'META_QUALITATIVA_ITEM':
            const answers = item.data.answers || {};
            return (
                <div className="w-full h-full bg-white border-2 border-black p-4 text-black font-sans overflow-hidden flex flex-col text-[10px]">
                    {/* Header */}
                    <div className="flex justify-center mb-4 border-b border-black pb-2">
                        <img src="/header_full.png" alt="Header" className="w-full object-contain" style={{ maxHeight: '80px' }} />
                    </div>

                    {/* Info */}
                    <div className="border border-black mb-2 text-[9px]">
                        <div className="flex border-b border-black">
                            <div className="w-1/3 p-1 font-bold border-r border-black bg-gray-50">Aluno</div>
                            <div className="w-2/3 p-1 uppercase">{item.data.studentName}</div>
                        </div>
                        <div className="flex border-b border-black">
                            <div className="w-1/3 p-1 font-bold border-r border-black bg-gray-50">Responsável</div>
                            <div className="w-2/3 p-1 uppercase">{item.data.responsibleName}</div>
                        </div>
                        <div className="flex">
                            <div className="w-1/3 p-1 font-bold border-r border-black bg-gray-50">Professor</div>
                            <div className="w-2/3 p-1 uppercase">{item.data.professorName}</div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="flex-1 space-y-2 overflow-auto">
                        {META_QUESTIONS.map((q, idx) => (
                            <div key={q.id} className="mb-1">
                                <p className="font-bold mb-1 leading-tight">{idx + 1}. {q.text} <span className="text-[8px] text-gray-500">({q.target})</span></p>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 ml-2">
                                    {['MUITO_BOM', 'BOM', 'REGULAR', 'RUIM'].map(opt => (
                                        <div key={opt} className="flex items-center gap-1">
                                            <span className="font-mono font-bold">{answers[q.id] === opt ? '(X)' : '( )'}</span>
                                            <span>{opt === 'MUITO_BOM' ? 'Muito Bom' : opt.charAt(0) + opt.slice(1).toLowerCase()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-[8px] text-center text-gray-500 pt-1 border-t border-gray-300">Documento gerado em {new Date(item.data.date).toLocaleDateString()}</div>
                </div>
            );

        // SOCIOECONOMICO - RENDERIZAÇÃO COMPLETA
        case 'SOCIOECONOMIC_CARD':
            const d = item.data;
            // Filter keys that are actual questions (excluding meta fields like 'nome' if displayed separately or empty values)
            const keysToDisplay = Object.keys(SOCIO_LABELS).filter(k => k !== 'nome' && k !== 'genero' && k !== 'faixa_etaria');

            return (
                <div className="w-full h-full bg-white border-2 border-black p-4 text-black font-sans overflow-hidden flex flex-col text-[8px]">
                    {/* Header */}
                    <div className="flex justify-center mb-4 border-b border-black pb-2">
                        <img src="/header_full.png" alt="Header" className="w-full object-contain" style={{ maxHeight: '80px' }} />
                    </div>

                    {/* Destaque */}
                    <div className="bg-gray-50 border border-black mb-2 p-1 flex justify-between items-center">
                        <div className="flex-1"><span className="font-bold uppercase text-gray-500 mr-2">Nome:</span><span className="font-bold uppercase">{d.nome}</span></div>
                        <div className="w-24"><span className="font-bold uppercase text-gray-500 mr-1">Idade:</span><span className="font-bold">{d.faixa_etaria}</span></div>
                    </div>

                    {/* Conteúdo em Colunas */}
                    <div className="flex-1 overflow-hidden">
                        <div className="columns-2 gap-4 h-full">
                            {keysToDisplay.map((key) => (
                                <div key={key} className="mb-1 break-inside-avoid border-b border-gray-100 pb-0.5">
                                    <p className="font-bold text-gray-500 uppercase mb-0">{SOCIO_LABELS[key]}</p>
                                    <p className="font-medium text-black leading-tight">{d[key] || '-'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        // FICHA DE ALUNO (STUDENT_CARD) - RENDERIZAÇÃO COMPLETA
        case 'STUDENT_CARD':
            const s = item.data;
            return (
                <div className="w-full h-full bg-white border-2 border-black p-4 text-black font-serif overflow-hidden flex flex-col text-[10px] leading-tight">
                    {/* Header */}
                    {/* Header */}
                    <div className="flex justify-center mb-4 border-b border-black pb-2">
                        <img src="/header_full.png" alt="Header" className="w-full object-contain" style={{ maxHeight: '100px' }} />
                    </div>

                    {/* Dados */}
                    <div className="space-y-1 mb-4 flex-1">
                        <div className="border-b border-gray-300 pb-0.5"><span className="font-normal">Aluno:</span> <span className="font-bold text-xs">{s.nome}</span></div>

                        <div className="flex gap-4 border-b border-gray-300 pb-0.5">
                            <div><span className="font-normal">Nasc:</span> <span className="font-bold">{s.data_nascimento}</span></div>
                            <div><span className="font-normal">Idade:</span> <span className="font-bold">{calculateAge(s.data_nascimento)}</span></div>
                            <div><span className="font-normal">RG/CPF:</span> <span className="font-bold">{s.rg_cpf}</span></div>
                        </div>

                        <div className="border-b border-gray-300 pb-0.5"><span className="font-normal">Escola:</span> <span className="font-bold">{s.escola_nome}</span> <span className="text-[8px]">({s.escola_tipo})</span></div>
                        <div className="border-b border-gray-300 pb-0.5"><span className="font-normal">Responsável:</span> <span className="font-bold">{s.nome_responsavel}</span></div>

                        <div className="flex gap-4 border-b border-gray-300 pb-0.5">
                            <div><span className="font-normal">Tel:</span> <span className="font-bold">{s.telefone}</span></div>
                            <div className="truncate"><span className="font-normal">End:</span> <span className="font-bold">{s.endereco}</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[8px] mt-2 bg-gray-50 p-1 rounded">
                            <div><span className="font-bold">SLI:</span> {s.n_sli}</div>
                            <div><span className="font-bold">Proponente:</span> {s.proponente}</div>
                        </div>
                    </div>

                    {/* Legal Text (Resumido para caber no card, ou completo se o card for grande) */}
                    <div className="text-[8px] text-justify space-y-1 opacity-80 mb-4 overflow-hidden h-32">
                        {LEGAL_TEXT_PARAGRAPHS.map((p, i) => <p key={i}>{p.substring(0, 300)}...</p>)}
                    </div>

                    {/* Assinatura */}
                    <div className="mt-auto flex flex-col items-center">
                        <div className="h-10 w-40 border-b border-black mb-1 flex items-end justify-center">
                            {s.assinatura && <img src={s.assinatura} className="h-full object-contain" />}
                        </div>
                        <span className="text-[8px] font-bold">Assinatura do Responsável</span>
                        <span className="text-[8px]">{s.data_assinatura}</span>
                    </div>
                </div>
            );

        default:
            return (
                <div className="w-full h-full border-2 border-dashed border-gray-400 flex items-center justify-center text-black font-bold text-xs bg-white">
                    {item.title || item.type}
                </div>
            );
    }
};

const LeftToolbar: React.FC<{ selectedItem?: PDFItem; selectedPageId?: string }> = ({ selectedItem, selectedPageId }) => {

    // Hooks do Contexto
    // ADICIONADO: removeItemFromPage para permitir exclusão via sidebar
    const { addAsset, assets, removeAsset, removeItemFromPage, generateToCAndNumbers } = usePDFBuilder();

    const handleDragStart = (e: React.DragEvent, toolType: string) => {
        const payload = { type: 'NEW_TOOL', toolType, title: 'Nova Ferramenta' };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Handler para Upload de Imagem na Biblioteca
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                const url = ev.target?.result as string;
                addAsset({ id: `asset_${Date.now()}`, url, name: file.name });
            };
            reader.readAsDataURL(file);
        }
    };

    // Handler para arrastar imagem da Biblioteca
    const handleDragAsset = (e: React.DragEvent, assetUrl: string, assetName: string) => {
        const payload = {
            type: 'IMAGE',
            data: { url: assetUrl },
            title: assetName || 'Imagem'
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 z-40 flex flex-col shadow-lg print:hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Ferramentas</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300">
                {/* CONTEXTUAL TOOLS (If item selected) */}
                {selectedItem && selectedPageId ? (
                    <div className="animate-fade-in">
                        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-4 text-xs text-blue-800 font-bold flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                            <span className="truncate flex-1">Item: {selectedItem.title || selectedItem.type}</span>
                        </div>

                        {selectedItem.type === 'TEXT_NOTE' ? (
                            <SidebarFormatting item={selectedItem} pageId={selectedPageId} />
                        ) : (
                            <div className="text-xs text-gray-500 text-center p-4 border border-dashed border-gray-300 rounded">
                                Sem opções de formatação de texto para este item. <br />Redimensione ou mova na página.
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-[10px] text-gray-400 text-center uppercase font-bold mb-2">Ações</p>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => removeItemFromPage(selectedPageId, selectedItem.id)}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-bold shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Excluir Item Selecionado
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* DEFAULT TOOLS LIST */
                    <div className="space-y-6">
                        {/* TEXTO */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Texto</p>
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'TEXT_NOTE')}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 cursor-grab active:cursor-grabbing group transition-all select-none"
                            >
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600 transition-colors">
                                    <span className="font-serif font-bold text-xl">T</span>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-700 block group-hover:text-blue-700">Texto Simples</span>
                                    <span className="text-[10px] text-gray-400">Arraste para a página</span>
                                </div>
                            </div>
                        </div>

                        {/* DOCUMENTO GLOBAL (NOVO) */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Documento</p>
                            <button
                                onClick={generateToCAndNumbers}
                                className="flex items-center gap-3 p-3 w-full bg-blue-50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-100 transition-all group"
                            >
                                <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <span className="text-sm font-bold text-blue-800 block">Gerar Sumário</span>
                                    <span className="text-[10px] text-blue-600">& Numeração de Páginas</span>
                                </div>
                            </button>
                        </div>

                        {/* IMAGENS E BIBLIOTECA */}
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Imagens & Logos</p>

                            {/* Botão de Upload */}
                            <label className="w-full flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors mb-4 group">
                                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center mb-1 group-hover:bg-blue-100 text-blue-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-700">Adicionar Imagem</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>

                            {/* Mini Biblioteca */}
                            {assets.length > 0 ? (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 flex justify-between">
                                        Sua Biblioteca <span className="text-gray-300">{assets.length}</span>
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {assets.map(asset => (
                                            <div
                                                key={asset.id}
                                                className="relative aspect-square border border-gray-200 rounded overflow-hidden cursor-move group hover:shadow-md bg-gray-50"
                                                draggable
                                                onDragStart={(e) => handleDragAsset(e, asset.url, asset.name)}
                                            >
                                                <img src={asset.url} alt="Asset" className="w-full h-full object-contain p-1" />

                                                {/* Botão Remover Asset */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    title="Remover da biblioteca"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                </button>

                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] truncate px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {asset.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded border border-dashed border-gray-200">
                                    <p className="text-[10px] text-gray-400">Nenhuma imagem na biblioteca.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Tip */}
            {!selectedItem && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                        Arraste os itens das tabelas e documentos no menu lateral direito <span className="font-bold">→</span>
                    </p>
                </div>
            )}
        </div>
    );
};

// --- SIDEBAR "DROP ZONE" ---
export const PDFBuilderSidebar: React.FC<SidebarProps> = ({ onOpenPreview }) => {
    const { addItemToPage, pages, addPage } = usePDFBuilder();
    const [isHovering, setIsHovering] = useState(false);
    const [pendingDropPayload, setPendingDropPayload] = useState<any>(null);
    const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(false);
        try {
            const rawData = e.dataTransfer.getData('application/json');
            if (rawData) {
                const payload = JSON.parse(rawData);

                if (payload.type === 'NEW_TOOL') {
                    // Ferramentas da esquerda não abrem seletor aqui, apenas arrastam no canvas.
                    // Mas se o usuário soltar na barra direita, podemos assumir que ele quer na última página ou abrir seletor.
                    // Vamos abrir o seletor para consistência.
                    setPendingDropPayload(payload);
                    setIsPageSelectorOpen(true);
                } else {
                    // Items externos (Tabelas, Fichas) e IMAGENS da biblioteca
                    setPendingDropPayload(payload);
                    setIsPageSelectorOpen(true);
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = () => {
        setIsHovering(false);
    };

    const handleSelectPage = (pageId: string) => {
        if (pendingDropPayload) {
            if (pendingDropPayload.type === 'NEW_TOOL') {
                if (pendingDropPayload.toolType === 'TEXT_NOTE') {
                    addItemToPage(pageId, 'TEXT_NOTE', { text: '', style: DEFAULT_TEXT_STYLE }, 'Novo Texto', { width: 300, height: 100 });
                }
            } else if (pendingDropPayload.type === 'BATCH') {
                // Adiciona cada item do batch à página, com offsets para não sobrepor
                pendingDropPayload.items.forEach((item: any, index: number) => {
                    addItemToPage(pageId, item.type, item.data, item.title, {
                        x: 20 + index * 20,
                        y: 20 + index * 20
                    });
                });
            } else {
                // Imagens da biblioteca caem aqui (type: IMAGE)
                addItemToPage(pageId, pendingDropPayload.type, pendingDropPayload.data, pendingDropPayload.title);
            }
        }
        setIsPageSelectorOpen(false);
        setPendingDropPayload(null);
    };

    const handleAddPageAndSelect = () => {
        addPage();
        // O addPage é assíncrono no state, então precisamos esperar ou pegar o ID gerado. 
        // Como o context não retorna o ID, vamos fechar e assumir que o usuário vai arrastar de novo ou melhorar isso.
        // Melhoria: Vamos usar um setTimeout para selecionar a ultima pagina criada.
        setTimeout(() => {
            // Isso é um hack rápido, o ideal seria addPage retornar o ID.
            // Mas como pages vem do context, ele vai atualizar.
            // Vamos permitir que o usuário selecione na lista atualizada visualmente.
        }, 100);
    };

    return (
        <>
            <div
                className={`fixed right-0 top-20 bottom-0 w-16 bg-white border-l border-gray-200 shadow-lg z-30 flex flex-col items-center py-4 transition-all ${isHovering ? 'bg-blue-50 w-20' : ''} print:hidden`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="mb-4 flex flex-col items-center gap-1 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01 2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-[10px] font-bold text-center" style={{ writingMode: 'vertical-rl' }}>DOCS</span>
                </div>

                <div className="flex-1 w-full flex flex-col items-center justify-center border-t border-b border-gray-100 my-2 bg-gray-50/50 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setIsPageSelectorOpen(true)}>
                    <p className="text-xs text-gray-400 font-bold tracking-widest uppercase pointer-events-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {isHovering ? 'SOLTAR' : 'ENVIAR'}
                    </p>
                </div>

                <button
                    onClick={onOpenPreview}
                    className="mt-4 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                    title="Abrir Editor"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <div className="mt-1 text-[9px] font-bold text-blue-600">{pages.reduce((acc, p) => acc + p.items.length, 0)}</div>
            </div>

            {/* MODAL DE SELEÇÃO DE PÁGINA */}
            {isPageSelectorOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Selecionar Página de Destino</h3>
                                {pendingDropPayload && <p className="text-sm text-blue-600 font-medium">Enviando: {pendingDropPayload.title}</p>}
                            </div>
                            <button onClick={() => { setIsPageSelectorOpen(false); setPendingDropPayload(null); }} className="text-gray-500 hover:text-red-500 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {pages.map((page: any, index: number) => (
                                    <div
                                        key={page.id}
                                        onClick={() => handleSelectPage(page.id)}
                                        className="aspect-[210/297] bg-white border-2 border-gray-300 hover:border-blue-500 hover:ring-4 hover:ring-blue-200 rounded-lg cursor-pointer transition-all relative group flex flex-col shadow-sm hover:shadow-xl transform hover:-translate-y-1"
                                    >
                                        {/* Header da Miniatura */}
                                        <div className="bg-gray-50 border-b p-2 text-center flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-600 uppercase">Página {index + 1}</span>
                                            <span className="text-[10px] bg-gray-200 px-1.5 rounded text-gray-500">{page.items.length} itens</span>
                                        </div>
                                        {/* Corpo da Miniatura (Preview Abstrato) */}
                                        <div className="flex-1 relative p-2 overflow-hidden bg-white">
                                            {page.items.map((it: any) => (
                                                <div key={it.id} className="absolute bg-gray-200 border border-gray-300 overflow-hidden opacity-60"
                                                    style={{
                                                        top: `${Math.min(100, (it.y / 297) * 10)}%`,
                                                        left: `${Math.min(100, (it.x / 210) * 10)}%`,
                                                        width: `${Math.min(100, (it.width / 210) * 10)}%`,
                                                        height: `${Math.max(2, (it.height || 30) / 10)}px`
                                                    }}>
                                                </div>
                                            ))}
                                            {/* Overlay de Seleção */}
                                            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 flex items-center justify-center transition-colors">
                                                <span className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                                                    {pendingDropPayload ? 'Enviar para cá' : 'Abrir Página'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Botão Nova Página */}
                                <button
                                    onClick={handleAddPageAndSelect}
                                    className="aspect-[210/297] border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all gap-2 group bg-transparent"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-sm">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </div>
                                    <span className="font-bold text-sm">Nova Página</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- PREVIEW / EDITOR ---
export const PDFBuilderPreview: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { pages, clearAll, removePage, addItemToPage, addPage } = usePDFBuilder();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isAnyItemDragging, setIsAnyItemDragging] = useState(false);

    // Margin State (Default 10mm ~ 37px)
    const [margins, setMargins] = useState({ top: 37, right: 37, bottom: 37, left: 37 });
    const [showMarginSettings, setShowMarginSettings] = useState(false);

    const handlePrint = () => window.print();

    // Find selected item object for Toolbar
    const selectedItemData = React.useMemo(() => {
        if (!selectedItemId) return undefined;
        for (const page of pages) {
            const found = page.items.find(i => i.id === selectedItemId);
            if (found) return { item: found, pageId: page.id };
        }
        return undefined;
    }, [selectedItemId, pages]);

    // Drag & Drop Global para soltar na página
    const handleDropOnPage = (e: React.DragEvent, pageId: string) => {
        e.preventDefault();
        try {
            const rawData = e.dataTransfer.getData('application/json');
            if (rawData) {
                const payload = JSON.parse(rawData);

                // Calcular posição relativa ao topo da página onde soltou
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                if (payload.type === 'NEW_TOOL') {
                    // Se for ferramenta nova (ex: Texto)
                    if (payload.toolType === 'TEXT_NOTE') {
                        addItemToPage(pageId, 'TEXT_NOTE', { text: '', style: DEFAULT_TEXT_STYLE }, 'Novo Texto', { x, y, width: 300, height: 100 });
                    }
                } else if (payload.type === 'BATCH') {
                    // Se for batch (ficha + laudo), adiciona cada item com offset
                    payload.items.forEach((item: any, index: number) => {
                        addItemToPage(pageId, item.type, item.data, item.title, {
                            x: x + index * 20,
                            y: y + index * 20
                        });
                    });
                } else {
                    // Se for item existente (arrastado de outro lugar, imagem biblioteca ou tabela)
                    addItemToPage(pageId, payload.type, payload.data, payload.title, { x, y });
                }
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col">
            <LeftToolbar selectedItem={selectedItemData?.item} selectedPageId={selectedItemData?.pageId} />

            {/* Toolbar Superior */}
            <div className="bg-white shadow-sm p-4 pl-72 flex justify-between items-center print:hidden sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-600 hover:text-blue-600 flex items-center gap-2 font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Voltar
                    </button>
                    <h1 className="text-lg font-bold">Editor de Relatório (A4)</h1>

                    {/* Margin Tools */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMarginSettings(!showMarginSettings)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700 ml-4"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                            Margens
                        </button>
                        {showMarginSettings && (
                            <div className="absolute top-10 left-0 bg-white shadow-xl border border-gray-200 rounded p-4 w-48 z-50">
                                <h4 className="font-bold text-xs mb-2 text-gray-500 uppercase">Margens (px)</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px]">Top</label><input type="number" value={margins.top} onChange={e => setMargins({ ...margins, top: +e.target.value })} className="w-full border rounded p-1 text-xs" /></div>
                                    <div><label className="text-[10px]">Bottom</label><input type="number" value={margins.bottom} onChange={e => setMargins({ ...margins, bottom: +e.target.value })} className="w-full border rounded p-1 text-xs" /></div>
                                    <div><label className="text-[10px]">Left</label><input type="number" value={margins.left} onChange={e => setMargins({ ...margins, left: +e.target.value })} className="w-full border rounded p-1 text-xs" /></div>
                                    <div><label className="text-[10px]">Right</label><input type="number" value={margins.right} onChange={e => setMargins({ ...margins, right: +e.target.value })} className="w-full border rounded p-1 text-xs" /></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { if (confirm('Limpar tudo?')) clearAll(); }} className="text-red-600 hover:bg-red-50 px-3 py-2 rounded font-bold text-sm">Limpar Tudo</button>
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* Área de Visualização (Canvas) */}
            <div className="flex-1 overflow-auto p-8 pl-72 print:p-0 print:overflow-visible print:pl-0" onClick={() => setSelectedItemId(null)}>
                {pages.map((page, index) => (
                    <div
                        key={page.id}
                        className={`bg-white w-[210mm] h-[297mm] mx-auto mb-8 shadow-2xl print:shadow-none print:m-0 print:mb-0 print:break-after-page relative group ${isAnyItemDragging ? 'overflow-visible' : 'overflow-hidden'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnPage(e, page.id)}
                    >
                        {/* Visual Guidelines for Margins (Print Hidden) */}
                        <div
                            className="absolute border border-dashed border-gray-300 pointer-events-none print:hidden z-0"
                            style={{
                                top: margins.top,
                                bottom: margins.bottom,
                                left: margins.left,
                                right: margins.right,
                            }}
                        >
                            <span className="absolute top-0 left-0 text-[9px] text-gray-300 p-1">Margem</span>
                        </div>

                        {/* Header/Overlay da Página para Edição */}
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gray-100 border-b flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20 print:hidden pointer-events-none">
                            <span className="text-xs text-gray-500 font-bold">Página {index + 1}</span>
                            <button onClick={() => removePage(page.id)} className="text-red-500 hover:text-red-700 pointer-events-auto" title="Remover Página">&times;</button>
                        </div>

                        {/* Renderização dos Itens - MODO EDITOR POSICIONAL */}
                        {page.items.map((item) => (
                            <DraggableResizableItem
                                key={item.id}
                                item={item}
                                pageId={page.id}
                                isSelected={selectedItemId === item.id}
                                onSelect={() => setSelectedItemId(item.id)}
                                onDragStateChange={setIsAnyItemDragging}
                            >
                                <RenderItemContent item={item} pageId={page.id} />
                            </DraggableResizableItem>
                        ))}
                    </div>
                ))}

                <div className="w-[210mm] mx-auto text-center print:hidden pb-12">
                    <button onClick={addPage} className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Nova Página
                    </button>
                </div>
            </div>

            <style>{`
          @media print {
             body { background: white !important; }
             @page { margin: 0; size: A4; }
             .print\\:break-after-page { page-break-after: always; }
             .print\\:hidden { display: none !important; }
             /* Remover estilos de seleção na impressão */
             .ring-2, .ring-1, .bg-red-500, .bg-blue-500 { display: none !important; box-shadow: none !important; }
             /* Garantir que conteúdo ocupe espaço correto */
             .absolute { position: absolute !important; }
             textarea { border: none !important; resize: none !important; }
          }
       `}</style>
        </div>
    );
};
