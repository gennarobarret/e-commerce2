// import { Injectable } from '@angular/core';
// import { FormControl } from '@angular/forms';

// @Injectable({
//   providedIn: 'root'
// })
// export class DateService {

//   constructor() { }

//   convertDateFormat(dateString: string): string {
//     const date = new Date(dateString);
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   }

//   validateDate(control: FormControl): { [key: string]: any } | null {
//     const inputDateStr: string = control.value;
//     if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDateStr)) {
//       return { invalidDateFormat: true };
//     }
//     return null;
//   }


// }
