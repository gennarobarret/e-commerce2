'use strict';

const Notification = require('../models/notificationModel');

class NotificationService {
    async createNotification({ userId, icon, message, type }) {
        const notification = new Notification({
            userId,
            icon,
            message,
            type
        });
        await notification.save();

        // Emitir la notificación a través de Socket.io
        if (global.io && global.users[userId]) {
            global.io.to(global.users[userId]).emit('notification', notification);
            console.log('Emitted notification to user:', userId, notification); // Agregar log para depuración
        }

        return notification;
    }

    async getNotifications(userId) {
        return Notification.find({ userId }).sort({ date: -1 });
    }
}

module.exports = new NotificationService();
