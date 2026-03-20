import React, { useState } from 'react';
import { Nucleo, NucleoTurma } from '../types';

interface NucleoAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (nucleo: Nucleo) => void;
}

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const emptyTurma = (): NucleoTurma => ({
    id: String.fromCharCode(65 + Math.floor(Math.random() * 26)) + Date.now(),
    nome: '',
    dias: [],
    horario: '',
});

export const NucleoAddModal: React.FC<NucleoAddModalProps> = ({ isOpen, onClose, onSave }) => {
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [dias, setDias] = useState<string[]>([]);
    const [horario, setHorario] = useState('');
    const [durabilidade, setDurabilidade] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataTermino, setDataTermino] = useState('');
    const [turmas, setTurmas] = useState<NucleoTurma[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const toggleDia = (dia: string) => {
        setDias(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]);
    };

    const addTurma = () => setTurmas(prev => [...prev, emptyTurma()]);

    const updateTurma = (idx: number, field: keyof NucleoTurma, value: any) => {
        setTurmas(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    };

    const toggleTurmaDia = (idx: number, dia: string) => {
        setTurmas(prev => prev.map((t, i) => {
            if (i !== idx) return t;
            const newDias = t.dias.includes(dia) ? t.dias.filter(d => d !== dia) : [...t.dias, dia];
            return { ...t, dias: newDias };
        }));
    };

    const removeTurma = (idx: number) => setTurmas(prev => prev.filter((_, i) => i !== idx));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!nome.trim()) e.nome = 'Nome é obrigatório';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const newNucleo: Nucleo = {
            id: `nuc_${Date.now()}`,
            nome: city ? `${nome} | ${city}` : nome,
            cnpj: cnpj || undefined,
            address: address || undefined,
            city: city || undefined,
            dias_aulas: dias.length > 0 ? dias : undefined,
            horario_aulas: horario || undefined,
            durabilidade: durabilidade || undefined,
            dataInicio: dataInicio || undefined,
            dataTermino: dataTermino || undefined,
            turmas: turmas.length > 0 ? turmas.map((t, i) => ({
                ...t,
                id: t.id || String.fromCharCode(65 + i),
                nome: t.nome || `Turma ${String.fromCharCode(65 + i)}`,
            })) : undefined,
            stockStatus: 'MEDIUM',
            coordinates: [-12.9777, -38.5016],
        };
        onSave(newNucleo);
        // Reset
        setNome(''); setCnpj(''); setAddress(''); setCity('');
        setDias([]); setHorario(''); setDurabilidade(''); setDataInicio(''); setDataTermino(''); setTurmas([]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">Novo Núcleo</h2>
                        <p className="text-blue-100 text-sm mt-0.5">Preencha as informações do núcleo</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Seção: Identificação */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                            Identificação
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Nome do Núcleo *</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={e => setNome(e.target.value)}
                                    placeholder="Ex: Ilhéus"
                                    className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.nome ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                                />
                                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Cidade / Estado</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    placeholder="Ex: Ilhéus | BA"
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">CNPJ</label>
                                <input
                                    type="text"
                                    value={cnpj}
                                    onChange={e => setCnpj(e.target.value)}
                                    placeholder="00.000.000/0001-00"
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-600 mb-1">Endereço Completo</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Rua, Número, Bairro, CEP"
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção: Agenda do Projeto */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                            Agenda Geral do Projeto
                        </h3>
                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-2">Dias de Aulas</label>
                                <div className="flex flex-wrap gap-2">
                                    {DIAS_SEMANA.map(dia => (
                                        <button
                                            key={dia}
                                            type="button"
                                            onClick={() => toggleDia(dia)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${dias.includes(dia)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            {dia.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Horário das Aulas</label>
                                <input
                                    type="text"
                                    value={horario}
                                    onChange={e => setHorario(e.target.value)}
                                    placeholder="Ex: 07:00 - 09:00"
                                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Data de Início do Projeto</label>
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={e => {
                                            setDataInicio(e.target.value);
                                            if (e.target.value && dataTermino) {
                                                const d1 = new Date(e.target.value); const d2 = new Date(dataTermino);
                                                const m = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                                                setDurabilidade(`${m} meses`);
                                            }
                                        }}
                                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">Data de Término do Projeto</label>
                                    <input
                                        type="date"
                                        value={dataTermino}
                                        onChange={e => {
                                            setDataTermino(e.target.value);
                                            if (dataInicio && e.target.value) {
                                                const d1 = new Date(dataInicio); const d2 = new Date(e.target.value);
                                                const m = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                                                setDurabilidade(`${m} meses`);
                                            }
                                        }}
                                        className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            </div>
                            {durabilidade && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="text-xs font-bold text-blue-700">Durabilidade: {durabilidade}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seção: Turmas */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                                Turmas
                            </h3>
                            <button
                                type="button"
                                onClick={addTurma}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Adicionar Turma
                            </button>
                        </div>

                        {turmas.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                                <p className="text-sm">Nenhuma turma adicionada</p>
                                <p className="text-xs mt-1">Clique em "Adicionar Turma" para criar Turma A, B, etc.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {turmas.map((turma, idx) => (
                                    <div key={turma.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-600 uppercase">Turma {idx + 1}</span>
                                            <button onClick={() => removeTurma(idx)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Turma</label>
                                                <input
                                                    type="text"
                                                    value={turma.nome}
                                                    onChange={e => updateTurma(idx, 'nome', e.target.value)}
                                                    placeholder="Ex: Turma A"
                                                    className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Horário</label>
                                                <input
                                                    type="text"
                                                    value={turma.horario}
                                                    onChange={e => updateTurma(idx, 'horario', e.target.value)}
                                                    placeholder="Ex: 07:00 - 08:30"
                                                    className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Dias desta turma</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {DIAS_SEMANA.map(dia => (
                                                    <button
                                                        key={dia}
                                                        type="button"
                                                        onClick={() => toggleTurmaDia(idx, dia)}
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${turma.dias.includes(dia)
                                                                ? 'bg-teal-500 text-white border-teal-500'
                                                                : 'bg-white text-gray-400 border-gray-200 hover:border-teal-300'
                                                            }`}
                                                    >
                                                        {dia.substring(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-teal-300 hover:from-blue-700 hover:to-teal-600 text-sm transition-all"
                    >
                        ✓ Criar Núcleo
                    </button>
                </div>
            </div>
        </div>
    );
};
