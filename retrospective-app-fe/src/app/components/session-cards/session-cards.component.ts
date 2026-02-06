import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-session-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './session-cards.component.html',
  styleUrl: './session-cards.component.scss'
})
export class SessionCardsComponent {
  allSessions: RetroSession[] = [];
  joiningSessionId: string | null = null;

  constructor(
      private sessionService: SessionService,
      private authService: AuthService,
      private router: Router
    ) {}
  
  ngOnInit(): void {
    this.loadAllSessions();
  }

  loadAllSessions(): void {
    this.sessionService.getAllSessions().subscribe({
      next: (response: any) => {
        let sessions = response.data;
        if(Array.isArray(sessions)) {
          this.allSessions = sessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        } else {
          this.allSessions = [];
        }
      },
      error: (err) => {
        console.error(`Error loading sessions: ${err}`);
        this.allSessions = [];
      }
    })
  }

  get mysTeamSessions() {
    return this.allSessions.filter(session => session.team === 'MYS Team');
  }

  get csmTeamSessions() {
    return this.allSessions.filter(session => session.team === 'CSM Team')
  }

  viewSession(sessionId: string): void {
    const email = this.authService.getEmail();
    const username = this.authService.getUsername();

    if (!email || !username) {
      console.error('User not logged in');
      this.router.navigate(['/']);
      return;
    }

    this.joiningSessionId = sessionId;

    // Auto-join the session
    this.sessionService.joinSession(sessionId).subscribe({
      next: (response) => {
        console.log('Successfully joined session:', response);
        this.joiningSessionId = null;
        this.router.navigate(['/session', sessionId]);
      },
      error: (err) => {
        console.log('Join session error:', err);
        // User might already be in the session, that's okay
        if (err.error?.message?.includes('already joined')) {
          console.log('User already in session, proceeding...');
        }
        this.joiningSessionId = null;
        this.router.navigate(['/session', sessionId]);
      }
    });
  }
}
