require('dotenv').config();
'use strict';

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 4201;

// Importar middleware
const corsMiddleware = require('./middlewares/corsMiddleware');
const socketAuthMiddleware = require('./middlewares/socketAuthMiddleware');

// Importar rutas existentes
const initialConfigRoute = require('./routes/initialConfigRoute');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const roleRoute = require('./routes/roleRoute');
const permissionRoute = require('./routes/permissionRoute');
const businessRoute = require('./routes/businessRoute');
const auditLogsRoute = require('./routes/auditLogsRoute');
const geoRoute = require('./routes/locationRoute');

// Nuevas rutas para mensajes y alertas
const alertRoute = require('./routes/alertRoute');
const messageRoute = require('./routes/messageRoute');

// Conectar a MongoDB
// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Database connection established');

        // Crear servidor HTTP y configurar Socket.io
        const server = http.createServer(app);
        const io = socketIo(server, {
            cors: {
                origin: [process.env.FRONTEND_URL],
                methods: ['GET', 'POST'],
                allowedHeaders: ['Authorization', 'X-API-KEY', 'Origin', 'X-Requested-With', 'Content-Type', 'Access-Control-Allow-Request-Method'],
                credentials: true
            }
        });

        // Middleware para adjuntar la instancia de Socket.io al objeto req
        app.use((req, res, next) => {
            req.io = io; // Adjunto la instancia de Socket.io al req
            next();
        });

        // Aplicar middleware de autenticación de socket
        socketAuthMiddleware(io);

        // Configuración de Socket.io
        io.on('connection', (socket) => {
            console.log('A user has connected');

            // Manejar eventos de mensaje
            socket.on('sendMessage', (msg) => {
                if (typeof msg === 'string' && msg.trim().length > 0) {
                    io.emit('receiveMessage', { message: msg, timestamp: new Date() });
                } else {
                    socket.emit('error', 'Invalid message');
                }
            });

            // Manejar eventos de alerta
            socket.on('sendAlert', (alert) => {
                if (typeof alert === 'object' && alert.message && alert.type) {
                    console.log('Received alert:', alert); // Log para verificar la recepción de la alerta
                    io.emit('receiveAlert', {
                        type: alert.type,
                        message: alert.message,
                        timestamp: new Date()
                    });
                } else {
                    socket.emit('error', 'Invalid alert');
                }
            });

            socket.on('disconnect', () => {
                console.log('A user has disconnected');
            });
        });

        // Iniciar el servidor
        server.listen(port, () => {
            console.log('** Server online on port ' + port + ' **');
        });
    })
    .catch((error) => {
        console.error('** Database Connection Failed:', error + ' **');
    });

// Parsear objetos JSON entrantes
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json({ limit: '50mb', extended: true }));

// Aplicar middleware de CORS
app.use(corsMiddleware);


// Inicializar rutas
app.use('/api/alerts', alertRoute);
app.use('/api', authRoute);
app.use('/api', initialConfigRoute);
app.use('/api', userRoute);
app.use('/api', roleRoute);
app.use('/api', permissionRoute);
app.use('/api', businessRoute);
app.use('/api', auditLogsRoute);
app.use('/api', geoRoute);
app.use('/api/messages', messageRoute);


module.exports = app;
