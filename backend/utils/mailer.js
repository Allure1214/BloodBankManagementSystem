const nodemailer = require('nodemailer');

const createTransporter = () => {
  const EMAIL_USER = process.env.EMAIL_USER?.trim();
  // Gmail displays app passwords in groups; SMTP expects the 16 characters without spaces.
  const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s/g, '');
  if (!EMAIL_USER || !EMAIL_PASS) {
    const missing = [!EMAIL_USER && 'EMAIL_USER', !EMAIL_PASS && 'EMAIL_PASS'].filter(Boolean);
    const error = new Error(`Missing SMTP environment variable(s): ${missing.join(', ')}`);
    error.code = 'SMTP_CONFIG_MISSING';
    throw error;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
  });
};

/** Send a password reset OTP email. */
const sendResetOtpEmail = async (toEmail, otp) => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const info = await createTransporter().sendMail({
    from: `"LifeLink Blood Bank" <${emailUser}>`,
    to: toEmail,
    subject: 'LifeLink - Password Reset Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #e53e3e; text-align: center;">LifeLink Blood Bank</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Use the verification code below to complete the reset process:</p>
        <div style="background-color: #f7fafc; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2d3748;">${otp}</span>
        </div>
        <p style="color: #718096; font-size: 14px;">This OTP code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">This is an automated message, please do not reply.</p>
      </div>
    `
  });

  return info;
};

module.exports = { sendResetOtpEmail };
