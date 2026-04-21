import { TestBed } from '@angular/core/testing';
import { RhStatistiquesService } from './rh-statistiques.service';



describe('RhStatistiques', () => {
  let service: RhStatistiquesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RhStatistiquesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
