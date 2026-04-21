import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RhApplicationsComponent } from './rh-applications.component';

describe('RhApplications', () => {
  let component: RhApplicationsComponent;
  let fixture: ComponentFixture<RhApplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RhApplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RhApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
