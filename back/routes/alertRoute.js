const express = require('express');
const api = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

// Crear una nueva alerta
api.post('/createAlert', [auth.auth, rbac('create', 'alert')], alertController.createAlert);

// Obtener todas las alertas
api.get('/getAllAlerts', [auth.auth, rbac('read', 'alert')], alertController.getAlerts);

// Obtener una alerta por su ID
api.get('/getAlertById/:id', [auth.auth, rbac('read', 'alert')], alertController.getAlertById);

// Actualizar una alerta por su ID
api.put('/updateAlert/:id', [auth.auth, rbac('update', 'alert')], alertController.updateAlert);

// Marcar una alerta como vista
api.patch('/markAsSeen/:id', [auth.auth, rbac('update', 'alert')], alertController.markAsSeen);

// Eliminar una alerta por su ID
api.delete('/deleteAlert/:id', [auth.auth, rbac('delete', 'alert')], alertController.deleteAlert);

module.exports = api;
