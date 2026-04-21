import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offer } from '../../models/offer.model';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private apiUrl = 'http://localhost:8080/api/admin/offers';

  constructor(private http: HttpClient) {}

  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.apiUrl);
  }
  /*createOffer(offer: Offer): Observable<Offer> {
  return this.http.post<Offer>(this.apiUrl, offer); // interceptor gère le token
}
updateOffer(id: number, offer: Offer): Observable<Offer> {
  return this.http.put<Offer>(`${this.apiUrl}/${id}`, offer);
}
deleteOffer(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}*/
}
