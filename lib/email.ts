import nodemailer from 'nodemailer';
import { theme } from '@/lib/theme';

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

  // Dev fallback: if SMTP isn't configured, print the link to the server console
  // instead of attempting to send (which would fail silently).
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔗 Magic link for ${playerName} <${email}>:`);
    console.log(loginUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  const htmlContent = `
    <h2>Welcome to the ${theme.title}, ${playerName}!</h2>
    <p>Click the link below to sign in to your account:</p>
    <p><a href="${loginUrl}" style="background-color: ${theme.themeColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 600;">Sign In</a></p>
    <p>Or copy this link: <code>${loginUrl}</code></p>
    <p>This link expires in 24 hours.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@thecupgolf.com',
    to: email,
    subject: `Your magic link for the ${theme.title}`,
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
    <p><a href="${appUrl}/announcements">View in the ${theme.title}</a></p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@thecupgolf.com',
    to: email,
    subject: `${theme.name}: ${title}`,
    html: htmlContent,
  });
}
