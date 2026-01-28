import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentSessionCardsComponent } from './recent-session-cards.component';

describe('RecentSessionCardsComponent', () => {
  let component: RecentSessionCardsComponent;
  let fixture: ComponentFixture<RecentSessionCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentSessionCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecentSessionCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
