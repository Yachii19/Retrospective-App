import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RetrospectiveService } from '../../services/retrospective.service';
import { RetroFeedback, UserRetroFeedback, FeedbackSection } from '../../models/feedback.model';
import { FeedbackService } from '../../services/feedback.service';
import { SessionService } from '../../services/session.service';
import { RetroSession, SessionResponse } from '../../models/session.model';

@Component({
  selector: 'app-my-contributions',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './my-contributions.component.html',
  styleUrl: './my-contributions.component.scss'
})
export class MyContributionsComponent {
  username: string | null = '';
  userEmail: string | null = '';
  userSessions: RetroSession[] = [];
  userFeedbacks: UserRetroFeedback[] = [];
  feedbackCount: number = 0;

  constructor(
    private authService: AuthService,
    private feedbackService: FeedbackService,
    private sessionService: SessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.username = this.authService.getUsername();
    this.userEmail = this.authService.getEmail();
    this.loadFeedbacks();
    this.loadSessions();
  }

  loadSessions(): void {
    this.sessionService.getUserSessions().subscribe({
      next: (response: SessionResponse) => {
        const sessions = response.data;
        if(Array.isArray(sessions)) {
          this.userSessions = sessions;
        } else {
          this.userSessions = [];
        }
      },
      error: (err) => {
        console.error(`Error loading user sessions ${err}`);
        this.userSessions = [];
      }
    })
  }

  loadFeedbacks(): void {
    this.feedbackService.getFeedbackByUser().subscribe({
      next: (response) => {
        if(Array.isArray(response.data)) {
          this.userFeedbacks = response.data;
          
          this.feedbackCount = this.calculateTotalFeedbackCount();
        } else {
          this.userFeedbacks = [];
          this.feedbackCount = 0;
        }
      },
      error: (err) => {
        console.error(`Error loading user feedbacks ${err}`);
        this.userFeedbacks = [];
        this.feedbackCount = 0;
      }
    })
  }

  // Calculate total feedback count from userFeedbacks
  private calculateTotalFeedbackCount(): number {
    return this.userFeedbacks.reduce((total, sessionGroup) => {
      return total + sessionGroup.feedbacks.length;
    }, 0);
  }

  // Public getter (optional - you can use feedbackCount directly in template)
  getTotalFeedbackCount(): number {
    return this.feedbackCount;
  }

  getAllSections(sessionGroup: UserRetroFeedback): { key: string, title: string }[] {
    const sectionsMap = new Map<string, string>();

    sessionGroup.feedbacks.forEach(feedback => {
      // REMOVED: Don't modify feedbackCount here during change detection
      feedback.sections.forEach(section => {
        if (!sectionsMap.has(section.key)) {
          sectionsMap.set(section.key, section.title);
        }
      });
    });
    
    return Array.from(sectionsMap, ([key, title]) => ({ key, title }));
  }

  getItemsBySection(sessionGroup: UserRetroFeedback, sectionKey: string): string[] {
    const items: string[] = [];
    
    sessionGroup.feedbacks.forEach(feedback => {
      const section = feedback.sections.find(s => s.key === sectionKey);
      
      if (section && section.items) {
        items.push(...section.items);
      }
    });
    
    return items;
  }

  getSectionIcon(sectionKey: string): string {
    switch(sectionKey) {
      case 'went-well':
        return 'sentiment_satisfied';
      case 'needs-improvement':
        return 'build_circle';
      case 'action-items':
        return 'adjust';
      default:
        return 'chat_bubble';
    }
  }

  viewSession(sessionId: string): void {
    this.router.navigate(['/session', sessionId]);
  }
}
