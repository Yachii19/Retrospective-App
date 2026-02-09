import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment.development';

// Simple interfaces that match backend response

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('Auth Service initialized with API URL:', this.apiUrl);
    console.log('Environment:', environment.production ? 'Production' : 'Development');
  }

  // Register new user
  register(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { 
      username, 
      email, 
      password,
    }).pipe(
      tap(response => {
        // Save token and user data to localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Token saved:', response.token);
      })
    );
  }

  // Login existing user
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { 
      email, 
      password 
    }).pipe(
      tap(response => {
        // Save token and user data to localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Token saved:', response.token);
      })
    );
  }

  // Get current user from localStorage
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get username
  getUsername(): string | null {
    const user = this.getUser();
    return user ? user.username : null;
  }

  // Get email
  getEmail(): string | null {
    const user = this.getUser();
    return user ? user.email : null;
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get authorization headers with token
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Check user sessions ID
  isCreator(creatorId: string | undefined): boolean {
    const user = this.getUser();
    if(user._id === creatorId) {
      console.log(creatorId);
      return true;
    } else {
      return false
    }
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
