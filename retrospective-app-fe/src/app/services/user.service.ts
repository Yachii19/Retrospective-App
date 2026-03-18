import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { UpdatePasswordResponse, UpdateUsernameResponse, UserProfileResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  updateUsername(newUsername: string): Observable<UpdateUsernameResponse> {
    return this.http.patch<UpdateUsernameResponse>(`${this.apiUrl}/profile/username`, { username: newUsername });
  }

  updatePassword(newPassword: string): Observable<UpdatePasswordResponse> {
    return this.http.patch<UpdatePasswordResponse>(`${this.apiUrl}/profile/password`, { password: newPassword });
  }

  getUserProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/profile`);
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
