import { Component, HostListener } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { RetroFeedback } from '../../models/feedback.model';
import { CommonModule } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { ActivatedRoute } from '@angular/router';
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
  errorMessage: string = '';
  currentUserId: string = '';
  isSessionCreator: boolean = false;

  sectionKeyToDelete: string = '';
  showDeleteModal: boolean = false;
  showAddModal: boolean = false;
  
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDeleteModal) {
      this.showDeleteModal = false;
      this.sectionKeyToDelete = '';
      document.body.style.overflow = '';
    }
    if (this.showAddModal) {
      this.showAddModal = false;
      document.body.style.overflow = '';
    }
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

    let user = this.authService.getUser();
    this.currentUserId = user._id;
    this.loadSession();
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response.data;
        this.isSessionCreator = this.authService.isCreator(this.session?.createdBy._id);
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
          this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
            next: (response) => {
              this.sessionFeedbacks[sectionKey] = response.data;
            }
          });
        },
        error: (error) => {
          this.showError = true;
          this.errorMessage = error.error?.message || 'Failed to add vote';
        }
      });
    } else {
      this.feedbackService.unvoteFeedback(feedbackId).subscribe({
        next: (response) => {
          this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
            next: (response) => {
              this.sessionFeedbacks[sectionKey] = response.data;
            }
          });
        },
        error: (error) => {
          this.showError = true;
          this.errorMessage = error.error?.message || 'Failed to remove vote';
        }
      });
    }
  }

  getSectionItems(feedback: RetroFeedback, sectionKey: string): string[] {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.items || [];
  }

  getSectionActionItems(feedback: RetroFeedback, sectionKey: string): any | null {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.actionItems || null;
  }

  confirmDeleteSection(): void {
    if (!this.session) return;

    this.sessionService.deleteSection(this.session._id, this.sectionKeyToDelete).subscribe({
      next: (response) => {
        this.showDeleteModal = false;
        this.sectionKeyToDelete = '';
        document.body.style.overflow = '';
        this.loadSession();
      },
      error: (error) => {
        this.showError = true;
        this.errorMessage = error.error?.message || 'Failed to delete section';
      }
    });
  }

  showDeleteSectionModal(sectionKey: string): void {
    this.sectionKeyToDelete = sectionKey;
    this.showDeleteModal = true;
    document.body.style.overflow = 'hidden';
  }

  cancelDeleteSection(): void {
    this.showDeleteModal = false;
    this.sectionKeyToDelete = '';
    document.body.style.overflow = '';
  }

  showAddSectionModal(): void {
    this.showAddModal = true;
    document.body.style.overflow = 'hidden';
  }

  cancelAddSection(): void {
    this.showAddModal = false;
    document.body.style.overflow = '';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}