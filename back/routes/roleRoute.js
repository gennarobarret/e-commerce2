// routes/roleRoutes.js
const express = require('express');
const roleController = require('../controllers/RoleController');
const api = express.Router();
const auth = require("../middlewares/authenticate");
const rbac = require("../middlewares/rbacMiddleware");

api.post('/roles', [auth.auth, rbac('create', 'role')], roleController.createRole);
api.put('/roles/:id', [auth.auth, rbac('update', 'role')], roleController.updateRole);
api.delete('/roles/:id', [auth.auth, rbac('delete', 'role')], roleController.deleteRole);
api.get('/roles', [auth.auth, rbac('read', 'role')], roleController.listRoles);

module.exports = api;