import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RetrospectiveService } from '../../services/retrospective.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-session-handler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-session-handler.component.html',
  styleUrl: './create-session-handler.component.scss'
})
export class CreateSessionHandlerComponent {
  sessionName: string = '';
  team: string = 'MYS Team';
  showSuccessModal: boolean = false;
  createdSessionName: string = '';
  createdSessionId: string = '';

  constructor(
    private retroService: RetrospectiveService,
    private router: Router
  ) {}

  createSession(): void {
    if (!this.sessionName.trim()) {
      return;
    }

    this.retroService.createSession(this.sessionName, this.team).subscribe({
      next: (session) => {
        console.log('Session created:', session);
        this.createdSessionName = session.sessionName;
        this.createdSessionId = session.sessionId;
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error creating session:', error);
      }
    });
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/session', this.createdSessionId]);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
