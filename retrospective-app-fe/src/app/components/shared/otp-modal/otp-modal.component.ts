import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-otp-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-modal.component.html',
  styleUrl: './otp-modal.component.scss'
})
export class OtpModalComponent implements OnInit, OnDestroy {
  otpDigits: string[] = ['', '', '', '', '', ''];
  isLoading = false;
  isResending = false;
  errorMessage = '';
  resendCooldown = 0;
  private cooldownInterval: any;

  constructor(
    private modalRef: NzModalRef,
    private authService: AuthService,
    @Inject(NZ_MODAL_DATA) public data: { email: string }
  ) {}

  ngOnInit(): void {
    this.startCooldown();
    setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
  }

  ngOnDestroy(): void {
    clearInterval(this.cooldownInterval);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    this.otpDigits[index] = value;
    this.errorMessage = '';

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    if (this.otpDigits.join('').length === 6) {
      setTimeout(() => this.verifyOTP(), 100);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  verifyOTP(): void {
    const otp = this.otpDigits.join('');
    if (otp.length < 6) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOTP(this.data.email, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalRef.close('verified');
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid OTP. Please try again.';
        this.otpDigits = ['', '', '', '', '', ''];
        setTimeout(() => document.getElementById('otp-0')?.focus(), 50);
      }
    });
  }

  resendOTP(): void {
    if (this.resendCooldown > 0 || this.isResending) return;

    this.isResending = true;
    this.errorMessage = '';

    this.authService.resendOTP(this.data.email).subscribe({
      next: () => {
        this.isResending = false;
        this.startCooldown();
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err.error?.message || 'Failed to resend OTP.';
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.cooldownInterval);
    }, 1000);
  }
}