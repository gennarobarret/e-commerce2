"use strict";

// Native Node.js modules
const fs = require('fs').promises;
const path = require("path");

// External modules (npm)
const mongoose = require('mongoose');

// Models (Internal modules)
const Category = require('../models/categoryModel');

// Response and Error Handling (Internal modules)
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const { logAudit } = require('../helpers/logAuditHelper');
const logger = require('../helpers/logHelper');

// Services
const uploadConfig = require('../config/uploadConfig');
const notificationService = require('../services/notificationService');


const createCategory = async (req, res) => {
    console.log("🚀 ~ createCategory ~ req:", req.body)
    try {
        const { title, slug, imageUrl, description, subcategories } = req.body;

        const newCategory = new Category({ title, slug, imageUrl, description, subcategories });
        await newCategory.save();

        handleSuccessfulResponse("Category created successfully", { categoryId: newCategory._id })(req, res);

        await logAudit('CREATE_CATEGORY', req.user ? req.user._id : 'system', newCategory._id, 'Category', 'Medium', 'Category created', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('createCategory error:', error);
        handleErrorResponse(error, req, res);
    }
};

const listAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        handleSuccessfulResponse("Categories listed successfully", categories)(req, res);

        await logAudit('LIST_CATEGORIES', req.user ? req.user._id : 'system', null, 'Category', 'Low', 'Listed all categories', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('listAllCategories error:', error);
        handleErrorResponse(error, req, res);
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el ID es válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ErrorHandler(400, "Invalid Category ID", req.originalUrl, req.method);
        }

        // Buscar la categoría por ID
        const category = await Category.findById(id).populate('subcategories', 'title description');
        if (!category) {
            throw new ErrorHandler(404, "Category not found", req.originalUrl, req.method);
        }

        // Responder con los detalles de la categoría y las subcategorías
        handleSuccessfulResponse("Category retrieved successfully", category)(req, res);

    } catch (error) {
        logger.error('getCategoryById error:', error);
        handleErrorResponse(error, req, res);
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const category = await Category.findByIdAndUpdate(id, data, { new: true });
        if (!category) {
            throw new ErrorHandler(404, "Category not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Category updated successfully", category)(req, res);

        await logAudit('UPDATE_CATEGORY', req.user ? req.user._id : 'system', category._id, 'Category', 'Medium', 'Updated category', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('updateCategory error:', error);
        handleErrorResponse(error, req, res);
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            throw new ErrorHandler(404, "Category not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Category deleted successfully", { id })(req, res);

        await logAudit('DELETE_CATEGORY', req.user ? req.user._id : 'system', id, 'Category', 'High', 'Deleted category', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('deleteCategory error:', error);
        handleErrorResponse(error, req, res);
    }
};

const updateCategoryImageUrl = async (req, res, next) => {
    try {
        const categoryId = req.params.identifier;
        const imageUrl = req.file.filename; // Este campo se llena después de que Multer maneje la carga

        // Actualizar el usuario con la nueva URL de la imagen
        await Category.findByIdAndUpdate(categoryId, { imageUrl });

        return handleSuccessfulResponse('Category image uploaded successfully', { imageUrl })(req, res);
    } catch (error) {
        return handleErrorResponse(error, req, res);
    }
};

const getCategoryImage = async (req, res, next) => {
    try {
        const categoryId = req.params.identifier;
        const category = await Category.findById(categoryId);

        if (!category || !category.imageUrl) {
            return next(new ErrorHandler(404, 'Category image not found.'));
        }

        const imagePath = path.join(__dirname, '..', 'uploads', 'categories', category.imageUrl);
        console.log(`Image path resolved: ${imagePath}`);

        res.sendFile(imagePath, (err) => {
            if (err) {
                return next(new ErrorHandler(500, 'Failed to send profile image.'));
            }
        });
    } catch (error) {
        return handleErrorResponse(error, req, res);
    }
};

const deleteCategoryImage = async (req, res, next) => {
    try {
        const categoryId = req.params.identifier;
        console.log(`Attempting to delete profile image for category ID: ${categoryId}`);

        const category = await Category.findById(categoryId);
        console.log(`Category found: ${category ? category._id : 'not found'}`);

        if (!category || !category.imageUrl) {
            console.log('Category image not found.');
            return next(new ErrorHandler(404, 'Category image not found.'));
        }

        const imagePath = path.join(__dirname, '..', 'uploads', 'categories', category.imageUrl);
        console.log(`Image path resolved: ${imagePath}`);

        // Eliminar la imagen del sistema de archivos
        try {
            await fs.unlink(imagePath);
            console.log(`Successfully deleted file: ${imagePath}`);

            // Eliminar la referencia de la imagen en la base de datos
            category.imageUrl = null;
            await category.save();
            console.log('Category image URL reference removed.');

            return handleSuccessfulResponse('Category image deleted successfully.')(req, res);
        } catch (err) {
            console.error(`Failed to delete file: ${imagePath}`, err);
            return next(new ErrorHandler(500, 'Failed to delete profile image from the server.'));
        }
    } catch (error) {
        console.error('Error in deleteUserProfileImage:', error);
        return handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createCategory,
    listAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    updateCategoryImageUrl,
    getCategoryImage,
    deleteCategoryImage
};
