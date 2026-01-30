import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RetroSession, Member, RetroSection } from '../models/session.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://localhost:3000/sessions'

  constructor(private http: HttpClient) {}

  createSession(sessionName: string, team: string, createdBy: string | null, sections: RetroSection[]): Observable<RetroSession> {
    return this.http.post<RetroSession>(`${this.apiUrl}/`, { sessionName, team, createdBy, sections });
  }

  getAllSessions(): Observable<{ message: string, data: RetroSession[] }> {
    return this.http.get<{ message: string, data: RetroSession[] }>(`${this.apiUrl}/`);
  }

  getSessionById(sessionId: string): Observable<{ message: string, data: RetroSession }> {
    return this.http.get<{ message: string, data: RetroSession }>(`${this.apiUrl}/${sessionId}`);
  }

  getSessionsByTeam(team: string): Observable<{ message: string, data: RetroSession[] }> {
    return this.http.get<{ message: string, data: RetroSession[] }>(`${this.apiUrl}/team/${team}`);
  }

  joinSession(sessionId: string, email: string, username: string): Observable<{ message: string, data: RetroSession }> {
    return this.http.post<{ message: string, data: RetroSession }>(`${this.apiUrl}/${sessionId}/join`, { email, username });
  }

  leaveSession(sessionId: string, email: string): Observable<{ message: string, data: RetroSession }> {
    return this.http.post<{ message: string, data: RetroSession }>(`${this.apiUrl}/${sessionId}/leave`, { email });
  }

  getSessionMembers(sessionId: string): Observable<{ message: string, data: Member[] }> {
    return this.http.get<{ message: string, data: Member[] }>(`${this.apiUrl}/${sessionId}/members`);
  }

  getUserSessions(email: string): Observable<{ message: string, data: RetroSession[] }> {
    return this.http.get<{ message: string, data: RetroSession[] }>(`${this.apiUrl}/user/${email}/sessions`);
  }

  generateSessionFile(sessionId: string): Observable<{ message: string, fileName: string }> {
    return this.http.post<{ message: string, fileName: string }>(`${this.apiUrl}/${sessionId}/generate`, {});
  }
}
