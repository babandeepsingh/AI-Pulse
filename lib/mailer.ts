import nodemailer from 'nodemailer';

import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, content: string) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
    to,
    subject: 'Daily News Summary',
    html: `<h2>Daily Summary</h2><p>${content}</p>`,
  });
}