import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RhOfferApplicationsComponent } from './rh-offer-applications.component';



describe('OfferApplicationsComponent', () => {
  let component: RhOfferApplicationsComponent;
  let fixture: ComponentFixture<RhOfferApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RhOfferApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RhOfferApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
