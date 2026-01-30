import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RetrospectiveService } from '../../services/retrospective.service';
import { RetroFeedback } from '../../models/feedback.model';

@Component({
  selector: 'app-my-contributions',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './my-contributions.component.html',
  styleUrl: './my-contributions.component.scss'
})
export class MyContributionsComponent {
  username: string | null = '';
  userFeedbacks:RetroFeedback[] = [];

  constructor(
    private authService: AuthService,
    private retroService: RetrospectiveService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.username = this.authService.getUsername();
    this.loadFeedbacks();
    console.log(this.username);
  }

  loadFeedbacks(): void {
    this.retroService.getFeedbackByUser(this.username).subscribe({
      next: (response: any) => {
        const feedbacks = response.data;
        console.log(feedbacks);
        if(Array.isArray(feedbacks)) {
          this.userFeedbacks = feedbacks
        } else {
          this.userFeedbacks = [];
        }
      },
      error: (err) => {
        console.error(`Error loading user feedbacks ${err}`);
        this.userFeedbacks = [];
      }
    })
    
  }

  viewSession(sessiodId: string): void {
    this.router.navigate(['/session', sessiodId]);
  }
}
