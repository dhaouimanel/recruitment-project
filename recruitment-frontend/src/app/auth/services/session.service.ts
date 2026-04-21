import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private heartbeatInterval: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  startHeartbeat(): void {
    this.heartbeatInterval = interval(2 * 60 * 1000).subscribe(() => {
      this.checkSession();
    });
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      this.heartbeatInterval.unsubscribe();
    }
  }

  checkSession(): void {
    if (!this.authService.isLoggedIn()) return;

    const tokenInfo = this.authService.getTokenInfo();
    console.log('❤️ Heartbeat - Session info:', tokenInfo);

    if (
      tokenInfo &&
      tokenInfo.expiresInMinutes < 5 &&
      tokenInfo.expiresInMinutes > 0
    ) {
      console.log('⚠️ Token expire bientôt, afficher un avertissement');
    }
  }

  refreshToken(): Promise<boolean> {
    return new Promise((resolve) => {
      this.http
        .post<any>('http://localhost:8080/api/auth/refresh', {
          token: this.authService.getToken(),
        })
        .subscribe({
          next: (response) => {
            if (response.token) {
              this.authService.setToken(response.token);
              console.log('✅ Token rafraîchi avec succès');
              resolve(true);
            } else {
              resolve(false);
            }
          },
          error: () => {
            resolve(false);
          },
        });
    });
  }
}
