
import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { CameraOCR } from './CameraOCR';
import { MetaQualitativa } from './MetaQualitativa';
import { SocioeconomicForm } from './SocioeconomicForm';
import { PublicBoletimUpload } from './PublicBoletimUpload';
import { PublicPreCadastroForm } from './PublicPreCadastroForm';
import { DeclaracaoUniformesForm } from './DeclaracaoUniformesForm';
import { DeclaracaoProntidaoForm } from './DeclaracaoProntidaoForm';
import { PublicDeclaracaoMatriculaUpload } from './PublicDeclaracaoMatriculaUpload';
import { StudentDraft, DocumentLog, PreCadastroData, DeclaracaoUniformes, DeclaracaoProntidao } from '../types';

interface PublicFormViewProps {
  serviceId: string;
  studentId?: string;
  onSave: (data: any) => void;
}

// ─── WIZARD STEPS ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Inscrição', short: 'Inscrição' },
  { id: 2, label: 'Declaração de Matrícula', short: 'Matrícula' },
  { id: 3, label: 'Indicadores Socioeconômicos', short: 'Socioeconômico' },
  { id: 4, label: 'Declaração de Uniformes', short: 'Uniformes' },
  { id: 5, label: 'Questionário de Prontidão (PAR-Q)', short: 'PAR-Q' },
  { id: 6, label: 'Meta Qualitativa (Parcial)', short: 'Meta Qualit.' },
];

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
const WizardProgress: React.FC<{ current: number; total: number; studentName?: string; onBack?: () => void }> = ({ current, total, studentName, onBack }) => (
  <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-40 shadow-sm">
    {/* Back button */}
    {onBack && current > 1 && (
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-blue-600 mb-3 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar etapa anterior
      </button>
    )}
    {/* Steps indicator */}
    <div className="flex items-center justify-between mb-3 max-w-lg mx-auto">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${done ? 'bg-green-500 text-white' :
                active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-gray-100 text-gray-400'
                }`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.id}
              </div>
              <span className={`text-[9px] font-bold mt-1 hidden sm:block ${active ? 'text-blue-600' : done ? 'text-green-500' : 'text-gray-300'}`}>
                {step.short}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-all ${done ? 'bg-green-400' : 'bg-gray-100'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
    {/* Label */}
    <div className="text-center">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        Passo {current} de {total}
      </p>
      <p className="text-sm font-bold text-gray-800">{STEPS[current - 1]?.label}</p>
      {studentName && current > 1 && (
        <p className="text-xs text-blue-600 font-medium mt-0.5">Aluno(a): {studentName}</p>
      )}
    </div>
  </div>
);

// ─── SKIP BUTTON ─────────────────────────────────────────────────────────────
const SkipButton: React.FC<{ onSkip: () => void; label?: string }> = ({ onSkip, label }) => (
  <div className="px-4 pb-6 pt-2 flex justify-center">
    <button
      type="button"
      onClick={onSkip}
      className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
    >
      {label || 'Não tenho este documento agora — pular esta etapa'}
    </button>
  </div>
);

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────
const SuccessScreen: React.FC<{ skipped: number[] }> = ({ skipped }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-in">
    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100">
      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
    <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Inscrição Enviada!</h2>
    <p className="text-gray-500 max-w-xs mx-auto font-medium leading-relaxed mb-6">
      As informações foram recebidas pelo Núcleo Esportivo com sucesso.
    </p>
    {skipped.length > 0 && (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 max-w-xs w-full mb-6">
        <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">⚠ Documentos pendentes</p>
        <p className="text-xs text-yellow-600 leading-relaxed">
          Os seguintes passos foram pulados e ainda precisam ser entregues ao núcleo:
        </p>
        <ul className="mt-2 space-y-1">
          {skipped.map(s => (
            <li key={s} className="text-xs font-bold text-yellow-800">• {STEPS[s - 1]?.label}</li>
          ))}
        </ul>
        <p className="text-[10px] text-yellow-500 mt-2">Procure o coordenador do projeto para regularizar.</p>
      </div>
    )}
    <p className="text-xs text-gray-300 mt-4">Você já pode fechar esta página.</p>
    <div className="mt-12 pt-8 border-t border-gray-100 w-full max-w-xs opacity-30 grayscale">
      <Logo className="h-8 mx-auto" />
    </div>
  </div>
);


// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export const PublicFormView: React.FC<PublicFormViewProps> = ({ serviceId, studentId, onSave }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);
  const [wizardStudentName, setWizardStudentName] = useState('');
  const [wizardStudentId, setWizardStudentId] = useState(studentId || '');

  // For non-wizard services: fetch student from localStorage
  const student: StudentDraft | undefined = React.useMemo(() => {
    if (serviceId !== 'declaracao' && serviceId !== 'declaracao_prontidao') return undefined;
    try {
      const saved = localStorage.getItem('students_v2');
      if (!saved) return undefined;
      const students: StudentDraft[] = JSON.parse(saved);
      return students.find(s => s.id === studentId || s.nome === studentId);
    } catch { return undefined; }
  }, [serviceId, studentId]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Helper: save student data to localStorage
  const saveStudentToLocalStorage = (updates: Partial<StudentDraft>, id: string) => {
    try {
      const saved = localStorage.getItem('students_v2');
      if (!saved) return;
      const students: StudentDraft[] = JSON.parse(saved);
      const updated = students.map(s =>
        (s.id === id || s.nome === id) ? { ...s, ...updates } : s
      );
      localStorage.setItem('students_v2', JSON.stringify(updated));
    } catch { }
  };

  const goBack = () => {
    setWizardStep(prev => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  const skip = (step: number) => {
    setSkippedSteps(prev => [...prev, step]);
    if (step >= STEPS.length) {
      setIsSuccess(true);
    } else {
      setWizardStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const advance = (step: number) => {
    if (step >= STEPS.length) {
      setIsSuccess(true);
    } else {
      setWizardStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  // ── NON-WIZARD SERVICES (legacy) ──────────────────────────────────────────
  if (serviceId !== 'ficha') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 flex flex-col items-center gap-1">
          <Logo className="h-10" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Portal do Aluno</p>
        </header>
        <main className="flex-1 overflow-auto bg-white pb-10">
          <div className="max-w-3xl mx-auto px-1">
            {isSuccess ? (
              <SuccessScreen skipped={[]} />
            ) : serviceId === 'meta' ? (
              <MetaQualitativa key="public-meta" onBack={() => { }} initialMode="DIGITAL_FORM"
                onSave={(data: DocumentLog) => { onSave(data); setIsSuccess(true); }} />
            ) : serviceId === 'socio' ? (
              <SocioeconomicForm key="public-socio" onBack={() => { }} initialMode="DIGITAL_FORM"
                onSave={(data: DocumentLog) => { onSave(data); setIsSuccess(true); }} />
            ) : serviceId === 'precadastro' ? (
              <PublicPreCadastroForm key="public-precadastro"
                onSave={(data: PreCadastroData) => { onSave(data); setIsSuccess(true); }} />
            ) : serviceId === 'boletim' ? (
              <PublicBoletimUpload key="public-boletim"
                onSave={(data: DocumentLog) => { onSave(data); setIsSuccess(true); }} />
            ) : serviceId === 'declaracao' ? (
              student ? (
                <DeclaracaoUniformesForm key="public-declaracao"
                  studentName={student.nome} responsavelName={student.nome_responsavel}
                  cpfResponsavel={student.rg_cpf} isPublic={true}
                  onSave={(declaracao: DeclaracaoUniformes) => {
                    saveStudentToLocalStorage({ declaracao_uniformes: declaracao }, studentId || '');
                    onSave({ type: 'declaracao_uniformes', studentId, declaracao });
                    setIsSuccess(true);
                  }} />
              ) : <LegacyNotFound />
            ) : serviceId === 'declaracao_prontidao' ? (
              student ? (
                <DeclaracaoProntidaoForm key="public-prontidao"
                  studentName={student.nome} responsavelName={student.nome_responsavel}
                  isPublic={true}
                  onSave={(declaracao: DeclaracaoProntidao) => {
                    saveStudentToLocalStorage({ declaracao_prontidao: declaracao }, studentId || '');
                    onSave({ type: 'declaracao_prontidao', studentId, declaracao });
                    setIsSuccess(true);
                  }} />
              ) : <LegacyNotFound />
            ) : <LegacyInvalid />}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── WIZARD MODE (serviceId === 'ficha') ───────────────────────────────────
  if (isSuccess) return <SuccessScreen skipped={skippedSteps} />;

  // Fetch student object from localStorage using wizardStudentId (populated after step 1)
  const wizardStudent: StudentDraft | undefined = (() => {
    if (!wizardStudentId) return undefined;
    try {
      const saved = localStorage.getItem('students_v2');
      if (!saved) return undefined;
      const students: StudentDraft[] = JSON.parse(saved);
      return students.find(s => s.id === wizardStudentId || s.nome === wizardStudentId);
    } catch { return undefined; }
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Wizard Header with progress */}
      <header className="bg-white border-b border-gray-100 p-3 flex flex-col items-center gap-1">
        <Logo className="h-8" />
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Portal do Aluno · Inscrição</p>
      </header>

      <WizardProgress current={wizardStep} total={STEPS.length} studentName={wizardStudentName} onBack={wizardStep > 1 ? goBack : undefined} />

      <main className="flex-1 overflow-auto pb-16">
        <div className="max-w-3xl mx-auto px-1">

          {/* ── STEP 1: Ficha de Inscrição ── */}
          {wizardStep === 1 && (
            <div>
              <CameraOCR
                key="wizard-ficha"
                onBack={() => { }}
                initialMode="FORM_DIGITAL"
                onSave={(data: StudentDraft) => {
                  // Persist and extract student identity for following steps
                  const name = data.nome || '';
                  const id = data.id || data.nome || '';
                  setWizardStudentName(name);
                  setWizardStudentId(id);
                  onSave(data);
                  advance(1);
                }}
              />
              <SkipButton onSkip={() => skip(1)} label="Pular esta etapa" />
            </div>
          )}

          {/* ── STEP 2: Declaração de Matrícula (scan/upload) ── */}
          {wizardStep === 2 && (
            <div>
              <PublicDeclaracaoMatriculaUpload
                key="wizard-matricula"
                studentName={wizardStudentName || wizardStudent?.nome}
                onSave={(doc: DocumentLog) => {
                  onSave(doc);
                  advance(2);
                }}
              />
              <SkipButton onSkip={() => skip(2)} label="Não possuo este documento agora — pular e entregar depois ao coordenador" />
            </div>
          )}

          {/* ── STEP 3: Indicadores Socioeconômicos ── */}
          {wizardStep === 3 && (
            <div>
              <div className="bg-blue-50 border border-blue-100 mx-4 mt-4 mb-2 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-blue-700">
                  Responda as perguntas sobre o perfil socioeconômico do(a) aluno(a).
                </p>
              </div>
              <SocioeconomicForm
                key="wizard-socio"
                onBack={() => { }}
                initialMode="DIGITAL_FORM"
                onSave={(data: DocumentLog) => {
                  onSave(data);
                  advance(3);
                }}
              />
              <SkipButton onSkip={() => skip(3)} label="Pular questionário socioeconômico" />
            </div>
          )}

          {/* ── STEP 4: Declaração de Uniformes ── */}
          {wizardStep === 4 && (
            <div>
              <div className="bg-blue-50 border border-blue-100 mx-4 mt-4 mb-2 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-blue-700">
                  Declare os uniformes recebidos e assine abaixo.
                </p>
              </div>
              {wizardStudent ? (
                <DeclaracaoUniformesForm
                  key="wizard-uniformes"
                  studentName={wizardStudent.nome}
                  responsavelName={wizardStudent.nome_responsavel}
                  cpfResponsavel={wizardStudent.rg_cpf}
                  isPublic={true}
                  onSave={(declaracao: DeclaracaoUniformes) => {
                    saveStudentToLocalStorage({ declaracao_uniformes: declaracao }, wizardStudentId);
                    onSave({ type: 'declaracao_uniformes', studentId: wizardStudentId, declaracao });
                    advance(4);
                  }}
                />
              ) : (
                <PlaceholderStep
                  title="Declaração de Uniformes"
                  desc="Esta etapa requer os dados do aluno. Se pulou o passo de inscrição, preencha diretamente com o coordenador do núcleo."
                />
              )}
              <SkipButton onSkip={() => skip(4)} label="Uniformes ainda não foram entregues — pular" />
            </div>
          )}

          {/* ── STEP 5: PAR-Q ── */}
          {wizardStep === 5 && (
            <div>
              <div className="bg-blue-50 border border-blue-100 mx-4 mt-4 mb-2 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-blue-700">
                  Questionário de Prontidão para Atividade Física. Responda com atenção.
                </p>
              </div>
              {wizardStudent ? (
                <DeclaracaoProntidaoForm
                  key="wizard-parq"
                  studentName={wizardStudent.nome}
                  responsavelName={wizardStudent.nome_responsavel}
                  isPublic={true}
                  onSave={(declaracao: DeclaracaoProntidao) => {
                    saveStudentToLocalStorage({ declaracao_prontidao: declaracao }, wizardStudentId);
                    onSave({ type: 'declaracao_prontidao', studentId: wizardStudentId, declaracao });
                    advance(5);
                  }}
                />
              ) : (
                <PlaceholderStep
                  title="Questionário PAR-Q"
                  desc="Esta etapa requer os dados do aluno. Se pulou o passo de inscrição, preencha diretamente com o coordenador do núcleo."
                />
              )}
              <SkipButton onSkip={() => skip(5)} label="Pular questionário de saúde — entregar depois" />
            </div>
          )}

          {/* ── STEP 6: Meta Qualitativa (Parcial) ── */}
          {wizardStep === 6 && (
            <div>
              <div className="bg-blue-50 border border-blue-100 mx-4 mt-4 mb-2 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-blue-700">
                  Responda as perguntas sobre a Meta Qualitativa (Parcial).
                </p>
              </div>
              <MetaQualitativa
                key="wizard-meta"
                onBack={() => { }}
                initialMode="DIGITAL_FORM"
                onSave={(data: DocumentLog) => {
                  onSave(data);
                  advance(6);
                }}
              />
              <SkipButton onSkip={() => skip(6)} label="Pular meta qualitativa parcial" />
            </div>
          )}

        </div>
      </main>

      <Footer />
      <WizardStyles />
    </div>
  );
};

// ─── HELPER SUB-COMPONENTS ────────────────────────────────────────────────────
const PlaceholderStep: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="mx-4 my-6 bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h3 className="font-bold text-gray-700 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

const LegacyNotFound: React.FC = () => (
  <div className="p-20 text-center flex flex-col items-center">
    <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-bold text-gray-800">Aluno não encontrado</h3>
    <p className="text-sm text-gray-500 mt-1">Utilize o link oficial enviado pelo Núcleo com os dados do aluno.</p>
  </div>
);

const LegacyInvalid: React.FC = () => (
  <div className="p-20 text-center flex flex-col items-center">
    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 className="font-bold text-gray-800">Serviço Inválido</h3>
    <p className="text-sm text-gray-500 mt-1">Por favor, utilize o link oficial enviado pelo Núcleo.</p>
  </div>
);

const Footer: React.FC = () => (
  <footer className="p-8 text-center bg-white border-t border-gray-100">
    <p className="text-[9px] text-gray-400 uppercase font-black tracking-[0.2em] leading-relaxed">
      Sistema de Gestão Esportiva<br />
      Governo Federal - Ministério do Esporte
    </p>
  </footer>
);

const WizardStyles: React.FC = () => (
  <style>{`
    /* LIMPEZA DE ELEMENTOS ADMINISTRATIVOS */
    button[title="Voltar"],
    button[title="Sair"],
    button[title="Histórico de Cadastros"],
    button[title="Visualizar Inscrições Salvas"],
    button[title="Fechar"],
    nav,
    .bg-white.p-4.shadow-sm:not(header) { display: none !important; }

    .min-h-screen.bg-gray-50 { background-color: #f9fafb !important; }
    .p-4.max-w-2xl { padding-top: 1rem !important; }
    .bg-white.p-4.border-b { border-bottom: none !important; padding-bottom: 0 !important; }

    h1.font-bold.text-lg {
      font-size: 1.1rem !important;
      font-weight: 900 !important;
      text-align: center !important;
      margin: 0.75rem 0 !important;
      color: #111827 !important;
    }

    input, select, textarea { font-size: 16px !important; }
  `}</style>
);
