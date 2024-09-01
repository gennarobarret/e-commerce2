const express = require('express');
const api = express.Router();
const subcategoryController = require('../controllers/SubcategoryController');
const auth = require('../middlewares/authenticate');
const rbac = require('../middlewares/rbacMiddleware');

api.post('/createSubcategory', [auth.auth, rbac('create', 'subcategory')], subcategoryController.createSubcategory);
api.get('/listAllSubcategories', [auth.auth, rbac('read', 'subcategory')], subcategoryController.listAllSubcategories);
api.get('/getSubcategoryById/:id', [auth.auth, rbac('read', 'subcategory')], subcategoryController.getSubcategoryById);
api.put('/updateSubcategory/:id', [auth.auth, rbac('update', 'subcategory')], subcategoryController.updateSubcategory);
api.delete('/deleteSubcategory/:id', [auth.auth, rbac('delete', 'subcategory')], subcategoryController.deleteSubcategory);

// Nueva ruta para listar subcategorías por categoría
api.get('/listSubcategoriesByCategory/:categoryId', [auth.auth, rbac('read', 'subcategory')], subcategoryController.listSubcategoriesByCategory);

module.exports = api;
