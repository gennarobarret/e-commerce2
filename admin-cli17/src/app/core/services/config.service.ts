// core/services/config.service.ts
import { Injectable } from '@angular/core';
import { GLOBAL_CONFIG } from '../config/GLOBAL';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  getConfig() {
    return GLOBAL_CONFIG;
  }
}
