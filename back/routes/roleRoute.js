const express = require('express');
const roleController = require('../controllers/RoleController');
const api = express.Router();
const auth = require("../middlewares/authenticate");
const rbac = require("../middlewares/rbacMiddleware");

api.post('/createRole', [auth.auth, rbac('create', 'role')], roleController.createRole);
api.put('/updateRole/:id', [auth.auth, rbac('update', 'role')], roleController.updateRole);
api.delete('/deleteRole/:id', [auth.auth, rbac('delete', 'role')], roleController.deleteRole);
api.get('/listRoles', [auth.auth, rbac('read', 'role')], roleController.listRoles);
api.get('/getRoleById/:id', [auth.auth, rbac('read', 'role')], roleController.getRoleById);

module.exports = api;
