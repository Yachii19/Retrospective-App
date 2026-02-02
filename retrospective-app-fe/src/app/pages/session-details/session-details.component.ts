import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RetroFeedback } from '../../models/feedback.model';
import { FeedbackService } from '../../services/feedback.service';
import { SessionService } from '../../services/session.service';
import { RetroSession } from '../../models/session.model';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-details.component.html',
  styleUrl: './session-details.component.scss'
})
export class SessionDetailsComponent {
  username: string | null = '';
  userEmail: string | null = '';
  sessionId: string = '';
  sessionFeedbacks: RetroFeedback[] = [];
  session: RetroSession | null = null;

  constructor(
    private authService: AuthService,
    private feedbackService: FeedbackService,
    private sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.username = this.authService.getUsername();
    this.userEmail = this.authService.getEmail();
    
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
      this.loadSession();
      this.loadFeedbacks();
    })
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response.data;
      },
      error: (err) => {
        console.error(`Error loading session: ${err}`);
        this.session = null;
      }
    });
  }

  loadFeedbacks(): void {
    this.feedbackService.getSessionFeedbacks(parseInt(this.sessionId)).subscribe({
      next: (feedbacks) => {
        this.sessionFeedbacks = feedbacks;
      },
      error: (err) => {
        console.error(`Error loading feedbacks: ${err}`);
        this.sessionFeedbacks = [];
      }
    });
  }

  getSectionFeedbacks(sectionKey: string): RetroFeedback[] {
    return this.sessionFeedbacks.filter(feedback => 
      feedback.sections.some(section => 
        section.key === sectionKey && section.items && section.items.length > 0
      )
    );
  }

  getItemsForSection(feedback: RetroFeedback, sectionKey: string): string[] {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.items || [];
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }
}
