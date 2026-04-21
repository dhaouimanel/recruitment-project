import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicOffersComponent } from './public-offers.component';


describe('PublicOffers', () => {
  let component: PublicOffersComponent;
  let fixture: ComponentFixture<PublicOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicOffersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
