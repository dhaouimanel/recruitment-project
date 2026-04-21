import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CandidateApplicationService } from '../../auth/services/candidate-application.services';
import { AuthService } from '../../auth/services/auth.service';
import { ApplicationHelperService } from '../../auth/services/application-helper.service';

@Component({
  selector: 'app-candidat',
  templateUrl: './candidat.component.html',
  styleUrls: ['./candidat.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class CandidatComponent implements OnInit, OnDestroy {
  applications: any[] = [];
  currentUser: any = null;

  pendingApplicationsCount: number = 0;
  acceptedApplicationsCount: number = 0;
  rejectedApplicationsCount: number = 0;

  showDetailsModal = false;
  selectedApplication: any = null;

  isLoading = false;
  isLoadingApplications = false;
  errorMessage = '';
  successMessage = '';

  searchTerm: string = '';
  statusFilter: string = 'all';
  currentPage = 1;
  itemsPerPage = 10;

  similarityThreshold: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private applicationService: CandidateApplicationService,
    private authService: AuthService,
    public helper: ApplicationHelperService,
  ) {}

  ngOnInit(): void {
    console.log('=== CANDIDAT COMPONENT INIT ===');
    console.log('Route actuelle:', this.router.url);
    console.log('Token présent:', !!localStorage.getItem('token'));
    console.log('User role:', this.authService.getUserRole());
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.authService.isLoggedIn() || !this.authService.isCandidate()) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }

    this.loadMyApplicationsWithOffers();
  }

  loadMyApplicationsWithOffers(): void {
    this.loadMyApplicationsWithScores();
  }

  private sortApplicationsByDate(applications: any[]): any[] {
    return applications.sort((a, b) => {
      const dateA = new Date(a.applicationDate).getTime();
      const dateB = new Date(b.applicationDate).getTime();
      return dateB - dateA;
    });
  }

  private updateStatistics(): void {
    const stats = this.helper.calculateApplicationStats(this.applications);
    this.pendingApplicationsCount = stats.pending;
    this.acceptedApplicationsCount = stats.interview + stats.hired;
    this.rejectedApplicationsCount = stats.rejected;
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      return "Vous n'avez pas les permissions nécessaires.";
    } else if (error.status === 404) {
      return 'Aucune candidature trouvée.';
    } else {
      return 'Une erreur est survenue lors du chargement de vos candidatures.';
    }
  }

  get filteredApplications() {
    let filtered = this.applications;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.offer?.title?.toLowerCase().includes(term) ||
          app.offer?.company?.toLowerCase().includes(term) ||
          app.offer?.location?.toLowerCase().includes(term),
      );
    }

    if (this.statusFilter !== 'all') {
      if (this.statusFilter === 'pending') {
        filtered = filtered.filter((app) => app.status === 'A_CONTACTER');
      } else if (this.statusFilter === 'accepted') {
        filtered = filtered.filter(
          (app) =>
            app.status === 'RETENUE' ||
            app.status === 'ENTRETIEN' ||
            app.status === 'RECRUTE',
        );
      }
    }

    if (this.similarityThreshold > 0) {
      filtered = filtered.filter(
        (app) =>
          app.similarityScore !== undefined &&
          app.similarityScore >= this.similarityThreshold,
      );
    }

    return filtered;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredApplications.length / this.itemsPerPage);
  }

  getCurrentPageApplications() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredApplications.slice(startIndex, endIndex);
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

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  setFilter(filter: string): void {
    this.statusFilter = filter;
    this.currentPage = 1;
  }

  getStatusCount(status: string): number {
    return this.applications.filter((app) => app.status === status).length;
  }

  getApplicationsByStatus(status: string): any[] {
    return this.applications.filter((app) => app.status === status);
  }

  getAcceptanceRate(): number {
    if (this.applications.length === 0) return 0;
    const accepted = this.applications.filter(
      (app) =>
        app.status === 'RETENUE' ||
        app.status === 'ENTRETIEN' ||
        app.status === 'RECRUTE',
    ).length;
    return Math.round((accepted / this.applications.length) * 100);
  }

  getStatusLabel(status: string): string {
    return this.helper.getStatusLabel(status);
  }

  getStatusClass(status: string): string {
    return this.helper.getStatusClass(status);
  }

  formatDate(dateString: string | Date | undefined): string {
    return this.helper.formatDate(dateString, false);
  }

  getTimeSince(dateString: string | Date | undefined): string {
    if (!dateString) return 'Date non disponible';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        }
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays === 1) {
        return 'Hier';
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jours`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Il y a ${months} mois`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `Il y a ${years} an${years > 1 ? 's' : ''}`;
      }
    } catch (error) {
      return 'Date non disponible';
    }
  }

  downloadCv(applicationId: number): void {
    console.log(
      '🔍 Tentative téléchargement CV pour application:',
      applicationId,
    );

    this.applicationService
      .downloadCv(applicationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          console.log('✅ Blob reçu:', {
            type: blob.type,
            size: blob.size,
          });

          const application = this.applications.find(
            (app) => app.id === applicationId,
          );
          let fileName = `CV_${applicationId}`;
          if (application?.offer?.title) {
            fileName = `CV_${application.offer.title.replace(/[^a-z0-9]/gi, '_')}`;
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.successMessage = 'CV téléchargé avec succès';
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (error) => {
          console.error('❌ Erreur détaillée:', {
            status: error.status,
            message: error.message,
            error: error.error,
          });
          this.errorMessage = this.helper.handleDownloadError(error, 'CV');
        },
      });
  }

  downloadCoverLetter(applicationId: number): void {
    this.applicationService
      .downloadCoverLetter(applicationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          let extension = '.pdf';
          if (blob.type.includes('word')) {
            extension = '.docx';
          }

          const application = this.applications.find(
            (app) => app.id === applicationId,
          );
          let fileName = `Lettre_${applicationId}`;
          if (application?.offer?.title) {
            fileName = `Lettre_Motivation_${application.offer.title.replace(/[^a-z0-9]/gi, '_')}`;
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${fileName}${extension}`;
          link.click();
          window.URL.revokeObjectURL(url);

          this.successMessage = 'Lettre de motivation téléchargée avec succès';
          setTimeout(() => (this.successMessage = ''), 3000);
        },
        error: (error) => {
          this.errorMessage = this.helper.handleDownloadError(
            error,
            'lettre de motivation',
          );
        },
      });
  }

  viewOfferDetails(offerId: number): void {
    this.router.navigate(['/offers', offerId]);
  }

  viewApplicationDetails(application: any): void {
    console.log('Détails de la candidature:', application);
    this.selectedApplication = application;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedApplication = null;
  }
  private showApplicationModal(application: any): void {
    const message = `
      Détails de la candidature:
      Offre: ${application.offer?.title}
      Entreprise: ${application.offer?.company || 'Non spécifié'}
      Localisation: ${application.offer?.location || 'Non spécifié'}
      Statut: ${this.getStatusLabel(application.status)}
      Date de candidature: ${this.formatDate(application.applicationDate)}
      ${application.message ? `\nMessage: ${application.message}` : ''}
    `;

    alert(message);
  }

  loadMyApplications(): void {
    this.loadMyApplicationsWithOffers();
  }

  getAverageResponseTime(): string {
    if (this.applications.length === 0) return 'N/A';

    const applicationsWithStatusDate = this.applications.filter(
      (app) => app.statusDate,
    );
    if (applicationsWithStatusDate.length === 0) return 'N/A';

    let totalDays = 0;
    applicationsWithStatusDate.forEach((app) => {
      const applicationDate = new Date(app.applicationDate);
      const statusDate = new Date(app.statusDate);
      const diffTime = statusDate.getTime() - applicationDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDays += diffDays;
    });

    const averageDays = Math.round(
      totalDays / applicationsWithStatusDate.length,
    );
    return `${averageDays} jours`;
  }

  getRelativeDate(dateString: string | Date | undefined): string {
    return this.getTimeSince(dateString);
  }

  logout(): void {
    console.log('🔴 Bouton logout cliqué');
    if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;

    console.log('✅ Confirmation OK');
    this.authService.logout();

    this.router
      .navigate(['/offers'])
      .then((success) => {
        if (!success) {
          console.warn(
            '⚠️ Navigation Angular échouée, fallback vers window.location',
          );
          window.location.href = '/offers';
        }
      })
      .catch((err) => {
        console.error('❌ Erreur de navigation', err);
        window.location.href = '/offers';
      });
  }
  loadMyApplicationsWithScores(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const timeout = setTimeout(() => {
      console.warn('⚠️ Timeout de chargement - reset isLoading');
      this.isLoading = false;
    }, 10000);

    this.applicationService
      .getMyApplicationsWithScores()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          clearTimeout(timeout);
          console.log('✅ finalize appelé, isLoading = false');
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (data) => {
          this.applications = this.sortApplicationsByDate(data);
          this.updateStatistics();
        },
        error: (error) => {
          console.error('❌ Erreur chargement:', error);
          this.errorMessage = this.getErrorMessage(error);
        },
      });
  }

  getSimilarityColor(score: number): string {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    if (score >= 0.2) return '#ffc107';
    return '#f44336';
  }

  isBestScore(app: any): boolean {
    if (!app.similarityScore) return false;
    const maxScore = Math.max(
      ...this.applications.map((a) => a.similarityScore || 0),
    );
    return app.similarityScore === maxScore && maxScore > 0;
  }
}
