const User = require('../models/userModel');
const Business = require('../models/businessModel');
const Role = require('../models/roleModel');
const Permission = require('../models/permissionModel');

const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const logger = require('../helpers/logHelper');

// INITIAL CHECK CONFIG
const InitialCheck = async (req, res) => {
    try {
        const masterAdminRole = await Role.findOne({ name: 'MasterAdministrator' });
        if (!masterAdminRole) {
            handleSuccessfulResponse('Initial setup required. No MasterAdmin role found.', {
                setupRequired: true,
                verificationRequired: true,
                masterAdminRequired: true
            })(req, res);
            return;
        }

        const masterAdminUser = await User.findOne({ role: masterAdminRole._id });

        if (!masterAdminUser) {
            handleSuccessfulResponse('Initial setup required. No MasterAdmin found.', {
                setupRequired: true,
                verificationRequired: true,
                masterAdminRequired: true
            })(req, res);
            return;
        }

        if (masterAdminUser.verification !== 'active') {
            handleSuccessfulResponse('MasterAdmin is not verified.', {
                setupRequired: true,
                verificationRequired: true,
                masterAdminRequired: false
            })(req, res);
            return;
        }

        handleSuccessfulResponse('System is fully configured and ready for use.', {
            setupRequired: false,
            verificationRequired: false,
            masterAdminRequired: false
        })(req, res);

    } catch (error) {
        console.error(error);
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    InitialCheck
};
