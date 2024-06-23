// En usernameGenerator.js
function generateUserName(email) {
    return email.split('@')[0];
}

module.exports = generateUserName;
