import { Component } from '@angular/core';
import { RetroSession } from '../../models/retrospective.model';
import { RetrospectiveService } from '../../services/retrospective.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';

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
      private retroService: RetrospectiveService,
      private router: Router
    ) {}
  
  ngOnInit(): void {
    this.loadAllSessions();
  }

  loadAllSessions(): void {
    this.retroService.getSessions().subscribe({
      next: (sessions: any) => {

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

    console.log(this.allSessions);
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
