import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RetroSection, SessionResponse, CreateSessionResponse, JoinSessionResponse } from '../models/session.model';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = `${environment.apiBaseUrl}/sessions`

  constructor(private http: HttpClient) {}

  createSession(sessionName: string, team: string, sections?: RetroSection[]): Observable<CreateSessionResponse> {
    return this.http.post<CreateSessionResponse>(`${this.apiUrl}/`, { sessionName, team, sections });
  }

  getAllSessions(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/`);
  }

  getSessionById(sessionId: string): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/${sessionId}`);
  }

  getSessionsByTeam(team: string): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/team/${team}`);
  }

  joinSession(sessionId: string): Observable<JoinSessionResponse> {
    return this.http.patch<JoinSessionResponse>(`${this.apiUrl}/${sessionId}/join`, {});
  }

  leaveSession(sessionId: string): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.apiUrl}/${sessionId}/leave`, {});
  }

  getSessionMembers(sessionId: string): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/${sessionId}/members`);
  }

  getUserSessions(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/user/sessions`);
  }

  generateSessionFile(sessionId: string): Observable<SessionResponse> { 
    return this.http.post<SessionResponse>(`${this.apiUrl}/${sessionId}/generate`, {});
  }
}
