import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CandidateApplicationService } from '../../../auth/services/candidate-application.services';
import { AuthService } from '../../../auth/services/auth.service';
import { ApplicationHelperService } from '../../../auth/services/application-helper.service';

interface Application {
  id: number;
  applicationDate: string;
  status: string;
  statusDate?: string;
  similarityScore?: number;
  message?: string;
  note?: string;
  offer?: {
    id: number;
    title: string;
    company?: string;
    location?: string;
    description?: string;
    contractType?: string;
  };
  statusHistory?: Array<{ status: string; date: string }>;
}

@Component({
  selector: 'app-candidate-applications',
  templateUrl: './candidate-applications.component.html',
  styleUrls: ['./candidate-applications.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class CandidateApplicationsComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  filteredApplications: Application[] = [];
  paginatedApplications: Application[] = [];

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  currentUser: any;

  pendingCount = 0;
  acceptedCount = 0;
  rejectedCount = 0;
  averageResponseTime = 0;
  conversionRate = 0;
  responseRate = 0;

  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'accepted' | 'rejected' = 'all';
  periodFilter = 'all';
  contractFilter = 'all';
  sortBy = 'date';
  similarityThreshold = 0;

  isDeleting = false;

  currentPage = 1;
  itemsPerPage = 10;

  showDetailsModal = false;
  selectedApplication: Application | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private applicationService: CandidateApplicationService,
    private authService: AuthService,
    public helper: ApplicationHelperService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadApplications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.applicationService
      .getMyApplicationsWithScores()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (data: any[]) => {
          this.applications = this.sortApplicationsByDate(data);
          this.calculateStats();
          this.applyFilters();
        },
        error: (err: any) => {
          console.error('Erreur chargement candidatures', err);
          this.errorMessage = 'Impossible de charger vos candidatures.';
        },
      });
  }

  private sortApplicationsByDate(apps: Application[]): Application[] {
    return apps.sort(
      (a, b) =>
        new Date(b.applicationDate).getTime() -
        new Date(a.applicationDate).getTime(),
    );
  }

  private calculateStats(): void {
    this.pendingCount = this.applications.filter(
      (app) => app.status === 'A_CONTACTER',
    ).length;
    this.acceptedCount = this.applications.filter(
      (app) =>
        app.status === 'RETENUE' ||
        app.status === 'ENTRETIEN' ||
        app.status === 'RECRUTE',
    ).length;
    this.rejectedCount = this.applications.filter(
      (app) => app.status === 'REJETE',
    ).length;

    const appsWithResponse = this.applications.filter(
      (app) => app.statusDate && app.status !== 'A_CONTACTER',
    );
    if (appsWithResponse.length > 0) {
      const totalDays = appsWithResponse.reduce((sum, app) => {
        const diff =
          new Date(app.statusDate!).getTime() -
          new Date(app.applicationDate).getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      this.averageResponseTime = Math.round(
        totalDays / appsWithResponse.length,
      );
    } else {
      this.averageResponseTime = 0;
    }

    this.conversionRate =
      this.applications.length > 0
        ? Math.round((this.acceptedCount / this.applications.length) * 100)
        : 0;

    const responded = this.applications.filter(
      (app) => app.status !== 'A_CONTACTER',
    ).length;
    this.responseRate =
      this.applications.length > 0
        ? Math.round((responded / this.applications.length) * 100)
        : 0;
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  setStatusFilter(filter: 'all' | 'pending' | 'accepted' | 'rejected'): void {
    this.statusFilter = filter;
    this.onFilterChange();
  }

  private applyFilters(): void {
    let filtered = [...this.applications];

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
      } else if (this.statusFilter === 'rejected') {
        filtered = filtered.filter((app) => app.status === 'REJETE');
      }
    }

    if (this.similarityThreshold > 0) {
      filtered = filtered.filter(
        (app) =>
          app.similarityScore !== undefined &&
          app.similarityScore >= this.similarityThreshold,
      );
    }

    const now = new Date();
    if (this.periodFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (app) => new Date(app.applicationDate) >= weekAgo,
      );
    } else if (this.periodFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (app) => new Date(app.applicationDate) >= monthAgo,
      );
    } else if (this.periodFilter === '3months') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(
        (app) => new Date(app.applicationDate) >= threeMonthsAgo,
      );
    }

    if (this.contractFilter !== 'all') {
      filtered = filtered.filter(
        (app) => app.offer?.contractType === this.contractFilter,
      );
    }

    filtered = this.sortApplications(filtered);

    this.filteredApplications = filtered;
    this.updatePagination();
  }

  private sortApplications(list: Application[]): Application[] {
    switch (this.sortBy) {
      case 'date':
        return list.sort(
          (a, b) =>
            new Date(b.applicationDate).getTime() -
            new Date(a.applicationDate).getTime(),
        );
      case 'dateAsc':
        return list.sort(
          (a, b) =>
            new Date(a.applicationDate).getTime() -
            new Date(b.applicationDate).getTime(),
        );
      case 'score':
        return list.sort(
          (a, b) => (b.similarityScore || 0) - (a.similarityScore || 0),
        );
      case 'company':
        return list.sort((a, b) =>
          (a.offer?.company || '').localeCompare(b.offer?.company || ''),
        );
      default:
        return list;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredApplications.length / this.itemsPerPage);
  }

  get paginationStart(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get paginationEnd(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredApplications.length,
    );
  }

  get pageNumbers(): number[] {
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

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedApplications = this.filteredApplications.slice(
      startIndex,
      endIndex,
    );
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  downloadCv(applicationId: number): void {
    this.applicationService.downloadCv(applicationId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CV_${applicationId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.successMessage = 'CV téléchargé avec succès.';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        this.errorMessage = this.helper.handleDownloadError(err, 'CV');
      },
    });
  }

  downloadCoverLetter(applicationId: number): void {
    this.applicationService.downloadCoverLetter(applicationId).subscribe({
      next: (blob: Blob) => {
        const extension = blob.type.includes('word') ? '.docx' : '.pdf';
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Lettre_${applicationId}${extension}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.successMessage = 'Lettre téléchargée avec succès.';
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        this.errorMessage = this.helper.handleDownloadError(err, 'lettre');
      },
    });
  }

  viewOffer(offerId: number): void {
    this.router.navigate(['/offers', offerId]);
  }

  viewDetails(application: Application): void {
    this.selectedApplication = {
      ...application,
      statusHistory: application.statusHistory || [
        {
          status: application.status,
          date: application.statusDate || application.applicationDate,
        },
      ],
    };
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedApplication = null;
  }

  getRelativeDate(date: string | Date | undefined): string {
    if (!date) return '';
    const diff = new Date().getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`;
    return `Il y a ${Math.floor(days / 365)} ans`;
  }

  getSimilarityColor(score: number): string {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    if (score >= 0.2) return '#ffc107';
    return '#f44336';
  }

  isBestScore(app: Application): boolean {
    if (!app.similarityScore) return false;
    const maxScore = Math.max(
      ...this.applications.map((a) => a.similarityScore || 0),
    );
    return app.similarityScore === maxScore && maxScore > 0;
  }

  isDelayed(app: Application): boolean {
    if (app.status !== 'A_CONTACTER') return false;
    const days = this.getDaysSince(app.applicationDate);
    return days > 10;
  }

  getDelayText(app: Application): string {
    const days = this.getDaysSince(app.applicationDate);
    if (days > 15) return 'Relance urgente';
    if (days > 10) return 'Bientôt à relancer';
    return '';
  }

  private getDaysSince(date: string | Date): number {
    const diff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  viewOfferIfExists(offer: { id: number } | undefined): void {
    if (offer?.id) {
      this.viewOffer(offer.id);
    }
  }

  deleteApplication(applicationId: number): void {
    if (this.isDeleting) return;

    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer cette candidature ? Cette action est irréversible.',
      )
    ) {
      this.isDeleting = true;
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          this.successMessage = 'Candidature supprimée avec succès.';
          this.loadApplications();
          setTimeout(() => (this.successMessage = ''), 3000);
          this.isDeleting = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression.';
          console.error(err);
          setTimeout(() => (this.errorMessage = ''), 5000);
          this.isDeleting = false;
        },
      });
    }
  }
}
