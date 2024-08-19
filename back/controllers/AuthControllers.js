"use strict";

require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = require('../models/userModel');
const Role = require('../models/roleModel');

const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const logger = require('../helpers/logHelper');
const { logAudit } = require('../helpers/logAuditHelper');
const jwt = require('../helpers/jwtHelper');
const { validateResetPassword, validateLogin } = require('../helpers/validateHelper');
const generateUserName = require('../helpers/userNameGeneratorHelper');
const { checkIfAdminEmail } = require('../helpers/adminHelper');
const { verifyGoogleToken } = require('../helpers/googleAuthHelper');
const { sendActivationEmail, sendPasswordResetEmail, sendConfirmationEmail, sendVerificationEmail, verificationCodeUrl } = require('../helpers/emailServiceHelper');
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS);
const LOCK_TIME = parseInt(process.env.LOCK_TIME);

// Services
const notificationService = require('../services/notificationService');

function validateLoginEnvironment() {
    if (isNaN(MAX_LOGIN_ATTEMPTS) || isNaN(LOCK_TIME)) {
        throw new ErrorHandler(500, 'Environment variables for login not properly configured.');
    }
}

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;
}

function getCleanUser(user) {
    return {
        id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        role: user.role.name,
        imageUrl: user.imageUrl,
    };
}

