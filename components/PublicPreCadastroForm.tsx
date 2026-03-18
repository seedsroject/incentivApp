import React, { useState } from 'react';
import { PreCadastroData } from '../types';

interface PublicPreCadastroFormProps {
    onSave: (data: PreCadastroData) => void;
}

export const PublicPreCadastroForm: React.FC<PublicPreCadastroFormProps> = ({ onSave }) => {
    const [formData, setFormData] = useState<Partial<PreCadastroData>>({
        pcd: 'Não',
        beneficio_gov: 'Não',
        vacinas_dia: 'Sim',
        sabe_nadar: 'Não',
        sabe_pedalar: 'Não',
        raca: 'Parda',
        tipo_escola: 'Escola Pública',
        bolsa_estudo: 'Não se aplica',
        periodo_estudo: 'Estuda de manhã',
        cursando: '2º ano ao 5º ano (Fundamental I)',
        frequencia_atividade: 'Não pratica atividade física',
        local_moradia: 'Área Urbana',
        tipo_imovel: 'Proprio',
        qtd_pessoas_casa: '2 a 7',
        renda_bruta: 'Até 1 salário mínimo',
        sistema_saude: 'Público (SUS)',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: PreCadastroData = {
            ...formData as any,
            id: `pc_${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'AGUARDANDO'
        };
        onSave(data);
    };

    const renderInput = (name: keyof PreCadastroData, label: string, type: string = 'text', required: boolean = true) => (
        <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">{label} {required && '*'}</label>
            {type === 'textarea' ? (
                <textarea
                    name={name as string}
                    value={(formData[name] as string) || ''}
                    onChange={handleChange}
                    required={required}
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:border-purple-500 focus:outline-none"
                    rows={3}
                />
            ) : (
                <input
                    type={type}
                    name={name as string}
                    value={(formData[name] as string) || ''}
                    onChange={handleChange}
                    required={required}
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:border-purple-500 focus:outline-none"
                />
            )}
        </div>
    );

    const renderSelect = (name: keyof PreCadastroData, label: string, options: string[], required: boolean = true) => (
        <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">{label} {required && '*'}</label>
            <select
                name={name as string}
                value={(formData[name] as string) || ''}
                onChange={handleChange}
                required={required}
                className="w-full border border-gray-300 rounded p-2 text-sm focus:border-purple-500 focus:outline-none"
            >
                <option value="">Selecione...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    const renderRadioGroup = (name: keyof PreCadastroData, label: string, options: string[]) => (
        <div className="mb-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">{label} *</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1">
                {options.map(opt => (
                    <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-100 flex-1">
                        <input
                            type="radio"
                            name={name as string}
                            value={opt}
                            checked={formData[name] === opt}
                            onChange={handleChange}
                            className="text-purple-600 focus:ring-purple-500"
                        />
                        {opt}
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto w-full pt-4 pb-12 animate-fade-in">
            <div className="bg-white border text-center border-purple-100 rounded-2xl p-6 mb-6 shadow-sm">
                <h1 className="text-xl font-black text-purple-900 leading-tight">QUESTIONÁRIO DE PRÉ-CADASTRO</h1>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-1">Escolinha de Triathlon Formando Campeões</h2>
                <div className="mt-4 text-xs text-justify sm:text-center text-gray-600 bg-purple-50 p-3 rounded-lg border border-purple-100 leading-relaxed max-w-lg mx-auto">
                    <strong>Instruções aos Pais:</strong> O preenchimento deste formulário é destinado à pré-seleção e reserva de vagas. O preenchimento <strong>NÃO GARANTE A MATRÍCULA</strong>, mas inclui o aluno em nossa fila de espera prioritária inteligente.
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* I. Identificação */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                        I. Identificação do Aluno
                    </h3>
                    {renderInput('nome_aluno', '1. Nome COMPLETO do(a) aluno(a)')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderInput('data_nascimento', '2. Data de Nascimento', 'date')}
                        {renderSelect('raca', '3. O(a) aluno(a) se declara:', ['Branca', 'Preta', 'Parda', 'Indígena', 'Amarela'])}
                    </div>
                    {renderRadioGroup('pcd', '4. É Pessoa com Deficiência (PCD)?', ['Sim', 'Não'])}
                    {formData.pcd === 'Sim' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                            {renderInput('deficiencia_desc', '5. Qual a deficiência?', 'text', false)}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">6. Anexar Laudo Médico (Opcional)</label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            const fileUrl = URL.createObjectURL(e.target.files[0]);
                                            setFormData(prev => ({ ...prev, laudo_url: fileUrl }));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderInput('rg', '7. RG do(a) aluno(a)')}
                        {renderInput('cpf', '8. CPF do(a) aluno(a)')}
                    </div>
                </section>

                {/* II. Escolar */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
                        II. Informações Escolares e Atividade Física
                    </h3>
                    {renderRadioGroup('tipo_escola', '8. Estuda em:', ['Escola Pública', 'Escola Privada'])}
                    {formData.tipo_escola === 'Escola Privada' && (
                        renderSelect('bolsa_estudo', '9. O aluno recebe bolsa?', ['Não recebe bolsa', 'Recebe bolsa parcial', 'Recebe bolsa integral (100%)'])
                    )}
                    {renderInput('nome_escola', '10. Nome da Escola')}
                    {renderSelect('periodo_estudo', '11. Estuda em qual período?', ['Estuda de manhã', 'Estuda à tarde', 'Estuda em período Integral'])}
                    {renderSelect('cursando', '12. Atualmente está cursando:', ['2º ano ao 5º ano (Fundamental I)', '6º ano ao 9º ano (Fundamental II)', '1º ano ou 2º ano (Ensino Médio)'])}
                    {renderSelect('frequencia_atividade', '13. Frequência de atividade física:', ['Não pratica atividade física', 'Pratica uma vez na semana', 'Pratica de 2 a 3 vezes na semana', 'Pratica mais de 3 vezes na semana'])}
                </section>

                {/* III. Responsável */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
                        III. Dados do Responsável e Socioeconômicos
                    </h3>
                    {renderInput('nome_responsavel', '14. Nome do(a) responsável')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderInput('telefone', '15. Telefone (WhatsApp)', 'tel')}
                        {renderInput('email', '16. E-mail do responsável', 'email')}
                    </div>
                    {renderInput('endereco', '17. Endereço Completo (Rua, nº, Bairro, CEP) - Importante para achar núcleo mais perto', 'textarea')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderRadioGroup('local_moradia', '18. Local de moradia?', ['Área Urbana', 'Área Rural'])}
                        {renderSelect('tipo_imovel', '19. O imóvel é:', ['Próprio', 'Alugado', 'Cedido'])}
                        {renderSelect('qtd_pessoas_casa', '20. Pessoas na casa?', ['2 a 7', '8 ou mais'])}
                        {renderSelect('renda_bruta', '21. Renda bruta familiar:', ['Até 1 salário mínimo', 'Até 2 salários mínimos', 'Até 3 salários mínimos', 'Até 4 salários mínimos', '5 salários mínimos ou mais'])}
                    </div>
                    {renderRadioGroup('beneficio_gov', '22. Recebe benefício governamental? (ex: Bolsa Família)', ['Sim', 'Não'])}
                </section>

                {/* IV. Saúde */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
                        IV. Saúde e Habilidades Específicas
                    </h3>
                    {renderRadioGroup('sistema_saude', '23. Qual o sistema de saúde utilizado?', ['Público (SUS)', 'Privado (Plano De Saúde)'])}
                    {renderRadioGroup('vacinas_dia', '24. Todas as vacinas estão em dia?', ['Sim', 'Não'])}
                    <div className="grid grid-cols-2 gap-4">
                        {renderInput('altura', '25. Altura (m)', 'number')}
                        {renderInput('peso', '26. Peso (kg)', 'number')}
                    </div>
                    {renderRadioGroup('sabe_nadar', '27. Consegue nadar Crawl Básico?', ['Sim', 'Não'])}
                    {renderRadioGroup('sabe_pedalar', '28. Sabe andar de bicicleta SEM rodinhas?', ['Sim', 'Não'])}
                </section>

                {/* V. Finalização */}
                <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-purple-700 mb-4 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
                        V. Finalização
                    </h3>
                    {renderInput('intuito', '29. Qual é o seu intuito ao inscrever seu filho(a)?', 'textarea')}
                    {renderInput('restricao_dias', '30. Restrições de dias para treino (Se puder treinar todos os dias, responda "Não")', 'textarea')}
                </section>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] text-lg uppercase tracking-wider"
                    >
                        Enviar Pré-Cadastro e Entrar na Fila
                    </button>
                </div>
            </form>
        </div>
    );
};
