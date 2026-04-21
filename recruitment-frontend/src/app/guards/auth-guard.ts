import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AuthGuard activé pour:', state.url);

  if (authService.isLoggedIn()) {
    console.log('✅ AuthGuard: Utilisateur connecté');
    return true;
  }

  console.log('❌ AuthGuard: Utilisateur non connecté, redirection vers login');
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
