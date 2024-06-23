import { TestBed } from '@angular/core/testing';

import { ResponseHandlingService } from './response-handling.service';

describe('ResponseHandlingService', () => {
  let service: ResponseHandlingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResponseHandlingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
