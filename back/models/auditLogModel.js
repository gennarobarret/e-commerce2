
// auditLogModel.js
"use strict";

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    action: { type: String, required: true },
    by: { type: mongoose.Schema.Types.Mixed, required: true },
    targetDoc: { type: Schema.Types.ObjectId, refPath: 'targetType', required: false },
    targetType: { type: String, required: true },
    alertLevel: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], required: true },
    apiPath: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);



// by: { type: Schema.Types.ObjectId, ref: 'User', required: false },