const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const port = parseInt(process.env.MAIL_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // Define email options
  const message = {
    from: `${process.env.MAIL_FROM_NAME || process.env.APP_NAME || 'GoalOS'} <${process.env.MAIL_FROM_ADDRESS}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  // Send email
  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
  return info;
};

module.exports = sendEmail;
