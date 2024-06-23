// middlewares/rateLimit.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // límite de 5 solicitudes por ventana
    message: 'Demasiados intentos de inicio de sesión desde esta IP, intente nuevamente después de 15 minutos'
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Límite de 10 solicitudes por ventana
    message: 'Demasiadas solicitudes de restablecimiento de contraseña desde esta IP, intente nuevamente después de una hora'
});

const verifyCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Límite de 10 solicitudes por ventana
    message: 'Demasiados intentos de verificación de código desde esta IP, intente nuevamente después de 15 minutos'
});

const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Límite de 5 solicitudes por ventana por IP
    message: 'Demasiadas solicitudes de restablecimiento de contraseña realizadas desde esta IP, intente nuevamente después de una hora'
});


const googleAuthLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 100, // Permite hasta 100 intentos por hora por IP
    message: 'Demasiadas solicitudes de autenticación desde esta IP, intente nuevamente después de una hora'
});


const createAdminLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 2, // Límite de 2 solicitudes por ventana por IP
    message: 'Demasiadas solicitudes de creación de administrador maestro desde esta IP, intente nuevamente después de 24 horas'
});


const activationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 10, // Límite de 10 solicitudes por ventana por IP
    message: 'Demasiadas solicitudes de activación desde esta IP, intente nuevamente después de 24 horas'
});


const resendEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // Límite de 5 solicitudes por ventana por IP
    message: 'Demasiadas solicitudes de reenvío de correo electrónico de verificación desde esta IP, intente nuevamente después de una hora'
});


module.exports = {
    loginLimiter,
    forgotPasswordLimiter,
    verifyCodeLimiter,
    resendEmailLimiter,
    activationLimiter,
    createAdminLimiter,
    googleAuthLimiter,
    resetPasswordLimiter,
    resetPasswordLimiter
};
