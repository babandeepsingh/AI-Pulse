import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, content: string) {
  const { data, error } = await resend.emails.send({
    from: "News AI <noreply@mail.babandeep.in>",
    to: [to],
    subject: `Daily News Summary`,
    html: `
        <h2>Daily Summary</h2>
        <p>${content}</p>
      `
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }
}
