export interface Notification {
    _id: string; // ID de la notificación
    userId: string; // ID del usuario al que pertenece la notificación
    icon: string; // Ícono de la notificación
    message: string; // Mensaje de la notificación
    date: Date; // Fecha de la notificación
    type: 'success' | 'info' | 'danger' | 'warning'; // Tipo de la notificación
    isViewed: boolean; // Indica si la notificación ha sido vista
    createdAt: Date; // Fecha de creación
    updatedAt: Date; // Fecha de actualización
}
