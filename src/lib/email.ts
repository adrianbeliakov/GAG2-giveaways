import nodemailer from "nodemailer";

/**
 * Sends email through SMTP when configured. In development without SMTP the
 * message (including the action link) is printed to the server console so the
 * full flow can be tested locally.
 */
async function sendMail(to: string, subject: string, text: string, html: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM } = process.env;

  if (!SMTP_HOST) {
    console.log("\n=== EMAIL (SMTP not configured – dev fallback) ===");
    console.log(`To: ${to}\nSubject: ${subject}\n\n${text}\n==============================\n`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });

  await transport.sendMail({
    from: EMAIL_FROM ?? "GAG2 Giveaways <no-reply@localhost>",
    to,
    subject,
    text,
    html,
  });
}

function wrap(title: string, body: string, url: string, cta: string) {
  return `
  <div style="background:#0C1210;padding:32px;font-family:Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#151F1A;border:1px solid #25332C;border-radius:16px;padding:32px;color:#EAF2ED">
      <h1 style="margin:0 0 12px;font-size:20px;color:#6EE7A0">GAG2 Giveaways</h1>
      <h2 style="margin:0 0 16px;font-size:16px">${title}</h2>
      <p style="margin:0 0 24px;color:#93A69B;font-size:14px;line-height:1.6">${body}</p>
      <a href="${url}" style="display:inline-block;background:#6EE7A0;color:#0C1210;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${cta}</a>
      <p style="margin:24px 0 0;color:#93A69B;font-size:12px">If the button doesn't work, copy this link:<br>${url}</p>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, url: string) {
  await sendMail(
    to,
    "Verify your email – GAG2 Giveaways",
    `Welcome to GAG2 Giveaways! Verify your email to start entering giveaways:\n\n${url}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    wrap(
      "Verify your email",
      "Welcome! Confirm your email address to start entering giveaways. This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
      url,
      "Verify email"
    )
  );
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await sendMail(
    to,
    "Reset your password – GAG2 Giveaways",
    `Someone requested a password reset for your account. If this was you, open:\n\n${url}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    wrap(
      "Reset your password",
      "Someone requested a password reset for your account. If this was you, use the button below. This link expires in 1 hour. Otherwise you can safely ignore this email.",
      url,
      "Reset password"
    )
  );
}
