import { TestBed } from '@angular/core/testing';

import { GroupExpensesService } from './group-expenses.service';

describe('GroupExpensesService', () => {
  let service: GroupExpensesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupExpensesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
