import { Component } from '@angular/core';
import { RetroSession } from '../../models/session.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-session-details-header',
  standalone: true,
  imports: [],
  templateUrl: './session-details-header.component.html',
  styleUrl: './session-details-header.component.scss'
})
export class SessionDetailsHeaderComponent {
  session: RetroSession | null = null;
  sessionId: string = '';
  membersCount: number = 0;

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private route: ActivatedRoute
  ) {};

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
    })

    this.loadSession();
  }

  
  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        console.log(response);
        this.session = response.data;
        this.membersCount = response.membersCount;
      },
      error: (err) => {
        console.error(`Error loading session: ${err}`);
        this.session = null;
      }
    });    
  }

  goHome(): void {
    
    this.router.navigate(['/dashboard']);
  }

  export(): void {
    console.log(this.sessionId);
    console.log(this.session);
  }
}
