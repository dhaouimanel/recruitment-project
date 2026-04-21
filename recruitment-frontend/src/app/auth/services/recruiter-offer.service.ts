import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RecruiterOfferService {
  private apiUrl = 'http://localhost:8080/api/recruiter/offers';

  constructor(private http: HttpClient) {}

  generateEmbeddings(): Observable<string> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/generate-embeddings`, {}, { headers, responseType: 'text' });
  }
}
