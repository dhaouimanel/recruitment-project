import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-unauthorized',
  standalone: true,
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss'],
})
export class UnauthorizedComponent implements OnInit {
  requiredRole: string = '';
  currentRole: string = '';
  canGoBack: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.requiredRole = params['requiredRole'] || '';
      this.currentRole = params['currentRole'] || '';
    });

    this.canGoBack = window.history.length > 1;
  }

  goBack(): void {
    window.history.back();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
