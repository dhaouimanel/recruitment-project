import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CandidateOfferSearchComponent } from './candidate-offer-search.component';


describe('CandidateOfferSearch', () => {
  let component: CandidateOfferSearchComponent;
  let fixture: ComponentFixture<CandidateOfferSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateOfferSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateOfferSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
