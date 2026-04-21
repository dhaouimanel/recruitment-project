import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RhStatistiques {
  totalOffers: number;
  publishedOffers: number;
  totalApplications: number;
  averagePerOffer: number;
  conversionRate: number;
  applicationsByStatus: { [key: string]: number };
  applicationsOverTime: { month: string; count: number }[];
  topLocations: { location: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class RhStatistiquesService {
  private apiUrl = 'http://localhost:8080/api/rh/statistics';


  constructor(private http: HttpClient) {}

 getStatistics(): Observable<RhStatistiques> {
  return this.http.get<RhStatistiques>(this.apiUrl);
}
}
