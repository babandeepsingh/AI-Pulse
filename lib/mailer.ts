import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail(to: string, content: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Daily News Summary',
    html: `<h2>Daily Summary</h2><p>${content}</p>`,
  });
}
