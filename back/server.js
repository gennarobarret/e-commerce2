// server.js
require('dotenv').config();
const http = require('http');
const app = require('./app'); // Importar la aplicación Express
const socketSetup = require('./socket'); // Configuración de Socket.io
const mongoose = require('mongoose');

const port = process.env.PORT || 4201;

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('** Database connected successfully **');
    })
    .catch((error) => {
        console.error('** Database connection failed:', error, '**');
    });

const server = http.createServer(app); // Crear el servidor HTTP usando la aplicación Express
socketSetup(server); // Configuración de Socket.io

server.listen(port, () => {
    console.log('** Server online on port ' + port + ' **');
});
