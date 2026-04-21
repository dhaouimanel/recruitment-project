import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Offer } from '../../models/offer.model';
import {
  ApplicationResponse,
  ApplicationStatus,
} from '../../models/application.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class RhService {
  private apiUrl = 'http://localhost:8080/api/rh/offers';
  private applicationsApiUrl = 'http://localhost:8080/api/rh/applications';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(this.apiUrl);
  }

  createOffer(offer: Offer): Observable<Offer> {
    return this.http.post<Offer>(this.apiUrl, offer);
  }

  updateOffer(id: number, offer: Offer): Observable<Offer> {
    return this.http.put<Offer>(`${this.apiUrl}/${id}`, offer);
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllApplications(): Observable<ApplicationResponse[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<ApplicationResponse[]>(this.applicationsApiUrl, {
      headers,
    });
  }

  getApplicationsByOffer(
    offerId: number,
    sortBySimilarity: boolean = false,
  ): Observable<ApplicationResponse[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    let url = `${this.applicationsApiUrl}/by-offer/${offerId}`;
    if (sortBySimilarity) {
      url += `?sortBySimilarity=true`;
    }

    return this.http.get<any[]>(url, { headers }).pipe(
      tap((response) =>
        console.log(
          `📡 Candidatures pour offre ${offerId} (sortBySimilarity=${sortBySimilarity}) :`,
          response,
        ),
      ),
      map((response) => response as ApplicationResponse[]),
    );
  }

  getBestCvForOffer(offerId: number): Observable<ApplicationResponse> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<ApplicationResponse>(
      `${this.applicationsApiUrl}/by-offer/${offerId}/best-cv`,
      { headers },
    );
  }

  getAdaptedCvsForOffer(
    offerId: number,
    seuil: number = 0.5,
  ): Observable<ApplicationResponse[]> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get<ApplicationResponse[]>(
      `${this.applicationsApiUrl}/by-offer/${offerId}/adapted?seuil=${seuil}`,
      { headers },
    );
  }
  updateApplicationStatus(
    applicationId: number,
    status: ApplicationStatus,
  ): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.patch(
      `${this.applicationsApiUrl}/${applicationId}/status`,
      { status },
      { headers },
    );
  }

  downloadCv(applicationId: number): Observable<Blob> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${this.applicationsApiUrl}/${applicationId}/cv`, {
      headers,
      responseType: 'blob',
    });
  }

  downloadCoverLetter(applicationId: number): Observable<Blob> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(
      `${this.applicationsApiUrl}/${applicationId}/cover-letter`,
      {
        headers,
        responseType: 'blob',
      },
    );
  }

  getApplicationsStats(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<any>(`${this.applicationsApiUrl}/stats`, { headers });
  }

  getProfile(): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    return this.http.get<any>(`http://localhost:8080/api/auth/profile`, {
      headers,
    });
  }

  updateProfile(profileData: any): Observable<any> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .put<any>(`http://localhost:8080/api/auth/profile`, profileData, {
        headers,
      })
      .pipe(
        tap((response: any) => {
          this.authService.setToken(response.accessToken);
          this.authService.setCurrentUser(response);
        }),
      );
  }
}
