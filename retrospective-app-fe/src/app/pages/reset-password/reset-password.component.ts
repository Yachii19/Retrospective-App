import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  email = '';

  newPassword = '';
  confirmPassword = '';
  showNew = false;
  showConfirm = false;

  isLoading = false;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Read token and email from URL query params
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.token || !this.email) {
      this.errorMessage = 'Invalid or missing reset link. Please request a new one.';
    }
  }

  get isValid(): boolean {
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

  submit(): void {
    if (!this.isValid) {
      if (this.newPassword.length < 8) {
        this.errorMessage = 'Password must be at least 8 characters';
      } else {
        this.errorMessage = 'Passwords do not match';
      }
      return;
    }

    console.log(this.email);
    console.log(this.token);
    console.log(this.newPassword);

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.email, this.token, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/']);
  }
}