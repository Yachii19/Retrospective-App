import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, tap } from 'rxjs'; // ← add tap
import { UpdatePasswordResponse, UpdateUsernameResponse, UserProfileResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/users`;
  private usernameSubject = new BehaviorSubject<string>('');
  username$ = this.usernameSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCurrentUsername(): string {
    return this.usernameSubject.getValue();
  }

  updateUsername(newUsername: string): Observable<UpdateUsernameResponse> {
    return this.http.patch<UpdateUsernameResponse>(`${this.apiUrl}/profile/username`, { username: newUsername }).pipe(
      tap(() => this.usernameSubject.next(newUsername)) //
    );
  }

  updatePassword(newPassword: string): Observable<UpdatePasswordResponse> {
    return this.http.patch<UpdatePasswordResponse>(`${this.apiUrl}/profile/password`, { password: newPassword });
  }

  updatePin(newPin: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/profile/pin`, { pin: newPin });
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile`).pipe(
      tap(res => this.usernameSubject.next(res.user.username))
    );
  }

  getUsername(): Observable<string> {
    return this.getUserProfile().pipe(
      map(res => res.user.username)
    );
  }

  getEmail(): Observable<string> {
    return this.getUserProfile().pipe(
      map(res => res.user.email)
    );
  }
}