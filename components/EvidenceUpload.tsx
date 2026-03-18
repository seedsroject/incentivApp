
import React, { useState, useEffect } from 'react';
import { User, EvidenceLog, EvidenceType } from '../types';
import { SmartCamera } from './SmartCamera';

interface EvidenceUploadProps {
    user: User;
    onBack: () => void;
    onSave: (data: EvidenceLog) => void;
    initialCategory?: EvidenceType;
    history?: EvidenceLog[]; // Recebe o histórico para exibir a galeria
}

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({ user, onBack, onSave, initialCategory, history = [] }) => {
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<EvidenceType>('ACESSIBILIDADE');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        if (initialCategory) {
            setCategory(initialCategory);
        }
    }, [initialCategory]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleCameraCapture = (base64: string) => {
        setPreview(base64);
        setFile(null); // Limpa arquivo se houver, pois agora é base64 direto
        setShowCamera(false);
    };

    const handleUpload = async () => {
        if ((!file && !preview) || !description) return;
        setIsUploading(true);
        // Simula delay de upload
        await new Promise(resolve => setTimeout(resolve, 600));

        const evidenceData: EvidenceLog = {
            id: `ev_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: category,
            description: description,
            imageUrl: preview || '',
            user_id: user.uid
        };

        onSave(evidenceData);

        // Limpa o formulário para permitir nova entrada
        setDescription('');
        setFile(null);
        setPreview(null);
        setIsUploading(false);
    };

    // Handler para iniciar o arraste da imagem para o PDF Builder
    const handleDragStart = (e: React.DragEvent, item: EvidenceLog, figureNumber: number, categoryLabel: string) => {
        const figureLabel = `Figura ${figureNumber}`;
        const payload = {
            type: 'EVIDENCE_CARD', // Tipo específico para renderizar com descrição
            data: {
                url: item.imageUrl,
                description: item.description,
                number: figureNumber,
                figureLabel: figureLabel,
                category: item.type,
                categoryLabel: categoryLabel
            },
            title: `${figureLabel} - ${categoryLabel}`
        };
        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (showCamera) {
        return <SmartCamera onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} title="Fotografar Evidência" />;
    }

    // Filtrar histórico se quiser mostrar apenas da categoria atual, 
    // mas o requisito diz "galeria" o que sugere mostrar tudo.
    // Vou ordenar os mais recentes primeiro para visualização.
    const galleryItems = [...history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Função para obter o número da figura (sequencial independente de categoria)
    const getFigureNumber = (item: EvidenceLog): number => {
        const allItems = history
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return allItems.findIndex(h => h.id === item.id) + 1;
    };

    // Função para obter o label da categoria
    const getCategoryLabel = (type: EvidenceType): string => {
        switch (type) {
            case 'ACESSIBILIDADE': return 'Acessibilidade';
            case 'DIVULGACAO': return 'Divulgação';
            case 'MATERIAIS': return 'Materiais do Projeto';
            case 'MATERIAIS_CONSUMO': return 'Material de Consumo / Esportivo';
            case 'UNIFORMES': return 'Uniformes';
            case 'HOSPEDAGEM': return 'Hospedagem e Alimentação';
            default: return 'Evidência';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 border-b border-gray-200">
                <button onClick={onBack} className="text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="font-bold text-lg text-gray-800">Nova Evidência (Fotos)</h1>
            </div>

            <div className="p-4 flex-1 max-w-lg mx-auto w-full pb-24">

                {/* FORMULÁRIO */}
                <div className="space-y-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as EvidenceType)}
                            className="block w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                        >
                            <option value="UNIFORMES">2 - Uniformes</option>
                            <option value="MATERIAIS_CONSUMO">3 - Material de Consumo/Esportivo</option>
                            <option value="HOSPEDAGEM">4 - Hospedagem/Alimentação</option>
                            <option value="DIVULGACAO">5 - Material Divulgação</option>
                            <option value="MATERIAIS">6 - Materiais/Bens do Projeto</option>
                            <option value="ACESSIBILIDADE">7 - Fotos de Acessibilidade</option>
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Foto</label>
                        <div className="flex flex-col gap-3">
                            {!preview ? (
                                <>
                                    <button
                                        onClick={() => setShowCamera(true)}
                                        className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Abrir Câmera Inteligente
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300"></div></div>
                                        <div className="relative flex justify-center"><span className="px-2 bg-white text-sm text-gray-500">OU</span></div>
                                    </div>

                                    <label className="flex items-center justify-center gap-2 w-full py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">
                                        <span>Carregar da Galeria</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </>
                            ) : (
                                <div className="relative animate-fade-in">
                                    <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg shadow-sm border border-gray-200" />
                                    <button
                                        onClick={() => { setPreview(null); setFile(null); }}
                                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow hover:bg-red-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição da Foto</label>
                        <textarea
                            rows={3}
                            className="block w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                            placeholder="Ex: Alunos utilizando material..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={(!file && !preview) || !description || isUploading}
                        className={`w-full py-3.5 rounded-lg text-white font-bold text-lg shadow-md transition-all active:scale-[0.98] ${(!file && !preview) || !description || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {isUploading ? 'Salvando...' : 'Adicionar à Galeria'}
                    </button>
                </div>

                {/* GALERIA */}
                <div className="border-t border-gray-300 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Galeria de Evidências</h2>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-bold">{galleryItems.length}</span>
                    </div>

                    {galleryItems.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-400 text-sm">Nenhuma foto adicionada ainda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {galleryItems.map((item, index) => {
                                // Calcula o número da figura dentro da sua categoria
                                const figureNumber = getFigureNumber(item);
                                const categoryLabel = getCategoryLabel(item.type);

                                return (
                                    <div
                                        key={item.id || index}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item, figureNumber, categoryLabel)}
                                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col cursor-move hover:shadow-lg hover:border-blue-400 transition-all group"
                                        title="Arraste para o Relatório"
                                    >
                                        <div className="h-32 w-full bg-gray-100 relative">
                                            <img
                                                src={item.imageUrl}
                                                alt="Evidência"
                                                className="w-full h-full object-cover pointer-events-none"
                                            />
                                            <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                                                Figura {figureNumber}
                                            </div>
                                            <div className="absolute top-0 right-0 bg-gray-800 text-white text-[8px] font-medium px-1.5 py-0.5 rounded-bl-lg shadow-sm">
                                                {categoryLabel}
                                            </div>
                                            {/* Drag Overlay Hint */}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-white text-xs font-bold border border-white px-2 py-1 rounded">Arraste +</span>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed flex-1">
                                                <span className="font-bold text-blue-700">Figura {figureNumber}: </span>
                                                {item.description}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-2 border-t pt-1">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div >
    );
};
