const express = require('express');
const api = express.Router();
const userManagement = require('../controllers/UserController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');
const User = require('../models/userModel');

api.post('/createMasterAdmin', userManagement.createMasterAdmin);
api.post('/createUser', [auth.auth, rbac('create', 'user')], userManagement.createUser);
api.get('/getUser', [auth.auth, rbac('read', 'user')], userManagement.getUser);
api.get('/getUserById/:id', [auth.auth, rbac('read', 'user')], userManagement.getUserById);
api.get('/listAllUsers', [auth.auth, rbac('read', 'user')], userManagement.listAllUsers);
api.put('/updateUser/:id', [auth.auth, rbac('update', 'user')], userManagement.updateUser);
api.delete('/deleteUser/:id', [auth.auth, rbac('delete', 'user')], userManagement.deleteUser);
api.post('/uploadProfileImage/:identifier',
    uploadConfig.removePreviousImage('users', User),
    uploadConfig.multerErrorHandler('users'),
    [auth.auth, rbac('update', 'user')],
    userManagement.uploadProfileImage
);

api.get('/getUserProfileImage/:identifier',
    [auth.auth, rbac('read', 'user')],
    userManagement.getUserProfileImage
);

api.delete('/deleteUserProfileImage/:identifier',
    [auth.auth, rbac('delete', 'user')],
    userManagement.deleteUserProfileImage
);



module.exports = api;
