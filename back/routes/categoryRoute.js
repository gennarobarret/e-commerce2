const express = require('express');
const mongoose = require('mongoose');
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

const validateCategoryExists = async (req, res, next) => {
    const categoryId = req.params.identifier;
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: 'Invalid category ID format.' });
    }
    try {
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
};

api.post('/uploadCategoryImage/:identifier',
    [auth.auth, rbac('update', 'category'), validateCategoryExists],
    uploadConfig.multerErrorHandler('categories'),
    async (req, res, next) => {
        try {
            const imageUrl = req.file.filename;
            await Category.findByIdAndUpdate(req.params.identifier, { imageUrl });
            res.status(200).json({ message: 'Category image updated successfully', fileName: imageUrl });
        } catch (error) {
            next(error);
        }
    }
);

api.get('/getCategoryImage/:identifier',
    [auth.auth, rbac('read', 'category')],
    async (req, res) => {
        try {
            const category = await Category.findById(req.params.identifier);
            if (!category || !category.imageUrl) {
                return res.status(404).json({ message: 'Category image not found.' });
            }
            res.status(200).json({ imageUrl: category.imageUrl });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    }
);

api.delete('/deleteCategoryImage/:identifier',
    [auth.auth, rbac('delete', 'category'), validateCategoryExists],
    async (req, res) => {
        try {
            await Category.findByIdAndUpdate(req.params.identifier, { imageUrl: null });
            res.status(200).json({ message: 'Category image deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    }
);

module.exports = api;
