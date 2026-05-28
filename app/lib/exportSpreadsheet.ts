import * as XLSX from "xlsx";

export type SpreadsheetSheet = {
  /** Nombre de la hoja (máx. 31 caracteres en Excel) */
  name: string;
  /** Filas como objetos; las claves de la primera fila definen las columnas */
  rows: Record<string, string | number>[];
};

/** Descarga un archivo CSV con BOM UTF-8 para Excel en español */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/** Genera y descarga un libro Excel (.xlsx) con una o más hojas */
export function downloadWorkbook(sheets: SpreadsheetSheet[], filename: string): void {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const safeName = sheet.name.replace(/[\\/*?:\[\]]/g, " ").trim().slice(0, 31) || "Hoja";
    const ws = XLSX.utils.json_to_sheet(sheet.rows.length > 0 ? sheet.rows : [{ "": "" }]);
    XLSX.utils.book_append_sheet(wb, ws, safeName);
  }
  const outName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, outName);
}
