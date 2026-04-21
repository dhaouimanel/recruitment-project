import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ApplicationResponse,
  ApplicationStatus,
} from '../../../models/application.model';
import { RhService } from '../../../auth/services/rh.service';
import {
  ApplicationEmailDTO,
  EmailService,
} from '../../../auth/services/email.service';
import { ThemeService } from '../../../auth/services/theme.service';

@Component({
  selector: 'app-rh-offer-applications',
  templateUrl: './rh-offer-applications.component.html',
  styleUrls: ['./rh-offer-applications.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class RhOfferApplicationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rhService = inject(RhService);
  private emailService = inject(EmailService);
  public themeService = inject(ThemeService);


  similarityThreshold: number = 0.7;
  viewMode: 'all' | 'best' = 'all';

  offerSequentialNumber: number = 0;

  bestApplication: ApplicationResponse | null = null;
  offerId!: number;
  applications: ApplicationResponse[] = [];
  filteredApplications: ApplicationResponse[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  editingNotes: { [key: number]: string } = {};
  editingRating: { [key: number]: number } = {};

  statusFilter: string = 'all';

  offerTitle: string = '';

  showEmailModal = false;
  selectedApplication: ApplicationResponse | null = null;
  emailType: 'interview' | 'rejection' | 'info' | 'generic' | 'meeting' =
    'generic';

  bulkCandidates: ApplicationResponse[] = [];

  customData = {
    interviewDate: '',
    interviewTime: '',
    interviewLocation: '',
    rejectionReason: '',
    message: '',

    meetingDate: '',
    meetingStartTime: '',
    meetingDuration: '60',
    meetingType: 'in-person',
    meetingLocation: '',
    meetingLink: '',
    additionalAttendees: '',
    additionalInstructions: '',
  };

  emailSubject = '';
  isSendingEmail = false;

  statusOptions = [
    {
      value: 'A_CONTACTER',
      label: 'À contacter',
      color: '#ff9800',
      icon: 'fa-clock',
    },
    {
      value: 'RETENUE',
      label: 'Retenue',
      color: '#2196f3',
      icon: 'fa-user-check',
    },
    {
      value: 'ELIMINE',
      label: 'Éliminée',
      color: '#f44336',
      icon: 'fa-times-circle',
    },
    {
      value: 'RECRUTE',
      label: 'Recrutée',
      color: '#4caf50',
      icon: 'fa-check-circle',
    },
  ];

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.offerId = +params['id'];
      this.calculateOfferNumber();
      this.loadApplications();
    });
  }
  calculateOfferNumber(): void {
    this.rhService.getOffers().subscribe({
      next: (offers) => {
        const offer = offers.find((o) => o.id === this.offerId);

        this.offerTitle = offer?.title || `Offre #${this.offerId}`;

        const index = offers.findIndex((o) => o.id === this.offerId);
        this.offerSequentialNumber = index !== -1 ? index + 1 : this.offerId;
      },
      error: () => {
        this.offerTitle = `Offre #${this.offerId}`;
        this.offerSequentialNumber = this.offerId;
      },
    });
  }
  loadApplications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rhService.getApplicationsByOffer(this.offerId, true).subscribe({
      next: (data) => {
        console.log('✅ Données reçues du backend :', data);
        console.log(
          '🎯 Scores de similarité :',
          data.map((a) => a.similarityScore),
        );

        this.applications = data.map((app) => ({
          ...app,
          status: this.normalizeStatus(app.status),
          applicationDate: app.createdAt,
        }));
        this.filterApplications();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.errorMessage = 'Erreur lors du chargement des candidatures';
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

  isBestScore(app: ApplicationResponse): boolean {
    if (!app.similarityScore) return false;
    const maxScore = Math.max(
      ...this.applications.map((a) => a.similarityScore || 0),
    );
    return app.similarityScore === maxScore && maxScore > 0;
  }

  private normalizeStatus(status: string): ApplicationStatus {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'A_CONTACTER':
        return 'A_CONTACTER';
      case 'RETENUE':
        return 'RETENUE';
      case 'ELIMINE':
        return 'ELIMINE';
      case 'RECRUTE':
        return 'RECRUTE';
      default:
        return 'A_CONTACTER';
    }
  }

  filterApplications(): void {
    console.log('🔍 Filtrage avec seuil =', this.similarityThreshold);
    console.log(
      '📊 Applications brutes :',
      this.applications.map((a) => ({
        nom: a.candidateLastName,
        score: a.similarityScore,
      })),
    );

    let filtered = [...this.applications];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.candidateFirstName.toLowerCase().includes(term) ||
          app.candidateLastName.toLowerCase().includes(term) ||
          app.candidateEmail.toLowerCase().includes(term) ||
          (app.candidatePhone &&
            app.candidatePhone.toLowerCase().includes(term)) ||
          (app.candidateNotes &&
            app.candidateNotes.toLowerCase().includes(term)),
      );
    }

    if (this.viewMode === 'all' && this.similarityThreshold > 0) {
      const avant = filtered.length;
      filtered = filtered.filter(
        (app) =>
          app.similarityScore !== undefined &&
          app.similarityScore !== null &&
          app.similarityScore >= this.similarityThreshold,
      );
      console.log(
        `📉 Après filtre seuil ${this.similarityThreshold} : ${avant} → ${filtered.length} candidats`,
      );
      console.log(
        '✅ Candidats conservés :',
        filtered.map((a) => a.similarityScore),
      );
    }

    this.filteredApplications = filtered;
  }

  getStatusInfo(status: string): any {
    return (
      this.statusOptions.find((opt) => opt.value === status) || {
        label: status,
        color: '#ccc',
        icon: 'fa-question',
      }
    );
  }

  updateApplicationStatus(
    application: ApplicationResponse,
    newStatus: string,
  ): void {
    const normalizedStatus = this.normalizeStatus(newStatus);

    this.rhService
      .updateApplicationStatus(application.id, normalizedStatus)
      .subscribe({
        next: () => {
          this.successMessage = 'Statut mis à jour avec succès';
          application.status = normalizedStatus;
          this.filterApplications();
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.errorMessage = 'Erreur lors de la mise à jour du statut';
        },
      });
  }

  downloadCV(application: ApplicationResponse): void {
    if (!application.id) return;

    this.rhService.downloadCv(application.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${application.candidateLastName}_${application.candidateFirstName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur téléchargement CV:', error);
        this.errorMessage = 'Erreur lors du téléchargement du CV';
      },
    });
  }

  downloadCoverLetter(application: ApplicationResponse): void {
    if (!application.id) return;

    this.rhService.downloadCoverLetter(application.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lettre_Motivation_${application.candidateLastName}_${application.candidateFirstName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur téléchargement lettre:', error);
        this.errorMessage =
          'Erreur lors du téléchargement de la lettre de motivation';
      },
    });
  }

  startEditNotes(application: ApplicationResponse): void {
    this.editingNotes[application.id] = application.candidateNotes || '';
    this.editingRating[application.id] = application.rating || 0;
  }

  saveNotes(application: ApplicationResponse): void {
    application.candidateNotes = this.editingNotes[application.id];
    application.rating = this.editingRating[application.id];
    delete this.editingNotes[application.id];
    delete this.editingRating[application.id];
    this.successMessage = 'Notes sauvegardées';
  }

  cancelEditNotes(applicationId: number): void {
    delete this.editingNotes[applicationId];
    delete this.editingRating[applicationId];
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Non spécifié';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';

      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date invalide';
    }
  }

  goBack(): void {
    this.router.navigate(['/rh']);
  }

  getApplicationsCountByStatus(status: string): number {
    return this.applications.filter((app) => app.status === status).length;
  }

  getTotalApplications(): number {
    return this.applications.length;
  }

  showAlert(message: string): void {
    alert(message);
  }

  openEmailModal(application: ApplicationResponse): void {
    this.bulkCandidates = [];
    this.selectedApplication = application;
    this.showEmailModal = true;
    this.emailType = 'generic';
    this.emailSubject = `À propos de votre candidature - ${application.offerTitle || 'Offre'}`;
    this.customData.message = `Bonjour ${application.candidateFirstName},\n\nNous vous remercions pour votre candidature.`;
  }

  getTopCandidates(): ApplicationResponse[] {
    return this.applications.filter(
      (app) => app.similarityScore !== undefined && app.similarityScore > 0.7,
    );
  }

  openBulkEmailModal(): void {
    const topCandidates = this.getTopCandidates();
    if (topCandidates.length === 0) {
      this.errorMessage = 'Aucun candidat avec un score supérieur à 70%.';
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    const defaultTime = '00:00';

    this.customData = {
      ...this.customData,
      meetingDate: defaultDate,
      meetingStartTime: defaultTime,
      meetingDuration: '60',
      meetingType: 'in-person',
      meetingLocation: 'Nos locaux (à préciser)',
      additionalInstructions: 'Merci de confirmer votre présence.',
    };

    this.bulkCandidates = topCandidates;
    this.selectedApplication = null;
    this.showEmailModal = true;
    this.emailType = 'meeting';
    this.emailSubject = `Invitation à une réunion – Candidats présélectionnés – Offre #${this.offerId}`;
    this.customData.message = `Bonjour,\n\nVous faites partie des candidats présélectionnés pour cette offre. Nous vous contacterons prochainement pour les détails de l’entretien.\n\nCordialement,\nL’équipe RH`;
  }

  private sendBulkEmails(): void {
    this.isSendingEmail = true;

    if (!this.customData.message?.trim()) {
      this.errorMessage = 'Le message ne peut pas être vide.';
      this.isSendingEmail = false;
      return;
    }

    const emailRequests = this.bulkCandidates.map((candidate) => {
      const emailData: ApplicationEmailDTO = {
        applicationId: candidate.id,
        candidateName: `${candidate.candidateFirstName} ${candidate.candidateLastName}`,
        candidateEmail: candidate.candidateEmail,
        offerTitle: candidate.offerTitle || `Offre #${candidate.offerId}`,
        emailType: this.emailType === 'meeting' ? 'interview' : this.emailType,
        customData: {
          ...this.customData,

          message:
            `Bonjour ${candidate.candidateFirstName},\n\n` +
            this.customData.message.replace(/^Bonjour,\s*/, ''),
        },
      };
      return this.emailService.sendEmailToCandidate(emailData);
    });

    forkJoin(emailRequests).subscribe({
      next: (results) => {
        this.successMessage = `Emails envoyés avec succès à ${this.bulkCandidates.length} candidat(s).`;
        this.closeEmailModal();
        this.isSendingEmail = false;
      },
      error: (error) => {
        console.error('Erreur envoi groupé:', error);

        const status = error.status;
        const errorMsg =
          error.error?.message || error.message || 'Erreur inconnue';
        this.errorMessage = `Erreur ${status ? ` ${status}` : ''} : ${errorMsg}`;
        this.isSendingEmail = false;
      },
    });
  }

  private sendSingleEmail(): void {
    if (!this.selectedApplication) return;

    this.isSendingEmail = true;
    this.errorMessage = '';
    this.successMessage = '';

    const backendEmailType =
      this.emailType === 'meeting' ? 'interview' : this.emailType;

    const emailData: ApplicationEmailDTO = {
      applicationId: this.selectedApplication.id,
      candidateName: `${this.selectedApplication.candidateFirstName} ${this.selectedApplication.candidateLastName}`,
      candidateEmail: this.selectedApplication.candidateEmail,
      offerTitle:
        this.selectedApplication.offerTitle ||
        `Offre #${this.selectedApplication.offerId}`,
      emailType: backendEmailType,
      customData: {
        interviewDate:
          this.customData.meetingDate || this.customData.interviewDate,
        interviewTime:
          this.customData.meetingStartTime || this.customData.interviewTime,
        interviewLocation:
          this.customData.meetingLocation || this.customData.interviewLocation,
        rejectionReason: this.customData.rejectionReason,
        message: this.customData.message,

        meetingDate: this.customData.meetingDate,
        meetingStartTime: this.customData.meetingStartTime,
        meetingDuration: this.customData.meetingDuration,
        meetingType: this.customData.meetingType,
        meetingLocation: this.customData.meetingLocation,
        meetingLink: this.customData.meetingLink,
        additionalAttendees: this.customData.additionalAttendees,
        additionalInstructions: this.customData.additionalInstructions,
      },
    };
    console.log('📤 Données envoyées au backend :', emailData.customData);

    if (
      !emailData.customData.message &&
      (this.emailType === 'meeting' || this.emailType === 'interview')
    ) {
      emailData.customData.message = this.generateDefaultMeetingMessage();
    }

    if (!emailData.customData.message && this.emailType === 'generic') {
      emailData.customData.message = `Bonjour ${emailData.candidateName},\n\nNous vous remercions pour votre candidature au poste de ${emailData.offerTitle}. Nous vous contacterons prochainement pour la suite du processus.\n\nCordialement,\nL'équipe RH`;
    }

    this.emailService.sendEmailToCandidate(emailData).subscribe({
      next: () => {
        this.successMessage = `Email envoyé à ${emailData.candidateName} avec succès !`;
        this.closeEmailModal();
        this.isSendingEmail = false;
      },
      error: (error) => {
        console.error('Erreur envoi email:', error);
        this.errorMessage = `Erreur lors de l'envoi de l'email: ${error.error || error.message}`;
        this.isSendingEmail = false;
      },
    });
  }

  sendEmailToCandidate(): void {
    if (this.bulkCandidates && this.bulkCandidates.length > 0) {
      this.sendBulkEmails();
    } else {
      this.sendSingleEmail();
    }
  }

  private generateDefaultMeetingMessage(): string {
    if (!this.selectedApplication) return '';

    const dateStr = this.customData.meetingDate
      ? this.formatPreviewDate(this.customData.meetingDate)
      : '';
    const timeStr = this.customData.meetingStartTime || '';
    const durationStr = this.customData.meetingDuration || '60';
    const locationInfo = this.getLocationInfo();
    const meetingTypeText =
      this.emailType === 'meeting' ? 'réunion' : 'entretien';

    let message = `Bonjour ${this.selectedApplication.candidateFirstName},\n\n`;
    message += `Nous vous invitons à une ${meetingTypeText} concernant votre candidature pour le poste de ${this.selectedApplication.offerTitle || 'cette offre'}.\n\n`;

    if (dateStr || timeStr || locationInfo) {
      message += `**Détails de la ${meetingTypeText} :**\n`;
      if (dateStr) message += `- Date : ${dateStr}\n`;
      if (timeStr) message += `- Heure : ${timeStr}\n`;
      if (durationStr) message += `- Durée : ${durationStr} minutes\n`;
      if (locationInfo) message += `${locationInfo}\n`;
    }

    if (this.customData.additionalInstructions) {
      message += `\n**Instructions :**\n${this.customData.additionalInstructions}\n`;
    }

    message +=
      "\nMerci de confirmer votre participation.\n\nCordialement,\nL'équipe RH";

    return message;
  }

  private getLocationInfo(): string {
    if (
      this.customData.meetingType === 'online' &&
      this.customData.meetingLink
    ) {
      return `- Format : Visioconférence\n  Lien : ${this.customData.meetingLink}`;
    } else if (
      this.customData.meetingType === 'in-person' &&
      this.customData.meetingLocation
    ) {
      return `- Lieu : ${this.customData.meetingLocation}`;
    } else if (this.customData.meetingType === 'hybrid') {
      const parts = [];
      if (this.customData.meetingLocation)
        parts.push(`- Présentiel : ${this.customData.meetingLocation}`);
      if (this.customData.meetingLink)
        parts.push(`- En ligne : ${this.customData.meetingLink}`);
      return parts.join('\n');
    }
    return '';
  }

  onMeetingTypeChange(): void {
    if (this.customData.meetingType === 'online') {
      this.customData.meetingLocation = '';
    } else if (this.customData.meetingType === 'in-person') {
      this.customData.meetingLink = '';
    }
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  closeEmailModal(): void {
    this.showEmailModal = false;
    this.selectedApplication = null;
    this.bulkCandidates = [];
    this.resetEmailForm();
  }

  private resetEmailForm(): void {
    this.emailType = 'generic';
    this.customData = {
      interviewDate: '',
      interviewTime: '',
      interviewLocation: '',
      rejectionReason: '',
      message: '',
      meetingDate: '',
      meetingStartTime: '',
      meetingDuration: '60',
      meetingType: 'in-person',
      meetingLocation: '',
      meetingLink: '',
      additionalAttendees: '',
      additionalInstructions: '',
    };
    this.emailSubject = '';
  }

  updateEmailSubject(): void {
    if (this.bulkCandidates.length > 0) {
      this.emailSubject = `Invitation à une réunion – Candidats présélectionnés – Offre #${this.offerId}`;
      return;
    }

    if (!this.selectedApplication) return;

    const offerTitle =
      this.selectedApplication.offerTitle ||
      `Offre #${this.selectedApplication.offerId}`;

    switch (this.emailType) {
      case 'interview':
        this.emailSubject = `Invitation à un entretien - ${offerTitle}`;
        break;
      case 'meeting':
        this.emailSubject = `Invitation à une réunion - ${offerTitle}`;
        break;
      case 'rejection':
        this.emailSubject = `Retour sur votre candidature - ${offerTitle}`;
        break;
      default:
        this.emailSubject = `Message concernant votre candidature - ${offerTitle}`;
    }
  }

  formatPreviewDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  exportToExcel(): void {
    if (this.filteredApplications.length === 0) {
      this.errorMessage = 'Aucune donnée à exporter';
      return;
    }

    let csvContent =
      'Nom;Prénom;Email;Téléphone;Date candidature;Statut;Notes\n';

    this.filteredApplications.forEach((app) => {
      const row = [
        app.candidateLastName,
        app.candidateFirstName,
        app.candidateEmail,
        app.candidatePhone || '',
        this.formatDate(app.applicationDate),
        this.getStatusInfo(app.status).label,
        app.candidateNotes || '',
      ]
        .map((field) => `"${field?.toString().replace(/"/g, '""') || ''}"`)
        .join(';');

      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `candidatures-offre-${this.offerId}-${date}.csv`,
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.successMessage = 'Export Excel terminé avec succès';
  }

  toggleViewMode(): void {
    if (this.viewMode === 'all') {
      this.viewMode = 'best';
      this.loadAdaptedCvs(this.similarityThreshold);
    } else {
      this.viewMode = 'all';
      this.loadApplications();
    }
  }

  sendInterviewToBestCandidate(): void {
    if (!this.bestApplication) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];
    const defaultTime = '09:30';

    this.customData = {
      ...this.customData,
      meetingDate: defaultDate,
      meetingStartTime: defaultTime,
      meetingDuration: '60',
      meetingType: 'in-person',
      meetingLocation: 'Nos locaux (à préciser)',
      meetingLink: '',
      additionalAttendees: '',
      additionalInstructions: 'Merci de confirmer votre présence.',
      message: '',
    };

    this.openEmailModal(this.bestApplication);
    this.emailType = 'interview';
    this.updateEmailSubject();
  }

  loadAdaptedCvs(threshold: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.rhService.getAdaptedCvsForOffer(this.offerId, threshold).subscribe({
      next: (data) => {
        console.log(`✅ Candidatures avec score >= ${threshold} :`, data);
        this.applications = data.map((app) => ({
          ...app,
          status: this.normalizeStatus(app.status),
          applicationDate: app.createdAt,
        }));
        this.filterApplications();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.errorMessage =
          'Erreur lors du chargement des candidatures adaptées.';
        this.applications = [];
        this.filteredApplications = [];
        this.isLoading = false;
      },
    });
  }
}
