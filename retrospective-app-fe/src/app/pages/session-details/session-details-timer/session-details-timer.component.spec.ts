import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDetailsTimerComponent } from './session-details-timer.component';

describe('SessionDetailsTimerComponent', () => {
  let component: SessionDetailsTimerComponent;
  let fixture: ComponentFixture<SessionDetailsTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDetailsTimerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDetailsTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
