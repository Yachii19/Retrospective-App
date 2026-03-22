import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Schedule auto logout on service init (page refresh)
    this.scheduleAutoLogout();
  }

  ngOnDestroy(): void {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, { username, email, password });
  }

  verifyOTP(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, { email, otp }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.scheduleAutoLogout(); // ← start timer after OTP verify
      })
    );
  }

  resendOTP(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-otp`, { email });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { email, token, newPassword });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.scheduleAutoLogout(); // ← start timer after login
      })
    );
  }

  logout(): void {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }

  // ── Token helpers ─────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const expMs = this.getTokenExpiryMs(token);
    if (!expMs) return true;
    return Date.now() >= expMs;
  }

  scheduleAutoLogout(): void {
    const token = this.getToken();
    if (!token) return;

    const expMs = this.getTokenExpiryMs(token);
    if (!expMs) return;

    const delay = expMs - Date.now();

    if (delay <= 0) {
      this.logout();
      return;
    }

    if (this.logoutTimer) clearTimeout(this.logoutTimer);

    this.logoutTimer = setTimeout(() => {
      this.logout();
    }, delay);
  }

  private getTokenExpiryMs(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  // ── User helpers ──────────────────────────────────────────────────────────

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getUsername(): string | null {
    return this.getUser()?.username ?? null;
  }

  getEmail(): string | null {
    return this.getUser()?.email ?? null;
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  isCreator(creatorId: string | undefined): boolean {
    return this.getUser()?._id === creatorId;
  }
}