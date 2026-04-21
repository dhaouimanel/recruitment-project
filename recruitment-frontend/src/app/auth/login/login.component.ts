import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
})
export class LoginComponent {
  form: any = {
    username: '',
    password: '',
  };

  errorMessage = '';
  rememberMe = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,
  ) {}

  onSubmit(): void {
    const { username, password } = this.form;
    this.authService.login(username, password).subscribe({
      next: (data) => {
        if (data.accessToken) {
          this.tokenService.saveToken(data.accessToken);
        }
        this.tokenService.saveUser(data);

        if (data.roles?.includes('ROLE_RH') || data.roles?.includes('RH')) {
          this.router.navigate(['/rh']);
        } else if (data.roles?.includes('ROLE_ADMIN')) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/candidate']);
        }
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage =
            "Identifiants incorrects. Vérifiez votre nom d'utilisateur et mot de passe.";
        } else {
          this.errorMessage =
            err.error?.message || 'Erreur de connexion au serveur';
        }
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    const passwordField = document.getElementById(
      'password',
    ) as HTMLInputElement;
    if (passwordField) {
      passwordField.type = this.showPassword ? 'text' : 'password';
    }
  }

  loginWithGoogle(): void {
    const clientId =
      '272144679807-bgrvahq0r3hpk7r2ek4cjv3qck4orlnr.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(
      'http://localhost:4200/auth/google/callback',
    );
    const scope = encodeURIComponent('email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  }
}
