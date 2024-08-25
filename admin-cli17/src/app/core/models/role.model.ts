import { Permission } from './permission.model';

export interface Role {
    _id?: string;         // ID opcional, generado por MongoDB
    name: string;         // Nombre del rol (debe ser único)
    permissions: Permission[];  // Lista de permisos asociados al rol
}

export { Permission };
