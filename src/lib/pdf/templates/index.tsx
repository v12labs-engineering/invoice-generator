import type { InvoiceTemplate } from "@prisma/client";
import type { InvoicePdfData } from "./shared";
import { ClassicTemplate } from "./classic";
import { ModernTemplate } from "./modern";
import { MinimalTemplate } from "./minimal";

export { type InvoicePdfData } from "./shared";

export const TEMPLATE_OPTIONS: {
  id: InvoiceTemplate;
  name: string;
  description: string;
}[] = [
  { id: "CLASSIC", name: "Classic", description: "Timeless, structured, bordered table." },
  { id: "MODERN", name: "Modern", description: "Bold header bar, brand gradient, mono type." },
  { id: "MINIMAL", name: "Minimal", description: "Heavy whitespace, tiny labels, large number." },
];

export function renderTemplate(template: InvoiceTemplate, data: InvoicePdfData) {
  switch (template) {
    case "MODERN":
      return <ModernTemplate data={data} />;
    case "MINIMAL":
      return <MinimalTemplate data={data} />;
    case "CLASSIC":
    default:
      return <ClassicTemplate data={data} />;
  }
}
