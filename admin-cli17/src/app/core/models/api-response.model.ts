// src/app/models/api-response.model.ts
export interface ApiResponse<T> {
    status: string;
    message: string;
    data: T;
}
