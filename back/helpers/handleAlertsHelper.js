const handleAlerts = (log) => {
    switch (log.alertLevel) {
        case 'Crítico':
            sendEmail(log);  // Enviar por correo electrónico
            sendSMS(log);    // Enviar SMS
            break;
        case 'Alto':
            sendEmail(log);  // Enviar por correo electrónico
            break;
        case 'Medio':
            logInSystem(log);  // Solo registrar en el sistema para revisión
            break;
        case 'Bajo':
            // Normalmente no se envían alertas, solo se registran
            break;
        default:
            console.error('Nivel de alerta no definido');
    }
};

module.exports = { handleAlerts };
