import React, { useState, useMemo } from 'react';
import { PreCadastroData, Nucleo, StudentDraft } from '../types';

interface PreCadastroDashboardProps {
    onBack: () => void;
    onOpenPublicForm: () => void;
    candidates: PreCadastroData[];
    nucleos?: Nucleo[]; // Added nucleos prop
    students?: StudentDraft[]; // Added students prop
    onAddCandidate: (data: PreCadastroData) => void;
    onUpdateCandidate: (id: string, updates: Partial<PreCadastroData>) => void;
    onDeleteCandidate: (id: string) => void;
}

// Mock Data
export const MOCK_PRE_CADASTRO: PreCadastroData[] = [
    {
        id: 'pc_001',
        timestamp: new Date().toISOString(),
        nucleo_id: 'nuc_ilheus', // Simulando geolocalização do endereço
        status: 'AGUARDANDO',
        nome_aluno: 'Lucas Almeida Santos',
        data_nascimento: '2010-05-14',
        raca: 'Parda',
        pcd: 'Não',
        deficiencia_desc: '',
        rg: '11.222.333-4',
        cpf: '111.222.333-44',
        tipo_escola: 'Escola Pública',
        bolsa_estudo: 'Estuda em escola Pública',
        nome_escola: 'Escola Estadual Carlos Marighella',
        periodo_estudo: 'Estuda de manhã',
        cursando: '6º ano ao 9º ano (Fundamental II)',
        frequencia_atividade: 'Pratica uma vez na semana',
        nome_responsavel: 'Maria Almeida',
        telefone: '(73) 99999-1111',
        email: 'maria.almeida@email.com',
        endereco: 'Rua das Flores, 12, Joaquim Romão, Ilhéus - BA, 45600-000',
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Alugado',
        qtd_pessoas_casa: '2 a 7 ou mais',
        renda_bruta: 'Até 1 salário mínimo',
        beneficio_gov: 'Sim',
        sistema_saude: 'Público (SUS)',
        vacinas_dia: 'Sim',
        altura: '1.45',
        peso: '40',
        sabe_nadar: 'Não',
        sabe_pedalar: 'Sim',
        intuito: 'Melhorar a saúde e tirar o menino da rua.',
        restricao_dias: 'Terça-feira (faz reforço escolar).',
    },
    {
        id: 'pc_002',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        nucleo_id: 'nuc_fortaleza',
        status: 'AGUARDANDO',
        nome_aluno: 'Ana Beatriz Souza',
        data_nascimento: '2012-08-20',
        raca: 'Branca',
        pcd: 'Sim',
        deficiencia_desc: 'Autismo Leve',
        rg: '55.666.777-8',
        cpf: '555.666.777-88',
        tipo_escola: 'Escola Privada',
        bolsa_estudo: 'Recebe bolsa integral (100%)',
        nome_escola: 'Colégio Adventista',
        periodo_estudo: 'Estuda à tarde',
        cursando: '2º ano ao 5º ano (Fundamental I)',
        frequencia_atividade: 'Não pratica atividade física',
        nome_responsavel: 'Carlos Souza',
        telefone: '(85) 98888-2222',
        email: 'carlos.souza@email.com',
        endereco: 'Av. Washington Soares, 100, Edson Queiroz, Fortaleza - CE, 60000-000', // Perto de Caucaia/Fortaleza
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Próprio',
        qtd_pessoas_casa: '2 a 7 ou mais',
        renda_bruta: 'Até 3 salários mínimos',
        beneficio_gov: 'Não',
        sistema_saude: 'Privado (Plano De Saúde)',
        vacinas_dia: 'Sim',
        altura: '1.30',
        peso: '32',
        sabe_nadar: 'Sim',
        sabe_pedalar: 'Não',
        intuito: 'Por recomendação médica (autismo).',
        restricao_dias: 'Não',
    },
    {
        id: 'pc_ilh_001',
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
        nucleo_id: 'nuc_ilheus',
        status: 'AGUARDANDO',
        nome_aluno: 'Thiago Barbosa Lima',
        data_nascimento: '2012-04-22',
        raca: 'Parda',
        pcd: 'Não',
        deficiencia_desc: '',
        rg: '12.345.678-9',
        cpf: '123.456.789-09',
        tipo_escola: 'Escola Pública',
        bolsa_estudo: 'Estuda em escola Pública',
        nome_escola: 'EMEF Padre Casimiro Bekx',
        periodo_estudo: 'Estuda de manhã',
        cursando: '6º ano ao 9º ano (Fundamental II)',
        frequencia_atividade: 'Não pratica atividade física',
        nome_responsavel: 'Claudete Barbosa',
        telefone: '(73) 98700-1234',
        email: 'claudete.barbosa@email.com',
        endereco: 'Rua Conquista, 55, Caixa d\'Água, Ilhéus - BA, 45656-000',
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Alugado',
        qtd_pessoas_casa: '2 a 7 ou mais',
        renda_bruta: 'Até 1 salário mínimo',
        beneficio_gov: 'Sim',
        sistema_saude: 'Público (SUS)',
        vacinas_dia: 'Sim',
        altura: '1.48',
        peso: '42',
        sabe_nadar: 'Não',
        sabe_pedalar: 'Sim',
        intuito: 'Quer aprender a nadar e ter saúde.',
        restricao_dias: 'Não',
    },
    {
        id: 'pc_ilh_002',
        timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
        nucleo_id: 'nuc_ilheus',
        status: 'AGUARDANDO',
        nome_aluno: 'Mariana Gomes Vieira',
        data_nascimento: '2011-09-15',
        raca: 'Negra',
        pcd: 'Não',
        deficiencia_desc: '',
        rg: '23.456.789-0',
        cpf: '234.567.890-00',
        tipo_escola: 'Escola Pública',
        bolsa_estudo: 'Estuda em escola Pública',
        nome_escola: 'Escola Estadual Rotary',
        periodo_estudo: 'Estuda à tarde',
        cursando: '6º ano ao 9º ano (Fundamental II)',
        frequencia_atividade: 'Pratica uma vez na semana',
        nome_responsavel: 'José Gomes',
        telefone: '(73) 98801-2345',
        email: 'jose.gomes@email.com',
        endereco: 'Av. da Paz, 312, Teotônio Vilela, Ilhéus - BA, 45657-000',
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Próprio',
        qtd_pessoas_casa: '2 a 7 ou mais',
        renda_bruta: 'Até 2 salários mínimos',
        beneficio_gov: 'Não',
        sistema_saude: 'Público (SUS)',
        vacinas_dia: 'Sim',
        altura: '1.52',
        peso: '45',
        sabe_nadar: 'Sim',
        sabe_pedalar: 'Sim',
        intuito: 'Participar de competições de triathlon.',
        restricao_dias: 'Sexta-feira (aula de reforço).',
    },
    {
        id: 'pc_ilh_003',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        nucleo_id: 'nuc_ilheus',
        status: 'AGUARDANDO',
        nome_aluno: 'Felipe Santos Rodrigues',
        data_nascimento: '2013-02-08',
        raca: 'Parda',
        pcd: 'Não',
        deficiencia_desc: '',
        rg: '34.567.890-1',
        cpf: '345.678.901-11',
        tipo_escola: 'Escola Pública',
        bolsa_estudo: 'Estuda em escola Pública',
        nome_escola: 'EMEF Urbano Portela Melo',
        periodo_estudo: 'Estuda de manhã',
        cursando: '2º ano ao 5º ano (Fundamental I)',
        frequencia_atividade: 'Não pratica atividade física',
        nome_responsavel: 'Rosana Santos',
        telefone: '(73) 98902-3456',
        email: 'rosana.santos@email.com',
        endereco: 'Rua Mem de Sá, 18, Salobrinho, Ilhéus - BA, 45658-000',
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Alugado',
        qtd_pessoas_casa: '2 a 7 ou mais',
        renda_bruta: 'Até 1 salário mínimo',
        beneficio_gov: 'Sim',
        sistema_saude: 'Público (SUS)',
        vacinas_dia: 'Sim',
        altura: '1.38',
        peso: '35',
        sabe_nadar: 'Não',
        sabe_pedalar: 'Não',
        intuito: 'Por incentivo da professora de educação física.',
        restricao_dias: 'Não',
    },
    {
        id: 'pc_ilh_004',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
        nucleo_id: 'nuc_ilheus',
        status: 'AGUARDANDO',
        nome_aluno: 'Beatriz Monteiro Cardoso',
        data_nascimento: '2012-11-27',
        raca: 'Branca',
        pcd: 'Não',
        deficiencia_desc: '',
        rg: '45.678.901-2',
        cpf: '456.789.012-22',
        tipo_escola: 'Escola Privada',
        bolsa_estudo: 'Recebe bolsa parcial (50%)',
        nome_escola: 'Colégio Maria Auxiliadora',
        periodo_estudo: 'Estuda de manhã',
        cursando: '6º ano ao 9º ano (Fundamental II)',
        frequencia_atividade: 'Pratica duas vezes na semana',
        nome_responsavel: 'Antônio Monteiro',
        telefone: '(73) 99003-4567',
        email: 'antonio.monteiro@email.com',
        endereco: 'Rua Theodomiro Sarro, 90, Malhado, Ilhéus - BA, 45652-000',
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Próprio',
        qtd_pessoas_casa: '2 a 7 ou mais',
        renda_bruta: 'Até 3 salários mínimos',
        beneficio_gov: 'Não',
        sistema_saude: 'Privado (Plano De Saúde)',
        vacinas_dia: 'Sim',
        altura: '1.50',
        peso: '43',
        sabe_nadar: 'Sim',
        sabe_pedalar: 'Sim',
        intuito: 'Melhorar performance esportiva e saúde.',
        restricao_dias: 'Não',
    },
];

