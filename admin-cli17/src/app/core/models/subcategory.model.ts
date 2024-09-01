import { Category } from "./category.model";


export interface Subcategory {
    _id?: string;
    title: string;
    category: string | Category;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
