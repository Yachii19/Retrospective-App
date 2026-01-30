import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-handler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-handler.component.html',
  styleUrl: './login-handler.component.scss'
})
export class LoginHandlerComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  showError: boolean = false;
  errorMessage: string = '';
  isLoginMode: boolean = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onInputChange() {
    this.showError = false;
    this.errorMessage = '';
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.showError = false;
    this.errorMessage = '';
    this.username = '';
    this.email = '';
    this.password = '';
  }

  signIn() {
    if (!this.email.trim() || !this.password.trim()) {
      this.showError = true;
      this.errorMessage = 'Email and password are required';
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.router.navigate(['/dashboard']); // or wherever you want to navigate
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.showError = true;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  signUp() {
    // Validate inputs
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.showError = true;
      this.errorMessage = 'Username, email, and password are required';
      return;
    }

    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.router.navigate(['/dashboard']); // or wherever you want to navigate
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.showError = true;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  handleSubmit() {
    if (this.isLoginMode) {
      this.signIn();
    } else {
      this.signUp();
    }
  }
}
