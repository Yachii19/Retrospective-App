import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';


@Component({
  selector: 'app-session-details-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-details-header.component.html',
  styleUrl: './session-details-header.component.scss'
})
export class SessionDetailsHeaderComponent {
  session: RetroSession | null = null;
  sessionId: string = '';
  membersCount: number = 0;
  creator: boolean = false;
  user: User | null = null;
  isScrolled: boolean = false;
  isHighlightsPage: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
    private route: ActivatedRoute
  ) {};

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.sessionId = params['id'];
    })

    this.isHighlightsPage = this.router.url.includes('/highlight');

    this.loadSession();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  loadSession(): void {
    this.sessionService.getSessionById(this.sessionId).subscribe({
      next: (response: any) => {
        this.session = response.data;
        this.membersCount = response.membersCount;

        this.creator = this.authService.isCreator(this.session?.createdBy._id);
        this.user = this.authService.getUser();
      },
      error: (err) => {
        console.error(`Error loading session: ${err}`);
        this.session = null;
      }
    });    
  }

  highlightSession(): void {
    this.router.navigate([`/session/${this.sessionId}/highlight`]);
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  isMemberCreator(memberId: string): boolean {
    if(memberId === this.session?.createdBy._id) {
      return true;
    } else {
      return false
    }
  }

  export(): void {
    console.log(this.sessionId);
    console.log(this.session);
  }
}
