/**
 * formulaEngine.ts
 * Excel-like formula engine for the Report Builder WidgetConfigurator.
 * 
 * Supports cell addressing (A1-style), ranges (A1:A5), and functions:
 *  - SOMA(range | list)   → Sum
 *  - MEDIA(range | list)  → Average
 *  - SUB(a; b)            → Subtraction (a - b)
 *  - DIV(a; b)            → Division (a / b)
 *  - PCT(a; b)            → Percentage (a / b × 100)
 *  - Basic arithmetic: =A1+B1-C1*D1/E1
 */

// ─── Cell Reference Helpers ─────────────────────────────────────

/** Convert column letter(s) to 0-based index: A→0, B→1, ... Z→25, AA→26 */
export function colLetterToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64); // 'A' = 65
  }
  return idx - 1;
}

/** Convert 0-based column index to letter: 0→A, 1→B, ... 25→Z, 26→AA */
export function indexToColLetter(idx: number): string {
  let result = '';
  let n = idx;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Parse a cell reference like "A1" → { col: 0, row: 0 } */
export function parseCellRef(ref: string): { col: number; row: number } | null {
  const match = ref.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    col: colLetterToIndex(match[1]),
    row: parseInt(match[2], 10) - 1,  // 1-indexed → 0-indexed
  };
}

/** Format a cell address: col=0, row=0 → "A1" */
export function formatCellRef(col: number, row: number): string {
  return `${indexToColLetter(col)}${row + 1}`;
}

/** Expand a range like "A1:A5" into an array of cell references */
export function expandRange(rangeStr: string): { col: number; row: number }[] {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return [];
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return [];

  const cells: { col: number; row: number }[] = [];
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push({ col: c, row: r });
    }
  }
  return cells;
}

// ─── Grid Data Type ─────────────────────────────────────────────

export interface CellData {
  raw: string;       // What the user typed (may be a formula starting with =)
  computed?: number;  // Resolved numeric value (if formula or parseable number)
  error?: string;     // Error message if formula failed
  isFormula: boolean; // Whether this cell contains a formula
}

/** A 2D grid keyed by "col,row" string */
export type GridData = Map<string, CellData>;

function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

// ─── Formula Evaluator ──────────────────────────────────────────

