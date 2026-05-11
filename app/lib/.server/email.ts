import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@veyra.app';
  const transport = createTransport();

  if (!transport) {
    console.warn(
      `[Veyra Email] SMTP not configured — email not sent.\n  To: ${to}\n  Subject: ${subject}\n  Configure SMTP_HOST, SMTP_USER, SMTP_PASS env vars to enable email.`,
    );
    return;
  }

  await transport.sendMail({ from, to, subject, html, text: text ?? subject });
}

export function passwordResetEmailHtml(resetUrl: string, userName: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your Veyra password</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#0f0f12;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:40px 36px;" cellpadding="0" cellspacing="0">
        <tr><td>
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(124,58,237,0.15);border-radius:12px;border:1px solid rgba(124,58,237,0.3);margin-bottom:16px;">
              <span style="font-size:24px;">V</span>
            </div>
            <h1 style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0;">Reset your password</h1>
            <p style="color:#64748b;font-size:14px;margin:8px 0 0;">Hi ${userName}, we received a request to reset your Veyra password.</p>
          </div>

          <a href="${resetUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-size:15px;font-weight:700;padding:14px 24px;border-radius:12px;text-decoration:none;margin-bottom:24px;">
            Reset password
          </a>

          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 8px;">
            This link expires in <strong style="color:#94a3b8;">1 hour</strong>. If you didn't request this, you can safely ignore it.
          </p>
          <p style="color:#475569;font-size:12px;text-align:center;word-break:break-all;margin:0;">
            Or copy this URL: ${resetUrl}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}
