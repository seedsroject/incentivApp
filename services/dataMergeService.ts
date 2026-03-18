/**
 * Data Merge Service
 * Serviço para cruzamento de dados entre diferentes fontes
 * Implementa matching exato com sugestões manuais para casos incompletos
 */

import { StudentDraft, DocumentLog, SchoolReportItem, AttendanceReportItem, SocioeconomicData } from '../types';
import { MergedStudentProfile, DataSource, MatchStatus, MatchSuggestion } from './dataCrossTypes';

/**
 * Normaliza nome para comparação (match exato)
 * Remove acentos, converte para uppercase, remove espaços extras
 */
export function normalizeStudentName(name: string): string {
    if (!name) return '';

    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toUpperCase()
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim();
}

/**
 * Verifica se dois nomes são idênticos (após normalização)
 */
export function isExactMatch(name1: string, name2: string): boolean {
    return normalizeStudentName(name1) === normalizeStudentName(name2);
}

/**
 * Calcula similaridade básica entre dois nomes (para sugestões)
 * Retorna um valor entre 0 e 1
 */
export function calculateSimilarity(name1: string, name2: string): number {
    const n1 = normalizeStudentName(name1);
    const n2 = normalizeStudentName(name2);

    if (n1 === n2) return 1;
    if (!n1 || !n2) return 0;

    // Verifica se um nome contém o outro
    if (n1.includes(n2) || n2.includes(n1)) {
        return 0.8;
    }

    // Verifica primeiro nome
    const firstName1 = n1.split(' ')[0];
    const firstName2 = n2.split(' ')[0];
    if (firstName1 === firstName2) {
        return 0.6;
    }

    return 0;
}

/**
 * Encontra match exato em uma lista de candidatos
 */
export function findExactMatch(targetName: string, candidates: string[]): string | null {
    const normalized = normalizeStudentName(targetName);

    for (const candidate of candidates) {
        if (normalizeStudentName(candidate) === normalized) {
            return candidate;
        }
    }

    return null;
}

/**
 * Encontra possíveis matches para revisão manual
 */
