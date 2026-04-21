import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔄 Intercepteur pour URL:', req.url);

  const publicAuthEndpoints = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/oauth/google',
    '/api/auth/oauth/linkedin',
  ];

  if (publicAuthEndpoints.some((endpoint) => req.url.includes(endpoint))) {
    console.log('🔓 Endpoint public - pas de token');
    const authReq = req.clone({ headers: req.headers.delete('Authorization') });
    return next(authReq);
  }

  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') {
    console.warn('⚠️ Pas de token valide');
    return next(req);
  }

  console.log('🔐 Token utilisé:', token.substring(0, 20) + '...');
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq);
};
