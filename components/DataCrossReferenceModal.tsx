/**
 * Modal de Cruzamento de Dados
 * Permite visualizar, filtrar e editar dados cruzados de múltiplas fontes
 * Tabela arrastável para o PDF Builder
 */

import React, { useState, useMemo } from 'react';
import { StudentDraft, DocumentLog, Nucleo, PDFItemType } from '../types';
import { MergedStudentProfile, CrossReferenceFilters, StudentRelationType, DataSource } from '../services/dataCrossTypes';
import { mergeStudentData, applyManualMatch, normalizeStudentName } from '../services/dataMergeService';
import { usePDFBuilder } from './PDFBuilderContext';

interface DataCrossReferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: StudentDraft[];
    documents: DocumentLog[];
    nucleos: Nucleo[];
}

// Cores por fonte de dados
const SOURCE_COLORS: Record<DataSource, string> = {
    ENROLLMENT: 'bg-blue-500',
    GRADES: 'bg-green-500',
    ATTENDANCE: 'bg-yellow-500',
    SOCIOECONOMIC: 'bg-emerald-500',
    META_QUALITATIVA: 'bg-pink-500'
};

const SOURCE_LABELS: Record<DataSource, string> = {
    ENROLLMENT: 'Ficha',
    GRADES: 'Boletim',
    ATTENDANCE: 'Freq.',
    SOCIOECONOMIC: 'Socio',
    META_QUALITATIVA: 'Meta'
};

// Configuração de colunas customizáveis
type ColumnKey = 'nome' | 'tipo' | 'sexo' | 'escola' | 'serie' | 'notas' | 'frequencia' | 'renda' | 'fontes';

interface ColumnConfig {
    key: ColumnKey;
    label: string;
    defaultVisible: boolean;
}

const COLUMN_CONFIG: ColumnConfig[] = [
    { key: 'nome', label: 'Nome', defaultVisible: true },
    { key: 'tipo', label: 'Tipo', defaultVisible: true },
    { key: 'sexo', label: 'Sexo', defaultVisible: false },
    { key: 'escola', label: 'Escola', defaultVisible: true },
    { key: 'serie', label: 'Série', defaultVisible: false },
    { key: 'notas', label: 'Notas', defaultVisible: true },
    { key: 'frequencia', label: 'Frequência', defaultVisible: false },
    { key: 'renda', label: 'Renda', defaultVisible: true },
    { key: 'fontes', label: 'Fontes', defaultVisible: true },
];

