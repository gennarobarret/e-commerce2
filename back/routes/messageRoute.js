const express = require('express');
const api = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

// Crear un nuevo mensaje
api.post('/createMessage', [auth.auth, rbac('create', 'message')], messageController.createMessage);

// Obtener todos los mensajes
api.get('/getAllMessages', [auth.auth, rbac('read', 'message')], messageController.getMessages);

// Obtener un mensaje por su ID
api.get('/getMessageById/:id', [auth.auth, rbac('read', 'message')], messageController.getMessageById);

// Actualizar un mensaje por su ID
api.put('/updateMessage/:id', [auth.auth, rbac('update', 'message')], messageController.updateMessage);

// Marcar un mensaje como leído
api.patch('/markAsRead/:id', [auth.auth, rbac('update', 'message')], messageController.markAsRead);

// Eliminar un mensaje por su ID
api.delete('/deleteMessage/:id', [auth.auth, rbac('delete', 'message')], messageController.deleteMessage);

module.exports = api;
