// roleModel.js
"use strict";

const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoleSchema = new Schema({
    name: { type: String, required: true, unique: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }]
});

RoleSchema.methods.saveWithAudit = async function (userId) {
    const AuditLog = mongoose.model('AuditLog');
    const action = this.isNew ? 'CREATE' : 'UPDATE';
    try {
        const savedUser = await this.save();

        await AuditLog.create({
            action: action,
            by: userId,
            targetDoc: this._id,
            targetType: 'Role',
            alertLevel: 'Critical',
            details: {}
        });

        return savedUser;
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model("Role", RoleSchema);
