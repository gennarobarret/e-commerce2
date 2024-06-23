// mailConfig.js
"use strict";
require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10), // Puerto SMTP
    secure: false, // No usar SSL/TLS (false para puertos diferentes a 465)
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
})

module.exports = transporter;
