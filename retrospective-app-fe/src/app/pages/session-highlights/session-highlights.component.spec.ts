import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionHighlightsComponent } from './session-highlights.component';

describe('SessionHighlightsComponent', () => {
  let component: SessionHighlightsComponent;
  let fixture: ComponentFixture<SessionHighlightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionHighlightsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionHighlightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
