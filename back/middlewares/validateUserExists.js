const validateDocumentExists = (model) => {
    return async (req, res, next) => {
        const documentId = req.params.identifier;
        console.log(`Validating document existence for ID: ${documentId}`);  // Log de depuración

        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            console.log('Invalid ID format');  // Log de depuración
            return res.status(400).json({ message: 'Invalid ID format.' });
        }
        try {
            const documentExists = await model.findById(documentId);
            if (!documentExists) {
                console.log(`${model.modelName} not found`);  // Log de depuración
                return res.status(404).json({ message: `${model.modelName} not found.` });
            }
            console.log(`${model.modelName} exists, proceeding to next middleware`);  // Log de depuración
            next();
        } catch (error) {
            console.error('Error during document validation', error);  // Log de depuración
            return res.status(500).json({ message: 'Internal server error.', error: error.message });
        }
    };
};
