import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfferDetailsModalComponent } from './offer-details-dialog.component';



describe('OfferDetailsDialog', () => {
  let component: OfferDetailsModalComponent;
  let fixture: ComponentFixture<OfferDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
