import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  RhStatistiques,
  RhStatistiquesService,
} from '../../../auth/services/rh-statistiques.service';
import { ThemeService } from '../../../auth/services/theme.service';

@Component({
  selector: 'app-rh-statistiques',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rh-satistiques.component.html',
  styleUrls: ['./rh-satistiques.component.scss'],
})
export class RhStatistiquesComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  stats: RhStatistiques | null = null;
  maxMonthlyCount = 0;

  statusLabels: { [key: string]: string } = {
    A_CONTACTER: 'À contacter',
    RETENUE: 'Retenue',
    ELIMINE: 'Éliminée',
    RECRUTE: 'Recrutée',
  };

  constructor(
    private statsService: RhStatistiquesService,
    private router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.statsService.getStatistics().subscribe({
      next: (data) => {
        this.stats = data;
        this.calculateMaxMonthlyCount();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur détaillée :', err);

        if (err.status === 0) {
          this.errorMessage =
            'Impossible de joindre le serveur. Vérifiez que le backend est lancé.';
        } else if (err.status === 401 || err.status === 403) {
          this.errorMessage =
            "Vous n'êtes pas autorisé. Veuillez vous reconnecter.";
        } else {
          this.errorMessage = 'Erreur lors du chargement des statistiques.';
        }
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/rh']);
  }

  refresh(): void {
    this.loadStatistics();
  }

  getPercentage(statusKey: string): string {
    if (!this.stats || !this.stats.totalApplications) return '0%';
    const count = this.stats.applicationsByStatus[statusKey] || 0;
    const percent = (count / this.stats.totalApplications) * 100;
    return percent.toFixed(1) + '%';
  }

  getStatusKeys(): string[] {
    return ['A_CONTACTER', 'RETENUE', 'ELIMINE', 'RECRUTE'];
  }

  getStatusLabel(key: string): string {
    return this.statusLabels[key] || key;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  calculateMaxMonthlyCount(): void {
  if (this.stats?.applicationsOverTime?.length) {
    this.maxMonthlyCount = Math.max(
      ...this.stats.applicationsOverTime.map(item => item.count)
    );
  }
}
}
