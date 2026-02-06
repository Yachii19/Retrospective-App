import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { RetroSection } from '../../models/session.model';


@Component({
  selector: 'app-create-session-handler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-session-handler.component.html',
  styleUrl: './create-session-handler.component.scss'
})
export class CreateSessionHandlerComponent {
  username: string | null = '';
  sessionName: string = '';
  team: string = 'MYS Team';
  showSuccessModal: boolean = false;
  createdSessionName: string = '';
  createdSessionId: string = '';
  sections: RetroSection[] = [];
  newSectionTitle: string = '';
  showError: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  joiningSessionId: string | null = '';

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
  }

  onInputChange():void {
    this.showError = false;
    this.errorMessage = '';
  }

  createSession(): void {
    if (!this.sessionName.trim()) {
      this.showError = true;
      this.errorMessage = 'Session name is empty. Please provide a name!';
      return;
    }

    const email = this.authService.getEmail();
    const username = this.authService.getUsername();

    if (!email || !username) {
      console.error('User not logged in');
      this.router.navigate(['/']);
      return;
    }

    this.isLoading = true;

    this.sessionService.createSession(this.sessionName, this.team, this.sections).subscribe({
      next: (response) => {
        this.createdSessionName = response.data.sessionName;
        this.createdSessionId = response.data._id;

        this.joiningSessionId = this.createdSessionId;

        this.sessionService.joinSession(this.createdSessionId).subscribe({
          next: (response) => {
            this.joiningSessionId = null;
            this.isLoading = false;
            this.showSuccessModal = true;
          },
          error: (error) => {
            this.joiningSessionId = null;
            this.isLoading = false;
            this.showSuccessModal = true;
          }
        });
      },
      error: (error) => {
        console.error('Error creating session:', error);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = error.error?.message
      }
    });
  }

  addSection(): void {
    if (!this.newSectionTitle.trim()) {
      this.showError = true;
      this.errorMessage = 'Section title cannot be empty';
      return;
    }

    // Generate key from title (lowercase, replace spaces with hyphens)
    const key = this.newSectionTitle.toLowerCase().replace(/\s+/g, '-');

    // Check if section already exists
    if (this.sections.some(s => s.key === key)) {
      this.showError = true;
      this.errorMessage = 'Section already exists';
      return;
    }

    this.sections.push({
      key: key,
      title: this.newSectionTitle.trim()
    });

    this.newSectionTitle = '';
    this.showError = false;
    this.errorMessage = '';
  }

  

  removeSection(index: number): void {
    this.sections.splice(index, 1);
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/session', this.createdSessionId]);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
