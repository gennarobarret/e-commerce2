// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Importa tus interceptores personalizados
import { authTokenInterceptor } from './app/core/interceptors/auth-token.interceptor';
import { contentTypeInterceptor } from './app/core/interceptors/content-type.interceptor';
import { httpErrorInterceptor } from './app/core/interceptors/http-error.interceptor';
import { httpResponseInterceptor } from './app/core/interceptors/http-response.interceptor';

// Actualiza la configuración de la aplicación para incluir los interceptores HTTP
const updatedAppConfig = {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    provideHttpClient(withInterceptors([
      authTokenInterceptor,  // Interceptor para añadir el token de autenticación
      contentTypeInterceptor, // Interceptor para gestionar Content-Type
      httpErrorInterceptor,   // Interceptor para manejar errores HTTP
      httpResponseInterceptor // Interceptor para gestionar respuestas HTTP
    ]))
  ]
};

// Inicia la aplicación con la configuración actualizada
bootstrapApplication(AppComponent, updatedAppConfig)
  .catch((err) => console.error(err));
