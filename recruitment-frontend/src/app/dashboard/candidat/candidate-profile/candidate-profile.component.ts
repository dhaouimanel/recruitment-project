import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-candidate-profile',
  templateUrl: './candidate-profile.component.html',
  styleUrls: ['./candidate-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CandidateProfileComponent implements OnInit {
  profile: any = {
    fname: '',
    lname: '',
    username: '',
    email: '',
    countryCode: '+216',
    phoneNumber: '',
  };
  originalProfile: any = {};
  passwords = {
    current: '',
    new: '',
    confirm: '',
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  passwordStrength = 0;
  hasMinLength = false;
  hasUpperCase = false;
  hasNumber = false;
  hasSpecialChar = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.mapUserToProfile(user);
    }

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.mapUserToProfile(data);
        localStorage.setItem('user_info', JSON.stringify(data));
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement profil', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.errorMessage =
            'Impossible de rafraîchir les données. Affichage des données locales.';
        }
      },
    });
  }

  private mapUserToProfile(user: any): void {
    let countryCode = '+216';
    let phoneNumber = '';
    if (user.phone) {
      const match = user.phone.match(/^(\+\d+)(\d+)$/);
      if (match) {
        countryCode = match[1];
        phoneNumber = match[2];
      } else {
        phoneNumber = user.phone;
      }
    }
    this.profile = {
      fname: user.fname || '',
      lname: user.lname || '',
      username: user.username || '',
      email: user.email || '',
      countryCode,
      phoneNumber,
    };
    this.originalProfile = { ...this.profile };
  }

  hasChanges(): boolean {
    return (
      JSON.stringify(this.profile) !== JSON.stringify(this.originalProfile) ||
      this.passwords.new.length > 0
    );
  }

  onSubmit(): void {
    if (!this.hasChanges()) {
      this.errorMessage = 'Aucune modification détectée.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const updatedData: any = {
      fname: this.profile.fname,
      lname: this.profile.lname,
      username: this.profile.username,
      email: this.profile.email,
      phone: this.profile.countryCode + this.profile.phoneNumber,
    };

    if (this.passwords.new) {
      if (this.passwords.new !== this.passwords.confirm) {
        this.errorMessage = 'Les mots de passe ne correspondent pas.';
        this.isLoading = false;
        return;
      }
      if (!this.passwords.current) {
        this.errorMessage = 'Veuillez fournir votre mot de passe actuel.';
        this.isLoading = false;
        return;
      }
      updatedData.currentPassword = this.passwords.current;
      updatedData.newPassword = this.passwords.new;
    }

    this.authService.updateProfile(updatedData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        console.log('✅ Réponse mise à jour:', response);

        if (response.accessToken) {
          console.log('🔐 Nouveau token reçu, mise à jour...');
          this.authService.setToken(response.accessToken);

          const newToken = this.authService.getToken();
          console.log(
            '🔐 Token après setToken:',
            newToken?.substring(0, 20) + '...',
          );
        } else {
          console.warn('⚠️ Aucun token dans la réponse');
          alert('Profil mis à jour mais vous devez vous reconnecter.');
          this.authService.logout();
          return;
        }

        this.successMessage = 'Profil mis à jour avec succès.';
        this.passwords = { current: '', new: '', confirm: '' };

        this.authService.getProfile().subscribe({
          next: (data) => {
            this.mapUserToProfile(data);
            localStorage.setItem('user_info', JSON.stringify(data));
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur rechargement profil', err);
            if (err.status === 401) {
              this.authService.logout();
            }
          },
        });
      },
      error: (err) => {
        this.isLoading = false;
        const backendMessage = err.error?.message;
        if (backendMessage) {
          this.errorMessage = backendMessage;
        } else if (err.status === 401) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          this.authService.logout();
        } else {
          this.errorMessage = 'Erreur lors de la mise à jour.';
        }
        console.error('Erreur update profile', err);
      },
    });
  }

  resetForm(): void {
    this.loadUserProfile();
    this.passwords = { current: '', new: '', confirm: '' };
    this.successMessage = '';
    this.errorMessage = '';
  }

  goBack(): void {
    if (this.hasChanges()) {
      if (
        confirm(
          'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?',
        )
      ) {
        this.router.navigate(['/candidate']);
      }
    } else {
      this.router.navigate(['/candidate']);
    }
  }

  onPasswordChange(password: string): void {
    this.passwordStrength = this.checkPasswordStrength(password);
  }

  checkPasswordStrength(password: string): number {
    let strength = 0;
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
    if (this.passwordStrength >= 75) return 'Fort';
    if (this.passwordStrength >= 50) return 'Bon';
    if (this.passwordStrength >= 25) return 'Moyen';
    return 'Faible';
  }
}
