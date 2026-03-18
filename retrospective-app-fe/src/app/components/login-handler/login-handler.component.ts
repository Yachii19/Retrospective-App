import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { OtpModalComponent } from '../shared/otp-modal/otp-modal.component';
import { ForgotPasswordModalComponent } from '../shared/forgot-password-modal/forgot-password-modal.component';

@Component({
  selector: 'app-login-handler',
  standalone: true,
  imports: [CommonModule, FormsModule, OtpModalComponent, ForgotPasswordModalComponent],
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
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private modal: NzModalService,
    private notification: NzNotificationService
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

        if (error.status === 403) {
          this.openOtpModal(error.error?.email || this.email);
          return;
        }

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
        this.isLoading = false;
        this.openOtpModal(this.email);
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

  openOtpModal(email: string): void {
    const modalRef: NzModalRef = this.modal.create({
      nzTitle: '',
      nzFooter: null,
      nzClosable: false,
      nzMaskClosable: false,
      nzCentered: true,
      nzWidth: 420,
      nzContent: OtpModalComponent,
      nzData: { email }
    });

    modalRef.afterClose.subscribe((result) => {
      if (result === 'verified') {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  openForgotPasswordModal(): void {
    this.modal.create({
      nzTitle: '',
      nzFooter: null,
      nzClosable: false,
      nzMaskClosable: true,
      nzCentered: true,
      nzWidth: 420,
      nzContent: ForgotPasswordModalComponent
    })
  }
}
