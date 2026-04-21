import { Injectable } from '@angular/core';
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  CanActivate,
} from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RhAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    console.log('🛡️ RhAuthGuard vérification...');

    if (!this.authService.isLoggedIn()) {
      console.log('❌ Non connecté, redirection vers login');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    const userRole = this.authService.getUserRole();
    const isAuthorized = this.authService.isRecruiterOrAdmin();

    console.log('🔑 Rôle utilisateur:', userRole);
    console.log('✅ Est autorisé?:', isAuthorized);

    if (!isAuthorized) {
      console.log('❌ Rôle insuffisant, redirection vers unauthorized');
      this.router.navigate(['/unauthorized'], {
        queryParams: {
          requiredRole: 'RH ou ADMIN',
          currentRole: userRole,
        },
      });
      return false;
    }

    console.log('✅ Accès autorisé pour la route:', state.url);
    return true;
  }
}
