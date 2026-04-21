import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { ScrollService } from './auth/services/scroll.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ThemeService } from './auth/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit, OnDestroy {
  isLoggedIn = false;
  userRole = '';
  currentRoute = '';
  isScrolled = false;

  get showMainNav(): boolean {
    return this.isLoggedIn && !this.isPublicPage() && !this.isRhRoute();
  }

  get showPublicNav(): boolean {

  if (this.currentRoute === '/' || this.currentRoute.startsWith('/offers')) {
    return true;
  }
  return !this.isLoggedIn && this.isPublicNavbarPage();
}

  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private scrollService: ScrollService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.updateAuthState();
    this.themeService.init();

    this.subscriptions.add(
      this.authService.authState$.subscribe((loggedIn) => {
        this.isLoggedIn = loggedIn;
        this.userRole = loggedIn ? this.authService.getUserRole() : '';
        console.log(
          '🔄 AuthState changé:',
          loggedIn,
          'Route:',
          this.currentRoute,
        );
      }),
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.currentRoute = event.urlAfterRedirects;
          console.log('🧭 Navigation vers:', this.currentRoute);
          this.checkDefaultRedirect();
        }),
    );
  }

  private checkDefaultRedirect(): void {
    if (this.isPublicPage()) {
      console.log('🔓 Page publique autorisée :', this.router.url);
      return;
    }

    const isStrictRoot = this.router.url === '/' || this.router.url === '';

    if (!this.isLoggedIn && isStrictRoot) {
      console.log('🚀 Redirection vers /offers (Racine stricte)');
      this.router.navigate(['/offers']);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private updateAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userRole = this.isLoggedIn ? this.authService.getUserRole() : '';
  }

  isPublicPage(): boolean {
    const url = this.router.url;

    const exactPublicRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/unauthorized',
      '/offers',
      '/',
    ];

    const isDynamicPublic =
      url.includes('/reset-password') ||
      url.includes('/auth/') ||
      url.includes('/api/public');

    if (exactPublicRoutes.some((route) => url === route) || isDynamicPublic) {
      return true;
    }

    return false;
  }

  isRhRoute(): boolean {
    return this.currentRoute.startsWith('/rh');
  }

  isCandidate(): boolean {
    const normalizedRole = this.userRole?.toUpperCase();
    return normalizedRole === 'ROLE_CANDIDAT' || normalizedRole === 'CANDIDAT';
  }

  getRoleDisplay(role: string): string {
    if (!role) return 'Visiteur';
    const roleMap: { [key: string]: string } = {
      ROLE_ADMIN: 'Administrateur',
      ROLE_RH: 'Responsable RH',
      ROLE_CANDIDAT: 'Candidat',
      ROLE_RECRUTEUR: 'Recruteur',
      CANDIDAT: 'Candidat',
      ADMIN: 'Administrateur',
      RH: 'Responsable RH',
    };
    return roleMap[role] || role;
  }

  getRoleClass(role: string): string {
    switch (role?.toUpperCase()) {
      case 'ROLE_ADMIN':
      case 'ADMIN':
        return 'admin';
      case 'ROLE_RH':
      case 'RH':
        return 'rh';
      case 'ROLE_CANDIDAT':
      case 'CANDIDAT':
        return 'candidat';
      default:
        return '';
    }
  }

  isPublicNavbarPage(): boolean {
    return this.currentRoute === '/' || this.currentRoute.startsWith('/offers');
  }

  goToOffers(): void {
    this.router.navigate(['/offers']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  navigateToOffers(): void {
    if (this.currentRoute === '/offers') {
      setTimeout(() => {
        const offersSection = document.getElementById('offers-section');
        if (offersSection) {
          const navbarHeight = 70;
          const elementPosition = offersSection.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - navbarHeight;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    } else {
      this.router.navigate(['/offers']);
    }
  }

  scrollToServices(): void {
    this.scrollService.scrollToServices();
  }

  scrollToFooter(): void {
    if (window.location.pathname === '/offers') {
      setTimeout(() => {
        const element = document.getElementById('footer-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      this.router.navigate(['/offers'], { fragment: 'footer-section' });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 50;
  }
}
