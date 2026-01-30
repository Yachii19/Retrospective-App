import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';

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
    this.router.navigate(['/session', sessionId]);
  }
}
