import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recent-session-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './recent-session-cards.component.html',
  styleUrl: './recent-session-cards.component.scss'
})
export class RecentSessionCardsComponent {
  recentSessions: RetroSession[] = [];
  joiningSessionId: string | null = '';

  constructor(
      private authService: AuthService,
      private sessionService: SessionService,
      private router: Router
    ) {}
  
  ngOnInit(): void {
    this.loadRecentSessions();
  }

  loadRecentSessions(): void {
    this.sessionService.getAllSessions().subscribe({
      next: (response: any) => {
        let sessions = response.data;
        if(Array.isArray(sessions)) {
          this.recentSessions = sessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 9);
          
        } else {
          this.recentSessions = [];
        }
      },
      error: (err) => {
        console.error(`Error loading sessions: ${err}`);
        this.recentSessions = [];
      }
    })

     
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

     this.sessionService.joinSession(sessionId, email, username).subscribe({
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
