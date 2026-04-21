import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RhStatistiquesComponent } from './rh-satistiques.component';


describe('RhSatistiques', () => {
  let component: RhStatistiquesComponent;
  let fixture: ComponentFixture<RhStatistiquesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RhStatistiquesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RhStatistiquesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
