import { Resend } from 'resend';
import { NewsDigest } from './openai';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, content: NewsDigest | string) {
  const isDigest = typeof content === 'object';
  const { data, error } = await resend.emails.send({
    from: 'AI News <noreply@mail.babandeep.in>',
    to: [to],
    subject: isDigest ? content.subject : 'AI News Notification',
    html: isDigest ? content.htmlBody : undefined,
    text: isDigest ? content.plainText : content,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;

  return data;
}