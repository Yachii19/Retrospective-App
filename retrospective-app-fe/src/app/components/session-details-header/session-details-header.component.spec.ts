import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDetailsHeaderComponent } from './session-details-header.component';

describe('SessionDetailsHeaderComponent', () => {
  let component: SessionDetailsHeaderComponent;
  let fixture: ComponentFixture<SessionDetailsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDetailsHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDetailsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
