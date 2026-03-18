/**
 * Data Cross-Reference Types
 * Tipos para o sistema de cruzamento de dados entre serviços
 */

import { StudentDraft, SocioeconomicData, SchoolReportItem, AttendanceReportItem } from '../types';

/**
 * Tipo de relação do aluno (filtro principal)
 */
export type StudentRelationType = 'ESCOLAR' | 'BENEFICIADO' | 'ALL';

/**
 * Status do matching de dados
 */
export type MatchStatus = 'COMPLETE' | 'PARTIAL' | 'UNMATCHED';

/**
 * Fonte de dados disponível
 */
export type DataSource = 'ENROLLMENT' | 'GRADES' | 'ATTENDANCE' | 'SOCIOECONOMIC' | 'META_QUALITATIVA';

/**
 * Perfil unificado com dados cruzados de múltiplas fontes
 */
export interface MergedStudentProfile {
    id: string;
    matchedName: string; // Nome normalizado usado para matching

    // Tipo de relação (filtro principal)
    relationType: 'ESCOLAR' | 'BENEFICIADO' | null;

    // Fonte: Ficha de Inscrição (StudentDraft)
    enrollment?: {
        nome: string;
        data_nascimento: string;
        nome_responsavel: string;
        escola_nome: string;
        escola_tipo: 'PUBLICA' | 'PARTICULAR' | '';
        nucleo_id?: string;
        reportType?: 'REPORT_7' | 'REPORT_8'; // 7=Beneficiado, 8=Escolar
    };

    // Fonte: Boletim Escolar
    grades?: {
        grade1: number;
        grade2: number;
        attendance1: number;
        attendance2: number;
        status: 'MELHORA' | 'PIORA' | 'MANTEVE';
    };

    // Fonte: Relatório de Assiduidade
    attendance?: {
        grade1: number;
        grade2: number;
        attendance1: number;
        attendance2: number;
        status: 'MELHORA' | 'PIORA' | 'MANTEVE';
    };

    // Fonte: Indicadores Socioeconômicos
    socioeconomic?: {
        nome: string;
        genero: string;
        renda_familiar: string;
        escolaridade: string;
        area_residencia: string;
        tipo_moradia: string;
        beneficio_social: string;
    };

    // Fonte: Pesquisa Meta Qualitativa
    metaQualitativa?: {
        respostas: Record<string, string>;
        timestamp: string;
    };

    // Metadados de matching
    sources: DataSource[];
    matchStatus: MatchStatus;
    suggestedMatches?: { name: string; source: DataSource }[];
    lastUpdated: string;
}

/**
 * Sugestão de match manual
 */
export interface MatchSuggestion {
    sourceProfile: MergedStudentProfile;
    targetName: string;
    targetSource: DataSource;
    similarity: number; // 0-1
}

/**
 * Filtros para a tabela de cruzamento
 */
export interface CrossReferenceFilters {
    nucleoId?: string;
    relationType: StudentRelationType;
    matchStatus?: MatchStatus;
    searchTerm?: string;
    escola?: string;
}

/**
 * Dados para arrastar para o PDF Builder
 */
export interface CrossReferenceTableData {
    profiles: MergedStudentProfile[];
    filters: CrossReferenceFilters;
    columns: string[];
    title: string;
}