// LOGIN USERS
const loginUser = async (req, res) => {
    try {
        const ipAddress = getClientIp(req);
        validateLoginEnvironment();
        const { password, userName } = req.body;
        if (!password) {
            logger.error('Login attempt without password');
            throw new ErrorHandler(400, 'Password is required', req.originalUrl, req.method, 'Login attempt without password.');
        }
        const validationResult = validateLogin({ password, userName });
        if (validationResult.error) {
            const errorMessages = validationResult.error.details.map(detail => detail.message).join(', ');
            logger.error(`Login validation failed: ${errorMessages}`);
            throw new ErrorHandler(400, 'Invalid input', req.originalUrl, req.method, errorMessages);
        }
        const user = await User.findOne({
            userName: { $regex: new RegExp('^' + userName + '$', 'i') }
        }).select('+password').populate('role');
        if (!user) {
            logger.warn(`Login attempt for non-existing user: ${userName} from IP: ${ipAddress}`);
            await logAudit(
                'LOGIN_ATTEMPT_NON_EXISTENT_USER',
                userName,
                null,
                'User',
                'Low',
                'Attempt to log in with a non-existent username.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(401, 'Invalid credentials', req.originalUrl, req.method, `Login attempt for non-existing user: ${userName} from IP: ${ipAddress}`);
        }
        if (user.verification === 'notVerified') {
            logger.warn(`Login attempt for not verified account: ${userName} from IP: ${ipAddress}`);
            await logAudit(
                'LOGIN_ATTEMPT_UNVERIFIED_ACCOUNT',
                user._id,
                null,
                'User',
                'Medium',
                'Login attempt for an account that has not been verified.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(403, 'Account not verified. Please check your email for activation link.', req.originalUrl, req.method, `Login attempt for not verified account: ${userName} from IP: ${ipAddress}`);
        }

        if (user.isBlocked) {
            logger.warn(`Login attempt for blocked account: ${userName} from IP: ${ipAddress}`);
            await logAudit(
                'LOGIN_ATTEMPT_BLOCKED_ACCOUNT',
                user._id,
                null,
                'User',
                'High',
                'Login attempt for a temporarily locked account.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(403, 'Account is temporarily locked. Try again later.', req.originalUrl, req.method, `Login attempt for blocked account: ${userName} from IP: ${ipAddress}`);
        }

        const check = await bcrypt.compare(password, user.password);
        if (!check) {
            logger.warn(`Failed login attempt for user: ${userName} from IP: ${ipAddress}`);
            user.loginAttempts += 1;
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS && !user.isBlocked) {
                user.lockUntil = Date.now() + LOCK_TIME;
                logger.info(`User ${userName} locked out due to too many failed attempts`);
            }
            await user.save();
            await logAudit(
                'LOGIN_FAILURE_INCORRECT_PASSWORD',
                user._id,
                null,
                'User',
                'High',
                'Failed login attempt due to incorrect password.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(401, 'Invalid credentials', req.originalUrl, req.method, `Failed login attempt for user: ${userName} from IP: ${ipAddress}`);
        }

        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();
        const cleanUser = getCleanUser(user);
        const token = jwt.createToken({ ...cleanUser, role: user.role.name });

        handleSuccessfulResponse('Login successful', {
            user: cleanUser,
            token: token
        })(req, res);
        // logger.info(`User ${userName} Successful login`, ipAddress);
        await logAudit(
            'LOGIN_SUCCESS',
            user._id,
            user._id,
            'User',
            'Low',
            'User successfully authenticated.',
            ipAddress,
            req.originalUrl
        );
    } catch (error) {
        // logger.error(`Login error for user ${req.body.userName}: ${error.message}`, { stack: error.stack });
        handleErrorResponse(error, req, res);
    }
};

// GOOGLE AUTHENTICATE 
const authenticateWithGoogle = async (req, res) => {
    try {
        const ipAddress = getClientIp(req);
        const { token } = req.body;
        const userInfo = await verifyGoogleToken(token);

        const isAdminEmail = checkIfAdminEmail(userInfo.email);
        const masterAdminRole = await Role.findOne({ name: 'MasterAdministrator' });
        if (!masterAdminRole) {
            throw new ErrorHandler(500, 'MasterAdministrator role not found', req.originalUrl, req.method, 'Web app need a initial setup.');
        }

        const existsMasterAdmin = await User.findOne({ role: masterAdminRole._id });
        const roleName = (isAdminEmail && !existsMasterAdmin) ? 'MasterAdministrator' : 'Registered';
        let role = await Role.findOne({ name: roleName });
        if (!role) {
            logger.error('Role ' + roleName + ' not found.', ipAddress);
            throw new ErrorHandler(500, 'Role not found', req.originalUrl, req.method, 'This role need to be added.');
        }

        let user = await User.findOne({ googleId: userInfo.sub });

        if (!user) {
            user = new User({
                googleId: userInfo.sub,
                emailAddress: userInfo.email,
                firstName: userInfo.given_name || 'notSpecified',
                lastName: userInfo.family_name || 'notSpecified',
                userName: generateUserName(userInfo.email),
                role: role._id,
                authMethod: 'google',
                imageUrl: userInfo.picture,
                emailVerified: userInfo.email_verified,
                locale: userInfo.locale,
                verification: userInfo.email_verified ? 'verified' : 'notVerified',
            });
            await user.save();


            logger.info(`New Google user registered: ${user.userName}`, ipAddress);
            await logAudit(
                'GOOGLE_USER_REGISTRATION',
                user._id,
                user._id,
                'User',
                'Medium',
                'New user registered via Google authentication.',
                ipAddress,
                req.originalUrl
            );
        } else {

            logger.info(`Existing Google user logged in: ${user.userName}`, ipAddress);
            await logAudit(
                'GOOGLE_USER_LOGIN',
                user._id,
                user._id,
                'User',
                'Low',
                'Existing user logged in via Google authentication.',
                ipAddress,
                req.originalUrl
            );
        }

        const userToken = jwt.createToken({
            id: user._id.toString(),
            userName: user.userName,
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            imageUrl: user.imageUrl,
            role: role.name,
        });

        const cleanedUser = getCleanUser(user);
        cleanedUser.role = role.name;

        handleSuccessfulResponse('Login successful', {
            user: cleanedUser,
            token: userToken
        })(req, res);

    } catch (error) {
        // logger.error(`Google authentication error: ${error.message}`, { stack: error.stack });
        handleErrorResponse(error, req, res);
    }
};

// ACTIVATE USER ACCOUNT
const activateUser = async (req, res) => {
    try {
        const { token } = req.params;
        const ipAddress = getClientIp(req);

        const user = await User.findOne({
            configurationToken: token,
            configurationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn(`Activation attempt with invalid or expired token from IP: ${ipAddress}`);
            await logAudit(
                'USER_ACTIVATION_ATTEMPT_FAIL',
                null,
                null,
                'User',
                'Medium',
                'Activation attempt with an invalid or expired token.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Invalid or expired token.', req.originalUrl, req.method, 'Checkout the token.');
        }

        if (user.verification === 'verified') {
            logger.warn(`Redundant activation attempt for already activated user: ${user.userName} from IP: ${ipAddress}`);
            await logAudit(
                'USER_ACTIVATION_REDUNDANT_ATTEMPT',
                user._id,
                user._id,
                'User',
                'Low',
                'Redundant activation attempt for an already activated account.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'This account has already been activated.', req.originalUrl, req.method);
        }

        user.verification = 'verified';
        user.configurationToken = undefined;
        user.configurationTokenExpires = undefined;
        await user.save();

        try {
            const confirmationEmailSent = await sendActivationEmail(user);
            handleSuccessfulResponse('Account successfully activated', { confirmationEmailSent })(req, res);
            logger.info(`User account activated: ${user.userName} from IP: ${ipAddress}`);

            await logAudit(
                'USER_ACCOUNT_ACTIVATION_SUCCESS',
                user._id,
                user._id,
                'User',
                'Medium',
                'User account successfully activated.',
                ipAddress,
                req.originalUrl
            );
        } catch (mailError) {
            logger.error('Error sending confirmation email:', mailError);
            throw new ErrorHandler(500, 'Account activated, but error sending confirmation email.', req.originalUrl, req.method, mailError.message);
        }

    } catch (error) {
        // logger.error('activateUser error:', error);
        handleErrorResponse(error, req, res);
    }
};

// RESEND VERIFICATION EMAIL
const resendVerificationEmail = async (req, res) => {
    try {
        const { emailAddress } = req.body;
        if (!emailAddress) {
            throw new ErrorHandler(400, 'Email address is required.', req.originalUrl, req.method);
        }
        const user = await User.findOne({ emailAddress, role: 'MasterAdministrator' });
        if (!user) {
            throw new ErrorHandler(404, 'User not found.', req.originalUrl, req.method);
        }
        if (user.verification === 'verified') {
            throw new ErrorHandler(400, 'This account has already been verified.', req.originalUrl, req.method);
        }

        const token = user.generateConfigurationToken();
        await user.save();
        await logAudit(
            'VERIFICATION_EMAIL_RESENT',
            user._id,
            user._id,
            'User',
            'Low',
            'Verification email resent to an unverified user.',
            req.ip,
            req.originalUrl
        );
        const mailSent = await sendVerificationEmail(user, token);
        if (!mailSent) {
            await logAudit(
                'VERIFICATION_EMAIL_SEND_FAIL',
                user._id,
                user._id,
                'User',
                'High',
                'Failed to send verification email due to system error.',
                req.ip,
                req.originalUrl
            );
            throw new ErrorHandler(500, 'Error sending verification email.', req.originalUrl, req.method);
        }
        handleSuccessfulResponse('Verification email resent successfully to ', user.emailAddress)(req, res);
    } catch (error) {
        logger.error('resendVerificationEmail error:', error);
        handleErrorResponse(error, req, res);
    }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
    const ipAddress = getClientIp(req);
    try {
        const { emailAddress } = req.body;
        if (!emailAddress) {
            logger.warn(`Forgot password attempt without email address from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_RESET_ATTEMPT_NO_EMAIL',
                null,
                null,
                'User',
                'Medium',
                'Attempt to reset password without providing an email address.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Email address is required.', req.originalUrl, req.method);
        }
        const user = await User.findOne({ emailAddress });
        if (!user) {
            logger.info(`Forgot password attempt for non-existing email: ${emailAddress} from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_RESET_NO_USER',
                null,
                null,
                'User',
                'Low',
                'Attempt to reset password for a non-existing email address.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(200, 'If the email exists in our system, a password reset email will be sent.', req.originalUrl, req.method);
        }
        if (user.isBlocked) {
            logger.warn(`Attempted reset from blocked account: ${emailAddress}`);
            await logAudit(
                'PASSWORD_RESET_BLOCKED_USER',
                user._id,
                user._id,
                'User',
                'High',
                'Password reset attempt from a blocked account.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(403, 'Account blocked. Operation not allowed.', req.originalUrl, req.method);
        }
        if (user.authMethod !== 'local') {
            logger.warn(`Reset attempt with non-local authentication method: ${emailAddress}`);
            await logAudit(
                'PASSWORD_RESET_NON_LOCAL_AUTH_METHOD',
                user._id,
                user._id,
                'User',
                'Medium',
                'Password reset attempt using a non-local authentication method.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(403, 'Non-local authentication. Operation not allowed.', req.originalUrl, req.method);
        }
        const resetToken = user.generatePasswordResetToken();
        console.log("Token antes de hashear:", resetToken);
        const verificationCode = user.generateVerificationCode();

        const resetUrl = verificationCodeUrl(resetToken);
        const tokenExpiration = user.resetPasswordExpires - Date.now();
        await user.save();

        await sendPasswordResetEmail(user.emailAddress, resetUrl, verificationCode, tokenExpiration);
        await logAudit(
            'PASSWORD_RESET_EMAIL_SENT',
            user._id,
            user._id,
            'User',
            'Medium',
            'Password reset email sent successfully.',
            ipAddress,
            req.originalUrl
        );
        handleSuccessfulResponse('If the email exists in our system, a password reset email will be sent.', {})(req, res);

    } catch (error) {
        // logger.error(`Forgot password error: ${error.message} from IP: ${getClientIp(req)}`, { stack: error.stack });
        await logAudit(
            'PASSWORD_RESET_PROCESS_ERROR',
            null,
            null,
            'User',
            'High',
            `Server error during password reset process: ${error.message}`,
            ipAddress,
            req.originalUrl
        );
        handleErrorResponse(error, req, res);
    }
};

// VERIFY VERIFICATION CODE
const verificationCode = async (req, res) => {
    const ipAddress = getClientIp(req);
    try {
        const { token } = req.params;  // El token ahora se recibe desde la URL
        const { verificationCode } = req.body;

        if (!token || !verificationCode) {
            logger.warn(`Verification attempt without token or code from IP: ${ipAddress}`);
            await logAudit(
                'VERIFICATION_ATTEMPT_MISSING_DETAILS',
                null,
                null,
                'User',
                'Medium',
                'Verification attempt failed due to missing token or verification code.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Token and verification code are required.', req.originalUrl, req.method);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            verificationCode,
            verificationCodeExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn(`Invalid or expired token or code used from IP: ${ipAddress}`);
            await logAudit(
                'VERIFICATION_ATTEMPT_INVALID_DETAILS',
                null,
                null,
                'User',
                'High',
                'Verification attempt failed due to invalid or expired token or verification code.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Invalid or expired token or verification code.', req.originalUrl, req.method);
        }

        const newResetToken = user.generatePasswordResetToken();
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        await user.save();

        await logAudit(
            'VERIFICATION_CODE_VALIDATED',
            user._id,
            user._id,
            'User',
            'Low',
            'Verification code validated successfully, user can now reset password.',
            ipAddress,
            req.originalUrl
        );

        handleSuccessfulResponse('Verification code is valid. Change to a new password.', { resetToken: newResetToken })(req, res);
    } catch (error) {
        // logger.error(`Verify verification code error: ${error.message}`, { stack: error.stack });
        await logAudit(
            'VERIFICATION_CODE_PROCESSING_ERROR',
            null,
            null,
            'User',
            'High',
            `Error processing verification code: ${error.message}`,
            ipAddress,
            req.originalUrl
        );
        handleErrorResponse(error, req, res);
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    const ipAddress = getClientIp(req);
    try {
        const { newPassword } = req.body;
        const { token } = req.params;  // Ahora obtenemos el token desde los parámetros de la URL

        // Validar que el token y la nueva contraseña estén presentes
        const { error } = validateResetPassword({ token, newPassword });
        if (error) {
            logger.warn(`Reset password validation failed from IP: ${ipAddress}`, { error });
            await logAudit(
                'PASSWORD_RESET_VALIDATION_FAIL',
                null,
                null,
                'User',
                'Medium',
                'Password reset validation failed due to incorrect input.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, error.details.map(detail => detail.message).join(', '), req.originalUrl, req.method);
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            logger.warn(`Invalid or expired password reset token used from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_RESET_INVALID_OR_EXPIRED_TOKEN',
                null,
                null,
                'User',
                'High',
                'Password reset attempt with an invalid or expired token.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Invalid or expired password reset token.', req.originalUrl, req.method);
        }

        let isOldPassword = false;
        for (const p of user.passwordHistory) {
            if (await bcrypt.compare(newPassword, p.password)) {
                isOldPassword = true;
                break;
            }
        }

        if (isOldPassword) {
            logger.warn(`Attempt to reuse old password by user: ${user.userName} from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_RESET_REUSE_OLD_PASSWORD',
                user._id,
                user._id,
                'User',
                'High',
                'User attempted to reuse an old password.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'The new password cannot be the same as any of your previous passwords.', req.originalUrl, req.method);
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        if (user.password) {
            user.passwordHistory.unshift({ password: user.password });
            if (user.passwordHistory.length > 5) {
                user.passwordHistory.pop();
            }
        }

        // Guardar el usuario con la nueva contraseña
        await user.save();

        // Si el usuario aún no está verificado, generar un token de activación y enviar el correo
        if (user.verification !== 'verified') {
            const activationToken = user.generateConfigurationToken();  // Usar el método que ya tienes para generar el token
            await user.save();  // Guardar el token en el usuario

            // Enviar el correo de activación
            await sendVerificationEmail(user, activationToken);
        } else {
            // Enviar correo de confirmación de cambio de contraseña
            await sendConfirmationEmail(user.emailAddress);
        }

        const path = req.originalUrl || req.url || 'undefined_path';
        await logAudit(
            'PASSWORD_RESET_COMPLETED',
            user._id,
            user._id,
            'User',
            'High',
            'Password has been reset successfully.',
            ipAddress,
            path  // Usa una ruta por defecto si req.originalUrl no está disponible
        );

        // Crear una notificación para el usuario sobre el cambio de contraseña
        await notificationService.createNotification({
            userId: user._id,
            icon: 'key',  // Puedes usar un icono alusivo al cambio de contraseña
            message: 'Your password has been successfully changed.',
            type: 'info'
        });

        handleSuccessfulResponse('Your password has been updated successfully.', {})(req, res);

    } catch (error) {
        await logAudit(
            'PASSWORD_RESET_PROCESS_ERROR',
            null,
            null,
            'User',
            'High',
            `Error during the password reset process: ${error.message}`,
            ipAddress,
            req.originalUrl
        );
        handleErrorResponse(error, req, res);
    }
};


// CHANGE PASSWORD (FOR LOGGED-IN USERS)
const changePassword = async (req, res) => {
    const ipAddress = getClientIp(req);
    try {
        const userId = req.user.sub;  // Acceder al 'sub' del payload que contiene el 'userId'
        console.log("🚀 ~ changePassword ~ userId:", userId)
        const { currentPassword, newPassword } = req.body;

        // Validar que los campos necesarios estén presentes
        if (!currentPassword || !newPassword) {
            logger.warn(`Change password attempt with missing fields from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_CHANGE_ATTEMPT_MISSING_FIELDS',
                userId,
                userId,
                'User',
                'Medium',
                'Password change attempt failed due to missing fields.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Current password and new password are required.', req.originalUrl, req.method);
        }

        // Buscar al usuario por ID
        const user = await User.findById(userId).select('+password');
        if (!user) {
            logger.warn(`Change password attempt for non-existing user ID: ${userId} from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_CHANGE_ATTEMPT_NON_EXISTING_USER',
                userId,
                null,
                'User',
                'High',
                'Password change attempt for a non-existing user.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(404, 'User not found.', req.originalUrl, req.method);
        }

        // Verificar la contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            logger.warn(`Incorrect current password attempt by user: ${user.userName} from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_CHANGE_ATTEMPT_INCORRECT_CURRENT_PASSWORD',
                userId,
                userId,
                'User',
                'High',
                'User provided an incorrect current password.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'Current password is incorrect.', req.originalUrl, req.method);
        }

        // Verificar que la nueva contraseña no coincida con las contraseñas anteriores
        let isOldPassword = false;
        for (const p of user.passwordHistory) {
            if (await bcrypt.compare(newPassword, p.password)) {
                isOldPassword = true;
                break;
            }
        }

        if (isOldPassword) {
            logger.warn(`Attempt to reuse old password by user: ${user.userName} from IP: ${ipAddress}`);
            await logAudit(
                'PASSWORD_CHANGE_REUSE_OLD_PASSWORD',
                userId,
                userId,
                'User',
                'High',
                'User attempted to reuse an old password.',
                ipAddress,
                req.originalUrl
            );
            throw new ErrorHandler(400, 'The new password cannot be the same as any of your previous passwords.', req.originalUrl, req.method);
        }

        // Actualizar la contraseña
        user.password = newPassword;
        user.passwordHistory.unshift({ password: user.password });
        if (user.passwordHistory.length > 5) {
            user.passwordHistory.pop();
        }

        await user.save();

        // Registrar la acción en el log de auditoría
        await logAudit(
            'PASSWORD_CHANGE_SUCCESS',
            userId,
            userId,
            'User',
            'Medium',
            'User successfully changed their password.',
            ipAddress,
            req.originalUrl
        );

        // Enviar correo electrónico de confirmación de cambio de contraseña
        await sendConfirmationEmail(user.emailAddress);

        // Crear una notificación para el usuario
        await notificationService.createNotification({
            userId: user._id,
            icon: 'key',  // Puedes usar un icono alusivo al cambio de contraseña
            message: 'Your password has been successfully changed.',
            type: 'info'
        });

        // Responder con éxito
        handleSuccessfulResponse('Your password has been changed successfully.', {})(req, res);

    } catch (error) {
        // Manejar errores
        await logAudit(
            'PASSWORD_CHANGE_PROCESS_ERROR',
            null,
            null,
            'User',
            'High',
            `Error during the password change process: ${error.message}`,
            ipAddress,
            req.originalUrl
        );
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    loginUser,
    forgotPassword,
    resetPassword,
    authenticateWithGoogle,
    activateUser,
    resendVerificationEmail,
    verificationCode,
    changePassword
};
