import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../../services/session.service';
import { AuthService } from '../../../services/auth.service';
import { RetroSection, SessionTemplate } from '../../../models/session.model';
import { UserService } from '../../../services/user.service';
import { NzSelectModule } from 'ng-zorro-antd/select';


@Component({
  selector: 'app-create-session-handler',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  templateUrl: './create-session-handler.component.html',
  styleUrl: './create-session-handler.component.scss'
})
export class CreateSessionHandlerComponent {
  username: string | null = '';
  sessionName: string = '';
  team: string = '';
  userTeams: string[] = [];
  loadingTeams: boolean = false;

  showSuccessModal: boolean = false;
  createdSessionName: string = '';
  createdSessionId: string = '';
  sections: RetroSection[] = [];
  newSectionTitle: string = '';
  showError: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;
  joiningSessionId: string | null = '';
  selectedTemplate: SessionTemplate | null = null;

  selectedMode: string = 'standardTemplate';

  templates: SessionTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Retro',
      description: 'Went Well, Needs Improvement, Action Items',
      icon: 'assignment',
      sections: [
        { key: 'went-well', title: 'Went Well' },
        { key: 'needs-improvement', title: 'Needs Improvement' },
        { key: 'action-items', title: 'Action Items' }
      ]
    },
    {
      id: 'start-stop-continue',
      name: 'Start / Stop / Continue',
      description: 'What to start, stop, and keep doing',
      icon: 'play_circle',
      sections: [
        { key: 'start', title: 'Start' },
        { key: 'stop', title: 'Stop' },
        { key: 'continue', title: 'Continue' }
      ]
    },
    {
      id: '4ls',
      name: '4 L\'s Retro',
      description: 'Liked, Learned, Lacked, Longed For',
      icon: 'favorite',
      sections: [
        { key: 'liked', title: 'Liked' },
        { key: 'learned', title: 'Learned' },
        { key: 'lacked', title: 'Lacked' },
        { key: 'longed-for', title: 'Longed For' }
      ]
    },
    {
      id: 'mad-sad-glad',
      name: 'Mad / Sad / Glad',
      description: 'Team emotions and feelings check-in',
      icon: 'mood',
      sections: [
        { key: 'mad', title: 'Mad' },
        { key: 'sad', title: 'Sad' },
        { key: 'glad', title: 'Glad' }
      ]
    },
    {
      id: 'rose-bud-thorn',
      name: 'Rose, Bud, Thorn',
      description: 'Positives, Potential, and Problems',
      icon: 'local_florist',
      sections: [
        { key: 'rose', title: 'Rose (Positives)' },
        { key: 'bud', title: 'Bud (Potential)' },
        { key: 'thorn', title: 'Thorn (Problems)' }
      ]
    },
    {
      id: 'starfish',
      name: 'Starfish',
      description: 'Stop, Start, Keep, More Of, Less Of',
      icon: 'stars',
      sections: [
        { key: 'stop', title: 'Stop' },
        { key: 'start', title: 'Start' },
        { key: 'keep', title: 'Keep Doing' },
        { key: 'more-of', title: 'More Of' },
        { key: 'less-of', title: 'Less Of' }
      ]
    },
    {
      id: 'kalm',
      name: 'KALM',
      description: 'Keep, Add, Less, More',
      icon: 'tune',
      sections: [
        { key: 'keep', title: 'Keep' },
        { key: 'add', title: 'Add' },
        { key: 'less', title: 'Less' },
        { key: 'more', title: 'More' }
      ]
    }
  ]

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.selectTemplate(this.templates[0]);
    this.loadUserTeams();
  }

  loadUserTeams(): void {
    this.loadingTeams = true;
    this.userService.getUserTeams().subscribe({
      next: (teams) => {
        console.log(teams);
        this.userTeams = teams;
        this.team = teams[0] ?? '';
        this.loadingTeams = false;
      },
      error: (error) => {
        console.error('Error loading user teams:', error);
        this.loadingTeams = false;
      }
    });
  }

  selectTemplate(template: SessionTemplate | null): void {
    this.selectedTemplate = template;
    if (template) {
      this.sections = [...template.sections];
    } else {
      this.sections = [];
    }
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

    const key = this.newSectionTitle.toLowerCase().replace(/\s+/g, '-');

    if (this.sections.some(s => s.key === key)) {
      this.showError = true;
      this.errorMessage = 'Section already exists';
      return;
    }
    
    this.selectedTemplate = null;

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
    this.selectedTemplate = null;
  }

  closeModal(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/session', this.createdSessionId]);
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
