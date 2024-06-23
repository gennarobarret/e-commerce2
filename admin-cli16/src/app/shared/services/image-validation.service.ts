import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageValidationService {
  private validTypes = ['image/png', 'image/webp', 'image/jpg', 'image/gif', 'image/jpeg'];

  constructor() { }

  public validateImageType(file: File): boolean {
    return this.validTypes.includes(file.type);
  }

  public validateImageSize(file: File, maxSize: number = 4000000): boolean {
    return file.size <= maxSize;
  }
}
