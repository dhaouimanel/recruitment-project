import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Offer } from '../../../models/offer.model';
import { PublicOfferService } from '../../../auth/services/public-offer.service';
import { AuthService } from '../../../auth/services/auth.service';
import { OfferDetailsModalComponent } from '../../rh/offer-details-dialog/offer-details-dialog.component';




@Component({
  selector: 'app-candidate-offers-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    OfferDetailsModalComponent,
  ],
  templateUrl: './candidate-offers-list.component.html',
  styleUrls: ['./candidate-offers-list.component.scss'],
})
export class CandidateOffersListComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;

  selectedOfferForModal: Offer | null = null;
  modalMode: 'view' | 'edit' = 'view';

  constructor(
    private publicOfferService: PublicOfferService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.isLoading = true;
    this.publicOfferService.getPublishedOffers().subscribe({
      next: (data) => {
        this.offers = data;
        this.filteredOffers = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement offres', err);
        this.isLoading = false;
        alert('Impossible de charger les offres');
      },
    });
  }

  filterOffers(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredOffers = this.offers;
      return;
    }
    this.filteredOffers = this.offers.filter(
      (offer) =>
        offer.title?.toLowerCase().includes(term) ||
        offer.location?.toLowerCase().includes(term) ||
        offer.description?.toLowerCase().includes(term),
    );
  }

  viewOfferDetails(offer: Offer): void {
    this.selectedOfferForModal = offer;
    this.modalMode = 'view';
  }

  applyToOffer(offerId: number): void {
    this.router.navigate(['/candidate/apply', offerId]);
  }

  goBack(): void {
    this.router.navigate(['/candidate']);
  }

  onCloseModal(): void {
    this.selectedOfferForModal = null;
  }

  onOfferSaved(updatedOffer: Offer): void {
    this.selectedOfferForModal = null;
    this.loadOffers();
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Date non disponible';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
