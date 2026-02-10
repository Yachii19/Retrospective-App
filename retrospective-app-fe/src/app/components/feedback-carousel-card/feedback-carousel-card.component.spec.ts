import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackCarouselCardComponent } from './feedback-carousel-card.component';

describe('FeedbackCarouselCardComponent', () => {
  let component: FeedbackCarouselCardComponent;
  let fixture: ComponentFixture<FeedbackCarouselCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackCarouselCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackCarouselCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
