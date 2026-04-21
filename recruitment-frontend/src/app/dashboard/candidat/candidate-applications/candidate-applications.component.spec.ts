import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidateApplicationsComponent } from './candidate-applications.component';

describe('OfferApplications', () => {
  let component: CandidateApplicationsComponent;
  let fixture: ComponentFixture<CandidateApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateApplicationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CandidateApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
