import { Injectable } from '@angular/core';
declare let iziToast: any;


@Injectable({
  providedIn: 'root' // Esto asegura que el servicio sea un singleton
})


export class ToastService {

  constructor() { }

  showToast(type: 'success' | 'warning' | 'error', message: string) {
    let options = {
      position: "topRight",
      message: message
    };

    switch (type) {
      case 'success':
        iziToast.success({
          ...options,
          title: "SUCCESS",
          titleColor: "#1DC74C",
          color: "#FFF",
          class: "text-success",
        });
        break;
      case 'warning':
        iziToast.warning({
          ...options,
          title: "CAUTION",
        });
        break;
      case 'error':
        iziToast.error({
          ...options,
          title: "ERROR",
        });
        break;
      default:
        throw new Error(`Unrecognized toast type: ${type}`);
    }
  }
}
