import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DebugService {
  constructor(private http: HttpClient) {}

  testAuth(): void {
    const token = localStorage.getItem('token');
    console.log('=== TEST AUTH ===');
    console.log('Token:', token);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Payload JWT:', payload);
        console.log('Expiration:', new Date(payload.exp * 1000));
        console.log('Rôles:', payload.roles || payload.authorities);
      } catch (e) {
        console.error('Erreur décodage token:', e);
      }
    }
  }

  testEndpoint(url: string): void {
    console.log('=== TEST ENDPOINT ===');
    console.log('URL:', url);

    this.http
      .get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      .subscribe({
        next: (response) => console.log('✅ Réponse:', response),
        error: (error) => console.log('❌ Erreur:', error),
      });
  }
}
