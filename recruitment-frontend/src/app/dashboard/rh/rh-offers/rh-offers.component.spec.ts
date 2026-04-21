import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RhOffersComponent } from './rh-offers.component';


describe('RhOffers', () => {
  let component: RhOffersComponent;
  let fixture: ComponentFixture<RhOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RhOffersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RhOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
