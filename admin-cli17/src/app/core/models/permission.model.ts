export interface Permission {
    _id?: string;         // ID opcional, generado por MongoDB
    name: string;         // Nombre del permiso (debe ser único)
    action: string;       // Acción que el permiso autoriza
    resource: string;     // Recurso al que se aplica el permiso
}
