const express = require('express');
const api = express.Router();
const userManagement = require('../controllers/UserController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

api.post('/createMasterAdmin', userManagement.createMasterAdmin);
api.post('/createUser', [auth.auth, rbac('create', 'user')], userManagement.createUser);
api.get('/getUser', [auth.auth, rbac('read', 'user')], userManagement.getUser);
api.get('/getUserById/:id', [auth.auth, rbac('read', 'user')], userManagement.getUserById);
api.get('/listAllUsers', [auth.auth, rbac('read', 'user')], userManagement.listAllUsers);
api.get('/getProfileImage/:profileImage', [auth.auth, rbac('read', 'userImage')], userManagement.getProfileImage);
api.put('/updateUser/:id', [auth.auth, rbac('update', 'user')], userManagement.updateUser);
api.put('/updateProfileImage/:userName', [auth.auth, rbac('update', 'user'), uploadConfig.multerErrorHandler], userManagement.updateProfileImage);
api.patch('/updateUserActiveStatus/:userId', [auth.auth, rbac('update', 'user')], userManagement.updateUserActiveStatus);
api.patch('/updateMultipleUserActiveStatus', [auth.auth, rbac('update', 'user')], userManagement.updateMultipleUserActiveStatus);

// Aquí se agrega el endpoint para eliminar un usuario
api.delete('/deleteUser/:id', [auth.auth, rbac('delete', 'user')], userManagement.deleteUser);

module.exports = api;
