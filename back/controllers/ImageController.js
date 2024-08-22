const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { ErrorHandler, handleErrorResponse, handleSuccessfulResponse } = require('../helpers/responseManagerHelper');
const { logAudit } = require('../helpers/logAuditHelper');

function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;
}

// Subir una nueva imagen
const uploadImage = async (req, res) => {

    let responseSent = false;
    let newFilePath;
    let file;
    try {
        file = req.file;
        if (!file) {
            throw new ErrorHandler(400, "No file uploaded.");
        }

        const { entityType, entityId } = req.params;
        console.log("🚀 ~ uploadImage ~ entityId:", entityId)
        console.log("🚀 ~ uploadImage ~ entityType:", entityType)

        if (!entityType || !entityId) {
            throw new ErrorHandler(400, "Invalid entityType or entityId.");
        }

        const directoryPath = path.join(__dirname, '..', 'uploads', entityType);
        const tempFilePath = file.path;
        const newFileName = `${entityId}-${Date.now()}${path.extname(file.originalname)}`;
        newFilePath = path.join(directoryPath, newFileName);

        // Asegúrate de que el directorio existe
        await fs.mkdir(directoryPath, { recursive: true });

        // Verifica si el archivo temporal aún existe antes de renombrarlo
        if (fsSync.existsSync(tempFilePath)) {
            console.log(`Moving file from ${tempFilePath} to ${newFilePath}`);
            await fs.rename(tempFilePath, newFilePath);
        } else {
            throw new ErrorHandler(500, "Temporary file does not exist.");
        }

        // Elimina el archivo anterior si existe
        const files = await fs.readdir(directoryPath);
        for (const existingFile of files) {
            if (existingFile.startsWith(entityId) && existingFile !== newFileName) {
                console.log(`Deleting existing file: ${existingFile}`);
                await fs.unlink(path.join(directoryPath, existingFile));
                break;
            }
        }

        // Registrar en el log de auditoría
        const ipAddress = getClientIp(req);
        await logAudit('UPLOAD_IMAGE_SUCCESS', entityId, null, entityType, 'Medium', `Image ${newFileName} uploaded successfully`, ipAddress, req.originalUrl);

        // Responder con éxito
        handleSuccessfulResponse("Image uploaded successfully", { fileName: newFileName })(req, res);
        responseSent = true;

    } catch (error) {
        console.error('Error en uploadImage:', error);

        if (!responseSent && newFilePath && fsSync.existsSync(newFilePath)) {
            // Intentar eliminar el nuevo archivo si ocurre un error
            try {
                console.log('Deleting new file due to error:', newFilePath);
                await fs.unlink(newFilePath);
            } catch (unlinkError) {
                console.error(`Failed to delete new file: ${unlinkError.message}`);
            }
        }

        if (!responseSent && file && file.path) {
            // Intentar eliminar el archivo temporal si existe
            try {
                console.log('Deleting temporary file:', file.path);
                await fs.unlink(file.path);
            } catch (unlinkError) {
                console.error(`Failed to delete temp file: ${unlinkError.message}`);
            }
        }

        if (!responseSent) {
            handleErrorResponse(new ErrorHandler(500, "Failed to create or replace the file.", req.originalUrl), req, res);
            responseSent = true;
        }
    }
};

// Obtener una imagen
const getImage = async (req, res) => {
    try {
        const { fileName, entityType } = req.params;
        console.log("🚀 ~ getImage ~ entityType:", entityType)
        console.log("🚀 ~ getImage ~ fileName:", fileName)
        const filePath = path.resolve(`./uploads/${entityType}`, fileName);

        console.log("🚀 ~ getImage ~ filePath:", filePath)
        await fs.stat(filePath); // Verificar si la imagen existe

        res.sendFile(filePath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return handleSuccessfulResponse("Image not found", {})(req, res);
        }
        handleErrorResponse(error, req, res);
    }
};

// Eliminar una imagen
const deleteImage = async (req, res) => {
    try {
        const { fileName, entityType } = req.params;
        const filePath = path.resolve(`./uploads/${entityType}`, fileName);

        // Verificar si la imagen existe antes de eliminarla
        try {
            await fs.access(filePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                return handleSuccessfulResponse("Image not found", {})(req, res);
            }
            throw err;
        }

        // Eliminar la imagen
        await fs.unlink(filePath);

        // Registrar la auditoría
        const ipAddress = getClientIp(req);
        try {
            await logAudit('DELETE_IMAGE_SUCCESS', null, null, entityType, 'Medium', `Image ${fileName} deleted successfully`, ipAddress);
        } catch (error) {
            console.error('Error al registrar en el log de auditoría:', error);
            throw new ErrorHandler(500, 'Failed to create audit log.');
        }

        // Crear una notificación para el usuario que eliminó la imagen
        const requestingUserId = req.user._id;
        try {
            await notificationService.createNotification({
                userId: requestingUserId,
                icon: 'trash',
                message: `Image ${fileName} for ${entityType} has been deleted successfully!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error al crear la notificación:', error);
        }

        // Responder con éxito
        handleSuccessfulResponse("Image deleted successfully", {})(req, res);
    } catch (error) {
        console.error('Error en deleteImage:', error);
        handleErrorResponse(error, req, res);
    }
};

module.exports = {
    uploadImage,
    getImage,
    deleteImage,
};
