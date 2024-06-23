import { Injectable, HostListener } from '@angular/core';

declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class UIBootstrapService {

  constructor() { }


  enableTooltipsGlobally(): void {
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  enablePopoversGlobally(): void {
    const popoverTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.forEach(popoverTriggerEl => {
      new bootstrap.Popover(popoverTriggerEl);
    });
  }

  activateScrollspyForStickyNav(): void {
    const stickyNav = document.body.querySelector('#stickyNav');
    if (stickyNav) {
      new bootstrap.ScrollSpy(document.body, {
        target: '#stickyNav',
        offset: 82,
      });
    }
  }

  toggleSideNavigation(): void {
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
      if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
        document.body.classList.toggle('sidenav-toggled');
      }
      sidebarToggle.addEventListener('click', event => {
        event.preventDefault();
        document.body.classList.toggle('sidenav-toggled');
        localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sidenav-toggled').toString());
      });
    }
  }

  closeSideNavigationOnWidthChange(): void {
    const sidenavContent = document.body.querySelector('#layoutSidenav_content');
    if (sidenavContent) {
      sidenavContent.addEventListener('click', event => {
        const BOOTSTRAP_LG_WIDTH = 992;
        if (window.innerWidth < BOOTSTRAP_LG_WIDTH && document.body.classList.contains("sidenav-toggled")) {
          document.body.classList.toggle("sidenav-toggled");
        }
      });
    }
  }
  addActiveStateToSidebarNavLinks(): void {
    const matchResult = window.location.pathname.match(/\/([\w-]+\.html)$/);
    const activatedPath = matchResult ? matchResult[1] : 'index.html';
  
    const targetAnchors = Array.from(document.querySelectorAll(`[href="${activatedPath}"].nav-link`));
    targetAnchors.forEach(targetAnchor => {
      let parentNode = targetAnchor.parentNode as HTMLElement;
      while (parentNode !== null && parentNode !== document.documentElement) {
        if (parentNode.classList.contains('collapse')) {
          parentNode.classList.add('show');
          const parentNavLink = document.body.querySelector(`[data-bs-target="#${parentNode.id}"]`);
          if (parentNavLink) {
            parentNavLink.classList.remove('collapsed');
            parentNavLink.classList.add('active');
          }
        }
        parentNode = parentNode.parentNode as HTMLElement;
      }
      targetAnchor.classList.add('active');
    });
  } 

  showScrollTopButton(): void {
    const btnScrollTop = document.getElementById('btnScrollTop');
    if (btnScrollTop) {
      if (window.pageYOffset > 200) {
        btnScrollTop.style.display = 'block';
      } else {
        btnScrollTop.style.display = 'none';
      }
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
}
