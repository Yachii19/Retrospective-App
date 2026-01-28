import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { Router, RouterLink } from '@angular/router';
import { RecentSessionCardsComponent } from '../../components/recent-session-cards/recent-session-cards.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RecentSessionCardsComponent, SidebarComponent, RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  username: string | null = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.username = this.authService.getUsername();
  }
}
