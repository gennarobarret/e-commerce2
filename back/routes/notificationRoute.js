'use strict';

const express = require('express');
const api = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middlewares/authenticate');

// Ruta para marcar una notificación como vista
api.patch('/notifications/:id/view', auth.auth, notificationController.markAsViewed);

// Ruta para borrar una notificación específica
api.delete('/notifications/:id', auth.auth, notificationController.deleteNotification);

// Ruta para borrar todas las notificaciones vistas
api.delete('/notifications/viewed/all', auth.auth, notificationController.deleteAllViewedNotifications);

// Ruta para obtener todas las notificaciones de un usuario
api.get('/notifications', auth.auth, notificationController.getNotifications);

// Ruta para crear una notificación de prueba
api.post('/test-notification', auth.auth, notificationController.createTestNotification);

module.exports = api;
