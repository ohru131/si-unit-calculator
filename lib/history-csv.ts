export type CsvHistoryEntry = {
  createdAt: string;
  expression: string;
  resultText: string;
  targetUnit: string;
};

function escapeCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function historyToCsv(entries: CsvHistoryEntry[]) {
  const header = ["calculated_at", "expression", "result", "display_unit"].join(",");
  const rows = entries.map((entry) => [entry.createdAt, entry.expression, entry.resultText, entry.targetUnit].map(escapeCell).join(","));
  return [header, ...rows].join("\n");
}