export function findPossibleMatches(
    targetName: string,
    candidates: string[],
    threshold: number = 0.5
): { name: string; similarity: number }[] {
    const results: { name: string; similarity: number }[] = [];

    for (const candidate of candidates) {
        const similarity = calculateSimilarity(targetName, candidate);
        if (similarity >= threshold && similarity < 1) {
            results.push({ name: candidate, similarity });
        }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Extrai dados de boletim de um DocumentLog
 */
function extractGradesFromDocument(doc: DocumentLog): SchoolReportItem | null {
    if (doc.type !== 'BOLETIM' || !doc.metaData) return null;

    // O metaData pode ser um array de SchoolReportItem ou um único item
    const data = Array.isArray(doc.metaData) ? doc.metaData[0] : doc.metaData;

    if (data && data.studentName) {
        return data as SchoolReportItem;
    }

    return null;
}

/**
 * Extrai dados de assiduidade de um DocumentLog
 */
function extractAttendanceFromDocument(doc: DocumentLog): AttendanceReportItem | null {
    if (doc.type !== 'RELATORIO_ASSIDUIDADE' || !doc.metaData) return null;

    const data = Array.isArray(doc.metaData) ? doc.metaData[0] : doc.metaData;

    if (data && data.studentName) {
        return data as AttendanceReportItem;
    }

    return null;
}

/**
 * Extrai dados socioeconômicos de um DocumentLog
 */
function extractSocioeconomicFromDocument(doc: DocumentLog): SocioeconomicData | null {
    if (doc.type !== 'INDICADORES_SAUDE' || !doc.metaData) return null;

    return doc.metaData as SocioeconomicData;
}

/**
 * Extrai dados de pesquisa meta de um DocumentLog
 */
function extractMetaQualitativaFromDocument(doc: DocumentLog): { respostas: Record<string, string>; timestamp: string } | null {
    if (doc.type !== 'PESQUISA_META' || !doc.metaData) return null;

    return {
        respostas: doc.metaData,
        timestamp: doc.timestamp
    };
}

/**
 * Determina o tipo de relação baseado no reportType
 */
function getRelationType(student: StudentDraft): 'ESCOLAR' | 'BENEFICIADO' | null {
    if (student.reportType === 'REPORT_7') return 'BENEFICIADO';
    if (student.reportType === 'REPORT_8') return 'ESCOLAR';
    return null;
}

/**
 * Determina o status do match baseado nas fontes encontradas
 */
function determineMatchStatus(sources: DataSource[]): MatchStatus {
    if (sources.length >= 3) return 'COMPLETE';
    if (sources.length >= 1) return 'PARTIAL';
    return 'UNMATCHED';
}

/**
 * Merge completo de dados de todas as fontes
 * Usa o nome do aluno como chave principal
 */
export function mergeStudentData(
    students: StudentDraft[],
    documents: DocumentLog[]
): MergedStudentProfile[] {
    const profilesMap = new Map<string, MergedStudentProfile>();

    // 1. Inicializa com os dados das fichas de inscrição
    for (const student of students) {
        const normalizedName = normalizeStudentName(student.nome);
        if (!normalizedName) continue;

        const profile: MergedStudentProfile = {
            id: student.id || `student_${Date.now()}_${Math.random()}`,
            matchedName: normalizedName,
            relationType: getRelationType(student),
            enrollment: {
                nome: student.nome,
                data_nascimento: student.data_nascimento,
                nome_responsavel: student.nome_responsavel,
                escola_nome: student.escola_nome,
                escola_tipo: student.escola_tipo,
                nucleo_id: student.nucleo_id,
                reportType: student.reportType
            },
            sources: ['ENROLLMENT'],
            matchStatus: 'PARTIAL',
            lastUpdated: student.timestamp || new Date().toISOString()
        };

        profilesMap.set(normalizedName, profile);
    }

    // 2. Processa documentos para encontrar matches
    for (const doc of documents) {
        // Boletim
        const grades = extractGradesFromDocument(doc);
        if (grades) {
            const normalizedName = normalizeStudentName(grades.studentName);
            const existing = profilesMap.get(normalizedName);

            if (existing) {
                existing.grades = {
                    grade1: grades.grade1,
                    grade2: grades.grade2,
                    attendance1: grades.attendance1,
                    attendance2: grades.attendance2,
                    status: grades.status
                };
                if (!existing.sources.includes('GRADES')) {
                    existing.sources.push('GRADES');
                }
                existing.lastUpdated = doc.timestamp;
            } else {
                // Cria perfil órfão para match manual posterior
                profilesMap.set(normalizedName, {
                    id: `orphan_${Date.now()}_${Math.random()}`,
                    matchedName: normalizedName,
                    relationType: null,
                    grades: {
                        grade1: grades.grade1,
                        grade2: grades.grade2,
                        attendance1: grades.attendance1,
                        attendance2: grades.attendance2,
                        status: grades.status
                    },
                    sources: ['GRADES'],
                    matchStatus: 'UNMATCHED',
                    lastUpdated: doc.timestamp
                });
            }
        }

        // Assiduidade
        const attendance = extractAttendanceFromDocument(doc);
        if (attendance) {
            const normalizedName = normalizeStudentName(attendance.studentName);
            const existing = profilesMap.get(normalizedName);

            if (existing) {
                existing.attendance = {
                    grade1: attendance.grade1,
                    grade2: attendance.grade2,
                    attendance1: attendance.attendance1,
                    attendance2: attendance.attendance2,
                    status: attendance.status
                };
                if (!existing.sources.includes('ATTENDANCE')) {
                    existing.sources.push('ATTENDANCE');
                }
                existing.lastUpdated = doc.timestamp;
            }
        }

        // Socioeconômico
        const socio = extractSocioeconomicFromDocument(doc);
        if (socio && socio.nome) {
            const normalizedName = normalizeStudentName(socio.nome);
            const existing = profilesMap.get(normalizedName);

            if (existing) {
                existing.socioeconomic = {
                    nome: socio.nome,
                    genero: socio.genero,
                    renda_familiar: socio.renda_familiar,
                    escolaridade: socio.escolaridade,
                    area_residencia: socio.area_residencia,
                    tipo_moradia: socio.tipo_moradia,
                    beneficio_social: socio.beneficio_social
                };
                if (!existing.sources.includes('SOCIOECONOMIC')) {
                    existing.sources.push('SOCIOECONOMIC');
                }
                existing.lastUpdated = doc.timestamp;
            } else {
                profilesMap.set(normalizedName, {
                    id: `orphan_socio_${Date.now()}_${Math.random()}`,
                    matchedName: normalizedName,
                    relationType: null,
                    socioeconomic: {
                        nome: socio.nome,
                        genero: socio.genero,
                        renda_familiar: socio.renda_familiar,
                        escolaridade: socio.escolaridade,
                        area_residencia: socio.area_residencia,
                        tipo_moradia: socio.tipo_moradia,
                        beneficio_social: socio.beneficio_social
                    },
                    sources: ['SOCIOECONOMIC'],
                    matchStatus: 'UNMATCHED',
                    lastUpdated: doc.timestamp
                });
            }
        }

        // Pesquisa Meta Qualitativa
        const meta = extractMetaQualitativaFromDocument(doc);
        if (meta && doc.metaData?.nomeAtleta) {
            const normalizedName = normalizeStudentName(doc.metaData.nomeAtleta);
            const existing = profilesMap.get(normalizedName);

            if (existing) {
                existing.metaQualitativa = meta;
                if (!existing.sources.includes('META_QUALITATIVA')) {
                    existing.sources.push('META_QUALITATIVA');
                }
                existing.lastUpdated = doc.timestamp;
            }
        }
    }

    // 3. Atualiza status de match e busca sugestões para órfãos
    const allProfiles = Array.from(profilesMap.values());
    const enrollmentNames = allProfiles
        .filter(p => p.sources.includes('ENROLLMENT'))
        .map(p => p.matchedName);

    for (const profile of allProfiles) {
        profile.matchStatus = determineMatchStatus(profile.sources);

        // Busca sugestões para perfis órfãos
        if (!profile.sources.includes('ENROLLMENT') && profile.matchStatus === 'UNMATCHED') {
            const suggestions = findPossibleMatches(profile.matchedName, enrollmentNames);
            if (suggestions.length > 0) {
                profile.suggestedMatches = suggestions.map(s => ({
                    name: s.name,
                    source: 'ENROLLMENT' as DataSource
                }));
            }
        }
    }

    return allProfiles;
}

/**
 * Aplica match manual entre dois perfis
 */
export function applyManualMatch(
    profiles: MergedStudentProfile[],
    sourceId: string,
    targetId: string
): MergedStudentProfile[] {
    const sourceIdx = profiles.findIndex(p => p.id === sourceId);
    const targetIdx = profiles.findIndex(p => p.id === targetId);

    if (sourceIdx === -1 || targetIdx === -1) return profiles;

    const source = profiles[sourceIdx];
    const target = profiles[targetIdx];

    // Merge dados do source no target
    const merged: MergedStudentProfile = {
        ...target,
        grades: target.grades || source.grades,
        attendance: target.attendance || source.attendance,
        socioeconomic: target.socioeconomic || source.socioeconomic,
        metaQualitativa: target.metaQualitativa || source.metaQualitativa,
        sources: [...new Set([...target.sources, ...source.sources])],
        lastUpdated: new Date().toISOString()
    };

    merged.matchStatus = determineMatchStatus(merged.sources);

    // Remove source e atualiza target
    const result = profiles.filter((_, i) => i !== sourceIdx);
    const newTargetIdx = result.findIndex(p => p.id === targetId);
    if (newTargetIdx !== -1) {
        result[newTargetIdx] = merged;
    }

    return result;
}
