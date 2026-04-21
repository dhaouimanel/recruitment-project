import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subscription } from 'rxjs';

import { Offer } from '../../models/offer.model';
import { RhService } from '../../auth/services/rh.service';
import { AuthService } from '../../auth/services/auth.service';
import { OfferDetailsModalComponent } from './offer-details-dialog/offer-details-dialog.component';
import { ThemeService } from '../../auth/services/theme.service';


@Component({
  selector: 'app-rh',
  templateUrl: './rh.component.html',
  styleUrls: ['./rh.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    OfferDetailsModalComponent,
  ],
})
export class RhComponent implements OnInit, OnDestroy, AfterViewInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  paginatedOffers: Offer[] = [];


  selectedLocation: string = '';
  selectedStatus: string = '';
  uniqueLocations: string[] = [];

  sortColumn: keyof Offer = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  pages: number[] = [];

  newOffer: Offer = {
    title: '',
    description: '',
    location: '',
    published: false,
  };

  isLoading = false;
  isExporting = false;
  currentUser: any = null;
  isHandset = false;
  sidebarOpen = true;
  currentDate = new Date();

  private refreshInterval: any;

  pageTitle: string = 'Tableau de bord';

  selectedOfferForModal: Offer | null = null;
  modalMode: 'view' | 'edit' = 'view';

  applicationsCount: { [offerId: number]: number } = {};

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('deleteModal') deleteModal!: ElementRef;

  private mediaQueryListener: (e: MediaQueryListEvent) => void;
  private userSubscription!: Subscription;
  private modalInstance: any = null;
  private offerToDeleteId: number | null = null;

  constructor(
    private rhService: RhService,
    public authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
     public themeService: ThemeService,
  ) {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    this.isHandset = mediaQuery.matches;
    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      this.isHandset = e.matches;
      if (!this.isHandset) {
        this.sidebarOpen = true;
      }
    };
    mediaQuery.addEventListener('change', this.mediaQueryListener);
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.logout();
      return;
    }

    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadOffers();

    this.refreshInterval = setInterval(() => {
      this.loadOffers();
    }, 30000);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.pageTitle = this.getPageTitle(event.urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.removeEventListener('change', this.mediaQueryListener);

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterViewInit(): void {
    if (this.deleteModal) {
      this.renderer.listen(
        this.deleteModal.nativeElement,
        'hidden.bs.modal',
        () => {
          this.offerToDeleteId = null;
        },
      );
    }
  }

  private getPageTitle(url: string): string {
    if (url.includes('/rh/offers')) {
      return 'Gestion des offres';
    } else if (url.includes('/rh/applications')) {
      return 'Candidatures';
    } else if (url.includes('/rh/statistiques')) {
      return 'Statistiques';
    } else if (url.includes('/rh/parametres')) {
      return 'Paramètres';
    } else {
      return 'Tableau de bord';
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  loadOffers(): void {
    this.isLoading = true;
    this.rhService.getOffers().subscribe({
      next: (data: Offer[]) => {
        this.offers = data;
        this.applyFilterAndSort();
        this.offers.forEach((offer) => {
          if (offer.id) {
            this.loadApplicationsCount(offer.id);
          }
        });
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement offres:', error);
        alert('Erreur lors du chargement des offres');
        this.isLoading = false;
      },
    });
  }

  loadApplicationsCount(offerId: number): void {
    this.rhService.getApplicationsByOffer(offerId).subscribe({
      next: (applications: any[]) => {
        this.applicationsCount[offerId] = applications.length;
      },
      error: (err: any) => {
        console.error(`Erreur chargement candidatures offre ${offerId}:`, err);
        this.applicationsCount[offerId] = 0;
      },
    });
  }

  getApplicationsCount(offerId: number | undefined): number {
    if (!offerId) return 0;
    return this.applicationsCount[offerId] || 0;
  }

  applyFilter() {
    this.applyFilterAndSort();
  }

  applyLocationFilter() {
    this.applyFilterAndSort();
  }

  applyStatusFilter() {
    this.applyFilterAndSort();
  }

  applyFilterAndSort() {
    const searchTerm =
      this.searchInput?.nativeElement.value?.toLowerCase() || '';

    let filtered = this.offers.filter((offer) => {
      const matchSearch =
        !searchTerm ||
        offer.title?.toLowerCase().includes(searchTerm) ||
        offer.location?.toLowerCase().includes(searchTerm);

      const matchLocation =
        !this.selectedLocation || offer.location === this.selectedLocation;
      const matchStatus =
        !this.selectedStatus ||
        (this.selectedStatus === 'published'
          ? offer.published
          : !offer.published);

      return matchSearch && matchLocation && matchStatus;
    });

    filtered.sort((a, b) => {
      let valA: any = a[this.sortColumn];
      let valB: any = b[this.sortColumn];

      if (this.sortColumn === 'createDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredOffers = filtered;
    this.currentPage = 1;
    this.updatePaginatedOffers();
    this.updateStatsAndFilters();
  }

  sortBy(column: keyof Offer) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilterAndSort();
  }

  updatePaginatedOffers() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedOffers = this.filteredOffers.slice(start, end);
    this.totalPages = Math.ceil(this.filteredOffers.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedOffers();
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePaginatedOffers();
  }

  addOffer(): void {
    if (!this.newOffer.title || !this.newOffer.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading = true;
    this.rhService.createOffer(this.newOffer).subscribe({
      next: () => {
        alert('Offre créée avec succès !');
        this.resetForm();
        this.loadOffers();
      },
      error: (error: any) => {
        alert(
          `Erreur ${error.status}: ${error.error?.message || 'Création impossible'}`,
        );
        this.isLoading = false;
      },
    });
  }

  resetForm(): void {
    this.newOffer = {
      title: '',
      description: '',
      location: '',
      published: false,
    };
  }

  editOffer(offer: Offer): void {
    this.selectedOfferForModal = offer;
    this.modalMode = 'edit';
  }

  deleteOffer(id: number): void {
    this.offerToDeleteId = id;
    if (typeof (window as any).bootstrap !== 'undefined' && this.deleteModal) {
      this.modalInstance = new (window as any).bootstrap.Modal(
        this.deleteModal.nativeElement,
      );
      this.modalInstance.show();
    } else {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
        this.rhService.deleteOffer(id).subscribe({
          next: () => {
            alert('Offre supprimée');
            this.loadOffers();
          },
          error: () => alert('Erreur lors de la suppression'),
        });
      }
    }
  }

  confirmDelete(): void {
    if (this.offerToDeleteId !== null) {
      this.rhService.deleteOffer(this.offerToDeleteId).subscribe({
        next: () => {
          alert('Offre supprimée');
          this.loadOffers();
        },
        error: () => alert('Erreur lors de la suppression'),
        complete: () => {
          this.offerToDeleteId = null;
          this.modalInstance?.hide();
        },
      });
    }
  }

  toggleOfferStatus(offer: Offer): void {
    const updated = { ...offer, published: !offer.published };
    if (updated.id) {
      this.rhService.updateOffer(updated.id, updated).subscribe({
        next: () => {
          alert(`Offre ${updated.published ? 'publiée' : 'dépubliée'}`);
          this.loadOffers();
        },
        error: () => alert('Erreur de mise à jour'),
      });
    }
  }

  viewOfferDetails(offer: Offer): void {
    this.selectedOfferForModal = offer;
    this.modalMode = 'view';
  }

  onOfferSaved(updatedOffer: Offer): void {
    if (updatedOffer.id) {
      this.rhService.updateOffer(updatedOffer.id, updatedOffer).subscribe({
        next: () => {
          this.loadOffers();
          this.selectedOfferForModal = null;
        },
        error: () => alert('Erreur lors de la mise à jour'),
      });
    }
  }

  viewApplications(offerId: number): void {
    this.router.navigate(['/rh/applications/offer', offerId]);
  }

  exportToExcel(): void {
    this.isExporting = true;

    try {
      const dataToExport = this.filteredOffers.map((offer) => ({
        ID: offer.id ?? '',
        Titre: offer.title,
        Lieu: offer.location || 'Non spécifié',
        'Date création': offer.createDate
          ? new Date(offer.createDate).toLocaleDateString('fr-FR')
          : '',
        Statut: offer.published ? 'Publiée' : 'Brouillon',
        Description: offer.description,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Offres');
      XLSX.writeFile(
        workbook,
        `offres_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert("Erreur lors de l'export Excel");
    } finally {
      this.isExporting = false;
    }
  }

  exportSingleOfferExcel(offer: Offer): void {
    this.isExporting = true;

    try {
      const data = [
        {
          ID: offer.id ?? '',
          Titre: offer.title,
          Lieu: offer.location || 'Non spécifié',
          'Date création': offer.createDate
            ? new Date(offer.createDate).toLocaleDateString('fr-FR')
            : '',
          Statut: offer.published ? 'Publiée' : 'Brouillon',
          Description: offer.description,
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Offre');
      XLSX.writeFile(
        workbook,
        `offre_${offer.id}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert("Erreur lors de l'export Excel");
    } finally {
      this.isExporting = false;
    }
  }

  exportToPDF(): void {
    this.isExporting = true;

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Liste des offres', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

      const tableColumn = ['ID', 'Titre', 'Lieu', 'Date', 'Statut'];
      const tableRows = this.filteredOffers.map((offer) => [
        offer.id ?? '',
        offer.title,
        offer.location || 'Non spécifié',
        offer.createDate
          ? new Date(offer.createDate).toLocaleDateString('fr-FR')
          : '',
        offer.published ? 'Publiée' : 'Brouillon',
      ]);

      autoTable(doc, {
        startY: 35,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });

      doc.save(`offres_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert("Erreur lors de l'export PDF");
    } finally {
      this.isExporting = false;
    }
  }

  exportSingleOfferPDF(offer: Offer): void {
    this.isExporting = true;

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Détail de l'offre", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

      const data = [
        ['ID', offer.id ?? ''],
        ['Titre', offer.title],
        ['Lieu', offer.location || 'Non spécifié'],
        [
          'Date de création',
          offer.createDate
            ? new Date(offer.createDate).toLocaleDateString('fr-FR')
            : '',
        ],
        ['Statut', offer.published ? 'Publiée' : 'Brouillon'],
        ['Description', offer.description],
      ];

      autoTable(doc, {
        startY: 35,
        body: data,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
      });

      doc.save(
        `offre_${offer.id}_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert("Erreur lors de l'export PDF");
    } finally {
      this.isExporting = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/offers']);
  }

  getPublishedCount(): number {
    return this.offers.filter((o) => o.published).length;
  }

  getUnpublishedCount(): number {
    return this.offers.filter((o) => !o.published).length;
  }

  getLocationsCount(): number {
    return new Set(this.offers.map((o) => o.location)).size;
  }

  getPublishedPercent(): string {
    if (this.offers.length === 0) {
      return '0';
    }
    const percent = (this.getPublishedCount() / this.offers.length) * 100;
    return percent.toFixed(0);
  }

  updateStatsAndFilters() {
    this.uniqueLocations = [
      ...new Set(this.offers.map((o) => o.location).filter(Boolean)),
    ] as string[];
  }
}
