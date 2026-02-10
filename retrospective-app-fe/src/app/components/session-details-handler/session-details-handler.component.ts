import { Component } from '@angular/core';
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
  

  editingAssignee: { [key: string]: boolean } = {};
  editingDueDate: { [key: string]: boolean } = {};
  tempAssignee: { [key: string]: string } = {};
  tempDueDate: { [key: string]: string } = {};

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
            console.log(this.sessionFeedbacks);
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

  getSectionItems(feedback: RetroFeedback, sectionKey: string): string[] {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.items || [];
  }

  getSectionActionItems(feedback: RetroFeedback, sectionKey: string): any | null {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.actionItems || null;
  }

  toggleActionItemStatus(feedbackId: string, sectionKey: string): void {
    if (!this.isSessionCreator) {
      this.showError = true;
      this.errorMessage = 'Only the session creator can toggle action item status';
      return;
    }

    this.feedbackService.toggleFeedbackVisibility(feedbackId.trim(), { key: sectionKey }).subscribe({
      next: (response) => {
        console.log('Action item status toggled successfully');
        this.feedbackService.getFeedbackBySection(this.sessionId.trim(), sectionKey).subscribe({
          next: (response) => {
            this.sessionFeedbacks[sectionKey] = response.data;
          }
        });
      },
      error: (error) => {
        console.error(`Error toggling status: ${error.error?.message}`);
        this.showError = true;
        this.errorMessage = error.error?.message || 'Failed to toggle status';
      }
    });
  }

  shouldShowActionItems(feedback: RetroFeedback, sectionKey: string): boolean {
    const actionItems = this.getSectionActionItems(feedback, sectionKey);

    if (!actionItems) {
      return false;
    }
    
    return this.isSessionCreator || actionItems.status === 'Open';
  }

  updateActionItems(feedbackId: string, sectionKey: string, assignee?: string | null, dueDate?: string | null): void {
    if (!this.isSessionCreator) {
      this.showError = true;
      this.errorMessage = 'Only the session creator can update action items';
      return;
    }

    const updateData: any = { key: sectionKey };
    
    if (assignee !== undefined) {
      updateData.assignee = assignee;
    }
    
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate;
    }

    this.feedbackService.updateActionItems(feedbackId, updateData).subscribe({
      next: (response) => {
        console.log('Action items updated successfully');
        this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
          next: (response) => {
            this.sessionFeedbacks[sectionKey] = response.data;
            this.showError = false;
          }
        });
      },
      error: (error) => {
        console.error(`Error updating action items: ${error.error?.message}`);
        this.showError = true;
        this.errorMessage = error.error?.message || 'Failed to update action items';
      }
    });
  }

  startEditAssignee(feedbackId: string, sectionKey: string): void {
    const key = feedbackId + sectionKey;
    const feedback = this.sessionFeedbacks[sectionKey]?.find(f => f._id === feedbackId);
    const actionItems = this.getSectionActionItems(feedback!, sectionKey);
    
    this.editingAssignee[key] = true;
    this.tempAssignee[key] = actionItems?.assignee || '';
  }

  startEditDueDate(feedbackId: string, sectionKey: string): void {
    const key = feedbackId + sectionKey;
    const feedback = this.sessionFeedbacks[sectionKey]?.find(f => f._id === feedbackId);
    const actionItems = this.getSectionActionItems(feedback!, sectionKey);
    
    this.editingDueDate[key] = true;
    if (actionItems?.dueDate) {
      this.tempDueDate[key] = new Date(actionItems.dueDate).toISOString().split('T')[0];
    } else {
      this.tempDueDate[key] = '';
    }
  }

  saveAssignee(feedbackId: string, sectionKey: string): void {
    const key = feedbackId + sectionKey;
    const assignee = this.tempAssignee[key]?.trim() || null;
    
    this.updateActionItems(feedbackId, sectionKey, assignee);
    this.editingAssignee[key] = false;
  }

  saveDueDate(feedbackId: string, sectionKey: string): void {
    const key = feedbackId + sectionKey;
    const dueDate = this.tempDueDate[key] || null;
    
    this.updateActionItems(feedbackId, sectionKey, undefined, dueDate);
    this.editingDueDate[key] = false;
  }

  cancelEdit(feedbackId: string, sectionKey: string, field: 'assignee' | 'dueDate'): void {
    const key = feedbackId + sectionKey;
    if (field === 'assignee') {
      this.editingAssignee[key] = false;
    } else {
      this.editingDueDate[key] = false;
    }
  }
}
