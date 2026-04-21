import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Offer } from '../../../models/offer.model';
import {
  Application,
  ApplicationResponse,
  ApplicationStatus,
} from '../../../models/application.model';
import { PublicOfferService } from '../../../auth/services/public-offer.service';
import { RhService } from '../../../auth/services/rh.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ApplicationHelperService } from '../../../auth/services/application-helper.service';
import { ThemeService } from '../../../auth/services/theme.service';

@Component({
  selector: 'app-rh-applications',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rh-applications.component.html',
  styleUrls: ['./rh-applications.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class RhApplicationsComponent implements OnInit {
  offer: Offer | null = null;
  applications: Application[] = [];
  allApplications: Application[] = [];
  isLoading = false;
  isLoadingOffer = false;
  errorMessage = '';
  successMessage = '';
  offerId: number | null = null;
  currentUser: any = null;

  currentPage = 1;
  itemsPerPage = 10;

  statusFilter = 'TOUS';
  searchTerm = '';

  mode: 'offer' | 'global' = 'offer';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicOfferService: PublicOfferService,
    private rhService: RhService,
    private authService: AuthService,
    private helper: ApplicationHelperService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    if (
      !this.authService.isLoggedIn() ||
      !this.authService.isRecruiterOrAdmin()
    ) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }

    this.currentUser = this.authService.getCurrentUser();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.offerId = Number(params['id']);
        this.mode = 'offer';
        this.loadOffer(this.offerId);
        this.loadOfferApplications();
      } else {
        this.mode = 'global';
        this.loadAllApplications();
      }
    });
  }

  private normalizeApplicationData(data: any): Application {
    const candidateData = data.candidate || {};
    const candidate = {
      id: candidateData.id || 0,
      firstName: (candidateData.fname || '').trim() || 'Prénom non disponible',
      lastName: (candidateData.lname || '').trim() || 'Nom non disponible',
      email: (candidateData.email || '').trim() || 'email@exemple.com',
      phone: (candidateData.phone || '').trim() || '',
      address: '',
    };

    const offerData = data.offer || {};
    const offerId = offerData.id || 0;
    const offerTitle = offerData.title || `Offre #${offerId}`;

    const cvFileName = data.cvPath || '';
    const coverLetterFileName = data.coverLetterPath || '';

    let status: ApplicationStatus = 'A_CONTACTER';
    const backendStatus = (data.status || '').toUpperCase();
    if (
      ['A_CONTACTER', 'RETENUE', 'ELIMINE', 'RECRUTE'].includes(backendStatus)
    ) {
      status = backendStatus as ApplicationStatus;
    }

    let applicationDate: Date;
    try {
      applicationDate = new Date(
        data.createdAt || data.applicationDate || Date.now(),
      );
      if (isNaN(applicationDate.getTime())) {
        applicationDate = new Date();
      }
    } catch {
      applicationDate = new Date();
    }

    return {
      id: data.id || 0,
      applicationDate,
      status,
      message: data.message || '',
      candidate,
      offerId,
      offerTitle,
      cvFileName,
      coverLetterFileName,
    };
  }

  loadAllApplications(): void {
    this.isLoading = true;
    this.rhService.getAllApplications().subscribe({
      next: (data: ApplicationResponse[]) => {
        this.allApplications = data.map((app) =>
          this.normalizeApplicationData(app),
        );
        this.applications = [...this.allApplications];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage =
          'Erreur lors du chargement de toutes les candidatures';
        this.isLoading = false;
        console.error('Erreur:', err);
      },
    });
  }

  loadOfferApplications(): void {
    if (!this.offerId) return;
    this.isLoading = true;
    this.errorMessage = '';

    console.log(
      `📡 Chargement des candidatures pour l'offre ID: ${this.offerId}`,
    );

    this.rhService.getApplicationsByOffer(this.offerId).subscribe({
      next: (data: ApplicationResponse[]) => {
        console.log('✅ Nombre total de candidatures reçues:', data.length);

        if (data && data.length > 0) {
          console.log('📋 STRUCTURE COMPLÈTE DE LA PREMIÈRE APPLICATION:');
          console.log(JSON.stringify(data[0], null, 2));

          console.log('🔍 ANALYSE DÉTAILLÉE:');

          const firstApp = data[0] as any;

          console.log('1. candidate existe?', 'candidate' in firstApp);
          console.log(
            '2. candidate est un objet?',
            typeof firstApp.candidate === 'object',
          );

          console.log('3. candidateFirstName:', data[0].candidateFirstName);
          console.log('4. candidateLastName:', data[0].candidateLastName);
          console.log('5. candidateEmail:', data[0].candidateEmail);
          console.log('6. candidateId:', data[0].candidateId);

          const keys = Object.keys(firstApp);
          console.log('7. Toutes les clés disponibles:', keys);

          keys.forEach((key) => {
            console.log(`   ${key}:`, firstApp[key]);
          });
        }

        this.applications = data.map((app) =>
          this.normalizeApplicationData(app),
        );

        if (this.applications.length > 0) {
          console.log('🎯 RÉSULTAT FINAL - Application normalisée:');
          console.log(JSON.stringify(this.applications[0], null, 2));

          console.log('👤 Candidat extrait:');
          console.log('   Prénom:', this.applications[0].candidate.firstName);
          console.log('   Nom:', this.applications[0].candidate.lastName);
          console.log('   Email:', this.applications[0].candidate.email);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erreur API complète:', err);
        console.error('❌ Statut:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ URL:', err.url);
        this.errorMessage = `Erreur ${err.status || 'inconnue'}: ${err.message || 'Impossible de charger les candidatures'}`;
        this.isLoading = false;
      },
    });
  }

  loadOffer(id: number): void {
    this.isLoadingOffer = true;
    this.publicOfferService.getOfferById(id).subscribe({
      next: (data: Offer) => {
        this.offer = data;
        this.isLoadingOffer = false;
      },
      error: (err) => {
        this.errorMessage = "Impossible de charger l'offre";
        this.isLoadingOffer = false;
        console.error('Erreur:', err);
      },
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredApplications.length / this.itemsPerPage);
  }

  getCurrentPageApplications(): Application[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredApplications.slice(start, end);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  getDisplayRangeStart(): number {
    return this.filteredApplications.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getDisplayRangeEnd(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredApplications.length,
    );
  }

  get filteredApplications(): Application[] {
    let filtered = this.applications;
    if (this.statusFilter !== 'TOUS')
      filtered = filtered.filter((a) => a.status === this.statusFilter);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter((a) => {
        const fullName =
          `${a.candidate.firstName} ${a.candidate.lastName}`.toLowerCase();
        return (
          fullName.includes(term) ||
          a.candidate.email?.toLowerCase().includes(term) ||
          a.candidate.phone?.toLowerCase().includes(term)
        );
      });
    }
    return filtered;
  }

  getCountByStatus(status: string): number {
    return this.filteredApplications.filter((app) => app.status === status)
      .length;
  }

  resetFilters(): void {
    this.statusFilter = 'TOUS';
    this.searchTerm = '';
    this.currentPage = 1;
  }

  getStatusLabel(status: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      A_CONTACTER: 'À contacter',
      RETENUE: 'Retenue',
      ELIMINE: 'Éliminée',
      RECRUTE: 'Recrutée',
    };
    return map[status] || status;
  }

  getStatusClass(status: ApplicationStatus): string {
    const map: Record<ApplicationStatus, string> = {
      A_CONTACTER: 'status-A_CONTACTER',
      RETENUE: 'status-RETENUE',
      ELIMINE: 'status-ELIMINE',
      RECRUTE: 'status-RECRUTE',
    };
    return map[status] || 'status-default';
  }

  formatDate(date: any): string {
    const d = new Date(date);
    return isNaN(d.getTime())
      ? 'Date invalide'
      : d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  }

  acceptApplication(id: number): void {
    this.updateApplicationStatus(
      id,
      'RECRUTE',
      'Candidature acceptée avec succès',
    );
  }

  rejectApplication(id: number): void {
    this.updateApplicationStatus(id, 'ELIMINE', 'Candidature rejetée');
  }

  scheduleInterview(id: number): void {
    this.updateApplicationStatus(
      id,
      'RETENUE',
      'Candidature retenue pour entretien',
    );
  }

  private updateApplicationStatus(
    id: number,
    status: ApplicationStatus,
    successMessage: string,
  ): void {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return;

    const previousStatus = app.status;
    app.status = status;

    this.rhService.updateApplicationStatus(id, status).subscribe({
      next: () => {
        this.successMessage = successMessage;
        setTimeout(() => (this.successMessage = ''), 3000);

        if (this.mode === 'global') {
          this.loadAllApplications();
        } else if (this.offerId) {
          this.loadOfferApplications();
        }
      },
      error: (err) => {
        app.status = previousStatus;
        this.errorMessage = 'Erreur lors de la mise à jour du statut';
        console.error('Erreur mise à jour statut:', err);
        setTimeout(() => (this.errorMessage = ''), 3000);
      },
    });
  }

  downloadCV(app: Application): void {
    if (app.cvFileName) {
      this.rhService.downloadCv(app.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = app.cvFileName || `cv_${app.candidate.lastName}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.successMessage = 'CV téléchargé avec succès';
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors du téléchargement du CV';
          console.error('Erreur:', err);
          setTimeout(() => (this.errorMessage = ''), 3000);
        },
      });
    }
  }

  downloadCoverLetter(app: Application): void {
    if (app.coverLetterFileName) {
      this.rhService.downloadCoverLetter(app.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download =
            app.coverLetterFileName || `lettre_${app.candidate.lastName}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.successMessage = 'Lettre de motivation téléchargée avec succès';
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (err) => {
          this.errorMessage =
            'Erreur lors du téléchargement de la lettre de motivation';
          console.error('Erreur:', err);
          setTimeout(() => (this.errorMessage = ''), 3000);
        },
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/rh']);
  }

  goToOfferApplications(id: number): void {
    this.router.navigate(['/rh/applications/offer', id]);
  }
}
