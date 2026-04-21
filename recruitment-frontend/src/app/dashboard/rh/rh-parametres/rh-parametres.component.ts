import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { RhService } from '../../../auth/services/rh.service';
import { ThemeService } from '../../../auth/services/theme.service';

@Component({
  selector: 'app-rh-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rh-parametres.component.html',
  styleUrls: ['./rh-parametres.component.scss'],
})
export class RhParametresComponent implements OnInit {
  user = {
    id: 0,
    username: '',
    email: '',
    prenom: '',
    nom: '',
    telephone: '',
    fonction: 'Responsable RH',
  };

  password = {
    old: '',
    new: '',
    confirm: '',
  };

  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private authService: AuthService,
    private rhService: RhService,
    private router: Router,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.rhService.getProfile().subscribe({
      next: (data) => {
        this.user = {
          id: data.id,
          username: data.username,
          email: data.email,
          prenom: data.fname,
          nom: data.lname,
          telephone: data.phone || '',
          fonction: this.user.fonction,
        };
      },
      error: (err) => {
        console.error('Erreur chargement profil', err);
        this.showMessage('Impossible de charger le profil', 'error');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/rh']);
  }

  changePassword(): void {
    if (!this.password.old || !this.password.new || !this.password.confirm) {
      this.showMessage('Veuillez remplir tous les champs', 'error');
      return;
    }
    if (this.password.new !== this.password.confirm) {
      this.showMessage(
        'Les nouveaux mots de passe ne correspondent pas',
        'error',
      );
      return;
    }
    if (this.password.new.length < 6) {
      this.showMessage(
        'Le mot de passe doit contenir au moins 6 caractères',
        'error',
      );
      return;
    }

    this.saveSettings();
  }

  saveSettings(): void {
    if (
      !this.user.prenom ||
      !this.user.nom ||
      !this.user.email ||
      !this.user.username
    ) {
      this.showMessage(
        "Tous les champs (prénom, nom, email, nom d'utilisateur) sont obligatoires",
        'error',
      );
      return;
    }

    const updateRequest: any = {
      fname: this.user.prenom,
      lname: this.user.nom,
      username: this.user.username,
      email: this.user.email,
      phone: this.user.telephone,
    };

    if (this.password.new || this.password.confirm || this.password.old) {
      if (!this.password.old || !this.password.new || !this.password.confirm) {
        this.showMessage(
          'Veuillez remplir tous les champs de mot de passe',
          'error',
        );
        return;
      }
      if (this.password.new !== this.password.confirm) {
        this.showMessage(
          'Les nouveaux mots de passe ne correspondent pas',
          'error',
        );
        return;
      }
      if (this.password.new.length < 6) {
        this.showMessage(
          'Le mot de passe doit contenir au moins 6 caractères',
          'error',
        );
        return;
      }
      updateRequest.currentPassword = this.password.old;
      updateRequest.newPassword = this.password.new;
    }

    this.rhService.updateProfile(updateRequest).subscribe({
      next: (response) => {
        this.showMessage('Modifications enregistrées avec succès', 'success');

        this.user = {
          id: response.id,
          username: response.username,
          email: response.email,
          prenom: response.fname,
          nom: response.lname,
          telephone: response.phone || '',
          fonction: this.user.fonction,
        };

        this.authService.setToken(response.accessToken);
        this.authService.setCurrentUser(response);

        this.password = { old: '', new: '', confirm: '' };
      },
      error: (err) => {
        console.error('Erreur mise à jour', err);
        const message = err.error?.message || 'Erreur lors de la sauvegarde';
        this.showMessage(message, 'error');
      },
    });
  }

  reset(): void {
    this.loadProfile();
    this.password = { old: '', new: '', confirm: '' };
    this.message = '';
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => (this.message = ''), 3000);
  }
}
