import { Resend } from "resend";

export async function sendInviteEmail(params: {
  to: string;
  businessName: string;
  inviterEmail: string;
  appUrl: string;
}): Promise<void> {
  const apiKey = process.env.AUTH_RESEND_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    // Silently skip email if not configured — invite still works via auto-accept.
    return;
  }

  const resend = new Resend(apiKey);
  const subject = `You've been invited to ${params.businessName}`;
  const loginUrl = `${params.appUrl}/login`;
  const body = `Hi,

${params.inviterEmail} invited you to join ${params.businessName} on Invoicer.

Sign in with your email (${params.to}) at:
${loginUrl}

You'll be added automatically when you sign in.

— Invoicer`;

  const result = await resend.emails.send({
    from,
    to: params.to,
    subject,
    text: body,
  });
  if (result.error) throw new Error(`Invite email failed: ${result.error.message}`);
}
