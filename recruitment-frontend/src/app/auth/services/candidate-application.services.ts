import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CandidateApplicationDto } from '../../models/application.dto';
import { AuthService } from './auth.service';
import { CandidateApplicationWithScoreDto } from '../../models/application.model';
import { SearchResult } from './public-offer.service';

@Injectable({
  providedIn: 'root',
})
export class CandidateApplicationService {
  private apiUrl = 'http://localhost:8080/api/candidate/applications';
  private apiUrlRecruiter = 'http://localhost:8080/api/recruiter/applications';

  private searchUrl = 'http://localhost:8080/api/candidate/offers/search';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  getMyApplications(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  getMyApplicationsWithOffers(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.apiUrl}/with-offers`, { headers });
  }

  apply(applicationDto: CandidateApplicationDto): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(this.apiUrl, applicationDto, { headers });
  }

  applyWithFiles(formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    console.log(
      '🔐 Token utilisé pour la requête:',
      token ? 'Présent' : 'Absent',
    );

    if (!token) {
      console.error('❌ Pas de token disponible');
      return throwError(() => new Error('Non authentifié'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .post(`${this.apiUrl}/with-files`, formData, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error("❌ Erreur lors de l'envoi de la candidature:", {
            status: error.status,
            message: error.message,
            error: error.error,
          });
          return throwError(() => error);
        }),
      );
  }

  getApplicationsByOffer(offerId: number): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(`${this.apiUrlRecruiter}/offer/${offerId}`, {
      headers,
    });
  }

  downloadCv(applicationId: number): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${this.apiUrl}/${applicationId}/cv`, {
      headers,
      responseType: 'blob',
    });
  }

  downloadCoverLetter(applicationId: number): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${this.apiUrl}/${applicationId}/cover-letter`, {
      headers,
      responseType: 'blob',
    });
  }

  updateApplicationStatus(
    applicationId: number,
    status: string,
  ): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.patch(
      `${this.apiUrlRecruiter}/${applicationId}/status`,
      { status },
      { headers },
    );
  }

  getMyApplicationsWithScores(): Observable<
    CandidateApplicationWithScoreDto[]
  > {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<CandidateApplicationWithScoreDto[]>(
      `${this.apiUrl}/with-scores`,
      { headers },
    );
  }

  searchOffers(query?: string, location?: string): Observable<SearchResult[]> {
    let params = new HttpParams();
    if (query) params = params.set('query', query);
    if (location) params = params.set('location', location);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<SearchResult[]>(this.searchUrl, { headers, params });
  }

  checkIfAlreadyApplied(offerId: number): Observable<boolean> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params = new HttpParams().set('offerId', offerId.toString());

    return this.http.get<boolean>(`${this.apiUrl}/check`, { headers, params });
  }

  deleteApplication(applicationId: number): Observable<void> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .delete<void>(`${this.apiUrl}/${applicationId}`, { headers })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMsg = 'Erreur lors de la suppression';
          if (error.status === 403) {
            errorMsg = error.error?.error || 'Action non autorisée';
          } else if (error.status === 404) {
            errorMsg = 'Candidature introuvable';
          } else if (error.error?.error) {
            errorMsg = error.error.error;
          }
          return throwError(() => new Error(errorMsg));
        }),
      );
  }

  // Ajouter cette propriété
private profileUrl = 'http://localhost:8080/api/candidate/profile';

getMyCv(): Observable<Blob> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get(`${this.profileUrl}/cv`, { headers, responseType: 'blob' });
}

uploadMyCv(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('cv', file);
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.post(`${this.profileUrl}/cv`, formData, { headers });
}

deleteMyCv(): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.delete(`${this.profileUrl}/cv`, { headers });
}

getMyCvInfo(): Observable<{filename: string, size: number}> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get<{filename: string, size: number}>(`${this.profileUrl}/cv-info`, { headers });
}

// Dans CandidateApplicationService
getPreviousCvs(): Observable<{ applicationId: number, cvFileName: string, offerTitle: string, applicationDate: string }[]> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get<{ applicationId: number, cvFileName: string, offerTitle: string, applicationDate: string }[]>(`${this.apiUrl}/cv-history`, { headers });
}

downloadCvByPath(applicationId: number): Observable<Blob> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get(`${this.apiUrl}/${applicationId}/cv`, { headers, responseType: 'blob' });
}
}
