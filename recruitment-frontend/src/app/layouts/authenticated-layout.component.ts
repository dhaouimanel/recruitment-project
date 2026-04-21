import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './authenticated-layout.component.html',
  styleUrls: ['./authenticated-layout.component.scss'],
})
export class AuthenticatedLayoutComponent implements OnInit {
  isLoggedIn = false;
  userRole = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    console.log('=== AUTHENTICATED LAYOUT INIT ===');
    this.updateAuthState();

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        console.log('Navigation vers:', event.url);
        this.updateAuthState();
      }
    });
  }

  private updateAuthState(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    console.log('isLoggedIn:', this.isLoggedIn);

    if (this.isLoggedIn) {
      this.userRole = this.authService.getUserRole() || '';
      console.log('userRole:', this.userRole);
    } else {
      this.userRole = '';
    }
  }

  isCandidate(): boolean {
    const normalizedRole = this.userRole.toUpperCase();
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

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
    this.router.navigate(['/login']);
  }

  getRoleClass(role: string): string {
    switch (role.toUpperCase()) {
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
}
