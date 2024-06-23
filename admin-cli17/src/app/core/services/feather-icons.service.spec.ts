import { TestBed } from '@angular/core/testing';

import { FeatherIconsService } from './feather-icons.service';

describe('FeatherIconsService', () => {
  let service: FeatherIconsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatherIconsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
