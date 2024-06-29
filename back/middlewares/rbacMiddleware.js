// middlewares/rbacMiddleware.js
const Role = require('../models/roleModel');
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");

const rbacMiddleware = (action, resource) => async (req, res, next) => {
    try {
        if (!req.user || !req.user.role) {
            throw new ErrorHandler(403, 'Unauthorized access');
        }
        const role = await Role.findOne({ 'name': req.user.role }).populate('permissions');

        if (!role) {
            throw new ErrorHandler(403, 'Role not found');
        }

        const permissions = role.permissions || [];
        const isAuthorized = permissions.some(permission =>
            permission.action === action && permission.resource === resource);

        if (isAuthorized) {
            next();
        } else {
            throw new ErrorHandler(403, 'Unauthorized access');
        }
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = rbacMiddleware;
