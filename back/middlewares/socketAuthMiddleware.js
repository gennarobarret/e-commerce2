"use strict";
const jwt = require('jsonwebtoken');

const socketAuthMiddleware = (io) => {
    io.use((socket, next) => {
        const token = extractToken(socket.handshake);
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if (err) {
                    console.error('JWT Verification Error:', err.message);
                    return next(new Error('Authentication failed: ' + err.message));
                }
                // console.log('Authenticated user:', decoded);
                socket.user = decoded; // Guarda la información del usuario en el socket
                next();
            });
        } else {
            console.error('No authentication token provided');
            next(new Error('No authentication token provided'));
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected with id:', socket.id);

        socket.on('reconnect', (attemptNumber) => {
            console.log(`User reconnected on attempt ${attemptNumber}`);
        });

        // Validar token en cada evento
        socket.use((packet, next) => {
            const token = extractToken(socket.handshake);
            if (token) {
                jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                    if (err) {
                        console.error('Token validation failed:', err.message);
                        return next(new Error('Token validation failed: ' + err.message));
                    }
                    socket.user = decoded; // Actualiza la información del usuario en el socket
                    next();
                });
            } else {
                console.error('No authentication token provided during event handling');
                next(new Error('No authentication token provided'));
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected with id:', socket.id);
        });
    });
};

// Función para extraer el token del handshake del socket
function extractToken(handshake) {
    let token = handshake.query.token || handshake.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length); // Remueve el prefijo 'Bearer '
    }
    // console.log('Extracted token:', token);
    return token;
}

module.exports = socketAuthMiddleware;
