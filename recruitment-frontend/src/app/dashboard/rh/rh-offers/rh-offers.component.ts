import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Offer } from '../../../models/offer.model';
import { RhService } from '../../../auth/services/rh.service';
import { OfferDetailsModalComponent } from '../offer-details-dialog/offer-details-dialog.component';
import { ThemeService } from '../../../auth/services/theme.service';

@Component({
  selector: 'app-rh-offers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    OfferDetailsModalComponent,
  ],
  templateUrl: './rh-offers.component.html',
  styleUrls: ['./rh-offers.component.scss'],
})
export class RhOffersComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  searchTerm: string = '';
  isLoading = false;

  selectedOfferForModal: Offer | null = null;
  modalMode: 'view' | 'edit' = 'view';

  constructor(
    private rhService: RhService,
    private router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.isLoading = true;
    this.rhService.getOffers().subscribe({
      next: (data) => {
        this.offers = data;
        this.filteredOffers = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur chargement offres', error);
        alert('Erreur lors du chargement des offres');
        this.isLoading = false;
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

  goBack(): void {
    this.router.navigate(['/rh']);
  }

  viewApplications(offerId: number): void {
    this.router.navigate(['/rh/applications/offer', offerId]);
  }

  viewOfferDetails(offer: Offer): void {
    this.selectedOfferForModal = offer;
    this.modalMode = 'view';
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Date non disponible';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  onCloseModal(): void {
    this.selectedOfferForModal = null;
  }

  onOfferSaved(updatedOffer: Offer): void {
    this.selectedOfferForModal = null;
    this.loadOffers();
  }
}
