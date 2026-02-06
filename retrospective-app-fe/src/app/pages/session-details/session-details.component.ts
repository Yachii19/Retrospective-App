import { Component } from '@angular/core';
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
export class SessionDetailsComponent {
  sessionId: string = '';
  sessionFeedbacks: RetroFeedback[] = [];
  session: RetroSession | null = null;

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

}
