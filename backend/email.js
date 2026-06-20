const nodemailer = require('nodemailer');
require('dotenv').config();

// Send email using Brevo REST API (highly recommended, no SMTP overhead)
async function sendViaBrevo({ to, subject, html }) {
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) {
    throw new Error('Brevo API key is not configured in environment variables.');
  }
  const fromEmail = process.env.EMAIL_FROM || 'shortit.team@gmail.com';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: {
        name: 'Short-It Team',
        email: fromEmail
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Brevo REST API error (status ${response.status}): ${errText}`);
  }

  const resData = await response.json();
  return { success: true, messageId: resData.messageId };
}

// Send email using Gmail SMTP via Nodemailer
async function sendViaGmail({ to, subject, html }) {
  const gmailUser = process.env.GMAIL_USER || 'shortit.team@gmail.com';
  const gmailPass = process.env.GMAIL_PASS || 'eymz ghqb tovy mfbd';
  const fromEmail = process.env.EMAIL_FROM || 'shortit.team@gmail.com';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass
    }
  });

  const info = await transporter.sendMail({
    from: `"Short-It Team" <${fromEmail}>`,
    to,
    subject,
    html
  });

  return { success: true, messageId: info.messageId };
}

// Send email using Ethereal Test SMTP (development placeholder fallback)
async function sendViaEthereal({ to, subject, html }) {
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  const fromEmail = process.env.EMAIL_FROM || 'shortit.team@gmail.com';

  const info = await transporter.sendMail({
    from: `"Short-It Notifications" <${fromEmail}>`,
    to,
    subject,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  return { success: true, messageId: info.messageId, previewUrl };
}

// Entrypoint for sending email
async function sendMail({ to, subject, html }) {
  // 1. Try Brevo REST API
  try {
    console.log(`Email Service: Attempting to send via Brevo to ${to}...`);
    const res = await sendViaBrevo({ to, subject, html });
    console.log(`✓ Email sent via Brevo. Message ID: ${res.messageId}`);
    return res;
  } catch (err) {
    console.warn(`⚠ Brevo API send failed, trying Gmail fallback. Error:`, err.message);
  }

  // 2. Try Gmail SMTP
  try {
    console.log(`Email Service: Attempting to send via Gmail SMTP to ${to}...`);
    const res = await sendViaGmail({ to, subject, html });
    console.log(`✓ Email sent via Gmail SMTP. Message ID: ${res.messageId}`);
    return res;
  } catch (err) {
    console.warn(`⚠ Gmail SMTP send failed, trying Ethereal fallback. Error:`, err.message);
  }

  // 3. Try Ethereal SMTP fallback
  try {
    console.log(`Email Service: Attempting to send via Ethereal SMTP to ${to}...`);
    const res = await sendViaEthereal({ to, subject, html });
    if (res.previewUrl) {
      console.log(`✓ Email sent via Ethereal. Preview URL: ${res.previewUrl}`);
    } else {
      console.log(`✓ Email sent via Ethereal. Message ID: ${res.messageId}`);
    }
    return res;
  } catch (err) {
    console.error(`✕ Email Service: All send methods failed. Logging email to console.`);
    console.log('\n=================== MOCK EMAIL SENT ===================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-------------------- HTML Content --------------------');
    console.log(html);
    console.log('=======================================================\n');
    return { success: true, messageId: 'console-mock-' + Date.now() };
  }
}

module.exports = { sendMail };
