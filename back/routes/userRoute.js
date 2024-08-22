const express = require('express');
const mongoose = require('mongoose');
const api = express.Router();
const userManagement = require('../controllers/UserController');
const imageController = require('../controllers/ImageController');
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

const validateUserExists = async (req, res, next) => {
    const userId = req.params.identifier;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
    }
    try {
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

api.post('/uploadProfileImage/:identifier',
    [auth.auth, rbac('update', 'user'), validateUserExists], // Validación del usuario antes de Multer
    (req, res, next) => {
        uploadConfig.multerErrorHandler('users')(req, res, next);
    },
    async (req, res, next) => {
        try {
            req.params.entityType = 'users';
            req.params.entityId = req.params.identifier;
            await imageController.uploadImage(req, res, next);
            const imageUrl = req.file.filename;
            await User.findByIdAndUpdate(req.params.identifier, { imageUrl });
            res.status(200).json({ message: 'Profile image updated successfully' });
        } catch (error) {
            next(error);
        }
    }
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
