const express = require('express');
const api = express.Router();
const categoryController = require('../controllers/CategoryController');
const uploadConfig = require('../config/uploadConfig');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');
const Category = require('../models/categoryModel');

api.post('/createCategory', [auth.auth, rbac('create', 'category')], categoryController.createCategory);
api.get('/listAllCategories', [auth.auth, rbac('read', 'category')], categoryController.listAllCategories);
api.get('/getCategoryById/:id', [auth.auth, rbac('read', 'category')], categoryController.getCategoryById);
api.put('/updateCategory/:id', [auth.auth, rbac('update', 'category')], categoryController.updateCategory);
api.delete('/deleteCategory/:id', [auth.auth, rbac('delete', 'category')], categoryController.deleteCategory);
api.post('/uploadCategoryImage/:identifier',
    uploadConfig.removePreviousImage('categories', Category),
    uploadConfig.multerErrorHandler('categories'),
    [auth.auth, rbac('update', 'category')],
    categoryController.updateCategoryImageUrl
);

api.get('/getCategoryImage/:identifier',
    [auth.auth, rbac('read', 'category')],
    categoryController.getCategoryImage
);

api.delete('/deleteCategoryImage/:identifier',
    [auth.auth, rbac('delete', 'category')],
    categoryController.deleteCategoryImage
);




module.exports = api;
