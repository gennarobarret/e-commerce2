const express = require('express');
const api = express.Router();
const categoryController = require('../controllers/CategoryController');
const imageController = require('../controllers/ImageController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

api.post('/createCategory', [auth.auth, rbac('create', 'category')], categoryController.createCategory);
api.get('/listAllCategories', [auth.auth, rbac('read', 'category')], categoryController.listAllCategories);
api.get('/getCategoryById/:id', [auth.auth, rbac('read', 'category')], categoryController.getCategoryById);
api.put('/updateCategory/:id', [auth.auth, rbac('update', 'category')], categoryController.updateCategory);
api.delete('/deleteCategory/:id', [auth.auth, rbac('delete', 'category')], categoryController.deleteCategory);
api.post('/uploadCategoryImage/:identifier',
    [auth.auth, rbac('update', 'category'), uploadConfig.multerErrorHandler('categories')],
    async (req, res, next) => {
        try {
            req.params.entityType = 'categories';
            req.params.entityId = req.params.identifier;
            await imageController.uploadImage(req, res, next);
            const imageUrl = req.file.filename;
            await categoryController.updateCategoryImageUrl(req.params.identifier, imageUrl);
            res.status(200).json({ message: 'Category image updated successfully' });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = api;
