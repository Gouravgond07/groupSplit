import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupSpendComponent } from './group-spend.component';

describe('GroupSpendComponent', () => {
  let component: GroupSpendComponent;
  let fixture: ComponentFixture<GroupSpendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GroupSpendComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupSpendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
