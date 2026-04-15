"use client";

import dynamic from "next/dynamic";
import { renderTemplate, type InvoicePdfData } from "@/lib/pdf/templates";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[720px] items-center justify-center bg-muted/30 text-sm text-muted-foreground">
        Loading preview…
      </div>
    ),
  },
);

type TemplateId = "CLASSIC" | "MODERN" | "MINIMAL";

export function InvoicePreview({
  data,
  template,
}: {
  data: InvoicePdfData;
  template: TemplateId;
}) {
  return (
    <PDFViewer
      showToolbar={false}
      style={{ width: "100%", height: 720, border: "none" }}
    >
      {renderTemplate(template, data)}
    </PDFViewer>
  );
}
