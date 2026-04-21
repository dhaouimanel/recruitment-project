import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offer } from '../../models/offer.model';

export interface SearchResult {
  offer: Offer;
  similarity: number;
}

@Injectable({
  providedIn: 'root',
})
export class PublicOfferService {
  private apiUrl = 'http://localhost:8080/api/public/offers';

  private searchUrl = 'http://localhost:8080/api/candidate/offers/search';

  constructor(private http: HttpClient) {}

  getPublishedOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.apiUrl);
  }

  getOfferById(id: number): Observable<Offer> {
    return this.http.get<Offer>(`${this.apiUrl}/${id}`);
  }
}
