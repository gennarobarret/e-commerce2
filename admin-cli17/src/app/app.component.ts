// app.component.ts
import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UIEnhancementService } from './core/services/uienhancement.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <router-outlet></router-outlet>
    <button id="btnScrollTop" class="btn btn-primary btn-scroll-top" 
            (click)="uiEnhancementService.scrollToTop()" aria-label="Top" title="Top">
      <i class="fa-solid fa-arrow-up"></i>
    </button>
  `
})
export class AppComponent {
  title = 'admin';

  // Inyecta el servicio usando la API inject
  uiEnhancementService = inject(UIEnhancementService);

  // Escucha el evento de scroll en la ventana
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.uiEnhancementService.showScrollTopButton();
  }
}
