import { Component, HostListener } from '@angular/core';
import { UIBootstrapService } from './core/services/uibootstrap.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'admin';

  constructor(public uiBootstrapService: UIBootstrapService,
  ) { }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.uiBootstrapService.showScrollTopButton();
  }
}