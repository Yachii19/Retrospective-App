import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-login-handler',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-handler.component.html',
  styleUrl: './login-handler.component.scss'
})
export class LoginHandlerComponent {
  isLoginMode: boolean = true;
  isForgotMode: boolean = false;
  isPinSetupMode: boolean = false;

  username: string = '';
  email: string = '';
  password: string = '';
  recoveryPin: string = '';
  showPassword: boolean = false;

  resetEmail: string = '';
  resetPin: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;
  resetSuccess: boolean = false;

  setupPinValue: string = '';
  setupPinConfirm: string = '';
  pinSetupSuccess: boolean = false;

  showError: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private notification: NzNotificationService
  ) {}

  onInputChange(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.isForgotMode = false;
    this.isPinSetupMode = false;
    this.resetFields();
  }

  openForgotMode(): void {
    this.isForgotMode = true;
    this.isLoginMode = false;
    this.isPinSetupMode = false;
    this.resetSuccess = false;
    this.resetFields();
  }

  closeForgotMode(): void {
    this.isForgotMode = false;
    this.isLoginMode = true;
    this.isPinSetupMode = false;
    this.resetFields();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  private resetFields(): void {
    this.username = '';
    this.email = '';
    this.password = '';
    this.recoveryPin = '';
    this.resetEmail = '';
    this.resetPin = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.setupPinValue = '';
    this.setupPinConfirm = '';
    this.showError = false;
    this.errorMessage = '';
    this.resetSuccess = false;
    this.pinSetupSuccess = false;
  }

  get passwordStrength(): 'weak' | 'fair' | 'strong' {
    if (this.newPassword.length >= 12) return 'strong';
    if (this.newPassword.length >= 8) return 'fair';
    return 'weak';
  }

  signIn(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.showError = true;
      this.errorMessage = 'Email and password are required';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.requiresPinSetup) {
          this.isLoginMode = false;
          this.isPinSetupMode = true;
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }

  signUp(): void {
    if (!this.username.trim() || !this.email.trim() || !this.password.trim() || !this.recoveryPin.trim()) {
      this.showError = true;
      this.errorMessage = 'All fields including recovery PIN are required';
      return;
    }

    if (!/^\d{6}$/.test(this.recoveryPin)) {
      this.showError = true;
      this.errorMessage = 'Recovery PIN must be exactly 6 digits';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.username, this.email, this.password, this.recoveryPin).subscribe({
      next: () => {
        this.isLoading = false;
        this.notification.success('Welcome!', 'Account created successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  submitForgotPassword(): void {
    if (!this.resetEmail.trim() || !this.resetPin.trim() || !this.newPassword.trim() || !this.confirmPassword.trim()) {
      this.showError = true;
      this.errorMessage = 'All fields are required';
      return;
    }

    if (!/^\d{6}$/.test(this.resetPin)) {
      this.showError = true;
      this.errorMessage = 'Recovery PIN must be exactly 6 digits';
      return;
    }

    if (this.newPassword.length < 8) {
      this.showError = true;
      this.errorMessage = 'New password must be at least 8 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showError = true;
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.resetEmail, this.resetPin, this.newPassword, this.confirmPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetSuccess = true;
        this.showError = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  submitPinSetup(): void {
    if (!this.setupPinValue.trim() || !this.setupPinConfirm.trim()) {
      this.showError = true;
      this.errorMessage = 'Please enter and confirm your PIN';
      return;
    }

    if (!/^\d{6}$/.test(this.setupPinValue)) {
      this.showError = true;
      this.errorMessage = 'PIN must be exactly 6 digits';
      return;
    }

    if (this.setupPinValue !== this.setupPinConfirm) {
      this.showError = true;
      this.errorMessage = 'PINs do not match';
      return;
    }

    this.isLoading = true;

    this.authService.setupPin(this.setupPinValue).subscribe({
      next: () => {
        this.isLoading = false;
        this.pinSetupSuccess = true;
        this.showError = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showError = true;
        this.errorMessage = err.error?.message || 'Failed to set PIN. Please try again.';
      }
    });
  }

  handleSubmit(): void {
    if (this.isPinSetupMode) {
      this.submitPinSetup();
    } else if (this.isForgotMode) {
      this.submitForgotPassword();
    } else if (this.isLoginMode) {
      this.signIn();
    } else {
      this.signUp();
    }
  }
}