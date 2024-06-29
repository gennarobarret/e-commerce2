import { Component, HostListener, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UIEnhancementService } from './core/services/uienhancement.service';
import { AuthService } from './core/services/auth.service';

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
export class AppComponent implements OnInit {
  title = 'admin';

  // Inyecta el servicio usando la API inject
  uiEnhancementService = inject(UIEnhancementService);

  constructor(private authService: AuthService) { }

  ngOnInit() {
    const token = this.authService.getToken();
    if (token) {
      this.authService.checkSocketConnection(token);
    }
  }

  // Escucha el evento de scroll en la ventana
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.uiEnhancementService.showScrollTopButton();
  }
}
