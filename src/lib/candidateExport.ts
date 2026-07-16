import Papa from "papaparse";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Tables } from "@/integrations/supabase/types";

export type Candidate = Tables<"candidates">;

const cols = [
  ["full_name", "Name"],
  ["mobile", "Mobile"],
  ["email", "Email"],
  ["qualification", "Qualification"],
  ["passed_out_year", "Passed Out"],
  ["overall_experience", "Experience"],
  ["current_company", "Current Company"],
  ["current_location", "Location"],
  ["primary_skills", "Skills"],
  ["status", "Status"],
  ["submitted_at", "Submitted"],
] as const;

function toRows(list: Candidate[]) {
  return list.map((c) => {
    const r: Record<string, string> = {};
    for (const [key, label] of cols) {
      const v = c[key as keyof Candidate];
      r[label] = v == null ? "" : key === "submitted_at" ? new Date(v as string).toLocaleString() : String(v);
    }
    return r;
  });
}

export function exportCSV(list: Candidate[]) {
  const csv = Papa.unparse(toRows(list));
  download(new Blob([csv], { type: "text/csv;charset=utf-8" }), "candidates.csv");
}

export function exportExcel(list: Candidate[]) {
  const ws = XLSX.utils.json_to_sheet(toRows(list));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, "candidates.xlsx");
}

export function exportPDF(list: Candidate[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.text("Candidates", 14, 14);
  autoTable(doc, {
    startY: 20,
    head: [cols.map(([, l]) => l)],
    body: toRows(list).map((r) => cols.map(([, l]) => r[l])),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [99, 102, 241] },
  });
  doc.save("candidates.pdf");
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
