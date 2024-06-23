import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
  
export class ValidationService {

  constructor() { }

  validateDate(control: FormControl): { [key: string]: any } | null {
    const inputDateStr: string = control.value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDateStr)) {
      return { invalidDateFormat: true };
    }
    return null;
  }

  validateLogo(file: File): { [key: string]: any } | null {
    if (!file) {
      return { required: true };
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { invalidFileType: true };
    }

    // Suponiendo un tamaño máximo de 4MB
    if (file.size > 4000000) {
      return { invalidFileSize: true };
    }

    return null; // No hay errores
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (group: AbstractControl) => {
      const control = group.get(controlName);
      const matchingControl = group.get(matchingControlName);

      if (!control || !matchingControl) {
        return null;
      }

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return null;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }

      return null;
    };
  }

  passwordValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    const hasDigit = /[0-9]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const valid = hasDigit && hasUppercase && hasLowercase && hasSpecialChar;
    return !valid ? { passwordStrength: true } : null;
  }


}

