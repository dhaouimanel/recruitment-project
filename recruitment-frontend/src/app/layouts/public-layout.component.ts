import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss'],
})
export class PublicLayoutComponent implements OnInit {
  isLoggedIn = false;
  userRole = '';
  userRoleDisplay = '';
  private routerSubscription: any;
  successMessage = '';
  errorMessage = '';

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const tree = this.router.parseUrl(this.router.url);
        if (tree.fragment) {
          setTimeout(() => {
            this.scrollToSection(tree.fragment!);
          }, 200);
        }
      }
    });

    setTimeout(() => {
      this.onWindowScroll();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.userRole = this.authService.getUserRole() || '';
      this.userRoleDisplay = this.normalizeRoleForDisplay(this.userRole);
    }
  }

  normalizeRoleForDisplay(role: string): string {
    if (!role) return '';
    if (role.toUpperCase().startsWith('ROLE_')) {
      return role.substring(5);
    }
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  scrollToSection(sectionId: string): void {
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const navbarHeight = 70;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 100);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const navbar = document.querySelector('.navbar-fixed');
    if (navbar) {
      if (window.pageYOffset > 100) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
    this.userRoleDisplay = '';
    this.router.navigate(['/offers']);
  }

  submitNewsletter(): void {
    const emailInput = document.querySelector(
      '.newsletter-input',
    ) as HTMLInputElement;
    if (emailInput && emailInput.value) {
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailRegex.test(email)) {
        this.successMessage =
          'Vous êtes maintenant inscrit à notre newsletter !';
        emailInput.value = '';

        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      } else {
        this.errorMessage = 'Veuillez entrer une adresse email valide';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    }
  }
}
