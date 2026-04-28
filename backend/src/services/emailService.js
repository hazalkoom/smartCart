const { Resend } = require('resend');

// Initialize Resend with the API key we will put in .env
const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendVerificationEmail(email, token) {
    // This URL must match your Angular frontend route
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    try {
      const data = await resend.emails.send({
        from: 'SmartCart <onboarding@resend.dev>', // Keep this as onboarding@resend.dev for testing!
        to: email,
        subject: 'Verify your SmartCart account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Welcome to SmartCart!</h1>
            <p>Please verify your email address to unlock all features by clicking the link below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <p style="color: #999; font-size: 12px;">If you did not create an account, please ignore this email.</p>
          </div>
        `,
      });
      return data;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Email sending failed');
    }
  }

  async sendPasswordResetEmail(email, resetUrl) {
    try {
      const data = await resend.emails.send({
        from: 'SmartCart <onboarding@resend.dev>', // Keep this as onboarding@resend.dev for testing!
        to: email,
        subject: 'SmartCart Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>You requested to reset your password. Click the link below to set a new one:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
      });
      return data;
    } catch (error) {
      console.error('Failed to send reset email:', error);
      throw new Error('Email sending failed');
    }
  }
}

module.exports = new EmailService();