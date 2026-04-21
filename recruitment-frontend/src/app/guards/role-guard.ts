import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 === ROLE GUARD DÉBUT ===');
  console.log('URL demandée:', state.url);

  if (!authService.isLoggedIn()) {
    console.log('❌ Non connecté → /login');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  console.log('🎯 Rôles requis:', requiredRoles);

  if (!requiredRoles || requiredRoles.length === 0) {
    console.log('✅ Pas de restriction de rôle');
    return true;
  }

  const userJson = localStorage.getItem('user_info');
  const user = userJson ? JSON.parse(userJson) : null;
  const token = localStorage.getItem('token');

  console.log('👤 user_info brut:', user);
  console.log('🔑 token présent:', !!token);

  let userRoles: string[] = [];

  if (user?.roles && Array.isArray(user.roles)) {
    userRoles = user.roles;
  } else if (user?.role) {
    userRoles = [user.role];
  }

  if (userRoles.length === 0 && token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 Token payload:', payload);
      if (payload?.roles && Array.isArray(payload.roles)) {
        userRoles = payload.roles;
      }
    } catch (e) {
      console.error('❌ Erreur décodage token:', e);
    }
  }

  console.log('🎭 Rôles utilisateur trouvés:', userRoles);

  const normalizeRole = (role: string): string => {
    if (!role) return '';
    role = role.toUpperCase().trim();
    if (!role.startsWith('ROLE_')) role = 'ROLE_' + role;
    return role;
  };

  const normalizedUserRoles = userRoles.map(normalizeRole);
  console.log('🔧 Rôles normalisés:', normalizedUserRoles);

  const hasRequiredRole = requiredRoles.some((required) =>
    normalizedUserRoles.includes(normalizeRole(required)),
  );

  console.log('✅ Accès autorisé:', hasRequiredRole);

  if (!hasRequiredRole) {
    console.log(`❌ Accès refusé → /unauthorized`);
    console.log('   Rôles utilisateur:', normalizedUserRoles);
    console.log('   Rôles requis:', requiredRoles.map(normalizeRole));
    router.navigate(['/unauthorized']);
    return false;
  }

  console.log('🔐 === ROLE GUARD FIN ===');
  return true;
};
