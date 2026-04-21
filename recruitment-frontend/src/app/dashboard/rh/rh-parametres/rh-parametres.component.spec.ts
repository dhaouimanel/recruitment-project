import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RhParametresComponent } from './rh-parametres.component';



describe('RhParametres', () => {
  let component: RhParametresComponent;
  let fixture: ComponentFixture<RhParametresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RhParametresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RhParametresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
