import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
})
export class RegisterComponent {
  form: any = {
    fname: '',
    lname: '',
    countryCode: '+216',
    phoneNumber: '',
    username: '',
    email: '',
    password: '',
    role: 'CANDIDAT',
  };

  successMessage = '';
  errorMessage = '';
  showPassword = false;

  passwordStrength = 0;
  hasMinLength = false;
  hasUpperCase = false;
  hasNumber = false;
  hasSpecialChar = false;
  acceptTerms = false;
  receiveUpdates = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit(): void {
    localStorage.clear();
    sessionStorage.clear();

    if (this.passwordStrength < 50) {
      this.errorMessage =
        'Please choose a stronger password (minimum "Good" strength)';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'You must accept the terms and conditions';
      return;
    }

    const userData = {
      fname: this.form.fname,
      lname: this.form.lname,
      phone: this.form.countryCode + this.form.phoneNumber,
      username: this.form.username,
      email: this.form.email,
      password: this.form.password,

      role: this.form.role,
    };

    console.log(
      '📤 Données FINALES envoyées:',
      JSON.stringify(userData, null, 2),
    );
    console.log(
      '🎯 Type de rôle:',
      typeof userData.role,
      'Valeur:',
      userData.role,
    );

    this.authService.register(userData).subscribe({
      next: (res: any) => {
        console.log('✅ Inscription réussie:', res);
        this.successMessage =
          res.message ||
          'Registration successful! Please check your email to verify your account.';
        this.errorMessage = '';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        console.error("❌ Erreur d'inscription complète:", err);

        if (err.status === 400) {
          this.errorMessage =
            err.error.message ||
            'Invalid registration data. Please check your information.';
        } else if (err.status === 409) {
          this.errorMessage =
            'Username or email already exists. Please choose another.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }

        console.error('❌ Erreur détaillée:', err);
        if (err.error) {
          console.error('❌ Message backend:', err.error.message);
          console.error('❌ Erreurs:', err.error.errors);
        }
      },
    });
  }

  checkPasswordStrength(password: string): number {
    let strength = 0;

    this.hasMinLength = false;
    this.hasUpperCase = false;
    this.hasNumber = false;
    this.hasSpecialChar = false;

    this.hasMinLength = password.length >= 8;
    if (this.hasMinLength) strength += 25;

    this.hasUpperCase = /[A-Z]/.test(password);
    if (this.hasUpperCase) strength += 25;

    this.hasNumber = /\d/.test(password);
    if (this.hasNumber) strength += 25;

    this.hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (this.hasSpecialChar) strength += 25;

    return strength;
  }

  getPasswordStrengthClass(): string {
    if (this.passwordStrength >= 75) return 'strong';
    if (this.passwordStrength >= 50) return 'good';
    if (this.passwordStrength >= 25) return 'fair';
    return 'weak';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength >= 75) return 'Strong';
    if (this.passwordStrength >= 50) return 'Good';
    if (this.passwordStrength >= 25) return 'Fair';
    return 'Weak';
  }

  onPasswordChange(password: string): void {
    this.passwordStrength = this.checkPasswordStrength(password);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
