const express = require('express');
const AuthController = require('../controllers/AuthControllers');
const {
    activationLimiter,
    resendEmailLimiter,
    googleAuthLimiter,
    loginLimiter,
    forgotPasswordLimiter,
    verifyCodeLimiter,
    resetPasswordLimiter,
    changePasswordLimiter // Importar el limitador para cambio de contraseña
} = require('../middlewares/rateLimit');
const api = express.Router();
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

// Ruta para cambiar la contraseña desde la cuenta autenticada con limitador
api.post('/change-password', [auth.auth, rbac('update', 'user'), changePasswordLimiter], AuthController.changePassword);
api.post('/auth/google', googleAuthLimiter, AuthController.authenticateWithGoogle); // Autenticación con Google con limitador
api.get('/activation/:token', activationLimiter, AuthController.activateUser); // Activación de cuenta con limitador
api.post('/resendVerificationEmail', resendEmailLimiter, AuthController.resendVerificationEmail); // Reenviar email de verificación con limitador
api.post('/loginUser', loginLimiter, AuthController.loginUser); // Inicio de sesión con limitador
api.post('/forgotPassword', forgotPasswordLimiter, AuthController.forgotPassword); // Olvido de contraseña con limitador
api.post('/verification-code/:token', verifyCodeLimiter, AuthController.verificationCode); // Verificación de código con limitador
api.post('/resetPassword/:token', resetPasswordLimiter, AuthController.resetPassword); // Restablecimiento de contraseña con limitador

module.exports = api;
