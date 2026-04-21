import { TestBed } from '@angular/core/testing';

import {PublicOfferService } from './public-offer.service';

describe('PublicOffer', () => {
  let service: PublicOfferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicOfferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
