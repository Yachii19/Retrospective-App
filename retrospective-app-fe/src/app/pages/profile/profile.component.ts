import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AvatarColorPipe } from '../../pipes/avatar-color.pipe';
import { Observable, map } from 'rxjs';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, AvatarColorPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  currentUser$!: Observable<User>;

  usernameInput = '';
  newPassword = '';
  confirmPassword = '';

  showNew = false;
  showConfirm = false;

  savingUsername = false;
  savingPassword = false;

  usernameSuccess = '';
  usernameError = '';
  passwordSuccess = '';
  passwordError = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    this.currentUser$ = this.userService.getUserProfile().pipe(
      map(res => res.user)
    );
  }

  get isPasswordValid(): boolean {
    return (
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  get passwordStrength(): 'weak' | 'fair' | 'strong' {
    if (this.newPassword.length >= 12) return 'strong';
    if (this.newPassword.length >= 8) return 'fair';
    return 'weak';
  }

  resetUsername(): void {
    if (!this.usernameInput.trim()) {
      this.usernameError = 'Username cannot be empty';
      return;
    }

    this.savingUsername = true;
    this.usernameSuccess = '';
    this.usernameError = '';

    this.userService.updateUsername(this.usernameInput).subscribe({
      next: (response: any) => {
        this.savingUsername = false;
        this.usernameSuccess = response.message || 'Username updated successfully';
        this.currentUser$ = this.userService.getUserProfile().pipe(
          map(res => res.user)
        );
      },
      error: (err) => {
        this.savingUsername = false;
        this.usernameError = err?.error?.message || 'Failed to update username';
      }
    });
  }

  resetPassword(): void {
    if (this.newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }

    this.savingPassword = true;
    this.passwordSuccess = '';
    this.passwordError = '';

    this.userService.updatePassword(this.newPassword).subscribe({
      next: (response: any) => {
        this.savingPassword = false;
        this.passwordSuccess = response.message || 'Password updated successfully';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.savingPassword = false;
        this.passwordError = err?.error?.message || 'Failed to update password';
      }
    });
  }
}