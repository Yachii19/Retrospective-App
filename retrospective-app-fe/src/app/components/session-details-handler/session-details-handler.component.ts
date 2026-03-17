import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { RetroFeedback } from '../../models/feedback.model';
import { CommonModule } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReplyListComponent } from './reply-list/reply-list.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AvatarColorPipe } from '../../pipes/avatar-color.pipe';

@Component({
  selector: 'app-session-details-handler',
  standalone: true,
  imports: [CommonModule, FormsModule, ReplyListComponent, TimeAgoPipe, AvatarColorPipe],
  templateUrl: './session-details-handler.component.html',
  styleUrl: './session-details-handler.component.scss'
})
export class SessionDetailsHandlerComponent implements OnInit, OnDestroy {

  @Output() modalStateChange = new EventEmitter<boolean>();

  session: RetroSession | null = null;
  sessionId: string = '';
  sessionFeedbacks: { [key: string]: RetroFeedback[] } = {};
  feedbackInputs: { [key: string]: string } = {};

  sectionErrors: { [key: string]: string } = {};

  currentUserId: string = '';
  isSessionCreator: boolean = false;

  sectionKeyToDelete: string = '';
  showDeleteModal: boolean = false;

  showAddModal: boolean = false;
  newSectionTitle: string = '';
  newSectionKey: string = '';

  submissionInProgress: { [key: string]: boolean } = {};

  get sectionCount(): number {
    const sections = this.session?.sections?.length ?? 0;
    return this.isSessionCreator ? sections + 1 : sections;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showDeleteModal) this.cancelDeleteSection();
    if (this.showAddModal) this.cancelAddSection();
  }

  constructor(
    private notification: NzNotificationService,
    private feedbackService: FeedbackService,
    private sessionService: SessionService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
    });

    const user = this.authService.getUser();
    this.currentUserId = user._id;
    this.loadSession();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  // ── Session ───────────────────────────────────────────────────────────────

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

  // ── Feedback ──────────────────────────────────────────────────────────────

  onInputChange(sectionKey: string): void {
    this.sectionErrors[sectionKey] = '';
  }

  addFeedback(sectionKey: string, event?: Event): void {
    if  (event) event.preventDefault();

    if (this.submissionInProgress[sectionKey]) return;

    const feedbackText = this.feedbackInputs[sectionKey] || '';

    if (!feedbackText.trim()) {
      this.sectionErrors[sectionKey] = 'Feedback input is empty. Please provide a feedback!';
      return;
    }

    this.submissionInProgress[sectionKey] = true;

    const feedbackData = { sectionKey, feedbackText };

    this.feedbackService.addFeedback(this.sessionId, feedbackData).subscribe({
      next: () => {
        this.feedbackInputs[sectionKey] = '';
        this.sectionErrors[sectionKey] = '';
        this.reloadSectionFeedbacks(sectionKey);
        this.submissionInProgress[sectionKey] = false;
      },
      error: (err) => {
        console.error('Error adding feedback:', err);
        this.sectionErrors[sectionKey] = 'Failed to add feedback. Please try again.';
        this.submissionInProgress[sectionKey] = false;
      },
      complete: () => {
        this.submissionInProgress[sectionKey] = false;
      }
    });
  }

  private reloadSectionFeedbacks(sectionKey: string): void {
    this.feedbackService.getFeedbackBySection(this.sessionId, sectionKey).subscribe({
      next: (response) => {
        this.sessionFeedbacks[sectionKey] = response.data;
      },
      error: (err) => {
        console.error(`Error reloading feedbacks for ${sectionKey}:`, err);
      }
    });
  }

  // ── Voting ────────────────────────────────────────────────────────────────

  hasUserVoted(feedback: RetroFeedback): boolean {
    return feedback.votedBy.some(voter => voter._id === this.currentUserId);
  }

  addVote(feedbackId: string, sectionKey: string): void {
    const feedback = this.sessionFeedbacks[sectionKey]?.find(f => f._id === feedbackId);
    if (!feedback) return;

    const action$ = this.hasUserVoted(feedback)
      ? this.feedbackService.unvoteFeedback(feedbackId)
      : this.feedbackService.voteFeedback(feedbackId);

    action$.subscribe({
      next: () => this.reloadSectionFeedbacks(sectionKey),
      error: (error) => {
        this.sectionErrors[sectionKey] = error.error?.message || 'Failed to update vote';
      }
    });
  }

  // ── Section helpers ───────────────────────────────────────────────────────
  onSectionTitleChange(): void {
    this.newSectionKey = this.newSectionTitle
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
  }

  getSectionItems(feedback: RetroFeedback, sectionKey: string): string[] {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.items || [];
  }

  getSectionActionItems(feedback: RetroFeedback, sectionKey: string): any | null {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.actionItems || null;
  }

  // ── Delete section modal ──────────────────────────────────────────────────

  showDeleteSectionModal(sectionKey: string): void {
    this.sectionKeyToDelete = sectionKey;
    this.showDeleteModal = true;
    this.modalStateChange.emit(true);
    document.body.style.overflow = 'hidden';
  }

  cancelDeleteSection(): void {
    this.showDeleteModal = false;
    this.sectionKeyToDelete = '';
    this.modalStateChange.emit(false);
    document.body.style.overflow = '';
  }

  confirmDeleteSection(): void {
    if (!this.session) return;

    this.sessionService.deleteSection(this.session._id, this.sectionKeyToDelete).subscribe({
      next: () => {
        this.showNotification('Section deleted successfully', true);
        this.cancelDeleteSection();
        this.loadSession();
      },
      error: () => {
        this.showNotification('Failed to delete section', false);
      }
    });
  }

  // ── Add section modal ─────────────────────────────────────────────────────

  showAddSectionModal(): void {
    this.showAddModal = true;
    this.modalStateChange.emit(true);
    document.body.style.overflow = 'hidden';
  }

  cancelAddSection(): void {
    this.showAddModal = false;
    this.newSectionTitle = '';
    this.newSectionKey = '';
    this.modalStateChange.emit(false);
    document.body.style.overflow = '';
  }

  confirmAddSection(): void {
    if (!this.session) return;

    if (!this.newSectionTitle.trim()) {
      this.showNotification('Section title cannot be empty', false);
      return;
    }

    if (!this.newSectionKey) {
      this.newSectionKey = this.newSectionTitle
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');
    }

    this.sessionService.addSection(this.session._id, this.newSectionTitle, this.newSectionKey).subscribe({
      next: () => {
        this.cancelAddSection();
        this.loadSession();
        this.showNotification('Section added successfully', true);
      },
      error: () => {
        this.showNotification('Failed to add section', false);
      }
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────

  showNotification(message: string, success: boolean): void {
    if (success) {
      this.notification.success('Success', message);
    } else {
      this.notification.error('Error', message);
    }
  }
}