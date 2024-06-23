import { TestBed } from '@angular/core/testing';

import { UIEnhancementService } from './uienhancement.service';

describe('UIEnhancementService', () => {
  let service: UIEnhancementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UIEnhancementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
