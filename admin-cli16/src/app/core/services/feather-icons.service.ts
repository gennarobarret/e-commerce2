import { Injectable } from '@angular/core';

declare var feather: any;

@Injectable({
  providedIn: 'root'
})
export class FeatherIconsService {

  constructor() { }

  activateFeatherIcons(): void {
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

}
