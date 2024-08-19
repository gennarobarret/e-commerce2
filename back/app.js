// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

// Importar rutas existentes
const initialConfigRoute = require('./routes/initialConfigRoute');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const roleRoute = require('./routes/roleRoute');
const permissionRoute = require('./routes/permissionRoute');
const businessRoute = require('./routes/businessRoute');
const auditLogsRoute = require('./routes/auditLogsRoute');
const geoRoute = require('./routes/locationRoute');
const notificationRoute = require('./routes/notificationRoute');
const productRoute = require('./routes/productRoute');
const categoryRoute = require('./routes/categoryRoute');
const subcategoryRoute = require('./routes/subcategoryRoute');
const imageRoute = require('./routes/imageRoute');



// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(cors());

// Inicializar rutas
app.use('/api', authRoute);
app.use('/api', initialConfigRoute);
app.use('/api', userRoute);
app.use('/api', roleRoute);
app.use('/api', permissionRoute);
app.use('/api', businessRoute);
app.use('/api', auditLogsRoute);
app.use('/api', geoRoute);
app.use('/api', notificationRoute);
app.use('/api', productRoute);
app.use('/api', categoryRoute);
app.use('/api', subcategoryRoute);
app.use('/api/images', imageRoute);



// Middleware para manejo de errores
app.use((err, req, res, next) => {
    if (err) {
        res.status(err.status || 500).json({
            success: false,
            message: err.message || 'An unexpected error occurred',
            error: err
        });
    } else {
        next();
    }
});

module.exports = app;
