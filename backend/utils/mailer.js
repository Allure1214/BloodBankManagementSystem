const { Resend } = require('resend');

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error('Missing RESEND_API_KEY environment variable');
    error.code = 'EMAIL_CONFIG_MISSING';
    throw error;
  }
  return new Resend(apiKey);
};

/**
 * Send password reset OTP email via Resend HTTPS API (port 443).
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
const sendResetOtpEmail = async (toEmail, otp) => {
  const resend = getResendClient();

  const { data, error } = await resend.emails.send({
    from: 'LifeLink Blood Bank <onboarding@resend.dev>',
    to: [toEmail],
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

  if (error) {
    const resendError = new Error(`Resend API failed: ${error.message}`);
    resendError.code = error.name || 'RESEND_API_ERROR';
    throw resendError;
  }

  return data;
};

module.exports = { sendResetOtpEmail };
