import React, { useState, useRef, useMemo } from 'react';
import { Nucleo, Employee, Contract } from '../types';
import { extractContractData } from '../services/geminiService';
import { ContractGenerationModal } from './ContractGenerationModal';

interface NucleoDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    nucleo: Nucleo;
    onSave?: (updatedNucleo: Nucleo) => void;
}

const ROLES = ['COORDENADOR', 'PROFESSOR', 'MONITOR', 'ADMINISTRATIVO', 'PSICOLOGO', 'ASSISTENTE_SOCIAL', 'OUTROS'];
const CONTRACT_TYPES = ['PJ'];
const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface NucleoGeralFormProps {
    nucleo: import('../types').Nucleo;
    employees: import('../types').Employee[];
    onSave?: (updated: import('../types').Nucleo) => void;
}

const NucleoGeralForm: React.FC<NucleoGeralFormProps> = ({ nucleo, employees, onSave }) => {
    const [geralData, setGeralData] = useState({
        cnpj: nucleo.cnpj || '',
        address: nucleo.address || '',
        city: nucleo.city || '',
        dias_aulas: nucleo.dias_aulas || [] as string[],
        horario_aulas: nucleo.horario_aulas || '',
        durabilidade: nucleo.durabilidade || '',
        dataInicio: nucleo.dataInicio || '',
        dataTermino: nucleo.dataTermino || '',
        turmas: nucleo.turmas ? [...nucleo.turmas] : [] as import('../types').NucleoTurma[],
    });
    const [saved, setSaved] = useState(false);

    const toggleDia = (dia: string) => setGeralData(prev => ({
        ...prev,
        dias_aulas: prev.dias_aulas.includes(dia)
            ? prev.dias_aulas.filter(d => d !== dia)
            : [...prev.dias_aulas, dia]
    }));

    const addTurma = () => setGeralData(prev => ({
        ...prev,
        turmas: [...prev.turmas, { id: String.fromCharCode(65 + prev.turmas.length), nome: `Turma ${String.fromCharCode(65 + prev.turmas.length)}`, dias: [], horario: '' }]
    }));

    const updateTurma = (i: number, field: string, val: any) => setGeralData(prev => ({
        ...prev,
        turmas: prev.turmas.map((t, idx) => idx === i ? { ...t, [field]: val } : t)
    }));

    const toggleTurmaDia = (i: number, dia: string) => setGeralData(prev => ({
        ...prev,
        turmas: prev.turmas.map((t, idx) => idx !== i ? t : {
            ...t, dias: t.dias.includes(dia) ? t.dias.filter(d => d !== dia) : [...t.dias, dia]
        })
    }));

    const handleSaveGeral = () => {
        if (onSave) onSave({ ...nucleo, ...geralData });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-5">
            {/* Identificação */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Identificação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Nome da Unidade</label>
                        <p className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{nucleo.nome}</p>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">CNPJ</label>
                        <input value={geralData.cnpj} onChange={e => setGeralData(p => ({ ...p, cnpj: e.target.value }))}
                            placeholder="00.000.000/0001-00"
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Cidade / Estado</label>
                        <input value={geralData.city} onChange={e => setGeralData(p => ({ ...p, city: e.target.value }))}
                            placeholder="Ex: Ilhéus | BA"
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Endereço Completo</label>
                        <input value={geralData.address} onChange={e => setGeralData(p => ({ ...p, address: e.target.value }))}
                            placeholder="Rua, Número, Bairro, CEP"
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                </div>
            </div>

            {/* Agenda Geral */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Agenda Geral</h4>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">Dias de Aulas</label>
                        <div className="flex flex-wrap gap-2">
                            {DIAS_SEMANA.map(dia => (
                                <button key={dia} type="button" onClick={() => toggleDia(dia)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${geralData.dias_aulas.includes(dia) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-300'}`}>
                                    {dia.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Horário das Aulas</label>
                        <input value={geralData.horario_aulas} onChange={e => setGeralData(p => ({ ...p, horario_aulas: e.target.value }))}
                            placeholder="Ex: 07:00 - 09:00"
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Data de Início do Projeto</label>
                            <input type="date" value={geralData.dataInicio} onChange={e => {
                                const di = e.target.value;
                                setGeralData(p => {
                                    let dur = p.durabilidade;
                                    if (di && p.dataTermino) {
                                        const d1 = new Date(di); const d2 = new Date(p.dataTermino);
                                        const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                                        dur = `${months} meses`;
                                    }
                                    return { ...p, dataInicio: di, durabilidade: dur };
                                });
                            }}
                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Data de Término do Projeto</label>
                            <input type="date" value={geralData.dataTermino} onChange={e => {
                                const dt = e.target.value;
                                setGeralData(p => {
                                    let dur = p.durabilidade;
                                    if (p.dataInicio && dt) {
                                        const d1 = new Date(p.dataInicio); const d2 = new Date(dt);
                                        const months = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                                        dur = `${months} meses`;
                                    }
                                    return { ...p, dataTermino: dt, durabilidade: dur };
                                });
                            }}
                                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                        </div>
                    </div>
                    {geralData.durabilidade && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-xs font-bold text-blue-700">Durabilidade: {geralData.durabilidade}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Notificação de Envio de Dados */}
            {(() => {
                if (!geralData.dataInicio) return null;
                const hoje = new Date();
                const inicio = new Date(geralData.dataInicio);
                const marco5m = new Date(inicio); marco5m.setMonth(marco5m.getMonth() + 5);
                const marco6m = new Date(inicio); marco6m.setMonth(marco6m.getMonth() + 6);
                const marco11m = new Date(inicio); marco11m.setMonth(marco11m.getMonth() + 11);
                const marco12m = new Date(inicio); marco12m.setMonth(marco12m.getMonth() + 12);

                let level: 'FINAL' | 'PARCIAL' | null = null;
                let deadline = '';
                if (hoje >= marco11m) { level = 'FINAL'; deadline = marco12m.toLocaleDateString('pt-BR'); }
                else if (hoje >= marco5m) { level = 'PARCIAL'; deadline = marco6m.toLocaleDateString('pt-BR'); }

                if (!level) return null;
                const isFinal = level === 'FINAL';
                return (
                    <div className={`rounded-xl border p-4 flex items-start gap-3 ${isFinal ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className={`p-2 rounded-full ${isFinal ? 'bg-red-100 animate-pulse' : 'bg-amber-100'}`}>
                            <svg className={`w-5 h-5 ${isFinal ? 'text-red-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div>
                            <p className={`text-sm font-black uppercase ${isFinal ? 'text-red-700' : 'text-amber-700'}`}>
                                Envio de Dados {level}
                            </p>
                            <p className={`text-xs mt-0.5 ${isFinal ? 'text-red-600' : 'text-amber-600'}`}>
                                {isFinal
                                    ? `Prazo para enviar Dados Finais até ${deadline}`
                                    : `Prazo para enviar Dados Parciais até ${deadline}`}
                            </p>
                        </div>
                    </div>
                );
            })()}

            {/* Turmas */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Turmas</h4>
                    <button type="button" onClick={addTurma}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Turma
                    </button>
                </div>
                {geralData.turmas.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-4">Nenhuma turma cadastrada. Clique em "Adicionar Turma".</p>
                ) : (
                    <div className="space-y-3">
                        {geralData.turmas.map((turma, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Turma {idx + 1}</span>
                                    <button onClick={() => setGeralData(p => ({ ...p, turmas: p.turmas.filter((_, i) => i !== idx) }))}
                                        className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <input value={turma.nome} onChange={e => updateTurma(idx, 'nome', e.target.value)}
                                        placeholder="Nome da Turma"
                                        className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                    <input value={turma.horario} onChange={e => updateTurma(idx, 'horario', e.target.value)}
                                        placeholder="Horário (ex: 07:00-08:30)"
                                        className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {DIAS_SEMANA.map(dia => (
                                        <button key={dia} type="button" onClick={() => toggleTurmaDia(idx, dia)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${turma.dias.includes(dia) ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-400 border-gray-200 hover:border-teal-300'}`}>
                                            {dia.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Estatísticas */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 grid grid-cols-2 gap-3">
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Funcionários</p>
                    <p className="text-2xl font-black text-gray-800">{employees.length}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Turmas</p>
                    <p className="text-2xl font-black text-gray-800">{geralData.turmas.length}</p>
                </div>
            </div>

            {/* Save */}
            <button onClick={handleSaveGeral}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${saved ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:from-blue-700 hover:to-teal-600 shadow-blue-200'}`}>
                {saved ? '✓ Salvo com sucesso!' : 'Salvar Informações Gerais'}
            </button>
        </div>
    );
};

interface NucleoInventarioFormProps {
    nucleo: import('../types').Nucleo;
    onSave?: (updated: import('../types').Nucleo) => void;
}

const NucleoInventarioForm: React.FC<NucleoInventarioFormProps> = ({ nucleo, onSave }) => {
    const [bens, setBens] = useState<import('../types').NucleoBem[]>(nucleo.bens || []);
    const [saved, setSaved] = useState(false);

    const handleAdd = () => {
        setBens([...bens, { id: crypto.randomUUID(), name: '', quantity: 1 }]);
    };

    const handleUpdate = (id: string, field: 'name' | 'quantity', value: string | number) => {
        setBens(bens.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleRemove = (id: string) => {
        setBens(bens.filter(b => b.id !== id));
    };

    const handleSave = () => {
        if (onSave) onSave({ ...nucleo, bens });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bens e Materiais do Núcleo</h4>
                    <button type="button" onClick={handleAdd}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Bem
                    </button>
                </div>

                {bens.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        Nenhum bem cadastrado neste núcleo. Clique em "Adicionar Bem" para começar.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {bens.map((bem, idx) => (
                            <div key={bem.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome do Bem (Ex: Bicicletas, Bolas)</label>
                                    <input
                                        type="text"
                                        value={bem.name}
                                        onChange={(e) => handleUpdate(bem.id, 'name', e.target.value)}
                                        placeholder="Ex: Kit Uniformes G"
                                        className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Qtd</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bem.quantity}
                                        onChange={(e) => handleUpdate(bem.id, 'quantity', parseInt(e.target.value) || 0)}
                                        className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                <div className="flex items-end pb-1">
                                    <button
                                        onClick={() => handleRemove(bem.id)}
                                        title="Remover bem"
                                        className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end mt-6 border-t border-gray-100 pt-4">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-teal-600 transition-all flex items-center gap-2"
                    >
                        {saved ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                Salvo com sucesso!
                            </>
                        ) : 'Salvar Inventário'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const NucleoDetailModal: React.FC<NucleoDetailModalProps> = ({
    isOpen,
    onClose,
    nucleo,
    onSave
}) => {
    const [activeTab, setActiveTab] = useState<'rh' | 'geral' | 'inventario'>('geral');
    const [employees, setEmployees] = useState<Employee[]>(nucleo.employees || []);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // New States for Features
    const [showCustomContractInput, setShowCustomContractInput] = useState(false);
    const [isReadingContract, setIsReadingContract] = useState(false);
    const [showGenerationModal, setShowGenerationModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Employee>>({
        name: '', role: 'PROFESSOR', documentCpf: '', email: '', phone: '', address: '',
        contract: { id: '', startDate: new Date().toISOString(), endDate: new Date().toISOString(), type: 'PJ', status: 'ATIVO', documentUrl: '' } as Contract
    });

    if (!isOpen) return null;

    const handleEdit = (emp: Employee) => {
        setEditingEmployee(emp);
        setFormData(emp);
        setShowCustomContractInput(!CONTRACT_TYPES.includes(emp.contract.type));
        setIsFormOpen(true);
    };

    const handleAddNew = () => {
        setEditingEmployee(null);
        setFormData({
            name: '', role: 'PROFESSOR', documentCpf: '', email: '', phone: '', address: '',
            contract: { id: Math.random().toString(36).substr(2, 9), startDate: new Date().toISOString(), endDate: new Date().toISOString(), type: 'PJ', status: 'ATIVO', documentUrl: '' } as Contract,
            documents: []
        });
        setShowCustomContractInput(false);
        setIsFormOpen(true);
    };

    const handleContractUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsReadingContract(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const extracted = await extractContractData(base64, file.type);

                setFormData(prev => ({
                    ...prev,
                    name: extracted.name || prev.name,
                    documentCpf: extracted.documentCpf || prev.documentCpf,
                    role: extracted.role || prev.role,
                    contract: {
                        ...prev.contract!,
                        type: extracted.contractType || prev.contract?.type || 'PJ',
                        startDate: extracted.startDate ? new Date(extracted.startDate).toISOString() : (prev.contract?.startDate || new Date().toISOString()),
                        endDate: extracted.endDate ? new Date(extracted.endDate).toISOString() : (prev.contract?.endDate || new Date().toISOString()),
                        documentUrl: base64 // Simulação de URL com base64 para preview
                    }
                }));

                if (extracted.contractType && !CONTRACT_TYPES.includes(extracted.contractType)) {
                    setShowCustomContractInput(true);
                }
                alert('Dados extraídos do contrato com sucesso!');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            alert('Erro ao ler contrato: ' + error);
        } finally {
            setIsReadingContract(false);
        }
    };

    const handleSaveForm = () => {
        if (!formData.name) return alert('Nome é obrigatório');

        let updatedEmployees = [...employees];
        if (editingEmployee) {
            updatedEmployees = updatedEmployees.map(e => e.id === editingEmployee.id ? { ...formData as Employee, id: e.id } : e);
        } else {
            const newEmp = { ...formData, id: Math.random().toString(36).substr(2, 9) } as Employee;
            updatedEmployees.push(newEmp);
        }

        setEmployees(updatedEmployees);
        if (onSave) {
            onSave({ ...nucleo, employees: updatedEmployees });
        }
        setIsFormOpen(false);
    };

    const handleContractSave = (url: string) => {
        setFormData(prev => ({
            ...prev,
            contract: {
                ...prev.contract!,
                documentUrl: url
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{nucleo.nome.split(' - ')[0]}</h2>
                        <p className="text-sm text-gray-500 font-medium">{nucleo.nome.split(' - ')[1] || nucleo.nome}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                {!isFormOpen && (
                    <div className="flex border-b border-gray-100 px-6 pt-2 space-x-6">
                        <button
                            onClick={() => setActiveTab('rh')}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'rh' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Recursos Humanos
                            {activeTab === 'rh' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 rounded-t-full"></span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('geral')}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'geral' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Informações Gerais
                            {activeTab === 'geral' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 rounded-t-full"></span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('inventario')}
                            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'inventario' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Inventário
                            {activeTab === 'inventario' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-teal-500 rounded-t-full"></span>}
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

                    {isFormOpen ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-700">{editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                                    >
                                        {isReadingContract ? (
                                            <span className="animate-pulse">Lendo Contrato...</span>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                Upload Contrato (OCR)
                                            </>
                                        )}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={handleContractUpload}
                                    />

                                    <button onClick={() => setIsFormOpen(false)} className="text-sm text-gray-500 hover:text-gray-700 underline">Cancelar</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nome Completo</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Função / Cargo</label>
                                    <select
                                        value={ROLES.includes(formData.role || '') ? formData.role : 'OUTROS'}
                                        onChange={e => {
                                            const val = e.target.value;
                                            if (val === 'OUTROS') setFormData({ ...formData, role: '' }); // Clear to force input usage or just set to 'OUTROS' initially then user types? 
                                            // Better: Set to OUTROS acts as a flag. Actual role field needs to store the custom string. 
                                            // Strategy: If user selects OUTROS, I show input. The select value remains OUTROS if the current role is not in the list.
                                            // Actually, if I set role to '', select will show 'Selecione' or empty.
                                            // Let's use a temporary state or check if role is in ROLES.
                                            setFormData({ ...formData, role: val === 'OUTROS' ? '' : val as any });
                                        }}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                    >
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    {(!ROLES.includes(formData.role || '') || formData.role === '') && (
                                        <input
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            placeholder="Digite a função..."
                                            className="w-full p-2 mt-2 rounded-lg border border-blue-200 bg-blue-50 focus:ring-2 focus:ring-blue-100 outline-none animate-fade-in"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">CPF</label>
                                    <input
                                        value={formData.documentCpf}
                                        onChange={e => setFormData({ ...formData, documentCpf: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                                    <input
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Telefone</label>
                                    <input
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-200" />
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-gray-600">Dados Contratuais</h4>
                                {formData.contract?.documentUrl && (
                                    <a
                                        href={formData.contract.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-bold bg-blue-50 px-2 py-1 rounded"
                                        title="Ver Contrato Anexado"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        Ver Contrato
                                    </a>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 flex justify-between">
                                        Tipo de Contrato
                                        <button
                                            onClick={() => setShowCustomContractInput(!showCustomContractInput)}
                                            className="text-blue-600 hover:underline text-[10px]"
                                        >
                                            {showCustomContractInput ? 'Selecionar Lista' : '+ Outro'}
                                        </button>
                                    </label>

                                    {!showCustomContractInput ? (
                                        <select
                                            value={CONTRACT_TYPES.includes(formData.contract?.type || '') ? formData.contract?.type : 'OUTROS'}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setFormData({ ...formData, contract: { ...formData.contract!, type: val === 'OUTROS' ? '' : val as any } });
                                            }}
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                        >
                                            {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            value={formData.contract?.type}
                                            onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, type: e.target.value } })}
                                            placeholder="Digite o tipo..."
                                            autoFocus
                                            className="w-full p-2 rounded-lg border border-blue-200 bg-blue-50 focus:ring-2 focus:ring-blue-100 outline-none animate-fade-in"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Início</label>
                                    <input
                                        type="date"
                                        value={formData.contract?.startDate ? new Date(formData.contract.startDate).toISOString().split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, startDate: new Date(e.target.value).toISOString() } })}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Fim (Vigência)</label>
                                    <input
                                        type="date"
                                        value={formData.contract?.endDate ? new Date(formData.contract.endDate).toISOString().split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, endDate: new Date(e.target.value).toISOString() } })}
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                {formData.contract?.type === 'PJ' && (
                                    <div className="md:col-span-3 animate-fade-in bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                        <label className="block text-xs font-bold text-yellow-700 mb-1">CNPJ</label>
                                        <input
                                            value={formData.contract?.cnpj || ''}
                                            onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, cnpj: e.target.value } })}
                                            className="w-full p-2 rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-200 outline-none"
                                            placeholder="00.000.000/0001-00"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Botão de Gerar Contrato com IA */}
                            <div className="flex justify-start">
                                <button
                                    onClick={() => setShowGenerationModal(true)}
                                    className="text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Gerar Minuta com IA
                                </button>
                            </div>

                            <div className="flex justify-end pt-4 gap-2 border-t border-gray-100 mt-4">
                                <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button onClick={handleSaveForm} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-lg shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-teal-600 transition-all">
                                    Salvar Funcionário
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'rh' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-700">Equipe Cadastrada</h3>
                                        <button onClick={handleAddNew} className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-teal-600 transition-all flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Adicionar Funcionário
                                        </button>
                                    </div>

                                    <div className="grid gap-4">
                                        {employees.map(emp => (
                                            <div key={emp.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center group">

                                                {/* Avatar / Role Icon */}
                                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                                                    {emp.role === 'PROFESSOR' && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                    )}
                                                    {emp.role !== 'PROFESSOR' && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap gap-2 items-center mb-1">
                                                        <h4 className="font-bold text-gray-800 text-base">{emp.name}</h4>
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-200">{emp.role}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-500">
                                                        <p className="flex items-center gap-1.5 overflow-hidden">
                                                            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                            <span className="truncate">{emp.email}</span>
                                                        </p>
                                                        <p className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                            {emp.phone}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-auto p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                                                    <p className="font-bold text-gray-500 uppercase mb-1">Contrato: {emp.contract.type}</p>
                                                    <div className="flex justify-between md:block gap-4">
                                                        <div className="mb-1">
                                                            <span className="text-gray-400">Início:</span> <span className="font-medium text-gray-700">{new Date(emp.contract.startDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Fim:</span> <span className={`font-medium ${new Date(emp.contract.endDate) < new Date() ? 'text-red-500' : 'text-gray-700'}`}>{new Date(emp.contract.endDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        <button onClick={() => handleEdit(emp)} className="text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            Editar
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}

                                        {employees.length === 0 && (
                                            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100 border-dashed">
                                                <p>Nenhum funcionário cadastrado neste núcleo.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'geral' && (
                                <NucleoGeralForm
                                    nucleo={nucleo}
                                    employees={employees}
                                    onSave={onSave}
                                />
                            )}

                            {activeTab === 'inventario' && (
                                <NucleoInventarioForm
                                    nucleo={nucleo}
                                    onSave={onSave}
                                />
                            )}

                        </>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all mr-2">
                        Fechar
                    </button>
                    {isFormOpen && (
                        <button onClick={handleSaveForm} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-teal-600 transition-all">
                            Salvar
                        </button>
                    )}
                </div>

                {/* Contract Generation Modal */}
                {showGenerationModal && (
                    <ContractGenerationModal
                        isOpen={showGenerationModal}
                        onClose={() => setShowGenerationModal(false)}
                        employee={formData}
                        nucleo={nucleo}
                        onSave={handleContractSave}
                    />
                )}

            </div>
        </div>
    );
};
