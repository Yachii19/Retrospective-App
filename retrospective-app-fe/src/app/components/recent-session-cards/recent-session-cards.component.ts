import { Component } from '@angular/core';
import { RetroSession } from '../../models/retrospective.model';
import { AuthService } from '../../services/auth.service';
import { RetrospectiveService } from '../../services/retrospective.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-recent-session-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './recent-session-cards.component.html',
  styleUrl: './recent-session-cards.component.scss'
})
export class RecentSessionCardsComponent {
  recentSessions: RetroSession[] = [];

  constructor(
      private authService: AuthService,
      private retroService: RetrospectiveService,
      private router: Router
    ) {}
  
  ngOnInit(): void {
    this.loadRecentSessions();
  }

  loadRecentSessions(): void {
    this.retroService.getSessions().subscribe({
      next: (sessions: any) => {

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
    this.router.navigate(['/session', sessionId]);
  }
}
