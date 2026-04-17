"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { importExpenses } from "@/lib/actions/bulk-import";

type ColumnKey = "date" | "description" | "amount" | "reference";

const COLUMN_LABELS: Record<ColumnKey, string> = {
  date: "Date",
  description: "Description",
  amount: "Amount",
  reference: "Reference",
};

const DETECT_PATTERNS: Record<ColumnKey, RegExp> = {
  date: /^(date|transaction.?date|txn.?date|posted)$/i,
  description: /^(description|desc|narration|particulars|memo|details|name)$/i,
  amount: /^(amount|debit|credit|sum|total|value)$/i,
  reference: /^(reference|ref|txn.?id|transaction.?id|utr|check.?no)$/i,
};

function detectMapping(headers: string[]): Record<ColumnKey, number> {
  const mapping: Record<ColumnKey, number> = { date: -1, description: -1, amount: -1, reference: -1 };
  for (const key of Object.keys(DETECT_PATTERNS) as ColumnKey[]) {
    const idx = headers.findIndex((h) => DETECT_PATTERNS[key].test(h.trim()));
    if (idx !== -1) mapping[key] = idx;
  }
  return mapping;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
  );
  return { headers, rows };
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CsvImport() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ColumnKey, number>>({
    date: -1,
    description: -1,
    amount: -1,
    reference: -1,
  });

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setMapping(detectMapping(h));
    };
    reader.readAsText(file);
  }

  function onMappingChange(key: ColumnKey, value: string) {
    setMapping((prev) => ({ ...prev, [key]: parseInt(value, 10) }));
  }

  function onImport() {
    if (mapping.date === -1 || mapping.description === -1 || mapping.amount === -1) {
      toast.error("Map Date, Description, and Amount columns before importing.");
      return;
    }

    const importRows = rows
      .filter((row) => row.some((cell) => cell.trim() !== ""))
      .map((row) => ({
        date: row[mapping.date] ?? "",
        description: row[mapping.description] ?? "",
        amount: row[mapping.amount] ?? "",
        reference: mapping.reference >= 0 ? row[mapping.reference] : undefined,
      }));

    startTransition(async () => {
      const res = await importExpenses(importRows, fileName ?? "import.csv");
      if (res.ok) {
        toast.success(
          `Imported ${res.data.imported} row${res.data.imported === 1 ? "" : "s"}` +
            (res.data.skipped > 0 ? `, skipped ${res.data.skipped}` : ""),
        );
        router.push("/expenses");
      } else {
        toast.error(res.error);
      }
    });
  }

  const previewRows = rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="csv-file" className="mb-2 block">
          CSV file
        </Label>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-input px-4 py-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFileChange}
          />
          <Upload className="size-5 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {fileName ? (
              <span className="font-medium text-foreground">{fileName}</span>
            ) : (
              <>
                Click to select a <span className="font-medium text-foreground">.csv</span> file
              </>
            )}
          </p>
        </div>
      </div>

      {headers.length > 0 && (
        <>
          <div>
            <h3 className="mb-3 text-sm font-medium">Column mapping</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`map-${key}`}>
                    {COLUMN_LABELS[key]}
                    {key !== "reference" && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </Label>
                  <select
                    id={`map-${key}`}
                    value={mapping[key]}
                    onChange={(e) => onMappingChange(key, e.target.value)}
                    className={selectClass}
                  >
                    <option value={-1}>— not mapped —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {previewRows.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium">
                Preview ({previewRows.length} of {rows.length} rows)
              </h3>
              <div className="overflow-x-auto rounded-lg border text-sm">
                <table className="w-full">
                  <thead className="bg-muted/40">
                    <tr>
                      {(["date", "description", "amount", "reference"] as ColumnKey[]).map((k) => (
                        <th
                          key={k}
                          className="px-3 py-2 text-left font-medium text-muted-foreground"
                        >
                          {COLUMN_LABELS[k]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">
                          {mapping.date >= 0 ? row[mapping.date] : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {mapping.description >= 0 ? row[mapping.description] : "—"}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {mapping.amount >= 0 ? row[mapping.amount] : "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {mapping.reference >= 0 ? row[mapping.reference] : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={onImport} disabled={pending}>
            {pending ? "Importing…" : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}
          </Button>
        </>
      )}
    </div>
  );
}
