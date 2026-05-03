const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"Electrofied" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your Electrofied Account',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: `"Electrofied" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
