import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-test-candidate',
  template: `
    <div style="padding: 20px;">
      <h1>Test Candidate Route</h1>
      <p>Token présent: {{ hasToken }}</p>
      <p>Role: {{ userRole }}</p>
      <p>isCandidate: {{ isCandidate }}</p>
      <p>isLoggedIn: {{ isLoggedIn }}</p>
    </div>
  `,
  standalone: true,
})
export class TestCandidateComponent implements OnInit {
  hasToken = false;
  userRole = '';
  isCandidate = false;
  isLoggedIn = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.hasToken = !!localStorage.getItem('token');
    this.userRole = this.authService.getUserRole();
    this.isCandidate = this.authService.isCandidate();
    this.isLoggedIn = this.authService.isLoggedIn();

    console.log('🔍 TestCandidateComponent - Role:', this.userRole);
  }
}
