"use strict";
const Category = require('../models/categoryModel');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const { logAudit } = require('../helpers/logAuditHelper');
const logger = require('../helpers/logHelper');
// External modules (npm)
const mongoose = require('mongoose');

// Crear una nueva categoría
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

// Listar todas las categorías
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



// Actualizar una categoría
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

// Eliminar una categoría
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

const updateCategoryImageUrl = async (categoryId, imageUrl) => {
    try {
        // Actualizar el campo `imageUrl` en la base de datos para el usuario dado
        await User.findByIdAndUpdate(categoryId, { imageUrl });

    } catch (error) {
        console.error('Error updating category image:', error);
        throw new ErrorHandler(500, "Failed to update category image.");
    }

}

module.exports = {
    createCategory,
    listAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    updateCategoryImageUrl
};
