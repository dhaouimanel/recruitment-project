import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecruiterOffersComponent } from './recruiter-offers.component';

describe('RecruiterOffersComponent', () => {
  let component: RecruiterOffersComponent;
  let fixture: ComponentFixture<RecruiterOffersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecruiterOffersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecruiterOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
