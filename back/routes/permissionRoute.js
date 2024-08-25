const express = require('express');
const permissionController = require('../controllers/PermissionController');
const api = express.Router();
const auth = require("../middlewares/authenticate");
const rbac = require("../middlewares/rbacMiddleware");

api.post('/createPermission', [auth.auth, rbac('create', 'permission')], permissionController.createPermission);
api.put('/updatePermission/:id', [auth.auth, rbac('update', 'permission')], permissionController.updatePermission);
api.delete('/deletePermission/:id', [auth.auth, rbac('delete', 'permission')], permissionController.deletePermission);
api.get('/listPermissions', [auth.auth, rbac('read', 'permission')], permissionController.listPermissions);
api.get('/getPermissionById/:id', [auth.auth, rbac('read', 'permission')], permissionController.getPermissionById);

module.exports = api;
