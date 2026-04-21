import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {
    console.log('🔥 ResetPasswordComponent construit');
  }

  ngOnInit(): void {
    const tokenFromPath = this.route.snapshot.paramMap.get('token');

    if (tokenFromPath) {
      this.token = tokenFromPath;
    } else {
      this.route.queryParams.subscribe((params) => {
        this.token = params['token'];
        if (!this.token) {
          this.error = 'Token manquant. Veuillez réessayer.';
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.token) {
      this.error = 'Token invalide ou manquant.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.error = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.message = res.message || 'Mot de passe modifié avec succès.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error =
          err.error?.message || 'Erreur lors de la réinitialisation.';
      },
    });
  }
}
