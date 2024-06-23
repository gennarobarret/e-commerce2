"use strict";

const Permission = require("../models/permissionModel");
const Role = require("../models/roleModel");
const { logAudit } = require('../helpers/logAuditHelper');
const { validatePermission } = require('../helpers/validateHelper');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require("../helpers/responseManagerHelper");

const createPermission = async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!userId) {
            return res.status(401).send({ message: "Access Denied" });
        }
        const { error } = validatePermission(req.body);
        if (error) {
            throw new ErrorHandler(400, error.details[0].message);
        }
        const { name, action, resource } = req.body;
        let permission = new Permission({ name, action, resource });
        await permission.saveWithAudit(userId);

        const apiPath = req.originalUrl || 'Unknown API path';
        console.log("🚀 ~ API Path antes de logAudit:", apiPath);


        try {
            await logAudit(
                'CREATE',
                userId,
                permission._id,
                'Permission',
                'Medium',
                `Permission created: ${name}`,
                req.ip,
                apiPath
            );
        } catch (auditError) {
            console.error("Audit log failed: ", auditError);
        }

        const masterAdminRole = await Role.findOne({ name: "MasterAdministrator" });
        if (masterAdminRole) {
            masterAdminRole.permissions.push(permission._id);
            await masterAdminRole.saveWithAudit(userId);
        }

        handleSuccessfulResponse("Permission created successfully", { permission })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Función updatePermission
const updatePermission = async (req, res) => {
    try {
        const userId = req.user.sub;
        if (!userId) {
            return res.status(401).send({ message: "Access Denied" });
        }
        const { error } = validatePermission(req.body);
        if (error) {
            throw new ErrorHandler(400, error.details[0].message);
        }

        const { name, action, resource } = req.body;
        let permission = await Permission.findById(req.params.id);
        if (!permission) {
            throw new ErrorHandler(404, "Permission not found");
        }

        // Almacenar los valores antiguos para el log
        const oldValues = { name: permission.name, action: permission.action, resource: permission.resource };

        permission.name = name;
        permission.action = action;
        permission.resource = resource;

        await permission.saveWithAudit(userId);

        const apiPath = req.originalUrl || 'Unknown API path';

        try {
            // Registro en el log de auditoría
            await logAudit(
                'UPDATE',
                userId,
                permission._id,
                'Permission',
                'Medium',
                `Permission updated from ${JSON.stringify(oldValues)} to ${JSON.stringify(req.body)}`,
                req.ip,
                apiPath
            );
        } catch (auditError) {
            console.error("Audit log failed: ", auditError);
        }

        handleSuccessfulResponse("Permission updated successfully", { permission })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Función deletePermission
const deletePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permissionToDelete = await Permission.findOneAndDelete({ _id: id });
        if (!permissionToDelete) {
            throw new ErrorHandler(404, "Permission not found");
        }

        const userId = req.user.sub;

        const apiPath = req.originalUrl || 'Unknown API path';

        try {
            // Registro en el log de auditoría
            await logAudit(
                'DELETE',
                userId,
                permissionToDelete._id,
                'Permission',
                'High',
                `Permission deleted: ${permissionToDelete.name}`,
                req.ip,
                apiPath
            );
        } catch (auditError) {
            console.error("Audit log failed: ", auditError);
        }

        handleSuccessfulResponse("Permission deleted successfully", { id: permissionToDelete._id })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

// Función listPermissions
const listPermissions = async (req, res) => {
    try {
        const permissions = await Permission.find();

        const apiPath = req.originalUrl || 'Unknown API path';

        try {
            await logAudit(
                'READ',
                req.user.sub,
                null,
                'Permission',
                'Low',
                `Permissions list viewed`,
                req.ip,
                apiPath
            );
        } catch (auditError) {
            console.error("Audit log failed: ", auditError);
        }

        handleSuccessfulResponse("Permissions listed successfully", { permissions })(req, res);
    } catch (error) {
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    createPermission,
    updatePermission,
    deletePermission,
    listPermissions
};
