import { TestBed } from '@angular/core/testing';

import { SubcategoryManagementService } from './subcategory-management.service';

describe('SubcategoryManagementService', () => {
  let service: SubcategoryManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubcategoryManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
