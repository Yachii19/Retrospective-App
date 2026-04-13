import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { FeedbackService } from '../../../services/feedback.service';
import { RetroFeedback, VoteFeedbackResponse } from '../../../models/feedback.model';
import { CommonModule } from '@angular/common';
import { RetroSession } from '../../../models/session.model';
import { SessionService } from '../../../services/session.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ReplyListComponent } from './reply-list/reply-list.component';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AvatarColorPipe } from '../../../pipes/avatar-color.pipe';
import { SocketService } from '../../../services/socket.service';
import { Observable, Subscription } from 'rxjs';

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
  feedbackInputs: Record<string, string> = {};
  sectionErrors: Record<string, string> = {};
  feedbackErrors: Record<string, string> = {};

  newFeedbackInput: string = '';
  isFeedbackEditing: Record<string, boolean> = {};

  currentUserId: string = '';
  isSessionCreator: boolean = false;
  isMember: boolean = false;
  joinInProgress: boolean = false;

  sectionKeyToDelete: string = '';
  showDeleteModal: boolean = false;

  showAddModal: boolean = false;
  newSectionTitle: string = '';
  newSectionKey: string = '';

  submissionInProgress: Record<string, boolean> = {};
  votingInProgress: Record<string, boolean> = {};
  nowTick: Date = new Date();

  private socketSubs: Subscription[] = [];
  private timeAgoTimer?: ReturnType<typeof setInterval>;

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
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
    });

    const user = this.authService.getUser();
    this.currentUserId = user._id;
    this.startTimeAgoTicker();
    this.loadSession();
    this.initSocketListeners();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.socketService.leaveSession(this.sessionId);
    this.socketSubs.forEach(sub => sub.unsubscribe());
    if (this.timeAgoTimer) clearInterval(this.timeAgoTimer);
  }

  private startTimeAgoTicker(): void {
    this.timeAgoTimer = setInterval(() => {
      this.nowTick = new Date();
    }, 30000);
  }

  private initSocketListeners(): void {
    this.socketService.joinSession(this.sessionId);

    this.socketSubs.push(
      this.socketService.onFeedbackAdded().subscribe(({ sectionKey, feedback }) => {
        if (!this.sessionFeedbacks[sectionKey]) {
          this.sessionFeedbacks[sectionKey] = [];
        }
        const exists = this.sessionFeedbacks[sectionKey].some(f => f._id === feedback._id);
        if (!exists) {
          this.sessionFeedbacks[sectionKey] = [...this.sessionFeedbacks[sectionKey], feedback];
        }
      })
    );

    this.socketSubs.push(
      this.socketService.onFeedbackUpdated().subscribe(({ feedback }) => {
        const sectionKey = feedback.sections[0]?.key;
        if (!sectionKey || !this.sessionFeedbacks[sectionKey]) return;

        const index = this.sessionFeedbacks[sectionKey].findIndex(f => f._id === feedback._id);
        if (index !== -1) {
          this.sessionFeedbacks[sectionKey][index] = {
            ...this.sessionFeedbacks[sectionKey][index],
            sections: feedback.sections,
            updatedAt: feedback.updatedAt
          };
          this.sessionFeedbacks[sectionKey] = [...this.sessionFeedbacks[sectionKey]];
        }
      })
    );

    this.socketSubs.push(
      this.socketService.onFeedbackVoted().subscribe(({ feedbackId, votes, votedBy }) => {
        for (const key of Object.keys(this.sessionFeedbacks)) {
          const index = this.sessionFeedbacks[key]?.findIndex(f => f._id === feedbackId);
          if (index !== undefined && index !== -1) {
            this.sessionFeedbacks[key][index] = {
              ...this.sessionFeedbacks[key][index],
              votes,
              votedBy
            };
            this.sessionFeedbacks[key] = [...this.sessionFeedbacks[key]];
            this.votingInProgress[feedbackId] = false;
            break;
          }
        }
      })
    );

    this.socketSubs.push(
      this.socketService.onSectionAdded().subscribe(({ section }) => {
        if (this.session && !this.session.sections.some(s => s.key === section.key)) {
          this.session.sections = [...this.session.sections, section];
          this.sessionFeedbacks[section.key] = [];
        }
      })
    );

    this.socketSubs.push(
      this.socketService.onSectionDeleted().subscribe(({ key }) => {
        if (this.session) {
          this.session.sections = this.session.sections.filter(s => s.key !== key);
          delete this.sessionFeedbacks[key];
        }
      })
    );
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response.data;
        this.isSessionCreator = this.authService.isCreator(this.session?.createdBy._id);
        this.ensureMembership();
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
      this.feedbackService.getFeedbackBySection(this.sessionId, section.key).subscribe({
        next: (response) => {
          this.sessionFeedbacks[section.key] = response.data;
        },
        error: (err) => {
          console.error(`Error loading feedbacks for ${section.key}:`, err);
        }
      });
    });
  }

  onInputChange(sectionKey: string): void {
    this.sectionErrors[sectionKey] = '';
  }

  addFeedback(sectionKey: string, event?: Event): void {
    if (event) event.preventDefault();
    if (this.submissionInProgress[sectionKey]) return;

    const feedbackText = this.feedbackInputs[sectionKey] || '';
    if (!feedbackText.trim()) {
      this.sectionErrors[sectionKey] = 'Feedback input is empty. Please provide a feedback!';
      return;
    }

    this.submissionInProgress[sectionKey] = true;

    this.feedbackService.addFeedback(this.sessionId, { sectionKey, feedbackText }).subscribe({
      next: () => {
        this.feedbackInputs[sectionKey] = '';
        this.sectionErrors[sectionKey] = '';
      },
      error: (err) => {
        console.error('Error adding feedback:', err);
        this.sectionErrors[sectionKey] = err?.error?.message || 'Failed to add feedback. Please try again.';
      },
      complete: () => {
        this.submissionInProgress[sectionKey] = false;
      }
    });
  }

  startFeedbackEditing(feedback: RetroFeedback): void {
    this.newFeedbackInput = feedback.sections[0]?.items[0] ?? '';
    this.isFeedbackEditing[feedback._id] = true;
    this.feedbackErrors[feedback._id] = '';
  }

  cancelFeedbackEditing(feedbackId: string): void {
    this.isFeedbackEditing[feedbackId] = false;
    this.feedbackErrors[feedbackId] = '';
    this.newFeedbackInput = '';
  }

  onEditInputChange(feedbackId: string): void {
    this.feedbackErrors[feedbackId] = '';
  }

  trackByFeedbackId(index: number, feedback: RetroFeedback): string {
    return feedback._id;
  }

  updateFeedback(feedbackId: string, newFeedback: string, event?: Event): void {
    if (event) event.preventDefault();
    if (this.submissionInProgress[feedbackId]) return;

    if (!newFeedback?.trim()) {
      this.feedbackErrors[feedbackId] = 'Feedback cannot be empty. Please provide a feedback!';
      return;
    }

    this.submissionInProgress[feedbackId] = true;

    this.feedbackService.updateFeedback(feedbackId, newFeedback).subscribe({
      next: () => {
        this.isFeedbackEditing[feedbackId] = false;
        this.feedbackErrors[feedbackId] = '';
        this.newFeedbackInput = '';
      },
      error: (err) => {
        console.error('Error updating feedback:', err);
        this.feedbackErrors[feedbackId] = err?.error?.message || 'Failed to update feedback. Please try again.';
      },
      complete: () => {
        this.submissionInProgress[feedbackId] = false;
      }
    });
  }

  hasUserVoted(feedback: RetroFeedback): boolean {
    return feedback.votedBy.some((voter: any) => voter._id === this.currentUserId);
  }

  addVote(feedbackId: string, sectionKey: string): void {
    if (this.votingInProgress[feedbackId]) return;

    const feedbacks = this.sessionFeedbacks[sectionKey];
    const index = feedbacks?.findIndex(f => f._id === feedbackId);
    if (index === undefined || index === -1) return;

    const feedback = feedbacks[index];
    const hasVoted = this.hasUserVoted(feedback);
    this.votingInProgress[feedbackId] = true;

    const action$: Observable<VoteFeedbackResponse> = hasVoted
      ? this.feedbackService.unvoteFeedback(feedbackId)
      : this.feedbackService.voteFeedback(feedbackId);

    action$.subscribe({
      next: (res) => {
        const updated = res.data;
        if (updated) {
          this.sessionFeedbacks[sectionKey][index] = {
            ...feedback,
            votes: updated.votes,
            votedBy: updated.votedBy
          };
          this.sessionFeedbacks[sectionKey] = [...this.sessionFeedbacks[sectionKey]];
        }
        this.votingInProgress[feedbackId] = false;
      },
      error: (error) => {
        this.votingInProgress[feedbackId] = false;
        this.sectionErrors[sectionKey] = error.error?.message || 'Failed to update vote';
      }
    });
  }

  getSectionItems(feedback: RetroFeedback, sectionKey: string): string[] {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.items || [];
  }

  getSectionActionItems(feedback: RetroFeedback, sectionKey: string): any | null {
    const section = feedback.sections.find(s => s.key === sectionKey);
    return section?.actionItems || null;
  }

  onSectionTitleChange(): void {
    this.newSectionKey = this.newSectionTitle.toLowerCase().trim().replace(/\s+/g, '-');
  }

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
      },
      error: () => {
        this.showNotification('Failed to delete section', false);
      }
    });
  }

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
      this.newSectionKey = this.newSectionTitle.toLowerCase().trim().replace(/\s+/g, '-');
    }

    this.sessionService.addSection(this.session._id, this.newSectionTitle, this.newSectionKey).subscribe({
      next: () => {
        this.cancelAddSection();
        this.showNotification('Section added successfully', true);
      },
      error: () => {
        this.showNotification('Failed to add section', false);
      }
    });
  }

  showNotification(message: string, success: boolean): void {
    if (success) {
      this.notification.success('Success', message);
    } else {
      this.notification.error('Error', message);
    }
  }

  private ensureMembership(): void {
    const userId = this.currentUserId;
    const members = this.session?.members ?? [];
    const memberIds = members
      .map((m: any) => m?.sessionMember?._id ?? m?.sessionMember)
      .filter(Boolean);

    if (memberIds.includes(userId)) {
      this.isMember = true;
      return;
    }

    this.joinInProgress = true;
    this.sessionService.joinSession(this.sessionId).subscribe({
      next: () => {
        this.isMember = true;
        this.joinInProgress = false;
        this.loadSession();
      },
      error: (err) => {
        this.joinInProgress = false;
        if (err.status === 401) {
          this.router.navigate(['/'], { queryParams: { returnUrl: this.router.url } });
          return;
        }
        this.sectionErrors['__join__'] = err?.error?.message || 'Failed to join session';
      }
    });
  }
}