"use strict";

const User = require("../models/userModel");
const { ErrorHandler, handleErrorResponse } = require("../helpers/responseManagerHelper");

const deleteUserIfNotVerified = async () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 2); // Configura esto a 2 días atrás

    try {
        const result = await User.deleteMany({
            verification: 'notVerified',
            createdAt: { $lt: expirationDate }
        });
        console.log('Unverified users successfully removed. Amount:', result.deletedCount);
    } catch (error) {
        console.error('Error when deleting unverified users:', error);
        throw new ErrorHandler(500, 'Error deleting unverified users');
    }
};

module.exports = { deleteUserIfNotVerified };
