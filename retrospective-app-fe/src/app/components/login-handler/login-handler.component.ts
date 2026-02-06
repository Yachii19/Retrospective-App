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
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onInputChange():void {
    this.showError = false;
    this.errorMessage = '';
  }

  toggleMode():void {
    this.isLoginMode = !this.isLoginMode;
    this.showError = false;
    this.errorMessage = '';
    this.username = '';
    this.email = '';
    this.password = '';
  }

  signIn():void {
    if (!this.email.trim() || !this.password.trim()) {
      this.showError = true;
      this.errorMessage = 'Email and password are required';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  signUp():void {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.showError = true;
      this.errorMessage = 'Username, email, and password are required';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.username, this.email, this.password).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        console.log('User:', this.authService.getUser());
        console.log('Token stored:', this.authService.getToken());
        
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  handleSubmit():void {
    if (this.isLoginMode) {
      this.signIn();
    } else {
      this.signUp();
    }
  }
}
