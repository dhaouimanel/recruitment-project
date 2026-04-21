import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Offer } from '../../../models/offer.model';
import { PublicOfferService } from '../../../auth/services/public-offer.service';
import { CandidateApplicationService } from '../../../auth/services/candidate-application.services';
import { AuthService } from '../../../auth/services/auth.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
})
export class ApplyComponent implements OnInit {
  @ViewChild('cvFileInput') cvFileInput!: ElementRef;
  @ViewChild('coverLetterFileInput') coverLetterFileInput!: ElementRef;

  offer: Offer | null = null;
  applicationForm: FormGroup;
  isLoading = false;
  isLoadingOffer = false;
  errorMessage = '';
  successMessage = '';
  offerId: number | null = null;
  currentUser: any = null;
  authError: string = '';


  // Gestion du CV
  cvFile: File | null = null;
  cvFileName: string = '';
  cvFileSize: string = '';
  cvFileError: string = '';
  hasExistingCv = false;          // Initialisé à false → zone d'upload visible immédiatement
  existingCvName = '';
  existingCvSize = '';
  isLoadingCv = false;

isFetchingCv = true;

previousCvs: {applicationId: number, cvFileName: string, offerTitle: string, applicationDate: string}[] = [];
selectedPreviousCvId: number | null = null;
showPreviousCvs = false;// Pas de spinner, affichage direct

  // Gestion de la lettre de motivation
  coverLetterFile: File | null = null;
  coverLetterFileName: string = '';
  coverLetterFileSize: string = '';
  coverLetterFileError: string = '';

  hasAlreadyApplied = false;
  checkingApplication = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private publicOfferService: PublicOfferService,
    private applicationService: CandidateApplicationService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.applicationForm = this.fb.group({
      message: ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    if (
      !this.authService.isLoggedIn() ||
      this.authService.getUserRole() !== 'ROLE_CANDIDAT'
    ) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: this.router.url,
          offerId: this.route.snapshot.paramMap.get('id'),
        },
      });
      return;
    }

    this.currentUser = this.authService.getCurrentUser();
    this.offerId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.offerId) {
      this.loadOffer(this.offerId);
      this.loadExistingCv();
      this.loadPreviousCvs();   // Charge le CV existant en arrière‑plan
    } else {
      this.errorMessage = 'Aucune offre spécifiée';
    }
  }

 loadPreviousCvs(): void {
  this.applicationService.getPreviousCvs().subscribe({
    next: (cvs) => {
      // Éliminer les doublons par nom de fichier (optionnel)
      const seen = new Set<string>();
      this.previousCvs = cvs
        .filter(cv => {
          if (seen.has(cv.cvFileName)) return false;
          seen.add(cv.cvFileName);
          return true;
        })
        .map(cv => ({
          applicationId: cv.applicationId,
          cvFileName: cv.cvFileName,
          offerTitle: cv.offerTitle,
          applicationDate: this.formatDate(cv.applicationDate)
        }))
        .slice(0, 5);
      this.showPreviousCvs = this.previousCvs.length > 0;
    },
    error: (err) => {
      console.error('Erreur chargement CV précédents', err);
      this.showPreviousCvs = false;
    }
  });
}

selectPreviousCv(cv: any): void {
  this.selectedPreviousCvId = cv.applicationId;
  // Télécharger le CV depuis cette candidature et le mettre comme fichier actif
  this.applicationService.downloadCv(cv.applicationId).subscribe({
    next: (blob) => {
      const file = new File([blob], cv.cvFileName, { type: 'application/pdf' });
      this.cvFile = file;
      this.cvFileName = cv.cvFileName;
      this.cvFileSize = this.formatFileSize(blob.size);
      this.cvFileError = '';
      // Si l'utilisateur n'a pas de CV dans son profil, on l'uploade aussi
      if (!this.hasExistingCv) {
        this.applicationService.uploadMyCv(file).subscribe({
          next: () => this.loadExistingCv()
        });
      }
    },
    error: () => { this.cvFileError = 'Impossible de charger ce CV'; }
  });
}

