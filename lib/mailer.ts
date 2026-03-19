import { Resend } from 'resend';
import { NewsDigest } from './openai';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, digest: NewsDigest) {
  const { data, error } = await resend.emails.send({
    from: 'AI News <noreply@mail.babandeep.in>',
    to: [to],
    subject: digest.subject,
    html: digest.htmlBody,
    text: digest.plainText,   // plain-text fallback for clients that don't render HTML
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}