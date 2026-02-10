import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { RetroFeedback } from '../../models/feedback.model';

@Component({
  selector: 'app-feedback-carousel-card',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzTagModule,
    NzIconModule,
    NzBadgeModule
  ],
  templateUrl: './feedback-carousel-card.component.html',
  styleUrl: './feedback-carousel-card.component.scss'
})
export class FeedbackCarouselCardComponent {
  @Input() feedback!: RetroFeedback;
  @Input() hasUserVoted: boolean = false;
}
