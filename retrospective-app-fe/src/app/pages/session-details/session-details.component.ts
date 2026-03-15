import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RetroFeedback } from '../../models/feedback.model';
import { RetroSession } from '../../models/session.model';
import { SessionDetailsHeaderComponent } from '../../components/session-details-header/session-details-header.component';
import { SessionDetailsHandlerComponent } from '../../components/session-details-handler/session-details-handler.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [SessionDetailsHeaderComponent, SessionDetailsHandlerComponent],
  templateUrl: './session-details.component.html',
  styleUrl: './session-details.component.scss'
})
export class SessionDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  sessionId: string = '';
  sessionFeedbacks: RetroFeedback[] = [];
  session: RetroSession | null = null;
  isModalOpen: boolean = false;

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
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
  }

  ngAfterViewInit(): void {
    this.wrapperEl = document.querySelector('.session-grid-wrapper');
    if (!this.wrapperEl) return;

    this.wrapperEl.addEventListener('mousedown', this.boundMouseDown);
    this.wrapperEl.addEventListener('mousemove', this.boundMouseMove);
    this.wrapperEl.addEventListener('mouseup',   this.boundMouseUp);
    this.wrapperEl.addEventListener('mouseleave', this.boundMouseUp);

    // Watch for size changes and update cursor accordingly
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

  private onMouseDown(e: MouseEvent): void {
    if (!this.wrapperEl || this.wrapperEl.scrollWidth <= this.wrapperEl.clientWidth) return;
    this.isDragging = true;
    this.startX = e.pageX - this.wrapperEl.offsetLeft;
    this.scrollLeft = this.wrapperEl.scrollLeft;
    this.wrapperEl.style.cursor = 'grabbing';
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.wrapperEl) return;
    e.preventDefault();
    const x = e.pageX - this.wrapperEl.offsetLeft;
    this.wrapperEl.scrollLeft = this.scrollLeft - (x - this.startX);
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