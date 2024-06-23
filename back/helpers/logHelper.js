const path = require('path');
const fs = require('fs');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// Función para asegurar que una carpeta existe
function ensureDirSync(dirPath) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
        if (err.code !== 'EEXIST') throw err; // Solo lanza error si no es por 'EEXIST'
    }
}

// Ruta para la carpeta de logs en el directorio raíz del proyecto
const logsDir = path.join(__dirname, '..', 'logs');

// Asegurar que la carpeta de logs exista
ensureDirSync(logsDir);

// Ruta para la carpeta de logs de errores
const errorsLogDir = path.join(logsDir, 'errors');

// Asegurar que la carpeta de logs de errores exista
ensureDirSync(errorsLogDir);

// Ruta para la carpeta de logs combinados
const combinedLogDir = path.join(logsDir, 'combined');

// Asegurar que la carpeta de logs combinados exista
ensureDirSync(combinedLogDir);

const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    level: 'debug', // Captura todos los niveles desde 'debug' hacia arriba en consola
});

const errorTransport = new winston.transports.DailyRotateFile({
    filename: path.join(errorsLogDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
});

const combinedTransport = new winston.transports.DailyRotateFile({
    filename: path.join(combinedLogDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info', // Aquí estableces el nivel 'info' para los logs combinados
    maxSize: '20m',
    maxFiles: '30d',
});

const warnTransport = new winston.transports.DailyRotateFile({
    filename: path.join(combinedLogDir, 'warn-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'warn', // Aquí estableces el nivel 'warn' para los logs de advertencias
    maxSize: '20m',
    maxFiles: '30d',
});

const logger = winston.createLogger({
    level: 'silly', // Nivel de log más detallado posible
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        errorTransport,
        combinedTransport,
        warnTransport
    ]
});

// Agregar el transporte de la consola solo en entornos que no sean de producción
if (process.env.NODE_ENV !== 'production') {
    logger.add(consoleTransport);
}

module.exports = logger;
