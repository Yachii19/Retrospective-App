import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionCardsComponent } from './session-cards.component';

describe('SessionCardsComponent', () => {
  let component: SessionCardsComponent;
  let fixture: ComponentFixture<SessionCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
