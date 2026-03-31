import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RetroFeedback } from '../../models/feedback.model';
import { RetroSession } from '../../models/session.model';

import { ActivatedRoute, Router } from '@angular/router';
import { SessionDetailsHeaderComponent } from './session-details-header/session-details-header.component';
import { SessionDetailsHandlerComponent } from './session-details-handler/session-details-handler.component';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [SessionDetailsHeaderComponent, SessionDetailsHandlerComponent, CommonModule],
  templateUrl: './session-details.component.html',
  styleUrl: './session-details.component.scss'
})
export class SessionDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  sessionId: string = '';
  sessionFeedbacks: RetroFeedback[] = [];
  session: RetroSession | null = null;
  isModalOpen: boolean = false;

  isAccessDenied: boolean = false;

  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;
  private wrapperEl: HTMLElement | null = null;
  private resizeObserver!: ResizeObserver;

  private boundMouseDown = this.onMouseDown.bind(this);
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp   = this.onMouseUp.bind(this);

  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.sessionId = this.route.snapshot.paramMap.get('id') || '';

    this.checkAccess();
  }

  ngAfterViewInit(): void {
    this.wrapperEl = document.querySelector('.session-grid-wrapper');
    if (!this.wrapperEl) return;

    this.wrapperEl.addEventListener('mousedown', this.boundMouseDown);
    this.wrapperEl.addEventListener('mousemove', this.boundMouseMove);
    this.wrapperEl.addEventListener('mouseup',   this.boundMouseUp);
    this.wrapperEl.addEventListener('mouseleave', this.boundMouseUp);

    this.resizeObserver = new ResizeObserver(() => this.updateCursor());
    this.resizeObserver.observe(this.wrapperEl);
  }

  ngOnDestroy(): void {
    if (this.wrapperEl) {
      this.wrapperEl.removeEventListener('mousedown', this.boundMouseDown);
      this.wrapperEl.removeEventListener('mousemove', this.boundMouseMove);
      this.wrapperEl.removeEventListener('mouseup',   this.boundMouseUp);
      this.wrapperEl.removeEventListener('mouseleave', this.boundMouseUp);
    }
    this.resizeObserver?.disconnect();
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private checkAccess(): void {
    forkJoin({
      session: this.sessionService.getSessionById(this.sessionId),
      teams: this.userService.getUserTeams()
    }).subscribe({
      next: ({ session, teams }) => {
        const sessionData = session.data as RetroSession;
        const sessionTeam = sessionData.team;
        const isMember = teams.includes(sessionTeam);

        if (!isMember) {
          console.warn('Access denied: not a member of this session\'s team');
          this.isAccessDenied = true;
        }
      },
      error: (err) => {
        console.error('Access check failed:', err);
        this.isAccessDenied = true;
      }
    })
  }

  private onMouseDown(e: MouseEvent): void {
    if (!this.wrapperEl || this.wrapperEl.scrollWidth <= this.wrapperEl.clientWidth) return;

    const target = e.target as HTMLElement;
    if (target.closest('.feedback-body') || target.closest('.reply-item') || target.closest('textarea') || target.closest('input')) return;

    this.isDragging = true;
    this.startX = e.pageX - this.wrapperEl.offsetLeft;
    this.scrollLeft = this.wrapperEl.scrollLeft;
    this.wrapperEl.style.cursor = 'grabbing';
  }

 private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.wrapperEl) return;

    const x = e.pageX - this.wrapperEl.offsetLeft;
    const delta = x - this.startX;

    if (Math.abs(delta) < 5) return;

    e.preventDefault();
    this.wrapperEl.scrollLeft = this.scrollLeft - delta;
  }

  private onMouseUp(): void {
    if (!this.wrapperEl) return;
    this.isDragging = false;
    this.updateCursor();
  }

  private updateCursor(): void {
    if (!this.wrapperEl) return;
    this.wrapperEl.style.cursor =
      this.wrapperEl.scrollWidth > this.wrapperEl.clientWidth ? 'grab' : 'default';
  }
}