import React, { useMemo } from 'react';
import type { Nucleo, SliGroup } from '../types';

interface SliNucleoSelectProps {
  nucleos: Nucleo[];
  sliGroups: SliGroup[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  showAllOption?: boolean;
}

/**
 * Select hierárquico que agrupa núcleos por SLI.
 * Valores:
 *   - ""           → Todos os núcleos
 *   - "sli:XXXXX"  → Todos os núcleos do grupo SLI XXXXX
 *   - "uuid-..."   → Um núcleo específico
 */
export const SliNucleoSelect: React.FC<SliNucleoSelectProps> = ({
  nucleos,
  sliGroups,
  value,
  onChange,
  className = 'freq-select',
  showAllOption = true,
}) => {
  const { grouped, ungrouped } = useMemo(() => {
    const nucleoIdSet = new Set(nucleos.map(n => n.id));
    const assignedIds = new Set<string>();

    // Filtra apenas grupos que têm núcleos válidos
    const validGroups = sliGroups
      .map(g => ({
        ...g,
        matchedNucleos: g.nucleoIds
          .filter(id => nucleoIdSet.has(id))
          .map(id => nucleos.find(n => n.id === id)!)
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
      }))
      .filter(g => g.matchedNucleos.length > 0);

    validGroups.forEach(g =>
      g.matchedNucleos.forEach(n => assignedIds.add(n.id))
    );

    const remaining = nucleos
      .filter(n => !assignedIds.has(n.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return { grouped: validGroups, ungrouped: remaining };
  }, [nucleos, sliGroups]);

  const nucleoLabel = (n: Nucleo) => {
    return n.nome;
  };

  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      {showAllOption && <option value="">Todos os Núcleos</option>}

      {grouped.map(g => (
        <optgroup key={`sli-${g.sliNumber}`} label={`📋 SLI ${g.sliNumber} (${g.matchedNucleos.length} núcleos)`}>
          <option value={`sli:${g.sliNumber}`}>
            📊 Ver todos do SLI {g.sliNumber}
          </option>
          {g.matchedNucleos.map(n => (
            <option key={n.id} value={n.id}>
              &nbsp;&nbsp;└ {nucleoLabel(n)}
            </option>
          ))}
        </optgroup>
      ))}

      {ungrouped.length > 0 && (
        <optgroup label={grouped.length > 0 ? '🏠 Outros Núcleos' : '🏠 Núcleos'}>
          {ungrouped.map(n => (
            <option key={n.id} value={n.id}>
              {nucleoLabel(n)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
};

/**
 * Helper: resolve o valor do select em lista de nucleo IDs.
 * Retorna undefined se "todos", ou array de IDs.
 */
export function resolveSelectedNucleoIds(
  value: string,
  sliGroups: SliGroup[]
): string[] | undefined {
  if (!value) return undefined; // Todos
  if (value.startsWith('sli:')) {
    const sliNum = value.replace('sli:', '');
    const group = sliGroups.find(g => g.sliNumber === sliNum);
    return group ? group.nucleoIds : [];
  }
  return [value]; // Núcleo individual
}

export default SliNucleoSelect;
