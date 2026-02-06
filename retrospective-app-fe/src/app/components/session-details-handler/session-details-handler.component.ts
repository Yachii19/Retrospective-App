import { Component } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { RetroFeedback } from '../../models/feedback.model';
import { CommonModule } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { ActivatedRoute, Route } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-details-handler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-details-handler.component.html',
  styleUrl: './session-details-handler.component.scss'
})
export class SessionDetailsHandlerComponent {
  session: RetroSession | null = null;
  sessionId: string = '';
  sessionFeedbacks:  { [key: string]: RetroFeedback[]} = {};
  feedbackInputs: { [key: string]: string } = {};
  showError: boolean = false;
  errorMessage: string = "";
  currentUserId: string = '';

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

    let user = this.authService.getUser();
    this.currentUserId = user._id;
    this.loadSession();
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response.data;
        this.loadSessionFeedbacks();
      },
      error: (err) => {
        console.error(`Error loading session: ${err}`);
        this.session = null;
      }
    });    
  }

  loadSessionFeedbacks(): void {
    if (!this.session?.sections) return;
    
    this.session.sections.forEach(section => {
      this.feedbackService
        .getFeedbackBySection(this.sessionId, section.key)
        .subscribe({
          next: (response) => {
            this.sessionFeedbacks[section.key] = response.data;
          },
          error: (err) => {
            console.error(`Error loading feedbacks for ${section.key}:`, err);
          }
        });
    });
  }

  onInputChange(): void {
    this.showError = false;
    this.errorMessage = "";
  }

  addFeedback(sectionKey: string): void {
    console.log("Adding feedback for section:", sectionKey);
    
    const feedbackText = this.feedbackInputs[sectionKey] || '';
    
    if(!feedbackText.trim()) {
      this.showError = true;
      this.errorMessage = 'Feedback input is empty. Please provide a feedback!';
      return;
    }

    const feedbackData = {
      sectionKey: sectionKey,
      feedbackText: feedbackText
    }

    this.feedbackService.addFeedback(this.sessionId, feedbackData).subscribe({
      next: (response) => {
        console.log('Feedback added successfully:', response);
        
        this.feedbackInputs[sectionKey] = '';
        
        this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
          next: (response) => {
            this.sessionFeedbacks[sectionKey] = response.data;
          },
          error: (err) => {
            console.error(`Error reloading feedbacks for ${sectionKey}:`, err);
          }
        });
        
        this.showError = false;
        this.errorMessage = '';
      },
      error:(err) => {
        console.error('Error adding feedback:', err);
        this.showError = true;
        this.errorMessage = 'Failed to add feedback. Please try again.';
      }
    });
  }

  // Check if current user has voted on this feedback
  hasUserVoted(feedback: RetroFeedback): boolean {
    return feedback.votedBy.some(voter => voter._id === this.currentUserId);
  }

  addVote(feedbackId: string, sectionKey: string): void {
    const feedback = this.sessionFeedbacks[sectionKey]?.find(f => f._id === feedbackId);
    
    if (!feedback) return;

    const hasVoted = this.hasUserVoted(feedback);

    if (!hasVoted) {
      this.feedbackService.voteFeedback(feedbackId).subscribe({
        next: (response) => {
          console.log('Vote added successfully');
          this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
            next: (response) => {
              this.sessionFeedbacks[sectionKey] = response.data;
            }
          });
        },
        error: (error) => {
          console.log(`Error adding vote: ${error.error?.message}`);
          this.showError = true;
          this.errorMessage = error.error?.message || 'Failed to add vote';
        }
      });
    } else {
      this.feedbackService.unvoteFeedback(feedbackId).subscribe({
        next: (response) => {
          console.log('Vote removed successfully');
          // Reload feedbacks for this section to update vote count
          this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
            next: (response) => {
              this.sessionFeedbacks[sectionKey] = response.data;
            }
          });
        },
        error: (error) => {
          console.log(`Error removing vote: ${error.error?.message}`);
          this.showError = true;
          this.errorMessage = error.error?.message || 'Failed to remove vote';
        }
      });
    }
  }
}
