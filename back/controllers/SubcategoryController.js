"use strict";
const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');
const { logAudit } = require('../helpers/logAuditHelper');
const logger = require('../helpers/logHelper');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');

const createSubcategory = async (req, res) => {
    try {
        const { title, category, description } = req.body;

        // Verificar que la categoría exista
        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            throw new ErrorHandler(400, "Category not found", req.originalUrl, req.method);
        }

        // Verificar si ya existe una subcategoría con el mismo título en esta categoría
        const existingSubcategory = await Subcategory.findOne({ title, category: categoryDoc._id });
        if (existingSubcategory) {
            throw new ErrorHandler(400, "A subcategory with this title already exists in the selected category", req.originalUrl, req.method);
        }

        // Crear la subcategoría con el nombre de la categoría en lugar del ObjectId
        const newSubcategory = new Subcategory({
            title,
            category: categoryDoc._id,  // Se almacena el ObjectId en el campo de referencia
            description
        });

        await newSubcategory.save();

        // Hacer populate del campo 'category' para obtener el nombre de la categoría
        await newSubcategory.populate('category', 'title');

        handleSuccessfulResponse("Subcategory created successfully", {
            subcategoryId: newSubcategory._id,
            title: newSubcategory.title,
            category: newSubcategory.category.title,  // Devolvemos el nombre de la categoría en la respuesta
            description: newSubcategory.description
        })(req, res);

    } catch (error) {
        logger.error('createSubcategory error:', error);
        handleErrorResponse(error, req, res);
    }
};



// Listar todas las subcategorías
const listAllSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find().populate('category', 'title');
        handleSuccessfulResponse("Subcategories listed successfully", subcategories)(req, res);

        await logAudit('LIST_SUBCATEGORIES', req.user ? req.user._id : 'system', null, 'Subcategory', 'Low', 'Listed all subcategories', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('listAllSubcategories error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Obtener una subcategoría por ID
const getSubcategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ErrorHandler(400, "Invalid Subcategory ID", req.originalUrl, req.method);
        }

        const subcategory = await Subcategory.findById(id).populate('category', 'title');
        if (!subcategory) {
            throw new ErrorHandler(404, "Subcategory not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Subcategory retrieved successfully", subcategory)(req, res);

        await logAudit('GET_SUBCATEGORY', req.user ? req.user._id : 'system', subcategory._id, 'Subcategory', 'Low', 'Retrieved subcategory', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('getSubcategoryById error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Actualizar una subcategoría
const updateSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const subcategory = await Subcategory.findByIdAndUpdate(id, data, { new: true });
        if (!subcategory) {
            throw new ErrorHandler(404, "Subcategory not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Subcategory updated successfully", subcategory)(req, res);

        await logAudit('UPDATE_SUBCATEGORY', req.user ? req.user._id : 'system', subcategory._id, 'Subcategory', 'Medium', 'Updated subcategory', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('updateSubcategory error:', error);
        handleErrorResponse(error, req, res);
    }
};

// Eliminar una subcategoría
const deleteSubcategory = async (req, res) => {
    try {
        const { id } = req.params;

        const subcategory = await Subcategory.findByIdAndDelete(id);
        if (!subcategory) {
            throw new ErrorHandler(404, "Subcategory not found", req.originalUrl, req.method);
        }

        handleSuccessfulResponse("Subcategory deleted successfully", { id })(req, res);

        await logAudit('DELETE_SUBCATEGORY', req.user ? req.user._id : 'system', id, 'Subcategory', 'High', 'Deleted subcategory', req.ip, req.originalUrl);
    } catch (error) {
        logger.error('deleteSubcategory error:', error);
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createSubcategory,
    listAllSubcategories,
    getSubcategoryById,
    updateSubcategory,
    deleteSubcategory
};
