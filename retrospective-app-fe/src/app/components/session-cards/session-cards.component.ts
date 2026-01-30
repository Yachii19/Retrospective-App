import { Component } from '@angular/core';
import { RetrospectiveService } from '../../services/retrospective.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './session-cards.component.html',
  styleUrl: './session-cards.component.scss'
})
export class SessionCardsComponent {
  allSessions: RetroSession[] = [];

  constructor(
      private sessionService: SessionService,
      private router: Router
    ) {}
  
  ngOnInit(): void {
    this.loadAllSessions();
  }

  loadAllSessions(): void {
    console.log(this.allSessions);
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
    this.router.navigate(['/session', sessionId]);
  }
}
