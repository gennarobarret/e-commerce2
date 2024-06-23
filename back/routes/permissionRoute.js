const express = require('express');
const permissionController = require('../controllers/PermissionController');
const router = express.Router();
const auth = require("../middlewares/authenticate");
const rbac = require("../middlewares/rbacMiddleware");

router.post('/permissions', [auth.auth, rbac('create', 'permission')],permissionController.createPermission);
router.put('/permissions/:id', [auth.auth, rbac('update', 'permission')],permissionController.updatePermission);
router.delete('/permissions/:id', [auth.auth, rbac('delete', 'permission')],permissionController.deletePermission);
router.get('/permissions', [auth.auth, rbac('read', 'permission')],permissionController.listPermissions);

module.exports = router;
