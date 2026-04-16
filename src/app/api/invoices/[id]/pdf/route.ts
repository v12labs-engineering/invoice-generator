import { requireMembership } from "@/lib/actions/_shared";
import { buildPdfData, renderInvoicePdf } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let businessId: string;
  try {
    const m = await requireMembership();
    businessId = m.businessId;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const built = await buildPdfData(id, businessId);
  if (!built) return new Response("Not found", { status: 404 });

  const pdf = await renderInvoicePdf(built.data, built.template);
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${built.data.number}.pdf"`,
    },
  });
}
