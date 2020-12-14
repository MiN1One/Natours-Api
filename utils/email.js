const nodemailer = require('nodemailer');

const sendMail = async (options) => {
    // 1. Create transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        // Activate in gmail "less secure app option"
    });

    // 2. Define the email options
    const mailOptions = {
        from: 'MiN1One <min1one@mini.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: 
    };

    // 3. Send the email 
    await transporter.sendMail(mailOptions);
};

module.exports = sendMail;