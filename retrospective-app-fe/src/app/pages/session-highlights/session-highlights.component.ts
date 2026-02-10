import { Component, ViewChild } from '@angular/core';
import { SessionDetailsHeaderComponent } from '../../components/session-details-header/session-details-header.component';
import { FeedbackCarouselCardComponent } from '../../components/feedback-carousel-card/feedback-carousel-card.component';
import { FeedbackService } from '../../services/feedback.service';
import { SessionService } from '../../services/session.service';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RetroFeedback } from '../../models/feedback.model';
import { NzCarouselComponent, NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { RetroSession, SessionResponse } from '../../models/session.model';

@Component({
  selector: 'app-session-highlights',
  standalone: true,
  imports: [ 
    CommonModule, 
    FormsModule,
    SessionDetailsHeaderComponent, 
    FeedbackCarouselCardComponent,
    NzCarouselModule,
    NzSelectModule,
    NzSpinModule,
    NzEmptyModule,
    NzIconModule
  ],
  templateUrl: './session-highlights.component.html',
  styleUrl: './session-highlights.component.scss'
})
export class SessionHighlightsComponent {
  @ViewChild('carouselRef', { static: false }) carouselRef!: NzCarouselComponent;
  
  sessionId: string = '';
  session: RetroSession | null = null;
  sessionFeedbacks: RetroFeedback[] = [];
  filteredFeedbacks: RetroFeedback[] = [];
  selectedMemberId: string = 'all';
  loading: boolean = false;
  error: string = '';
  currentSlide: number = 0;

  get sessionMembers() {
    if(!this.session) return undefined;

    const memberUsers = this.session.members.map(m => m.sessionMember);
    return memberUsers
  }

  constructor(
    private feedbackService: FeedbackService,
    private sessionService: SessionService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
    })

    this.loadSession();
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe ({
      next: (response: any) => {
        this.session = response.data;

        this.loadFeedbacks();
      },
      error: (err) => {
        console.log(err);
        this.error = err.error?.message
      }
    })
  }

  loadFeedbacks(): void {
    this.loading = true;
    this.error = '';
    this.currentSlide = 0;

    if (this.selectedMemberId === 'all') {
      this.feedbackService.getSessionFeedbacks(this.sessionId).subscribe({
        next: (response: any) => {
          this.sessionFeedbacks =response.data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message;
          this.loading = false;
        }
      })
    } else {
      this.feedbackService.getFilteredFeedbacksByMember(this.sessionId, this.selectedMemberId).subscribe({
        next: (response: any) => {
          this.sessionFeedbacks = response.data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message;
          this.loading = false;
        }
      })
    }
  }

  onMemberFilterChange(): void {
    this.loadFeedbacks();
  }

  hasUserVoted(feedback: RetroFeedback): boolean {
    const currentUserId = this.authService.getUser()._id;
    return feedback.votedBy.some(voter => voter._id === currentUserId);
  }

  // Carousel navigation methods
  previousSlide(): void {
    this.carouselRef.pre();
  }

  nextSlide(): void {
    this.carouselRef.next();
  }

  onSlideChange(index: number): void {
    this.currentSlide = index;
  }
}
