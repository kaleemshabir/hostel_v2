const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service:'gmail',

    
    // host: process.env.MAIL_HOST,
    secure: false, // use SSL
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const message = {
    from: `${process.env.MAIL_USER} <${process.env.MAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;