/** Get the numeric value of a cell, resolving formulas recursively */
function getCellValue(
  col: number, row: number,
  grid: GridData,
  visited: Set<string>,
  columns: string[],
  rows: Record<string, string>[]
): number {
  const key = cellKey(col, row);

  // Check for circular reference
  if (visited.has(key)) {
    throw new Error('Referência circular');
  }

  // Check if we have a computed cell
  const cellData = grid.get(key);
  if (cellData?.computed !== undefined && !cellData.error) {
    return cellData.computed;
  }

  // Read raw value from the table data
  const rawValue = getRawCellValue(col, row, columns, rows);
  if (rawValue === undefined || rawValue === '') return 0;

  // If it's a formula, evaluate it
  if (typeof rawValue === 'string' && rawValue.startsWith('=')) {
    visited.add(key);
    const result = evaluateFormula(rawValue, grid, visited, columns, rows);
    visited.delete(key);
    return result;
  }

  // Try parsing as number
  const num = parseFloat(rawValue.replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

/** Get raw cell value from the table data structure */
function getRawCellValue(
  col: number, row: number,
  columns: string[], rows: Record<string, string>[]
): string | undefined {
  if (col < 0 || col >= columns.length || row < 0 || row >= rows.length) return undefined;
  return rows[row]?.[columns[col]];
}

/** Resolve a list of arguments (cell refs, ranges, or literals) to numbers */
function resolveArgs(
  argsStr: string,
  grid: GridData,
  visited: Set<string>,
  columns: string[],
  rows: Record<string, string>[]
): number[] {
  const values: number[] = [];
  // Split by semicolon (;) — Portuguese Excel convention
  const parts = argsStr.split(';').map(s => s.trim());

  for (const part of parts) {
    if (part.includes(':')) {
      // Range: e.g. A1:A5
      const cells = expandRange(part);
      for (const cell of cells) {
        values.push(getCellValue(cell.col, cell.row, grid, new Set(visited), columns, rows));
      }
    } else {
      // Single cell ref or literal number
      const ref = parseCellRef(part);
      if (ref) {
        values.push(getCellValue(ref.col, ref.row, grid, new Set(visited), columns, rows));
      } else {
        const num = parseFloat(part.replace(',', '.'));
        if (!isNaN(num)) values.push(num);
      }
    }
  }
  return values;
}

/** Evaluate a formula string (starting with =) */
function evaluateFormula(
  formula: string,
  grid: GridData,
  visited: Set<string>,
  columns: string[],
  rows: Record<string, string>[]
): number {
  const expr = formula.substring(1).trim().toUpperCase();

  // ── Function calls: SOMA(...), MEDIA(...), SUB(...), DIV(...), PCT(...) ──
  const funcMatch = expr.match(/^(SOMA|MEDIA|SUB|DIV|PCT|SUM|AVG|AVERAGE)\s*\((.+)\)$/);
  if (funcMatch) {
    const func = funcMatch[1];
    const args = resolveArgs(funcMatch[2], grid, visited, columns, rows);

    switch (func) {
      case 'SOMA':
      case 'SUM':
        return args.reduce((a, b) => a + b, 0);

      case 'MEDIA':
      case 'AVG':
      case 'AVERAGE':
        return args.length > 0 ? args.reduce((a, b) => a + b, 0) / args.length : 0;

      case 'SUB':
        return args.length >= 2 ? args[0] - args[1] : (args[0] || 0);

      case 'DIV':
        if (args.length < 2 || args[1] === 0) throw new Error('Divisão por zero');
        return args[0] / args[1];

      case 'PCT':
        if (args.length < 2 || args[1] === 0) throw new Error('Divisão por zero');
        return (args[0] / args[1]) * 100;

      default:
        throw new Error(`Função desconhecida: ${func}`);
    }
  }

  // ── Simple arithmetic: =A1+B1-C1*D1/E1 ──
  // Replace cell references with their values
  let resolved = expr;
  const cellRefs = expr.match(/[A-Z]+\d+/g);
  if (cellRefs) {
    for (const refStr of cellRefs) {
      const ref = parseCellRef(refStr);
      if (ref) {
        const val = getCellValue(ref.col, ref.row, grid, new Set(visited), columns, rows);
        resolved = resolved.replace(new RegExp(refStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(val));
      }
    }
  }

  // Evaluate the arithmetic expression safely
  try {
    // Only allow digits, operators, dots, parentheses, and spaces
    if (/^[\d\s+\-*/().]+$/.test(resolved)) {
      // Use Function constructor for safe eval of math expressions
      const result = new Function(`return (${resolved})`)();
      if (typeof result === 'number' && isFinite(result)) return result;
    }
    throw new Error('Expressão inválida');
  } catch {
    throw new Error('Expressão inválida');
  }
}

// ─── Public API ─────────────────────────────────────────────────

export interface ComputedCell {
  col: number;
  row: number;
  value: number;
  formula: string;
  error?: string;
  displayValue: string;
}

/**
 * Evaluate all formulas in a table grid.
 * @param columns - Column header names (e.g. ["Nome", "Valor", "Total"])
 * @param rows - Table row data (array of {columnName: cellValue})
 * @returns Map of computed cells keyed by "col,row"
 */
export function evaluateGrid(
  columns: string[],
  rows: Record<string, string>[]
): Map<string, ComputedCell> {
  const grid: GridData = new Map();
  const computedCells = new Map<string, ComputedCell>();

  // First pass: identify all formula cells
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const raw = rows[r]?.[columns[c]] || '';
      const isFormula = raw.startsWith('=');
      const key = cellKey(c, r);

      if (isFormula) {
        grid.set(key, { raw, isFormula: true });
      } else {
        const num = parseFloat(raw.replace(',', '.'));
        grid.set(key, {
          raw,
          computed: isNaN(num) ? undefined : num,
          isFormula: false,
        });
      }
    }
  }

  // Second pass: evaluate all formula cells
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const raw = rows[r]?.[columns[c]] || '';
      if (!raw.startsWith('=')) continue;

      const key = cellKey(c, r);
      try {
        const value = evaluateFormula(raw, grid, new Set(), columns, rows);
        const rounded = Math.round(value * 100) / 100;
        grid.set(key, { raw, computed: rounded, isFormula: true });
        computedCells.set(key, {
          col: c, row: r, value: rounded,
          formula: raw,
          displayValue: formatNumber(rounded),
        });
      } catch (err: any) {
        grid.set(key, { raw, isFormula: true, error: err.message });
        computedCells.set(key, {
          col: c, row: r, value: 0,
          formula: raw,
          error: err.message,
          displayValue: `#ERR: ${err.message}`,
        });
      }
    }
  }

  return computedCells;
}

/** Format a number for display */
function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace('.', ',');
}

/**
 * Extract computed column data for use as chart data.
 * @param labelColumn - Column index to use as labels
 * @param valueColumn - Column index to use as values (should contain formulas or numbers)
 * @param columns - All column names
 * @param rows - All row data
 * @param computedCells - Pre-computed formula results
 */
export function extractChartData(
  labelColumn: number,
  valueColumn: number,
  columns: string[],
  rows: Record<string, string>[],
  computedCells: Map<string, ComputedCell>,
  colors: string[]
): { label: string; value: number; color: string }[] {
  const data: { label: string; value: number; color: string }[] = [];

  for (let r = 0; r < rows.length; r++) {
    const label = rows[r]?.[columns[labelColumn]] || `Linha ${r + 1}`;
    const valKey = cellKey(valueColumn, r);
    const computed = computedCells.get(valKey);
    let value: number;

    if (computed && !computed.error) {
      value = computed.value;
    } else {
      const raw = rows[r]?.[columns[valueColumn]] || '0';
      value = parseFloat(raw.replace(',', '.')) || 0;
    }

    data.push({
      label,
      value,
      color: colors[r % colors.length],
    });
  }

  return data;
}

/** List of available formula functions with descriptions */
export const FORMULA_HELP = [
  { name: 'SOMA', syntax: '=SOMA(A1:A5)', desc: 'Soma de um intervalo ou lista' },
  { name: 'MEDIA', syntax: '=MEDIA(A1:A5)', desc: 'Média aritmética' },
  { name: 'SUB', syntax: '=SUB(A1;B1)', desc: 'Subtração (A - B)' },
  { name: 'DIV', syntax: '=DIV(A1;B1)', desc: 'Divisão (A / B)' },
  { name: 'PCT', syntax: '=PCT(A1;B1)', desc: 'Percentual (A/B × 100)' },
  { name: '+−×÷', syntax: '=A1+B1*C1', desc: 'Operações aritméticas' },
];
