import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendMagicLinkEmail(
  email: string,
  playerName: string,
  magicLink: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/auth/magic-link?token=${magicLink}`;

  const htmlContent = `
    <h2>Welcome to The Cup, ${playerName}!</h2>
    <p>Click the link below to sign in to your account:</p>
    <p><a href="${loginUrl}" style="background-color: #1B4D3E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a></p>
    <p>Or copy this link: <code>${loginUrl}</code></p>
    <p>This link expires in 24 hours.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@thecupgolf.com',
    to: email,
    subject: 'Your Magic Link for The Cup Golf Trip',
    html: htmlContent,
  });
}

export async function sendAnnouncementEmail(
  email: string,
  _playerName: string,
  title: string,
  content: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const htmlContent = `
    <h2>${title}</h2>
    <p>${content}</p>
    <p><a href="${appUrl}/announcements">View in The Cup</a></p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@thecupgolf.com',
    to: email,
    subject: `The Cup: ${title}`,
    html: htmlContent,
  });
}
