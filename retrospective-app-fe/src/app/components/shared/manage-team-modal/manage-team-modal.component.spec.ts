import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageTeamModalComponent } from './manage-team-modal.component';

describe('ManageTeamModalComponent', () => {
  let component: ManageTeamModalComponent;
  let fixture: ComponentFixture<ManageTeamModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageTeamModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageTeamModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
