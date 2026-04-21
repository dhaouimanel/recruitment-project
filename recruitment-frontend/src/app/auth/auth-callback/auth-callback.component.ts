import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export class AuthCallbackComponent implements OnInit {
  providerName: string = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private tokenService: TokenService,
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const provider = this.route.snapshot.paramMap.get('provider') || 'google';
    this.providerName = provider;

    if (!code) {
      console.error('❌ Aucun code de validation reçu');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.handleOAuthCallback(provider, code).subscribe({
      next: (response) => {
        console.log('✅ OAuth Succès:', response);

        const token = response.accessToken || response.token;
        if (!token) {
          console.error('❌ Token manquant dans la réponse API');
          this.router.navigate(['/login']);
          return;
        }

        this.authService.setToken(token);
        this.authService.setCurrentUser(response);

        if (
          this.authService.authState$ &&
          'next' in this.authService.authState$
        ) {
          (this.authService.authState$ as any).next(true);
        }

        const roles: string[] = response.roles || [];
        this.redirectBasedOnRole(roles);
      },
      error: (err) => {
        console.error("❌ Erreur lors de l'échange OAuth:", err);
        this.router.navigate(['/login'], {
          queryParams: { error: 'oauth_failed' },
        });
      },
    });
  }

  private redirectBasedOnRole(roles: string[]): void {
    const normalizedRoles = roles.map((r) => r.toUpperCase());

    console.log('🔀 Calcul de la redirection pour les rôles:', normalizedRoles);

    if (
      normalizedRoles.includes('ROLE_ADMIN') ||
      normalizedRoles.includes('ADMIN')
    ) {
      this.router.navigate(['/admin'], { replaceUrl: true });
    } else if (
      normalizedRoles.includes('ROLE_RH') ||
      normalizedRoles.includes('RH')
    ) {
      this.router.navigate(['/rh'], { replaceUrl: true });
    } else if (
      normalizedRoles.includes('ROLE_CANDIDAT') ||
      normalizedRoles.includes('CANDIDAT')
    ) {
      this.router.navigate(['/candidate'], { replaceUrl: true });
    } else {
      console.warn('⚠️ Aucun rôle reconnu, redirection par défaut');
      this.router.navigate(['/candidate'], { replaceUrl: true });
    }
  }
}
