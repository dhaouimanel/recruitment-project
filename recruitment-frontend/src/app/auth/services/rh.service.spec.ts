import { TestBed } from '@angular/core/testing';

import { RhService } from './rh.service';

describe('Rh', () => {
  let service: RhService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RhService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
