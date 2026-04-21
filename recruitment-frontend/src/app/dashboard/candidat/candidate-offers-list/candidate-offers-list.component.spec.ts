import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidateOffersListComponent } from './candidate-offers-list.component';



describe('CandidateOffersList', () => {
  let component: CandidateOffersListComponent;
  let fixture: ComponentFixture<CandidateOffersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateOffersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateOffersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
