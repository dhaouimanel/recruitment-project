import { Component } from '@angular/core';
import { RecruiterOfferService } from '../../../auth/services/recruiter-offer.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-recruiter-offers',
  templateUrl: './recruiter-offers.component.html',
  styleUrls: ['./recruiter-offers.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class RecruiterOffersComponent {
  isGenerating = false;
  message = '';

  constructor(private recruiterService: RecruiterOfferService ,
    public authService: AuthService,
  ) {}

  generateEmbeddings(): void {
    if (!confirm('Générer les embeddings pour toutes les offres ? Cela peut prendre un moment.')) return;

    this.isGenerating = true;
    this.message = 'Génération en cours...';

    this.recruiterService.generateEmbeddings().subscribe({
      next: (res) => {
        this.message = res;
        this.isGenerating = false;
        setTimeout(() => this.message = '', 5000);
      },
      error: (err) => {
        console.error(err);
        this.message = 'Erreur lors de la génération.';
        this.isGenerating = false;
        setTimeout(() => this.message = '', 5000);
      }
    });
  }
}