const extractLocationDetails = (text?: string) => {
    if (!text) return { city: '', uf: '' };

    // 1. Tentar extrair do formato final (candidatos e alguns núcleos): "... Cidade - UF ..."
    const tokens = text.split(',');
    for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i].trim();
        const match = token.match(/^(.+?)\s*-\s*([A-Z]{2})(?:\s+|$)/);
        if (match) {
            return {
                city: match[1].trim().toLowerCase(),
                uf: match[2].toUpperCase()
            };
        }
    }

    // 2. Tentar extrair do formato inicial dos núcleos: "Cidade | UF - ..."
    const startMatch = text.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\s]+)(?:\||\-)\s*([A-Z]{2})\b/);
    if (startMatch) {
        return {
            city: startMatch[1].trim().toLowerCase(),
            uf: startMatch[2].toUpperCase()
        };
    }

    // Fallback: procurar qualquer estado solto ex: "- CE", "| CE"
    const ufMatch = text.match(/(?:\||\-)\s*([A-Z]{2})\b/);
    return {
        city: '',
        uf: ufMatch ? ufMatch[1].toUpperCase() : ''
    };
};

export const PreCadastroDashboard: React.FC<PreCadastroDashboardProps> = ({
    onBack,
    onOpenPublicForm,
    candidates,
    nucleos = [],
    students = [],
    onAddCandidate,
    onUpdateCandidate,
    onDeleteCandidate
}) => {
    const [selectedCandidate, setSelectedCandidate] = useState<PreCadastroData | null>(null);
    const [filterNucleo, setFilterNucleo] = useState<string>('');
    const [editingNucleoId, setEditingNucleoId] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);

    // Sort valid candidates by timestamp (oldest first)
    // Add logic to calculate vacancies per nucleo
    const nucleoVacancies = useMemo(() => {
        const vacancies: Record<string, number> = {};
        nucleos.forEach(nucleo => {
            // Count active students in this nucleo
            // For simplicity, assuming each nucleo has 100 total spots
            const activeStudents = students.filter(s => s.nucleo_id === nucleo.id).length;
            const totalSpots = 60; // Mínimo de 60 alunos por núcleo
            vacancies[nucleo.id] = Math.max(0, totalSpots - activeStudents);
        });
        return vacancies;
    }, [nucleos, students]);

    const totalVacancies = useMemo(() => {
        return Object.values(nucleoVacancies).reduce((acc, curr) => acc + curr, 0);
    }, [nucleoVacancies]);

    const sortedCandidates = useMemo(() => {
        let filtered = [...candidates];
        if (filterNucleo) {
            filtered = filtered.filter(c => c.nucleo_id === filterNucleo);
        }
        return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [candidates, filterNucleo]);

    // Determine which candidates should get the red border (next in line for open spots)
    const nextInLineForVacancies = useMemo(() => {
        const priorityIds = new Set<string>();
        // Process each nucleo's waiting list independently
        Object.entries(nucleoVacancies).forEach(([nucleoId, availableSpots]) => {
            if (availableSpots > 0) {
                // Find candidates waiting for this nucleo
                const nucleoCandidates = [...candidates]
                    .filter(c => c.nucleo_id === nucleoId && c.status === 'AGUARDANDO')
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                // Mark exactly up to X candidates who can fill the open spots
                for (let i = 0; i < Math.min(availableSpots, nucleoCandidates.length); i++) {
                    priorityIds.add(nucleoCandidates[i].id);
                }
            }
        });
        return priorityIds;
    }, [candidates, nucleoVacancies]);

    const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            alert('Ficha recebida. Os dados seriam processados via IA e inseridos na fila automaticamente.');
            const newCandidate: PreCadastroData = {
                id: `pc_manual_${Date.now()} `,
                timestamp: new Date().toISOString(),
                nucleo_id: 'nuc_pendente',
                status: 'AGUARDANDO',
                nome_aluno: 'Candidato Ficha Impressa',
                nome_responsavel: 'Responsável',
                telefone: '(00) 00000-0000',
                data_nascimento: '', raca: '', pcd: 'Não', deficiencia_desc: '', rg: '', cpf: '',
                tipo_escola: '', bolsa_estudo: '', nome_escola: '', periodo_estudo: '', cursando: '', frequencia_atividade: '',
                email: '', endereco: '', local_moradia: '', tipo_imovel: '', qtd_pessoas_casa: '', renda_bruta: '', beneficio_gov: 'Não',
                sistema_saude: '', vacinas_dia: 'Sim', altura: '', peso: '', sabe_nadar: 'Não', sabe_pedalar: 'Não', intuito: '', restricao_dias: ''
            };
            onAddCandidate(newCandidate);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* HEADER */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-gray-200">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="text-gray-600 hover:text-purple-600 transition-colors flex items-center gap-1 font-bold">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            Voltar
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Fila de Espera Inteligente
                            {totalVacancies > 0 && (
                                <div className="relative ml-2 flex items-center">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="flex bg-red-100 items-center justify-center p-2 rounded-full cursor-pointer animate-pulse relative hover:bg-red-200 transition-colors"
                                        title="Ver Extrato de Vagas"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                                        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                            {totalVacancies}
                                        </div>
                                    </button>

                                    {showNotifications && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                            <div className="absolute top-full left-0 mt-3 bg-white shadow-2xl border border-gray-100 rounded-xl p-5 z-50 min-w-[320px] sm:min-w-[420px] max-w-[90vw] max-h-[70vh] overflow-y-auto animate-fade-in-up">
                                                <div className="flex items-center justify-between mb-4 border-b pb-3">
                                                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                                        Extrato de Vagas
                                                    </h3>
                                                    <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-1 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {Object.entries(nucleoVacancies).map(([nucId, spots]) => {
                                                        if (spots === 0) return null;
                                                        const nucleoNome = nucleos.find(n => n.id === nucId)?.nome || nucId;
                                                        return (
                                                            <div
                                                                key={nucId}
                                                                className="flex justify-between items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors border border-red-100 group"
                                                                onClick={() => {
                                                                    setFilterNucleo(nucId);
                                                                    setShowNotifications(false);
                                                                }}
                                                                title={`Filtrar candidatos aguardando para este núcleo`}
                                                            >
                                                                <div className="flex flex-col flex-1 pr-3">
                                                                    <span className="font-bold text-gray-800 text-sm">{nucleoNome.split(' - ')[0]}</span>
                                                                    <span className="text-xs text-gray-500 mt-0.5">{nucleoNome.split(' - ')[1] || nucleoNome}</span>
                                                                </div>
                                                                <div className="flex flex-col items-center shrink-0">
                                                                    <span className="bg-red-500 group-hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-xs shadow-sm transition-colors text-center whitespace-nowrap tracking-wide">
                                                                        {spots} VAGA{spots > 1 ? 'S' : ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center font-medium">
                                                    Clique em um núcleo para filtrar os alunos da fila
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </h1>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto mr-12 md:mr-24">
                        <label className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white px-4 py-2 rounded-lg shadow-sm transition-all font-bold flex items-center justify-center gap-2 cursor-pointer text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Receber Ficha Física
                            <input type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={handleManualUpload} />
                        </label>
                        <div className="flex bg-gradient-to-r from-blue-600 to-teal-500 rounded-lg shadow-sm overflow-hidden divide-x divide-white/20">
                            <button
                                onClick={onOpenPublicForm}
                                className="hover:bg-white/10 text-white px-4 py-2 transition-all font-bold flex items-center justify-center gap-2 text-sm flex-1"
                                title="Abrir Link"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Link URL
                            </button>
                            <button
                                onClick={() => {
                                    const url = window.location.origin + window.location.pathname + '?service=precadastro&token=admin_preview';
                                    const text = encodeURIComponent(`Olá! Segue o link para o questionário de pré - cadastro da Escolinha de Triathlon Formando Campeões: \n\n${url} `);
                                    window.open(`https://wa.me/?text=${text}`, '_blank');
                                }}
                                className="hover:bg-white/10 text-white px-4 py-2 transition-all font-bold flex items-center justify-center gap-2 text-sm"
                                title="Enviar por WhatsApp"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <p className="text-gray-600 max-w-2xl">
                            Acompanhe a fila de interessados. A entrada no sistema organiza automaticamente os alunos para sugerir o núcleo mais adequado com base no georreferenciamento do endereço.
                        </p>

                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            <select
                                value={filterNucleo}
                                onChange={(e) => setFilterNucleo(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 outline-none w-48"
                            >
                                <option value="">Todos os Núcleos</option>
                                {nucleos.map(nuc => (
                                    <option key={nuc.id} value={nuc.id}>{nuc.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedCandidates.length === 0 ? (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                                Nenhum candidato aguardando para este filtro.
                            </div>
                        ) : (
                            sortedCandidates.map((c, index) => {
                                const hasSpot = nextInLineForVacancies.has(c.id);
                                return (
                                    <div key={c.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow transition-colors overflow-hidden flex flex-col ${hasSpot ? 'border-2 border-red-500 ring-2 ring-red-100' : 'border border-gray-100'}`}>
                                        <div className="flex bg-gray-50 p-4 border-b border-gray-100 items-start gap-4">
                                            <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl w-14 h-14 flex items-center justify-center font-black text-xl shadow-inner flex-shrink-0">
                                                #{index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-800 text-lg">{c.nome_aluno}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    Responsável: {c.nome_responsavel.split(' ')[0]}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm bg-blue-50/50 p-3 rounded-xl border border-blue-100 gap-2 overflow-hidden">
                                                <span className="text-gray-600 flex-shrink-0">Núcleo Sugerido</span>
                                                {editingNucleoId === c.id ? (() => {
                                                    const candidateLoc = c.endereco ? extractLocationDetails(c.endereco) : { city: '', uf: '' };
                                                    const sameCityNucleos = nucleos.filter(n => {
                                                        const nucLoc = extractLocationDetails(n.city || n.nome);
                                                        return nucLoc.city && candidateLoc.city && nucLoc.city === candidateLoc.city && nucLoc.uf === candidateLoc.uf;
                                                    });
                                                    const sameStateNucleos = nucleos.filter(n => {
                                                        if (sameCityNucleos.includes(n)) return false;
                                                        const nucLoc = extractLocationDetails(n.city || n.nome);
                                                        return nucLoc.uf && candidateLoc.uf && nucLoc.uf === candidateLoc.uf;
                                                    });

                                                    // Function to shorten the visual name in the select to prevent overflow cuts
                                                    const formatNucleoName = (nome: string) => {
                                                        const short = nome.split(' - ')[0];
                                                        return short.length > 50 ? short.substring(0, 50) + '...' : short;
                                                    };

                                                    return (
                                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                                            <select
                                                                autoFocus
                                                                className="text-sm border-gray-300 rounded-lg py-1 pl-2 pr-6 focus:ring-blue-500 focus:border-blue-500 bg-white w-full max-w-[140px] sm:max-w-[200px] text-ellipsis overflow-hidden"
                                                                value={c.nucleo_id || ''}
                                                                onChange={(e) => {
                                                                    const newId = e.target.value;
                                                                    onUpdateCandidate(c.id, { nucleo_id: newId });
                                                                    setEditingNucleoId(null);
                                                                }}
                                                                onBlur={() => setEditingNucleoId(null)}
                                                            >
                                                                <option value="nuc_pendente">Pendente</option>
                                                                {sameCityNucleos.length > 0 && (
                                                                    <optgroup label="Mesma Cidade">
                                                                        {sameCityNucleos.map(n => <option key={n.id} value={n.id} title={n.nome}>{formatNucleoName(n.nome)}</option>)}
                                                                    </optgroup>
                                                                )}
                                                                {sameStateNucleos.length > 0 && (
                                                                    <optgroup label={`Outros Núcleos (${candidateLoc.uf})`}>
                                                                        {sameStateNucleos.map(n => <option key={n.id} value={n.id} title={n.nome}>{formatNucleoName(n.nome)}</option>)}
                                                                    </optgroup>
                                                                )}
                                                            </select>
                                                            <button onMouseDown={() => setEditingNucleoId(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div className="flex items-center gap-1 group w-full justify-end overflow-hidden">
                                                        <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded truncate max-w-full">
                                                            {c.nucleo_id === 'nuc_pendente' ? 'Pendente' : nucleos.find(n => n.id === c.nucleo_id)?.nome || c.nucleo_id}
                                                        </span>
                                                        <button
                                                            onClick={() => setEditingNucleoId(c.id)}
                                                            className="text-gray-400 hover:text-blue-600 p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                            title="Alterar Núcleo Sugerido"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-4 flex gap-2">
                                                {hasSpot && (
                                                    <div className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 animate-pulse">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Vaga
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setSelectedCandidate(c)}
                                                    className="flex-1 bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 text-sm font-bold py-2 px-4 rounded-xl transition-colors"
                                                >
                                                    Ver Detalhes
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`Tem certeza que deseja excluir ${c.nome_aluno} da fila de espera?`)) {
                                                            onDeleteCandidate(c.id);
                                                        }
                                                    }}
                                                    className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors p-2 rounded-xl border border-red-100 flex items-center justify-center"
                                                    title="Excluir Pré-cadastro"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            {/* MODAL DETALHES DO CANDIDATO */}
            {selectedCandidate && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
                        <button
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute top-4 right-4 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 p-2 rounded-full transition-colors z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
                            <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shadow-md">
                                {selectedCandidate.nome_aluno.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedCandidate.nome_aluno}</h2>
                                <p className="text-gray-500 text-sm">Responsável: {selectedCandidate.nome_responsavel}</p>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">

                            <section>
                                <h3 className="font-bold text-purple-700 text-sm uppercase mb-3 border-b border-purple-100 pb-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Identificação
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-gray-900 font-medium">
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Data de Nasc.</span> {selectedCandidate.data_nascimento}</div>
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Raça</span> {selectedCandidate.raca}</div>
                                    <div>
                                        <span className="block text-gray-500 text-[10px] font-bold uppercase">PCD</span>
                                        {selectedCandidate.pcd} {selectedCandidate.deficiencia_desc && `(${selectedCandidate.deficiencia_desc})`}
                                        {selectedCandidate.laudo_url && (
                                            <a href={selectedCandidate.laudo_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                Ver Laudo
                                            </a>
                                        )}
                                        {selectedCandidate.pcd === 'Sim' && !selectedCandidate.laudo_url && (
                                            <label className="ml-2 inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                Anexar Laudo
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files.length > 0) {
                                                            const url = URL.createObjectURL(e.target.files[0]);
                                                            onUpdateCandidate(selectedCandidate.id, { laudo_url: url });
                                                            setSelectedCandidate(prev => prev ? { ...prev, laudo_url: url } : null);
                                                        }
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-purple-700 text-sm uppercase mb-3 border-b border-purple-100 pb-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                                    Informações Escolares
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-900 font-medium">
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Escola</span> {selectedCandidate.nome_escola} ({selectedCandidate.tipo_escola})</div>
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Bolsa</span> {selectedCandidate.bolsa_estudo}</div>
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Período/Série</span> {selectedCandidate.cursando} / {selectedCandidate.periodo_estudo}</div>
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Ativ. Física</span> {selectedCandidate.frequencia_atividade}</div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-purple-700 text-sm uppercase mb-3 border-b border-purple-100 pb-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    Socioeconômico
                                </h3>
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col gap-3 text-sm text-gray-900 font-medium">
                                    <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Endereço</span> {selectedCandidate.endereco} <span className="text-indigo-600 font-bold ml-2">(Sugerido: {selectedCandidate.nucleo_id})</span></div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3">
                                        <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Renda</span> {selectedCandidate.renda_bruta}</div>
                                        <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Benefício</span> {selectedCandidate.beneficio_gov}</div>
                                        <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Moradia</span> {selectedCandidate.tipo_imovel} ({selectedCandidate.local_moradia})</div>
                                        <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Qtd Pessoas</span> {selectedCandidate.qtd_pessoas_casa}</div>
                                        <div><span className="block text-gray-500 text-[10px] font-bold uppercase">Telefone</span> {selectedCandidate.telefone}</div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-bold text-purple-700 text-sm uppercase mb-3 border-b border-purple-100 pb-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    Intuito & Restrições
                                </h3>
                                <div className="text-sm space-y-3 text-gray-900 font-medium">
                                    <p><strong>Intuito:</strong> {selectedCandidate.intuito}</p>
                                    <p><strong>Restrições de dia:</strong> {selectedCandidate.restricao_dias}</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div >
            )}
        </div >
    );
};
