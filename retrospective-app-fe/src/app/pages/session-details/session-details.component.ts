import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RetrospectiveService } from '../../services/retrospective.service';
import { RetroFeedback } from '../../models/retrospective.model';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './session-details.component.html',
  styleUrl: './session-details.component.scss'
})
export class SessionDetailsComponent {
  username: string | null = '';
  sessionId: string = '';
  sessionName: string = '';
  sessionFeedbacks: RetroFeedback[] = [];


  wentWell: string[] = [];
  needsImprovement: string[] = [];
  actionItems: string[] = [];

  constructor(
    private authService: AuthService,
    private retroService: RetrospectiveService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.username = this.authService.getUsername();
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
      this.loadSession();
      this.loadSessionFeedbacks();
    })
  }

  loadSession(): void {
    this.retroService.getSession(this.sessionId).subscribe({
      next: (response: any) => {
        const session = response.data;
        this.sessionName = session.sessionName;
        console.log(this.sessionName);
      },
      error: (err) => {
        console.error(`Error fetching session: ${err}`);
        this.sessionName = '';
      }
    })
  }

  loadSessionFeedbacks(): void {
    this.retroService.getFeedback(this.sessionId).subscribe({
      next: (feedback: any) => {
        if(Array.isArray(feedback)) {
          this.sessionFeedbacks = feedback;
        } else {
          this.sessionFeedbacks = [];
        }
      },
      error: (err) => {
        console.error(`Error fetching feedbacks: ${err}`);
        this.sessionFeedbacks = [];
      }
    })
  }

  addFeedback(): void {
    if (!this.wentWell.length && !this.needsImprovement.length && !this.actionItems.length) {
      alert('Please add at least one feedback item');
      return;
    }

    const feedback: RetroFeedback = {
      sessionId: this.sessionId,
      username: this.username || '',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      wentWell: this.wentWell,
      needsImprovement: this.needsImprovement,
      actionItems: this.actionItems
    };

    this.retroService.addFeedback(this.sessionId, feedback).subscribe({
      next: () => {
        this.loadSessionFeedbacks();
        this.clearForm();
      },
      error: (err) => console.error('Error adding feedback:', err)
    });
  }

  clearForm(): void {
    this.wentWell = [];
    this.needsImprovement = [];
    this.actionItems = [];
  }

  addItem(category: 'wentWell' | 'needsImprovement' | 'actionItems', input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value) {
      this[category].push(value);
      input.value = '';
    }
  }

  removeItem(category: 'wentWell' | 'needsImprovement' | 'actionItems', index: number): void {
    this[category].splice(index, 1);
  }
}
