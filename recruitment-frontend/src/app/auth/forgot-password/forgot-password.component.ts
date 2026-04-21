import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message = res.message || 'Email envoyé avec succès.';
        this.error = '';
      },
      error: (err) => {
        this.error = err.error?.message || "Erreur lors de l'envoi.";
        this.message = '';
      },
    });
  }
}
