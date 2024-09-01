        import { SafeUrl } from "@angular/platform-browser";
        import { Subcategory } from "./subcategory.model";


        export interface Category {
            _id?: string;
            title: string;
            slug: string;
            imageUrl?: SafeUrl | string | null; 
            description?: string;
            subcategories?: Subcategory[];
            createdAt?: Date;
            updatedAt?: Date;
        }
