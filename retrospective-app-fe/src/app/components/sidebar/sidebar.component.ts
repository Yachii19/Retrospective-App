import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs/internal/Observable';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  username$!: Observable<string>;
  isAdmin: boolean = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username$ = this.userService.username$;

    if (!this.userService.getCurrentUsername()) {
      this.userService.getUserProfile().subscribe();
    }

    const user = this.authService.getUser();
    console.log(user);
    this.isAdmin = user?.role === 'admin';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
