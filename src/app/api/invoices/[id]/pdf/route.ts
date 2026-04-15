import { auth } from "@/lib/auth";
import { buildPdfData, renderInvoicePdf } from "@/lib/pdf/render";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const data = await buildPdfData(id, session.user.id);
  if (!data) return new Response("Not found", { status: 404 });

  const pdf = await renderInvoicePdf(data);
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.number}.pdf"`,
    },
  });
}
