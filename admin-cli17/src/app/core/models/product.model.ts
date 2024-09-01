import { SafeUrl } from "@angular/platform-browser";
import { Category } from "./category.model";
import { Subcategory } from './subcategory.model';

export interface Product {
    _id?: string;
    name: string;
    description?: string;
    category: {
        _id: string;
        title: string;
    };
    subcategory?: {
        _id: string;
        title: string;
    };
    manufacturer?: {
        name: string;
        brand: string;
    };
    price: number;
    discount?: number;
    stock: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    coverImage?: string;
    coverImageUrl?: SafeUrl;
    gallery?: { imageUrl: string; _id: string }[];
    galleryImages?: { imageUrl: string }[];
}



export interface ManufacturerInfo {
    name?: string;
    brand?: string;
}

export interface Image {
    imageUrl: string;
}

export interface Size {
    weight?: number;
    height?: number;
    width?: number;
    length?: number;
}
