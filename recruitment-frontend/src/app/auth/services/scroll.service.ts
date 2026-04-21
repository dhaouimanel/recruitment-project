import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ScrollService {
  constructor(private router: Router) {}

  scrollToServices(): void {
    if (window.location.pathname === '/offers') {
      setTimeout(() => {
        const element = document.getElementById('services-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      this.router.navigate(['/offers'], { fragment: 'services-section' });
    }
  }
}
