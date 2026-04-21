import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

const API_URL = 'http://localhost:8080/api/auth/';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'token';
  private userInfoKey = 'user_info';
  private jwtHelper = new JwtHelperService();

  private authState = new BehaviorSubject<boolean>(this.hasValidToken());
  public authState$ = this.authState.asObservable();

  private currentUserSubject = new BehaviorSubject<any>(this.getCurrentUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      return !this.jwtHelper.isTokenExpired(token);
    } catch {
      return false;
    }
  }

  private emitAuthState(): void {
    this.authState.next(this.hasValidToken());
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(API_URL + 'signin', { username, password }).pipe(
      tap((response: any) => {
        console.log('🔑 Réponse COMPLÈTE du login:', response);

        if (response && response.accessToken) {
          this.setToken(response.accessToken);
        } else if (response && response.token) {
          this.setToken(response.token);
        }

        if (response) {
          localStorage.setItem(this.userInfoKey, JSON.stringify(response));
          this.currentUserSubject.next(response);
        }

        this.emitAuthState();
      }),
    );
  }

  register(data: any): Observable<any> {
    this.clearTokens();

    const formattedData = {
      fname: data.fname,
      lname: data.lname,
      phone: data.phone,
      username: data.username,
      email: data.email,
      password: data.password,
      role: Array.isArray(data.role) ? data.role : [data.role],
    };

    console.log('📤 Données envoyées:', formattedData);
    return this.http.post(API_URL + 'signup', formattedData);
  }

  private clearTokens(): void {
    console.log('🧹 Nettoyage des tokens avant inscription');

    const tokensToRemove = [
      'token',
      'user_info',
      'auth-token',
      'auth-user',
      'accessToken',
      'refreshToken',
    ];

    tokensToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    console.log('💾 Token sauvegardé avec clé:', this.tokenKey);
    this.emitAuthState();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  logout(): void {
    console.log('=== DÉCONNEXION ===');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userInfoKey);

    console.log('Token après suppression:', this.getToken());

    this.emitAuthState();
    this.currentUserSubject.next(null);

    this.router.navigate(['/login'], {
      queryParams: {
        reason: 'logout',
        previousUrl: this.router.url,
      },
    });
  }

  getCurrentUser(): any {
    const userJson = localStorage.getItem(this.userInfoKey);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('❌ Erreur de parsing des infos utilisateur:', e);
        return null;
      }
    }
    return null;
  }

  getUserRole(): string {
    const user = this.getCurrentUser();
    if (user) {
      console.log('🔍 DEBUG getUserRole - user:', user);
      if (user.role) {
        console.log('✅ Rôle trouvé dans user.role:', user.role);
        return user.role;
      } else if (
        user.roles &&
        Array.isArray(user.roles) &&
        user.roles.length > 0
      ) {
        console.log('✅ Rôle trouvé dans user.roles[0]:', user.roles[0]);
        return user.roles[0];
      } else if (
        user.authorities &&
        Array.isArray(user.authorities) &&
        user.authorities.length > 0
      ) {
        console.log(
          '✅ Rôle trouvé dans user.authorities[0]:',
          user.authorities[0],
        );
        return user.authorities[0];
      }
    }

    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        console.log('🔍 DEBUG getUserRole - decodedToken:', decodedToken);
        if (
          decodedToken?.roles &&
          Array.isArray(decodedToken.roles) &&
          decodedToken.roles.length > 0
        ) {
          return decodedToken.roles[0];
        } else if (decodedToken?.role) {
          return decodedToken.role;
        }
      } catch (error) {
        console.error('Erreur de décodage du token:', error);
      }
    }

    console.warn("⚠️ Aucun rôle trouvé pour l'utilisateur");
    return 'CANDIDAT';
  }

  isRecruiterOrAdmin(): boolean {
    console.log('=== DEBUG isRecruiterOrAdmin ===');

    if (!this.isLoggedIn()) {
      console.log('❌ Non connecté');
      return false;
    }

    const role = this.getUserRole();
    console.log('🔍 Rôle détecté:', role);
    console.log('🔍 Type du rôle:', typeof role);

    if (!role || role.trim() === '') {
      console.log('⚠️ Rôle vide ou non défini');
      return false;
    }

    const normalizedRole = this.normalizeRole(role);
    console.log('🔧 Rôle normalisé:', normalizedRole);

    const isRecruiter = normalizedRole.includes('RECRUTEUR');
    const isAdmin = normalizedRole.includes('ADMIN');
    const isRh = normalizedRole.includes('RH');
    const isRoleRh = normalizedRole.includes('ROLE_RH');
    const isRoleAdmin = normalizedRole.includes('ROLE_ADMIN');
    const isRoleRecruiter = normalizedRole.includes('ROLE_RECRUTEUR');

    console.log(`🔍 Vérifications:
    RECRUTEUR: ${isRecruiter}
    ADMIN: ${isAdmin}
    RH: ${isRh}
    ROLE_RH: ${isRoleRh}
    ROLE_ADMIN: ${isRoleAdmin}
    ROLE_RECRUTEUR: ${isRoleRecruiter}`);

    const result =
      isRecruiter ||
      isAdmin ||
      isRh ||
      isRoleRh ||
      isRoleAdmin ||
      isRoleRecruiter;
    console.log(`✅ Résultat final: ${result}`);
    console.log('=== FIN DEBUG ===');

    return result;
  }
  debugToken(): void {
    const token = localStorage.getItem('token');
    console.log('=== DEBUG TOKEN ===');
    console.log('1. Token présent?:', !!token);

    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(''),
        );

        const payload = JSON.parse(jsonPayload);
        console.log('2. Payload du token:', payload);
        console.log(
          '3. Roles dans token:',
          payload.roles || payload.authorities || payload.role,
        );
      } catch (e) {
        console.error('Erreur de décodage du token:', e);
      }
    }

    const userInfo = this.getCurrentUser();
    console.log('4. Infos utilisateur stockées:', userInfo);
    console.log('=== FIN DEBUG TOKEN ===');
  }

  getAllPossibleRoles(): string[] {
    const roles = [];
    const user = this.getCurrentUser();
    const token = this.getToken();

    if (user) {
      if (user.role) roles.push(user.role);
      if (user.roles && Array.isArray(user.roles)) roles.push(...user.roles);
      if (user.authorities && Array.isArray(user.authorities))
        roles.push(...user.authorities);
    }

    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        if (decodedToken?.role) roles.push(decodedToken.role);
        if (decodedToken?.roles) roles.push(...decodedToken.roles);
        if (decodedToken?.authorities) roles.push(...decodedToken.authorities);
      } catch (error) {
        console.error('Erreur de décodage:', error);
      }
    }

    return [...new Set(roles)];
  }

  isCandidate(): boolean {
    const role = this.getUserRole();
    console.log('🔍 Vérification candidat - Rôle:', role);

    if (!role) return false;

    const normalizedRole = this.normalizeRole(role);
    return normalizedRole.includes('CANDIDAT');
  }
  private normalizeRole(role: string): string {
    if (!role) return '';

    console.log(`🔧 Normalisation du rôle: "${role}"`);

    let normalized = role.toUpperCase().trim();

    if (!normalized.startsWith('ROLE_')) {
      normalized = 'ROLE_' + normalized;
    }

    console.log(`🔧 Rôle normalisé: "${normalized}"`);
    return normalized;
  }

  hasRole(expectedRole: string): boolean {
    if (!this.isLoggedIn()) return false;

    const userRole = this.getUserRole();
    const normalizedUserRole = this.normalizeRole(userRole);
    const normalizedExpectedRole = this.normalizeRole(expectedRole);

    return normalizedUserRole === normalizedExpectedRole;
  }

  getUserId(): number | null {
    const user = this.getCurrentUser();
    if (user && user.id) {
      return user.id;
    }

    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = this.jwtHelper.decodeToken(token);
        return decodedToken?.userId || decodedToken?.sub || null;
      } catch (error) {
        console.error('Erreur décodage token pour userId:', error);
      }
    }

    return null;
  }

  getTokenInfo(): any {
    const token = this.getToken();
    if (!token) {
      console.log('⚠️ getTokenInfo: Token est null');
      return null;
    }

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.error('❌ Token mal formé - pas de payload');
        return null;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(''),
      );

      const payload = JSON.parse(jsonPayload);

      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const diffInMinutes =
        (expirationDate.getTime() - now.getTime()) / (1000 * 60);

      return {
        payload,
        expirationDate,
        isExpired: payload.exp < Date.now() / 1000,
        expiresInMinutes: Math.round(diffInMinutes * 100) / 100,
      };
    } catch (e) {
      console.error('❌ Erreur décodage token dans getTokenInfo:', e);
      return null;
    }
  }

  getTokenSafe(): string | null {
    const token = this.getToken();
    if (!token) {
      console.log('⚠️ getTokenSafe: Token est null');
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Token mal formé - structure incorrecte');
      return null;
    }

    try {
      const payload = JSON.parse(atob(parts[1]));
      console.log('✅ Token valide - exp:', new Date(payload.exp * 1000));
      return token;
    } catch (e) {
      console.error('❌ Token invalide - erreur de décodage:', e);
      return null;
    }
  }

  redirectBasedOnRole(): void {
    const role = this.getUserRole();
    if (!role) {
      this.router.navigate(['/login']);
      return;
    }

    const normalizedRole = this.normalizeRole(role);

    if (normalizedRole.includes('ADMIN')) {
      this.router.navigate(['/admin']);
    } else if (normalizedRole.includes('RH')) {
      this.router.navigate(['/rh']);
    } else if (normalizedRole.includes('CANDIDAT')) {
      this.router.navigate(['/candidate']);
    } else {
      this.router.navigate(['/unauthorized']);
    }
  }

  private normalizeRoleForRedirect(role: string): string {
    if (!role) return '';

    let normalized = role.toUpperCase();

    if (!normalized.startsWith('ROLE_')) {
      normalized = 'ROLE_' + normalized;
    }

    return normalized;
  }

  debugUserInfo(): void {
    console.log('=== DEBUG USER INFO ===');
    console.log('Token:', this.getToken());
    console.log('Current User:', this.getCurrentUser());
    console.log('User Role:', this.getUserRole());
    console.log('All Possible Roles:', this.getAllPossibleRoles());

    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token Payload:', payload);
        console.log('Roles in token:', payload.roles || payload.role);
      } catch (e) {
        console.error('Error decoding token:', e);
      }
    }
    console.log('=== END DEBUG ===');
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(API_URL + 'forgot-password', null, {
      params: { email },
    });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(
      `http://localhost:8080/api/auth/reset-password`,
      null,
      { params: { token, newPassword } },
    );
  }
  handleOAuthCallback(provider: string, code: string): Observable<any> {
    return this.http.post(`${API_URL}oauth/${provider}`, { code });
  }
  updateProfile(profileData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.put(`${API_URL}profile`, profileData, { headers }).pipe(
      tap((response: any) => {
        this.setToken(response.accessToken);
        this.setCurrentUser(response);
      }),
    );
  }

  setCurrentUser(user: any): void {
    localStorage.setItem(this.userInfoKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getProfile(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(API_URL + 'profile', { headers });
  }
}
