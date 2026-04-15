import { Resend } from "resend";

export type SendInvoiceEmailParams = {
  to: string;
  subject: string;
  body: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
  from?: string;
};

export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = params.from ?? process.env.RESEND_FROM;
  if (!apiKey) throw new Error("AUTH_RESEND_KEY is not configured");
  if (!from) throw new Error("RESEND_FROM is not configured");

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.body,
    attachments: [{ filename: params.pdfFilename, content: params.pdfBuffer }],
  });
  if (result.error) throw new Error(`Email send failed: ${result.error.message}`);
}
