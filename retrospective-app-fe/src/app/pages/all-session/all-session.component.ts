import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { RetroSession } from '../../models/retrospective.model';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { SessionCardsComponent } from '../../components/session-cards/session-cards.component';

@Component({
  selector: 'app-all-session',
  standalone: true,
  imports: [CommonModule, SessionCardsComponent, SidebarComponent, RouterLink, DatePipe],
  templateUrl: './all-session.component.html',
  styleUrl: './all-session.component.scss'
})
export class AllSessionComponent implements OnInit {
  allSessions: RetroSession[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit (): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
  }
}
