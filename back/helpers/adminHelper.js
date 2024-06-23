// adminHelper.js

require('dotenv').config();

function checkIfAdminEmail(email) {
    const adminEmails = process.env.ADMIN_EMAILS.split(',');
    return adminEmails.includes(email);
}

module.exports = {
    checkIfAdminEmail,
};
