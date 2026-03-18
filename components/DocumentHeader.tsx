
import React, { useState, useEffect } from 'react';

/**
 * DocumentHeader — Cabeçalho oficial com as 3 logos:
 * Lei de Incentivo ao Esporte | Escalinha de Triathlon | Ministério do Esporte / Governo do Brasil
 *
 * Usado em: Ficha de Inscrição, Declaração de Uniformes, e demais documentos impressos.
 */
export const DocumentHeader: React.FC<{ className?: string }> = ({ className = '' }) => {
    const [src, setSrc] = useState<string>('/header_full.png');

    // Pré-carrega o header como base64 para garantir que apareça na impressão/PDF
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/header_full.png');
                const blob = await res.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') setSrc(reader.result);
                };
                reader.readAsDataURL(blob);
            } catch {
                // Mantém o caminho relativo como fallback
            }
        };
        load();
    }, []);

    return (
        <div className={`w-full flex justify-center ${className}`}>
            <img
                src={src}
                alt="Lei de Incentivo ao Esporte | Escalinha de Triathlon Formando Campeões | Ministério do Esporte – Governo do Brasil"
                className="w-full object-contain"
                style={{ maxHeight: '110px' }}
            />
        </div>
    );
};