export const DataCrossReferenceModal: React.FC<DataCrossReferenceModalProps> = ({
    isOpen,
    onClose,
    students,
    documents,
    nucleos
}) => {
    const { addItemToPage, pages, addPage } = usePDFBuilder();

    // Estados
    const [filters, setFilters] = useState<CrossReferenceFilters>({
        relationType: 'ALL',
        searchTerm: ''
    });
    const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
    const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
    const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
    const [matchSource, setMatchSource] = useState<MergedStudentProfile | null>(null);
    const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
    const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
    const [isNucleoSelectorOpen, setIsNucleoSelectorOpen] = useState(false);
    // Estado de busca interna do dropdown de núcleos
    const [nucleoSearchTerm, setNucleoSearchTerm] = useState('');

    // Filtro os núcleos para exibição no dropdown
    const filteredNucleos = useMemo(() => {
        if (!nucleoSearchTerm) return nucleos;
        const lowerTerm = nucleoSearchTerm.toLowerCase();
        return nucleos.filter(n => n.nome.toLowerCase().includes(lowerTerm));
    }, [nucleos, nucleoSearchTerm]);

    // Seleção múltipla de núcleos para comparação
    const [selectedNucleos, setSelectedNucleos] = useState<Set<string>>(new Set());

    // Estado de colunas visíveis
    const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
        new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key))
    );

    // Merge de dados
    const mergedProfiles = useMemo(() => {
        return mergeStudentData(students, documents);
    }, [students, documents]);

    const [profiles, setProfiles] = useState<MergedStudentProfile[]>(mergedProfiles);

    // Atualiza profiles quando dados mudam
    React.useEffect(() => {
        setProfiles(mergeStudentData(students, documents));
    }, [students, documents]);

    // Aplica filtros
    const filteredProfiles = useMemo(() => {
        return profiles.filter(profile => {
            // Filtro por tipo de relação
            if (filters.relationType !== 'ALL') {
                if (filters.relationType === 'ESCOLAR' && profile.relationType !== 'ESCOLAR') return false;
                if (filters.relationType === 'BENEFICIADO' && profile.relationType !== 'BENEFICIADO') return false;
            }

            // Filtro por núcleos selecionados (multi-seleção)
            if (selectedNucleos.size > 0 && profile.enrollment?.nucleo_id) {
                if (!selectedNucleos.has(profile.enrollment.nucleo_id)) return false;
            }

            // Filtro por status
            if (filters.matchStatus && profile.matchStatus !== filters.matchStatus) return false;

            // Filtro por busca
            if (filters.searchTerm) {
                const search = filters.searchTerm.toLowerCase();
                const name = (profile.enrollment?.nome || profile.matchedName).toLowerCase();
                if (!name.includes(search)) return false;
            }

            return true;
        });
    }, [profiles, filters, selectedNucleos]);

    // Estatísticas
    const stats = useMemo(() => ({
        total: profiles.length,
        complete: profiles.filter(p => p.matchStatus === 'COMPLETE').length,
        partial: profiles.filter(p => p.matchStatus === 'PARTIAL').length,
        unmatched: profiles.filter(p => p.matchStatus === 'UNMATCHED').length,
        escolar: profiles.filter(p => p.relationType === 'ESCOLAR').length,
        beneficiado: profiles.filter(p => p.relationType === 'BENEFICIADO').length
    }), [profiles]);

    // Handlers
    const toggleSelectProfile = (id: string) => {
        const newSelected = new Set(selectedProfiles);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProfiles(newSelected);
    };

    const selectAll = () => {
        if (selectedProfiles.size === filteredProfiles.length) {
            setSelectedProfiles(new Set());
        } else {
            setSelectedProfiles(new Set(filteredProfiles.map(p => p.id)));
        }
    };

    const handleManualMatch = (source: MergedStudentProfile) => {
        setMatchSource(source);
        setIsMatchModalOpen(true);
    };

    const confirmManualMatch = (targetId: string) => {
        if (matchSource) {
            setProfiles(prev => applyManualMatch(prev, matchSource.id, targetId));
            setIsMatchModalOpen(false);
            setMatchSource(null);
        }
    };

    // Toggle de coluna visível
    const toggleColumn = (key: ColumnKey) => {
        setVisibleColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                // Não permite remover a coluna "nome"
                if (key !== 'nome') newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    // Drag and drop para PDF
    const handleDragStart = (e: React.DragEvent) => {
        const selectedData = filteredProfiles.filter(p =>
            selectedProfiles.size === 0 || selectedProfiles.has(p.id)
        );

        e.dataTransfer.setData('crossReferenceData', JSON.stringify({
            profiles: selectedData,
            filters,
            title: `Dados Cruzados - ${filters.relationType === 'ALL' ? 'Todos' : filters.relationType}`
        }));
        e.dataTransfer.effectAllowed = 'copy';

        // Abre seletor de página
        setIsPageSelectorOpen(true);
    };

    const handleSelectPage = (pageId: string) => {
        const selectedData = filteredProfiles.filter(p =>
            selectedProfiles.size === 0 || selectedProfiles.has(p.id)
        );

        addItemToPage(
            pageId,
            'CROSS_REFERENCE_TABLE',
            {
                profiles: selectedData,
                filters,
                title: `Relatório de Dados Cruzados`
            },
            `Dados Cruzados - ${selectedData.length} alunos`,
            { width: 700, height: 500 }
        );

        setIsPageSelectorOpen(false);
        alert(`Tabela com ${selectedData.length} alunos adicionada ao relatório!`);
    };

    const handleAddPageAndSelect = () => {
        addPage();
    };

    // Exportar CSV
    const exportCSV = () => {
        const data = filteredProfiles.filter(p =>
            selectedProfiles.size === 0 || selectedProfiles.has(p.id)
        );

        const headers = ['Nome', 'Tipo', 'Escola', 'Notas', 'Renda', 'Status'];
        const rows = data.map(p => [
            p.enrollment?.nome || p.matchedName,
            p.relationType || '-',
            p.enrollment?.escola_nome || '-',
            p.grades ? `${p.grades.grade1}/${p.grades.grade2}` : '-',
            p.socioeconomic?.renda_familiar || '-',
            p.matchStatus
        ]);

        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dados_cruzados.csv';
        a.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-full max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-emerald-500 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                🔗 Cruzamento de Dados
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {stats.total} perfis | {stats.complete} completos | {stats.partial} parciais | {stats.unmatched} órfãos
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Tipo de Relação (Filtro Principal) */}
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
                            {(['ALL', 'ESCOLAR', 'BENEFICIADO'] as StudentRelationType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilters(f => ({ ...f, relationType: type }))}
                                    className={`px-4 py-2 text-xs font-bold transition-all ${filters.relationType === type
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {type === 'ALL' ? `Todos (${stats.total})` :
                                        type === 'ESCOLAR' ? `Escolar (${stats.escolar})` :
                                            `Beneficiado (${stats.beneficiado})`}
                                </button>
                            ))}
                        </div>

                        {/* Núcleo */}
                        {/* Núcleo Multi-Select */}
                        <div className="relative">
                            <button
                                onClick={() => setIsNucleoSelectorOpen(!isNucleoSelectorOpen)}
                                className={`px-3 py-2 text-sm border rounded-xl bg-white flex items-center gap-2 min-w-[160px] justify-between transition-colors ${selectedNucleos.size > 0
                                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                                    : 'border-gray-200 hover:border-emerald-300'
                                    }`}
                            >
                                <span className="truncate max-w-[140px]">
                                    {selectedNucleos.size === 0
                                        ? 'Todos Núcleos'
                                        : `${selectedNucleos.size} Núcleo${selectedNucleos.size > 1 ? 's' : ''} Selecionado${selectedNucleos.size > 1 ? 's' : ''}`
                                    }
                                </span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isNucleoSelectorOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isNucleoSelectorOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsNucleoSelectorOpen(false)}
                                    />
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-[300px] overflow-y-auto flex flex-col">
                                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Filtrar Núcleos</span>
                                                {selectedNucleos.size > 0 && (
                                                    <button
                                                        onClick={() => setSelectedNucleos(new Set())}
                                                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                                                    >
                                                        Limpar Filtros
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Buscar núcleo..."
                                                value={nucleoSearchTerm}
                                                onChange={(e) => setNucleoSearchTerm(e.target.value)}
                                                className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="p-1 space-y-0.5">
                                            <label
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedNucleos.size === 0 ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'}`}
                                                onClick={() => setSelectedNucleos(new Set())}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedNucleos.size === 0 ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                                                    {selectedNucleos.size === 0 && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <span className="text-sm font-medium">Todos os Núcleos</span>
                                            </label>
                                            {filteredNucleos.map(nucleo => (
                                                <label
                                                    key={nucleo.id}
                                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedNucleos.has(nucleo.id) ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedNucleos.has(nucleo.id)}
                                                        onChange={() => {
                                                            setSelectedNucleos(prev => {
                                                                const newSet = new Set(prev);
                                                                if (newSet.has(nucleo.id)) {
                                                                    newSet.delete(nucleo.id);
                                                                } else {
                                                                    newSet.add(nucleo.id);
                                                                }
                                                                return newSet;
                                                            });
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span className="text-sm text-gray-700 truncate">{nucleo.nome.split(' - ')[0]}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Status */}
                        <select
                            value={filters.matchStatus || ''}
                            onChange={e => setFilters(f => ({ ...f, matchStatus: e.target.value as any || undefined }))}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="">Todos Status</option>
                            <option value="COMPLETE">✅ Completos</option>
                            <option value="PARTIAL">🟡 Parciais</option>
                            <option value="UNMATCHED">🔴 Órfãos</option>
                        </select>

                        {/* Busca */}
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={filters.searchTerm}
                                onChange={e => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                                className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Botão Configurar Colunas */}
                        <div className="relative">
                            <button
                                onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white hover:bg-gray-50 flex items-center gap-2 font-medium text-gray-700"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                Colunas
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">{visibleColumns.size}</span>
                            </button>

                            {/* Dropdown de Colunas */}
                            {isColumnSelectorOpen && (
                                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-3 min-w-[200px]">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Colunas Visíveis</p>
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                                        {COLUMN_CONFIG.map(col => (
                                            <label
                                                key={col.key}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${visibleColumns.has(col.key) ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                                    } ${col.key === 'nome' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.has(col.key)}
                                                    onChange={() => toggleColumn(col.key)}
                                                    disabled={col.key === 'nome'}
                                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="border-t border-gray-100 mt-2 pt-2 flex gap-2">
                                        <button
                                            onClick={() => setVisibleColumns(new Set(COLUMN_CONFIG.map(c => c.key)))}
                                            className="flex-1 text-xs py-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                        >
                                            Todas
                                        </button>
                                        <button
                                            onClick={() => setVisibleColumns(new Set(COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key)))}
                                            className="flex-1 text-xs py-1 text-gray-600 hover:bg-gray-100 rounded"
                                        >
                                            Padrão
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm min-w-[1200px]">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedProfiles.size === filteredProfiles.length && filteredProfiles.length > 0}
                                        onChange={selectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </th>
                                {visibleColumns.has('nome') && <th className="p-3 text-left font-bold text-gray-700">Nome</th>}
                                {visibleColumns.has('tipo') && <th className="p-3 text-left font-bold text-gray-700">Tipo</th>}
                                {visibleColumns.has('sexo') && <th className="p-3 text-center font-bold text-gray-700">Sexo</th>}
                                {visibleColumns.has('escola') && <th className="p-3 text-left font-bold text-gray-700">Escola</th>}
                                {visibleColumns.has('serie') && <th className="p-3 text-center font-bold text-gray-700">Série</th>}
                                {visibleColumns.has('notas') && <th className="p-3 text-left font-bold text-gray-700">Notas</th>}
                                {visibleColumns.has('frequencia') && <th className="p-3 text-center font-bold text-gray-700">Frequência</th>}
                                {visibleColumns.has('renda') && <th className="p-3 text-left font-bold text-gray-700">Renda</th>}
                                {visibleColumns.has('fontes') && <th className="p-3 text-center font-bold text-gray-700">Fontes</th>}
                                <th className="p-3 text-center font-bold text-gray-700">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProfiles.map((profile, idx) => (
                                <tr
                                    key={profile.id}
                                    className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${selectedProfiles.has(profile.id) ? 'bg-emerald-50' : ''
                                        } ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                >
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedProfiles.has(profile.id)}
                                            onChange={() => toggleSelectProfile(profile.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                    </td>

                                    {/* Nome */}
                                    {visibleColumns.has('nome') && (
                                        <td className="p-3 font-medium text-gray-800">
                                            {profile.enrollment?.nome || profile.matchedName}
                                        </td>
                                    )}

                                    {/* Tipo */}
                                    {visibleColumns.has('tipo') && (
                                        <td className="p-3">
                                            {profile.relationType ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${profile.relationType === 'ESCOLAR'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {profile.relationType}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}

                                    {/* Sexo */}
                                    {visibleColumns.has('sexo') && (
                                        <td className="p-3 text-center">
                                            {profile.socioeconomic?.genero ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${profile.socioeconomic.genero === 'Masculino'
                                                    ? 'bg-blue-100 text-blue-600'
                                                    : 'bg-pink-100 text-pink-600'
                                                    }`}>
                                                    {profile.socioeconomic.genero === 'Masculino' ? 'M' : 'F'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}

                                    {/* Escola */}
                                    {visibleColumns.has('escola') && (
                                        <td className="p-3 text-gray-600">
                                            {profile.enrollment?.escola_nome || '-'}
                                            {profile.enrollment?.escola_tipo && (
                                                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${profile.enrollment.escola_tipo === 'PUBLICA'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {profile.enrollment.escola_tipo}
                                                </span>
                                            )}
                                        </td>
                                    )}

                                    {/* Série */}
                                    {visibleColumns.has('serie') && (
                                        <td className="p-3 text-center text-gray-600">
                                            {(profile.enrollment as any)?.serie || '-'}
                                        </td>
                                    )}

                                    {/* Notas */}
                                    {visibleColumns.has('notas') && (
                                        <td className="p-3">
                                            {profile.grades ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">{profile.grades.grade1}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="font-medium">{profile.grades.grade2}</span>
                                                    <span className={`ml-1 w-2 h-2 rounded-full ${profile.grades.status === 'MELHORA' ? 'bg-green-500' :
                                                        profile.grades.status === 'PIORA' ? 'bg-red-500' : 'bg-yellow-500'
                                                        }`}></span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}

                                    {/* Frequência */}
                                    {visibleColumns.has('frequencia') && (
                                        <td className="p-3 text-center">
                                            {profile.attendance ? (
                                                <span className={`font-bold ${profile.attendance.attendance2 >= 75 ? 'text-green-600' :
                                                    profile.attendance.attendance2 >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {profile.attendance.attendance2}%
                                                </span>
                                            ) : profile.grades?.attendance2 ? (
                                                <span className={`font-bold ${profile.grades.attendance2 >= 75 ? 'text-green-600' :
                                                    profile.grades.attendance2 >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>
                                                    {profile.grades.attendance2}%
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    )}

                                    {/* Renda */}
                                    {visibleColumns.has('renda') && (
                                        <td className="p-3 text-gray-600">
                                            {profile.socioeconomic?.renda_familiar || '-'}
                                        </td>
                                    )}

                                    {/* Fontes */}
                                    {visibleColumns.has('fontes') && (
                                        <td className="p-3">
                                            <div className="flex justify-center gap-1">
                                                {(['ENROLLMENT', 'GRADES', 'ATTENDANCE', 'SOCIOECONOMIC', 'META_QUALITATIVA'] as DataSource[]).map(source => (
                                                    <div
                                                        key={source}
                                                        title={SOURCE_LABELS[source]}
                                                        className={`w-3 h-3 rounded-full ${profile.sources.includes(source)
                                                            ? SOURCE_COLORS[source]
                                                            : 'bg-gray-200'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                    )}

                                    {/* Ações */}
                                    <td className="p-3">
                                        <div className="flex justify-center gap-1">
                                            {profile.matchStatus === 'UNMATCHED' && profile.suggestedMatches && (
                                                <button
                                                    onClick={() => handleManualMatch(profile)}
                                                    title="Vincular manualmente"
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProfiles.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">Nenhum dado encontrado</p>
                            <p className="text-sm mt-1">Cadastre alunos e documentos para ver os dados cruzados</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* Legenda */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">Fontes:</span>
                            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                                <span key={key} className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${SOURCE_COLORS[key as DataSource]}`}></span>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar CSV
                        </button>

                        <button
                            onClick={() => setIsPageSelectorOpen(true)}
                            draggable
                            onDragStart={handleDragStart}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl hover:from-blue-700 hover:to-emerald-600 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 cursor-grab active:cursor-grabbing"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Adicionar ao Relatório PDF
                            <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                                {selectedProfiles.size || filteredProfiles.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Match Manual */}
            {isMatchModalOpen && matchSource && (
                <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Vincular Perfil Manualmente</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Selecione o perfil para vincular com: <strong>{matchSource.matchedName}</strong>
                        </p>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {matchSource.suggestedMatches?.map(suggestion => (
                                <button
                                    key={suggestion.name}
                                    onClick={() => {
                                        const target = profiles.find(p => p.matchedName === suggestion.name);
                                        if (target) confirmManualMatch(target.id);
                                    }}
                                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                                >
                                    <span className="font-medium">{suggestion.name}</span>
                                    <span className="text-xs text-gray-400 ml-2">({suggestion.source})</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setIsMatchModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Seletor de Página */}
            {isPageSelectorOpen && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Selecionar Página</h3>
                                <p className="text-sm text-emerald-600 font-medium">
                                    Adicionando: Tabela com {selectedProfiles.size || filteredProfiles.length} alunos
                                </p>
                            </div>
                            <button
                                onClick={() => setIsPageSelectorOpen(false)}
                                className="text-gray-500 hover:text-red-500 p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {pages.map((page: any, index: number) => (
                                    <div
                                        key={page.id}
                                        onClick={() => handleSelectPage(page.id)}
                                        className="aspect-[210/297] bg-white border-2 border-gray-300 hover:border-emerald-500 hover:ring-4 hover:ring-emerald-200 rounded-lg cursor-pointer transition-all relative group flex flex-col shadow-sm hover:shadow-xl"
                                    >
                                        <div className="bg-gray-50 border-b p-2 text-center">
                                            <span className="text-xs font-bold text-gray-600">Página {index + 1}</span>
                                        </div>
                                        <div className="flex-1 flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg transition-all">
                                                Adicionar Aqui
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddPageAndSelect}
                                    className="aspect-[210/297] border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition-all gap-2"
                                >
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="font-bold text-sm">Nova Página</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
