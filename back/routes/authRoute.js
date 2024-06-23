'use strict';

const express = require('express');
const AuthController = require('../controllers/AuthControllers');
const { activationLimiter, resendEmailLimiter, googleAuthLimiter, loginLimiter, forgotPasswordLimiter, verifyCodeLimiter, resetPasswordLimiter } = require('../middlewares/rateLimit');
const rbac = require('../middlewares/rbacMiddleware');
const api = express.Router();


api.post('/auth/google', googleAuthLimiter, AuthController.authenticateWithGoogle);
api.get('/activation/:token', AuthController.activateUser);
api.post('/resendVerificationEmail', resendEmailLimiter, AuthController.resendVerificationEmail);
api.post('/loginUser', AuthController.loginUser);
api.post('/forgotPassword', AuthController.forgotPassword);
api.post('/verification-code/:token', AuthController.verificationCode);
api.post('/resetPassword/:token', AuthController.resetPassword);

module.exports = api;
