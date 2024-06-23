// permissionModel.js
"use strict";
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PermissionSchema = new Schema({
    name: { type: String, required: true, unique: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
});


PermissionSchema.methods.saveWithAudit = async function (userId) {
    const AuditLog = mongoose.model('AuditLog');
    const action = this.isNew ? 'CREATE' : 'UPDATE';
    try {
        const savedUser = await this.save();
        await AuditLog.create({
            action: action,
            by: userId,
            targetDoc: this._id,
            targetType: 'Permission',
            alertLevel: 'Critical',
            details: {},
        });

        return savedUser;
    } catch (error) {
        throw error;
    }
};


module.exports = mongoose.model('Permission', PermissionSchema);
