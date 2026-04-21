import { TestBed } from '@angular/core/testing';

import { RhApplicationService } from './rh-application.service';

describe('RhApplication', () => {
  let service: RhApplicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RhApplicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
