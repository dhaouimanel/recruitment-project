import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  PublicOfferService,
  SearchResult,
} from '../../../auth/services/public-offer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidateApplicationService } from '../../../auth/services/candidate-application.services';
import { Offer } from '../../../models/offer.model';

@Component({
  selector: 'app-candidate-offer-search',
  templateUrl: './candidate-offer-search.component.html',
  styleUrls: ['./candidate-offer-search.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class CandidateOfferSearchComponent {
  query: string = '';
  location: string = '';
  results: SearchResult[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private applicationService: CandidateApplicationService,
    private offerService: PublicOfferService,
    private router: Router,
  ) {}

  onSearch(): void {
    if (!this.query.trim() && !this.location.trim()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.applicationService.searchOffers(this.query, this.location).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          if (data[0] && typeof data[0] === 'object' && 'offer' in data[0]) {
            this.results = data as SearchResult[];
          } else {
            this.results = (data as unknown as Offer[]).map((offer) => ({
              offer,
              similarity: 0,
            }));
          }
        } else {
          this.results = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur recherche:', err);
        this.errorMessage = 'Une erreur est survenue lors de la recherche.';
        this.isLoading = false;
      },
    });
  }
  loadAllOffers(): void {
    this.isLoading = true;
    this.offerService.getPublishedOffers().subscribe({
      next: (offers) => {
        this.results = offers.map((offer) => ({ offer, similarity: 0 }));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Impossible de charger les offres.';
        this.isLoading = false;
      },
    });
  }

  getSimilarityColor(score: number): string {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    if (score >= 0.2) return '#ffc107';
    return '#f44336';
  }

  applyToOffer(offerId: number | undefined): void {
    if (offerId) {
      this.router.navigate(['/candidate/apply', offerId]);
    } else {
      console.warn('ID d’offre manquant, impossible de postuler');
    }
  }

  goBack(): void {
    this.router.navigate(['/candidate']);
  }
}
