const nodemailer = require("nodemailer");
require('dotenv').config()

module.exports = {
  doEmail: (mail,subject, content) => {
    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const options = {
      from: process.env.NODEMAILER_USER,
      to: mail,
      subject: subject,
      text: content,
    };

    transporter.sendMail(options, function (err, info) {
      if (err) {
        console.log(err);
        return;
      }
      console.log("Sent :" + info.response);
    });
  },
};