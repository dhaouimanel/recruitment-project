import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { rhAuthGuard } from './rh-auth-guard';

describe('rhAuthGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => rhAuthGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
