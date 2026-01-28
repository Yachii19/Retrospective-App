import { TestBed } from '@angular/core/testing';

import { RetrospectiveService } from './retrospective.service';

describe('RetrospectiveService', () => {
  let service: RetrospectiveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RetrospectiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
