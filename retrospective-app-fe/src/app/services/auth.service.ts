import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginResponse, RegisterResponse, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) {}

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { username, email, password }).pipe(
      tap(response => {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('email', response.data.email);
      })
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('username', response.data.user.username);
        localStorage.setItem('email', response.data.user.email);
      })
    );
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getEmail(): string | null {
    return localStorage.getItem('email');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getUsername();
  }

  logout(): void {
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('user');
  }
}
