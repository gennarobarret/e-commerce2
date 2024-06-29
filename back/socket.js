'use strict';

require('dotenv').config();
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Notification = require('./models/notificationModel'); // Asegúrate de que la ruta sea correcta

const JWT_SECRET = process.env.JWT_SECRET;

global.users = {}; // Objeto global para almacenar usuarios conectados

function socketSetup(server) {
    const io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    global.io = io;

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }
            socket.userId = decoded.sub;
            next();
        });
    });

    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.userId);
        users[socket.userId] = socket.id;
        console.log('Connected users:', global.users); // Agregar log para depuración

        socket.on('disconnect', () => {
            console.log('User disconnected: ' + socket.userId);
            delete users[socket.userId];
            console.log('Connected users after disconnect:', global.users); // Agregar log para depuración
        });
    });

    return io;
}

module.exports = socketSetup;


// 'use strict';

// require('dotenv').config();

// const socketIo = require('socket.io');
// const jwt = require('jsonwebtoken');

// const JWT_SECRET = process.env.JWT_SECRET; // Asegúrate de usar una clave secreta segura

// let users = {}; // Objeto para almacenar usuarios conectados

// function socketSetup(server) {
//     const io = socketIo(server, {
//         cors: {
//             origin: "*", // Ajusta esto según la configuración de CORS de tu frontend
//             methods: ["GET", "POST"]
//         }
//     });

//     io.use((socket, next) => {
//         const token = socket.handshake.auth.token;
//         if (!token) {
//             return next(new Error('Authentication error'));
//         }
//         jwt.verify(token, JWT_SECRET, (err, decoded) => {
//             if (err) {
//                 return next(new Error('Authentication error'));
//             }
//             socket.userId = decoded.sub;
//             next();
//         });
//     });

//     io.on('connection', (socket) => {
//         console.log('A user connected: ' + socket.userId);
//         users[socket.userId] = socket.id;

//         // Emitir un mensaje de bienvenida al usuario conectado
//         socket.emit('welcome', {
//             userId: socket.userId,
//             icon: 'info', // Puedes cambiar esto por cualquier ícono que necesites
//             message: 'Welcome to the server!',
//             date: new Date(),
//             type: 'info',
//             isViewed: false
//         });

//         socket.on('disconnect', () => {
//             console.log('User disconnected: ' + socket.userId);
//             delete users[socket.userId];
//         });
//     });

//     return io;
// }

// module.exports = socketSetup;
