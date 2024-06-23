'use strict';

const express = require('express');
const api = express.Router();
const auditLogsController = require('../controllers/AuditLogsController');
const auth = require("../middlewares/authenticate");
const rbac = require("../middlewares/rbacMiddleware");

api.get('/audit-logs/document/:targetDoc', [auth.auth, rbac('read', 'auditLog')], auditLogsController.getAuditLogsByTargetDoc);
api.get('/audit-logs/:id', [auth.auth, rbac('read', 'auditLog')], auditLogsController.getAuditLogById);
api.get('/audit-logs', [auth.auth, rbac('read', 'auditLog')], auditLogsController.listAllAuditLogs);
api.delete('/audit-logs/:id', [auth.auth, rbac('delete', 'auditLog')], auditLogsController.deleteAuditLog);

module.exports = api;