previewPreviousCv(applicationId: number, event: Event): void {
  event.stopPropagation();
  this.applicationService.downloadCv(applicationId).subscribe({
    next: (blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
}

  loadExistingCv(): void {
  this.isFetchingCv = true; // Début du chargement

  this.applicationService.getMyCvInfo().subscribe({
    next: (info) => {
      if (info && info.filename) {
        this.hasExistingCv = true;
        this.existingCvName = info.filename;
        const fileSize = typeof info.size === 'number' ? info.size : 0;
        this.existingCvSize = this.formatFileSize(fileSize);
      } else {
        this.hasExistingCv = false;
      }
      this.isFetchingCv = false; // Chargement fini
      this.cdr.detectChanges();
    },
    error: (err) => {
      // Tentative de fallback sur le blob si l'info échoue
      this.applicationService.getMyCv().subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            this.hasExistingCv = true;
            this.existingCvName = 'Mon CV.pdf';
            this.existingCvSize = this.formatFileSize(blob.size);
          } else {
            this.hasExistingCv = false;
          }
          this.isFetchingCv = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.hasExistingCv = false;
          this.isFetchingCv = false;
          this.cdr.detectChanges();
        }
      });
    }
  });
}

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return 'Taille inconnue';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  triggerCvFileInput(): void {
    this.cvFileInput.nativeElement.click();
  }

  onCvFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.cvFileError = 'Seuls les fichiers PDF sont acceptés pour le CV';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.cvFileError = 'Le fichier est trop volumineux (max 5MB)';
      return;
    }

    this.applicationService.uploadMyCv(file).subscribe({
      next: () => {
        this.loadExistingCv();   // Recharge les infos du CV
        this.cvFile = null;
        this.cvFileName = '';
        this.cvFileSize = '';
        this.cvFileError = '';
        this.cvFileInput.nativeElement.value = '';
      },
      error: (err) => {
        this.cvFileError = "Erreur lors de l'enregistrement du CV";
        console.error(err);
      },
    });
  }

  removeCvFile(event: Event): void {
    event.stopPropagation();
    this.applicationService.deleteMyCv().subscribe({
      next: () => {
        this.hasExistingCv = false;
        this.existingCvName = '';
        this.existingCvSize = '';
        this.cvFile = null;
        this.cvFileName = '';
        this.cvFileSize = '';
        this.cvFileError = '';
        this.cvFileInput.nativeElement.value = '';
        this.loadExistingCv();
      },
      error: (err) => {
        console.error('Erreur suppression CV', err);
        this.cvFileError = "Impossible de supprimer le CV";
      },
    });
  }

  triggerCoverLetterFileInput(): void {
    this.coverLetterFileInput.nativeElement.click();
  }

  onCoverLetterFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      this.coverLetterFileError = 'Formats acceptés : PDF, DOC, DOCX';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.coverLetterFileError = 'Le fichier est trop volumineux (max 5MB)';
      return;
    }

    this.coverLetterFile = file;
    this.coverLetterFileName = file.name;
    this.coverLetterFileSize = this.formatFileSize(file.size);
    this.coverLetterFileError = '';
  }

  removeCoverLetterFile(event: Event): void {
    event.stopPropagation();
    this.coverLetterFile = null;
    this.coverLetterFileName = '';
    this.coverLetterFileSize = '';
    this.coverLetterFileError = '';
    this.coverLetterFileInput.nativeElement.value = '';
  }

  isPdfFile(filename: string): boolean {
    return filename.toLowerCase().endsWith('.pdf');
  }

  isWordFile(filename: string): boolean {
    return (
      filename.toLowerCase().endsWith('.doc') ||
      filename.toLowerCase().endsWith('.docx')
    );
  }

  onSubmit(): void {
    if (!this.hasExistingCv && !this.cvFile) {
      this.cvFileError = 'Veuillez télécharger votre CV';
      return;
    }
    if (!this.coverLetterFile) {
      this.coverLetterFileError = 'Veuillez télécharger votre lettre de motivation';
      return;
    }
    if (this.hasAlreadyApplied) {
      this.errorMessage = 'Vous avez déjà postulé à cette offre.';
      return;
    }
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url, offerId: this.offerId },
        });
      }, 2000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = new FormData();
    if (this.cvFile) {
  formData.append('cvFile', this.cvFile, this.cvFile.name);
} else if (this.selectedPreviousCvId && !this.hasExistingCv) {
  this.cvFileError = 'Erreur: CV non chargé. Veuillez resélectionner.';
  this.isLoading = false;
  return;
}
    formData.append('coverLetterFile', this.coverLetterFile, this.coverLetterFile.name);
    formData.append('offerId', this.offerId!.toString());

    const message = this.applicationForm.get('message')?.value;
    if (message) {
      formData.append('message', message);
    }

    this.applicationService.applyWithFiles(formData).subscribe({
      next: (response) => {
        console.log('✅ Candidature envoyée:', response);
        this.successMessage = 'Votre candidature a été envoyée avec succès !';
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/candidate']);
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        if (error.status === 401 || error.status === 403) {
          this.errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: `/candidate/apply/${this.offerId}`, reason: 'session_expired' },
            });
          }, 2000);
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Données invalides. Vérifiez vos informations.';
        } else if (error.status === 409) {
          this.errorMessage = 'Vous avez déjà postulé à cette offre.';
        } else {
          this.errorMessage = error.error?.message || "Impossible d'envoyer votre candidature. Veuillez réessayer.";
        }
        this.isLoading = false;
      },
    });
  }

  loadOffer(id: number): void {
    this.isLoadingOffer = true;
    this.errorMessage = '';
    this.publicOfferService.getOfferById(id).subscribe({
      next: (data: Offer) => {
        this.offer = {
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          published: data.published !== undefined ? data.published : false,
          createDate: data.createDate,
        };
        if (!this.offer.published) {
          this.errorMessage = "Cette offre n'est plus disponible";
        }
        this.checkingApplication = true;
        this.applicationService.checkIfAlreadyApplied(id).subscribe({
          next: (alreadyApplied) => {
            this.hasAlreadyApplied = alreadyApplied;
            this.checkingApplication = false;
          },
          error: (err) => {
            console.error('Erreur de vérification', err);
            this.checkingApplication = false;
          },
        });
        this.isLoadingOffer = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = "Impossible de charger l'offre";
        this.isLoadingOffer = false;
      },
    });
  }

  formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return 'Date non disponible';
    }
  }

  refreshSession(): void {
    this.authService.logout();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url, offerId: this.offerId, reason: 'session_refresh' },
    });
  }

  previewCv(): void {
    this.applicationService.getMyCv().subscribe({
      next: (blob) => {
        if (!blob || blob.size === 0) {
          alert('Aucun CV trouvé dans votre profil. Veuillez en télécharger un.');
          this.loadExistingCv();
          return;
        }
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        if (err.status === 404 || err.status === 204) {
          alert('Aucun CV trouvé dans votre profil.');
          this.loadExistingCv();
        } else {
          console.error('Erreur lors du chargement du CV', err);
          alert('Impossible de charger le CV.');
        }
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/candidate']);
  }
}
