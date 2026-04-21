import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Offer } from '../../models/offer.model';
import { AdminService } from '../../auth/services/admin.service';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

declare const jsPDF: any;

interface ContactRH {
  nom: string;
  email: string;
  tel: string;
  role: string;
}

interface ReportDetail {
  id: number | string;
  titre: string;
  statut: string;
  localisation: string;
  dateCreation: string;
}

interface ReportData {
  titre: string;
  date: string;
  format: string;
  periode: string;
  totalOffres: number;
  offresPubliees: number;
  offresBrouillons: number;
  localisations: number;
  details: ReportDetail[];
}

interface StatItem {
  label: string;
  value: number;
}

interface SystemSettings {
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  language: string;
  timezone: string;
  backupFrequency: string;
  maxOffersPerPage: number;
  exportFormats: string[];
  enableAuditLog: boolean;
  maintenanceMode: boolean;
  dateFormat: string;
  theme: string;
  sessionTimeout: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  providers: [DatePipe],
})
export class AdminComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  searchTerm: string = '';
  filterStatus: string = 'all';
  currentUser: any = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  infoMessage = '';
  currentYear = new Date().getFullYear();

  showReportsModal = false;
  activeTab = 'statistics';
  selectedExportFormat = 'pdf';
  selectedPeriod = 'all';
  includeDetails = true;
  includeCharts = true;
  currentDate = new Date();

  showSettingsModal = false;
  settingsTab = 'general';
  systemSettings: SystemSettings = {
    notifications: true,
    autoRefresh: false,
    refreshInterval: 30,
    language: 'fr',
    timezone: 'Europe/Paris',
    backupFrequency: 'daily',
    maxOffersPerPage: 50,
    exportFormats: ['pdf', 'excel', 'csv', 'json'],
    enableAuditLog: true,
    maintenanceMode: false,
    dateFormat: 'dd/MM/yyyy HH:mm',
    theme: 'light',
    sessionTimeout: 30,
  };

  showContactsModal = false;
  contactsList = [
    {
      nom: 'Marie Durand',
      email: 'marie.durand@rh.com',
      tel: '01 23 45 67 89',
      role: 'Responsable RH',
    },
    {
      nom: 'Pierre Martin',
      email: 'pierre.martin@rh.com',
      tel: '01 23 45 67 90',
      role: 'Gestionnaire Offres',
    },
    {
      nom: 'Sophie Bernard',
      email: 'sophie.bernard@rh.com',
      tel: '01 23 45 67 91',
      role: 'Admin Système',
    },
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private datePipe: DatePipe,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.authService.logout();
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.loadOffers();
    this.loadSavedSettings();

    this.loadPdfScripts();
  }

  private loadSavedSettings(): void {
    const savedSettings = localStorage.getItem('adminSystemSettings');
    if (savedSettings) {
      try {
        this.systemSettings = {
          ...this.systemSettings,
          ...JSON.parse(savedSettings),
        };
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    }
  }

  private loadPdfScripts(): void {
    const jsPdfScript = document.createElement('script');
    jsPdfScript.src =
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    jsPdfScript.onload = () => {
      console.log('✅ jsPDF chargé avec succès');

      if (typeof window !== 'undefined') {
        (window as any).jsPDF = (window as any).jspdf.jsPDF;
      }
    };
    jsPdfScript.onerror = () => {
      console.error('❌ Erreur de chargement de jsPDF');
      this.errorMessage =
        'Impossible de charger le générateur PDF. Utilisez un autre format.';
    };
    document.head.appendChild(jsPdfScript);
  }

  loadOffers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';

    this.adminService.getOffers().subscribe({
      next: (data: Offer[]) => {
        this.offers = data.map((offer: Offer) => ({
          id: offer.id,
          title: offer.title || '',
          description: offer.description || '',
          location: offer.location || '',
          published: offer.published !== undefined ? offer.published : false,
          createDate: offer.createDate,
        }));

        this.filterOffers();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur:', error);
        this.errorMessage = `Erreur ${error.status}: Impossible de charger les offres`;
        this.isLoading = false;
      },
    });
  }

  filterOffers(): void {
    let filtered = this.offers;

    if (this.filterStatus === 'published') {
      filtered = filtered.filter((offer: Offer) => offer.published);
    } else if (this.filterStatus === 'drafts') {
      filtered = filtered.filter((offer: Offer) => !offer.published);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (offer: Offer) =>
          offer.title.toLowerCase().includes(term) ||
          offer.description.toLowerCase().includes(term) ||
          offer.location.toLowerCase().includes(term),
      );
    }

    this.filteredOffers = filtered;
  }

  setFilter(status: string): void {
    this.filterStatus = status;
    this.filterOffers();
  }

  getPublishedCount(): number {
    return this.offers.filter((offer: Offer) => offer.published).length;
  }

  getUnpublishedCount(): number {
    return this.offers.filter((offer: Offer) => !offer.published).length;
  }

  getLocationsCount(): number {
    const locations = new Set(
      this.offers.map((offer: Offer) => offer.location),
    );
    return locations.size;
  }

  truncateText(text: string, limit: number = 100): string {
    if (!text) return '';
    if (text.length <= limit) {
      return text;
    }
    return text.substring(0, limit) + '...';
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) {
      return 'Date non disponible';
    }

    try {
      if (typeof dateString === 'string') {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }
        return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm') || dateString;
      } else if (dateString instanceof Date) {
        return (
          this.datePipe.transform(dateString, 'dd/MM/yyyy HH:mm') ||
          'Date invalide'
        );
      }
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
    }

    return 'Date non disponible';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/offers']);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
  }

  navigateToReports(): void {
    this.clearMessages();
    this.showReportsModal = true;
    this.activeTab = 'statistics';
  }

  navigateToContacts(): void {
    this.clearMessages();
    this.showContactsModal = true;
    this.infoMessage =
      'Contacts RH chargés. ' +
      this.contactsList.length +
      ' contact(s) disponible(s).';
  }

  navigateToSettings(): void {
    this.clearMessages();
    this.showSettingsModal = true;
    this.settingsTab = 'general';
  }

  closeReportsModal(): void {
    this.showReportsModal = false;
    this.activeTab = 'statistics';
  }

  generateReport(): void {
    this.isLoading = true;

    setTimeout(() => {
      this.isLoading = false;
      this.activeTab = 'preview';
      this.successMessage = `Rapport ${this.selectedExportFormat.toUpperCase()} généré avec succès!`;
    }, 2000);
  }

  downloadReport(): void {
    if (
      !this.systemSettings.exportFormats.includes(this.selectedExportFormat)
    ) {
      this.errorMessage = `Le format ${this.selectedExportFormat.toUpperCase()} n'est pas autorisé.`;
      return;
    }

    switch (this.selectedExportFormat) {
      case 'pdf':
        this.downloadPdfReport();
        break;
      case 'excel':
        this.downloadExcelReport();
        break;
      case 'csv':
        this.downloadCsvReport();
        break;
      case 'json':
        this.downloadJsonReport();
        break;
      default:
        this.downloadPdfReport();
    }
  }

  private downloadPdfReport(): void {
    try {
      this.isLoading = true;

      if (typeof jsPDF !== 'undefined') {
        this.generatePdfWithJsPDF();
      } else {
        this.downloadJsonReport();
        this.infoMessage =
          'Générateur PDF non disponible. Rapport téléchargé en JSON.';
      }

      this.isLoading = false;
    } catch (error: any) {
      console.error('Erreur lors de la génération du PDF:', error);
      this.errorMessage =
        'Erreur lors de la génération du PDF. Utilisez un autre format.';
      this.isLoading = false;
    }
  }

  private generatePdfWithJsPDF(): void {
    try {
      if (typeof window !== 'undefined' && (window as any).jspdf) {
        const { jsPDF } = (window as any).jspdf;
        this.createPdfDocument(jsPDF);
      } else if (typeof jsPDF !== 'undefined') {
        this.createPdfDocument(jsPDF);
      } else {
        throw new Error('jsPDF non disponible');
      }
    } catch (error) {
      console.error('Erreur jsPDF:', error);
      this.downloadJsonReport();
      this.infoMessage =
        'Générateur PDF temporairement indisponible. Rapport téléchargé en JSON.';
    }
  }

  private createPdfDocument(jsPDFClass: any): void {
    const doc = new jsPDFClass();

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Rapport des Offres d'Emploi", 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Généré le: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      105,
      30,
      { align: 'center' },
    );

    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text('Statistiques', 20, 50);

    doc.setFontSize(12);
    let yPosition = 60;

    const stats: StatItem[] = [
      { label: 'Total des offres:', value: this.offers.length },
      { label: 'Offres publiées:', value: this.getPublishedCount() },
      { label: 'Offres brouillons:', value: this.getUnpublishedCount() },
      { label: 'Localisations uniques:', value: this.getLocationsCount() },
    ];

    stats.forEach((stat: StatItem) => {
      doc.text(`${stat.label} ${stat.value}`, 30, yPosition);
      yPosition += 10;
    });

    if (this.includeDetails && this.filteredOffers.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Liste des offres', 20, 20);

      doc.setFontSize(10);
      yPosition = 30;

      this.filteredOffers
        .slice(0, 20)
        .forEach((offer: Offer, index: number) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${offer.title}`, 20, yPosition);
          doc.setFont('helvetica', 'normal');

          yPosition += 7;
          doc.text(`   Localisation: ${offer.location}`, 25, yPosition);

          yPosition += 7;
          doc.text(
            `   Statut: ${offer.published ? 'Publiée' : 'Brouillon'}`,
            25,
            yPosition,
          );

          yPosition += 7;
          doc.text(
            `   Date: ${this.formatDate(offer.createDate)}`,
            25,
            yPosition,
          );

          yPosition += 10;
        });

      if (this.filteredOffers.length > 20) {
        doc.text(
          `... et ${this.filteredOffers.length - 20} autres offres`,
          20,
          yPosition,
        );
      }
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} sur ${pageCount}`, 105, 285, { align: 'center' });
      doc.text('Plateforme de Recrutement - Module Administration', 105, 290, {
        align: 'center',
      });
    }

    const fileName = `rapport_offres_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    this.successMessage = `Rapport PDF téléchargé: ${fileName}`;
    this.closeReportsModal();
  }

  private downloadExcelReport(): void {
    const csvData = this.convertToCSV();
    const blob = new Blob([csvData], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_offres_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.successMessage = 'Rapport Excel téléchargé avec succès!';
    this.closeReportsModal();
  }

  private downloadCsvReport(): void {
    const csvData = this.convertToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_offres_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.successMessage = 'Rapport CSV téléchargé avec succès!';
    this.closeReportsModal();
  }

  private downloadJsonReport(): void {
    const reportData: ReportData = this.prepareReportData();
    const dataStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([dataStr], {
      type: 'application/json;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_offres_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.successMessage = 'Rapport JSON téléchargé avec succès!';
    this.closeReportsModal();
  }

  private prepareReportData(): ReportData {
    return {
      titre: "Rapport des Offres d'Emploi",
      date: new Date().toLocaleDateString('fr-FR'),
      format: this.selectedExportFormat,
      periode: this.selectedPeriod,
      totalOffres: this.offers.length,
      offresPubliees: this.getPublishedCount(),
      offresBrouillons: this.getUnpublishedCount(),
      localisations: this.getLocationsCount(),
      details: this.includeDetails
        ? this.offers.map((offer: Offer) => ({
            id: offer.id ?? 0,
            titre: offer.title,
            statut: offer.published ? 'Publiée' : 'Brouillon',
            localisation: offer.location,
            dateCreation: this.formatDate(offer.createDate),
          }))
        : [],
    };
  }

  private convertToCSV(): string {
    const headers = [
      'ID',
      'Titre',
      'Description',
      'Localisation',
      'Statut',
      'Date de création',
    ];
    const rows = this.offers.map((offer: Offer) => [
      offer.id ?? '',
      `"${offer.title.replace(/"/g, '""')}"`,
      `"${(offer.description || '').replace(/"/g, '""').substring(0, 100)}"`,
      `"${offer.location.replace(/"/g, '""')}"`,
      offer.published ? 'Publiée' : 'Brouillon',
      this.formatDate(offer.createDate),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  printReport(): void {
    const printContent = `
      <html>
        <head>
          <title>Rapport Offres d'Emploi</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .stats { display: flex; justify-content: space-between; margin: 20px 0; }
            .stat-item { text-align: center; padding: 10px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #3498db; }
          </style>
        </head>
        <body>
          <h1>Rapport des Offres d'Emploi</h1>
          <p>Généré le: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>

          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${this.offers.length}</div>
              <div>Total offres</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.getPublishedCount()}</div>
              <div>Publiées</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.getUnpublishedCount()}</div>
              <div>Brouillons</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${this.getLocationsCount()}</div>
              <div>Localisations</div>
            </div>
          </div>

          <h3>Détails des offres (${this.filteredOffers.length})</h3>
          <table>
            <tr>
              <th>Titre</th>
              <th>Localisation</th>
              <th>Statut</th>
              <th>Date de création</th>
            </tr>
            ${this.filteredOffers
              .slice(0, 20)
              .map(
                (offer: Offer) => `
              <tr>
                <td>${offer.title}</td>
                <td>${offer.location}</td>
                <td>${offer.published ? 'Publiée' : 'Brouillon'}</td>
                <td>${this.formatDate(offer.createDate)}</td>
              </tr>
            `,
              )
              .join('')}
          </table>

          ${this.filteredOffers.length > 20 ? `<p>... et ${this.filteredOffers.length - 20} autres offres</p>` : ''}

          <footer style="margin-top: 50px; text-align: center; color: #7f8c8d;">
            <p>Plateforme de Recrutement - Module Administration</p>
          </footer>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }

  closeContactsModal(): void {
    this.showContactsModal = false;
  }

  closeSettingsModal(): void {
    this.showSettingsModal = false;
    this.settingsTab = 'general';
  }

  saveSystemSettings(): void {
    this.isLoading = true;

    try {
      localStorage.setItem(
        'adminSystemSettings',
        JSON.stringify(this.systemSettings),
      );

      setTimeout(() => {
        this.isLoading = false;
        this.successMessage = 'Paramètres système sauvegardés avec succès!';
        console.log('Paramètres sauvegardés:', this.systemSettings);
        this.closeSettingsModal();

        this.applySettings();
      }, 1500);
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
      this.errorMessage = 'Erreur lors de la sauvegarde des paramètres.';
      this.isLoading = false;
    }
  }

  private applySettings(): void {
    const body = document.body;
    if (this.systemSettings.theme === 'dark') {
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
    }
  }

  resetToDefaultSettings(): void {
    if (
      confirm(
        'Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?',
      )
    ) {
      this.systemSettings = {
        notifications: true,
        autoRefresh: false,
        refreshInterval: 30,
        language: 'fr',
        timezone: 'Europe/Paris',
        backupFrequency: 'daily',
        maxOffersPerPage: 50,
        exportFormats: ['pdf', 'excel', 'csv', 'json'],
        enableAuditLog: true,
        maintenanceMode: false,
        dateFormat: 'dd/MM/yyyy HH:mm',
        theme: 'light',
        sessionTimeout: 30,
      };
      localStorage.removeItem('adminSystemSettings');
      this.successMessage = 'Paramètres réinitialisés aux valeurs par défaut.';
    }
  }

  exportSystemSettings(): void {
    const settingsData = JSON.stringify(this.systemSettings, null, 2);
    const blob = new Blob([settingsData], {
      type: 'application/json;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parametres_systeme_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.successMessage = 'Paramètres exportés avec succès!';
  }

  importSystemSettings(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        this.systemSettings = { ...this.systemSettings, ...importedSettings };
        this.successMessage = 'Paramètres importés avec succès!';

        event.target.value = '';
      } catch (error) {
        console.error("Erreur d'import:", error);
        this.errorMessage =
          "Erreur lors de l'import du fichier JSON. Format invalide.";
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      this.errorMessage = 'Erreur de lecture du fichier.';
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  toggleExportFormat(format: string, event: any): void {
    if (event.target.checked) {
      if (!this.systemSettings.exportFormats.includes(format)) {
        this.systemSettings.exportFormats.push(format);
      }
    } else {
      if (this.systemSettings.exportFormats.length > 1) {
        const index = this.systemSettings.exportFormats.indexOf(format);
        if (index > -1) {
          this.systemSettings.exportFormats.splice(index, 1);
        }
      } else {
        event.target.checked = true;
        this.infoMessage = "Au moins un format d'export doit être activé.";
      }
    }
  }

  testNotification(): void {
    if ('Notification' in window && this.systemSettings.notifications) {
      if (Notification.permission === 'granted') {
        new Notification('Test de notification', {
          body: 'Ceci est un test des notifications système.',
          icon: 'assets/images/notification-icon.png',
        });
        this.successMessage = 'Notification de test envoyée!';
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Test de notification', {
              body: 'Ceci est un test des notifications système.',
              icon: 'assets/images/notification-icon.png',
            });
            this.successMessage = 'Notification de test envoyée!';
          }
        });
      }
    } else {
      this.infoMessage =
        'Les notifications ne sont pas supportées ou désactivées.';
    }
  }

  clearLocalData(): void {
    if (
      confirm('Cette action effacera toutes les données locales. Continuer ?')
    ) {
      localStorage.clear();
      sessionStorage.clear();
      this.successMessage =
        'Données locales effacées avec succès. Rechargez la page.';
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  generateSystemReport(): void {
    const report = {
      date: new Date().toISOString(),
      platform: 'Admin Dashboard',
      version: '2.0.1',
      user: this.currentUser?.username || 'Admin',
      offersCount: this.offers.length,
      publishedCount: this.getPublishedCount(),
      systemSettings: this.systemSettings,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      browserLanguage: navigator.language,
    };

    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], {
      type: 'application/json;charset=utf-8',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_systeme_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    this.successMessage = 'Rapport système généré avec succès!';
  }

  private showCurrentSettings(): void {
    const settings = {
      plateforme: 'Tableau de Bord Admin',
      version: '2.0.1',
      mode: 'Consultation seule',
      utilisateur: this.currentUser?.username || 'Admin',
      date: new Date().toLocaleString(),
    };

    console.log('Paramètres actuels:', settings);

    setTimeout(() => {
      this.infoMessage = `Plateforme: ${settings.plateforme} | Version: ${settings.version} | Mode: ${settings.mode}`;
    }, 500);
  }
}
