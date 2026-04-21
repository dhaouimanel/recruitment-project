import { TestBed } from '@angular/core/testing';

import {ApplicationHelperService } from './application-helper.service';

describe('ApplicationHelper', () => {
  let service: ApplicationHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
