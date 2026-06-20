const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

async function initEmail() {
  if (transporter) return transporter;

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtp) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Email Transporter: Configured using custom SMTP.');
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Email Transporter: Created Ethereal SMTP test account (${testAccount.user}).`);
      console.log('Test emails can be previewed at ethereal.email');
    } catch (err) {
      console.warn('Failed to create Ethereal SMTP account. Falling back to console-only logging for emails:', err.message);
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n=================== MOCK EMAIL SENT ===================');
          console.log(`From:    ${mailOptions.from}`);
          console.log(`To:      ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log('-------------------- HTML Content --------------------');
          console.log(mailOptions.html);
          console.log('=======================================================\n');
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  try {
    const client = await initEmail();
    const info = await client.sendMail({
      from: `"Short-It Notifications" <no-reply@shortit.com>`,
      to,
      subject,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email sent! Subject: "${subject}". Preview URL: ${previewUrl}`);
    } else {
      console.log(`Email sent! Subject: "${subject}". Message ID: ${info.messageId || 'N/A'}`);
    }
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendMail };
