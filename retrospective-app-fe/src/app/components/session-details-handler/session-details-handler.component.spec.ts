import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionDetailsHandlerComponent } from './session-details-handler.component';

describe('SessionDetailsHandlerComponent', () => {
  let component: SessionDetailsHandlerComponent;
  let fixture: ComponentFixture<SessionDetailsHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDetailsHandlerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDetailsHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
