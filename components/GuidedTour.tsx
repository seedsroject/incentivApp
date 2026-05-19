import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  clickTarget?: boolean; // se true, simula clique visual no target
  offsetX?: number;
  offsetY?: number;
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ steps, isActive, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMoving, setIsMoving] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showClick, setShowClick] = useState(false);
  const animFrameRef = useRef<number>(0);
  const timeoutRef = useRef<number>(0);

  const step = steps[currentStep];

  const animateCursorTo = useCallback((targetX: number, targetY: number, onComplete: () => void) => {
    setIsMoving(true);
    setShowTooltip(false);
    setShowClick(false);

    const startX = cursorPos.x;
    const startY = cursorPos.y;
    const duration = 900; // ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const x = startX + (targetX - startX) * eased;
      const y = startY + (targetY - startY) * eased;
      setCursorPos({ x, y });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsMoving(false);
        onComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [cursorPos]);

  const goToStep = useCallback((stepIdx: number) => {
    if (stepIdx >= steps.length) {
      onClose();
      return;
    }

    setCurrentStep(stepIdx);
    const s = steps[stepIdx];

    // Give time for any UI updates
    setTimeout(() => {
      const el = document.querySelector(s.targetSelector);
      if (!el) {
        // Element not found, skip
        console.warn(`Tour: element not found for selector "${s.targetSelector}"`);
        goToStep(stepIdx + 1);
        return;
      }

      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll element into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        const freshRect = el.getBoundingClientRect();
        setTargetRect(freshRect);

        const targetX = freshRect.left + freshRect.width / 2 + (s.offsetX || 0);
        const targetY = freshRect.top + freshRect.height / 2 + (s.offsetY || 0);

        animateCursorTo(targetX, targetY, () => {
          if (s.clickTarget) {
            setShowClick(true);
            timeoutRef.current = window.setTimeout(() => {
              setShowClick(false);
              setShowTooltip(true);
            }, 500);
          } else {
            setShowTooltip(true);
          }
        });
      }, 350);
    }, 150);
  }, [steps, animateCursorTo, onClose]);

  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
      setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      goToStep(0);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const pos = step?.position || 'bottom';
    const gap = 16;

    switch (pos) {
      case 'top':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.top - gap,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + gap,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          left: targetRect.left - gap,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          left: targetRect.right + gap,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translate(0, -50%)',
        };
      default:
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + gap,
          transform: 'translate(-50%, 0)',
        };
    }
  };

  const handleNext = () => {
    goToStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 z-[9999]" style={{ pointerEvents: 'auto' }}>
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight glow around target */}
      {targetRect && !isMoving && (
        <div
          className="absolute rounded-xl border-2 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-500"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Animated Cursor */}
      <div
        className="absolute z-[10001] pointer-events-none transition-transform"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-4px, -2px)',
        }}
      >
        {/* Cursor SVG */}
        <svg
          width="28" height="28" viewBox="0 0 24 24" fill="none"
          style={{
            filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.5))',
            transition: isMoving ? 'none' : 'transform 0.2s',
            transform: showClick ? 'scale(0.85)' : 'scale(1)',
          }}
        >
          <path
            d="M5.65 1.55L5.65 18.6L10.25 13.65L16 13.65L5.65 1.55Z"
            fill="white"
            stroke="black"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Click ripple */}
        {showClick && (
          <div className="absolute -top-2 -left-2">
            <div
              className="w-10 h-10 rounded-full border-2 border-blue-400 animate-ping"
              style={{ animationDuration: '0.4s', animationIterationCount: '1' }}
            />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && step && (
        <div
          className="absolute z-[10002] bg-white rounded-2xl shadow-2xl border border-gray-200 px-5 py-4 max-w-xs animate-fade-in"
          style={{
            ...getTooltipStyle(),
            animation: 'fadeInUp 0.35s ease-out',
          }}
        >
          {/* Arrow */}
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {currentStep + 1}/{steps.length}
            </div>
            <h4 className="text-sm font-bold text-gray-900">{step.title}</h4>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            {step.description}
          </p>
          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-blue-600' : i < currentStep ? 'bg-blue-300' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="text-xs text-gray-500 hover:text-gray-700 font-bold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={handleNext}
                className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold px-4 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10003] bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full shadow-lg transition-all hover:scale-110"
        title="Fechar tutorial"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10003] text-white/60 text-[10px] font-medium flex items-center gap-3">
        <span>ESC para sair</span>
        <span>•</span>
        <span>Clique em "Próximo" para avançar</span>
      </div>
    </div>
  );
};

// ---- PREDEFINED TOUR STEPS ----

export const LOGIN_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="login-email"]',
    title: '1. E-mail de Acesso',
    description: 'Insira o e-mail cadastrado pelo Administrador Geral do projeto. Se você é novo, clique em "Registrar" e aguarde a aprovação.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="login-password"]',
    title: '2. Senha',
    description: 'Digite sua senha. Se esqueceu, entre em contato com o administrador do projeto para resetar.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="login-submit"]',
    title: '3. Entrar no Sistema',
    description: 'Clique aqui para acessar o sistema. Se seu cadastro ainda está "PENDENTE", o Admin Geral precisará aprovar antes do primeiro acesso.',
    position: 'top',
    clickTarget: true,
  },
];

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="service-precadastro"]',
    title: 'Pré-cadastro e Fila de Espera',
    description: 'Aqui você gerencia a fila de espera inteligente. Famílias preenchem o formulário online e os candidatos são organizados automaticamente por proximidade do núcleo.',
    position: 'bottom',
    clickTarget: true,
  },
  {
    targetSelector: '[data-tour="service-ficha"]',
    title: 'Ficha de Inscrição',
    description: 'Cadastre oficialmente um aluno com todos os dados: nome, responsável, endereço, documentos pessoais e dados socioeconômicos.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="share-link-precadastro"]',
    title: 'Enviar Link de Cadastro',
    description: 'Este botão verde gera um link público que você pode enviar pelo WhatsApp para as famílias. Os pais preenchem direto do celular e o aluno entra automaticamente na fila de espera!',
    position: 'left',
    clickTarget: true,
  },
  {
    targetSelector: '[data-tour="service-declaracao"]',
    title: 'Documentação Escolar',
    description: 'Após a matrícula, recolha os documentos: Declaração de Matrícula, Boletim Escolar e Atestado Médico. Sem esses documentos, o aluno fica com pendência.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="dev-environment-btn"]',
    title: 'Ambiente de Desenvolvimento',
    description: 'Acesse aqui os relatórios finais e as ferramentas de análise avançada (cruzamento de dados, gráficos socioeconômicos e exportação em PDF).',
    position: 'top',
    clickTarget: true,
  },
];

export const ADMIN_MAP_TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="admin-map"]',
    title: 'Mapa de Núcleos',
    description: 'Este mapa mostra todos os núcleos esportivos do projeto. Cada pino representa uma cidade. Clique em um pino para ver os detalhes e alunos daquela região.',
    position: 'right',
  },
  {
    targetSelector: '[data-tour="admin-tabs"]',
    title: 'Navegação por Abas',
    description: 'Use estas abas para alternar entre a visão geral, gestão de alunos, estoque de materiais e aprovação de novos acessos.',
    position: 'bottom',
  },
  {
    targetSelector: '[data-tour="admin-acessos"]',
    title: 'Gestão de Acessos',
    description: 'Aqui o Admin Geral aprova ou rejeita novos cadastros de professores e coordenadores. Cadastros pendentes aparecem com borda amarela, aprovados com borda verde.',
    position: 'bottom',
    clickTarget: true,
  },
];
