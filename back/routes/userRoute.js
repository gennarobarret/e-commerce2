const express = require('express');
const api = express.Router();
const userManagement = require('../controllers/UserController');
const imageController = require('../controllers/ImageController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

api.post('/createMasterAdmin', userManagement.createMasterAdmin);
api.post('/createUser', [auth.auth, rbac('create', 'user')], userManagement.createUser);
api.get('/getUser', [auth.auth, rbac('read', 'user')], userManagement.getUser);
api.get('/getUserById/:id', [auth.auth, rbac('read', 'user')], userManagement.getUserById);
api.get('/listAllUsers', [auth.auth, rbac('read', 'user')], userManagement.listAllUsers);
api.put('/updateUser/:id', [auth.auth, rbac('update', 'user')], userManagement.updateUser);
api.delete('/deleteUser/:id', [auth.auth, rbac('delete', 'user')], userManagement.deleteUser);
api.post('/uploadProfileImage/:identifier',
    [auth.auth, rbac('update', 'user'), uploadConfig.multerErrorHandler('users')],
    async (req, res, next) => {
        try {
            req.params.entityType = 'users';
            req.params.entityId = req.params.identifier;
            await imageController.uploadImage(req, res, next);
            const imageUrl = req.file.filename;
            await userManagement.updateUserProfileImageUrl(req.params.identifier, imageUrl);
            res.status(200).json({ message: 'Profile image updated successfully' });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = api;
