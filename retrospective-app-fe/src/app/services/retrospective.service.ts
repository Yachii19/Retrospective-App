import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RetroSession } from '../models/session.model';
import { RetroFeedback } from '../models/feedback.model';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class RetrospectiveService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {};

  createSession(sessionName: string, team: string): Observable<RetroSession> {
    return this.http.post<RetroSession>(`${this.apiUrl}/`, { sessionName, team });
  }

  getSessions(): Observable<RetroSession> {
    return this.http.get<RetroSession>(`${this.apiUrl}/`);
  }

  getSession(sessionId: string): Observable<RetroSession> {
    return this.http.get<RetroSession>(`${this.apiUrl}/${sessionId}`);
  }

  addFeedback(sessionId: string, feedback: Omit<RetroFeedback, 'id' | 'timestamp'>): Observable<RetroFeedback> {
    return this.http.post<RetroFeedback>(`${this.apiUrl}/${sessionId}/feedback`, feedback);
  }

  getFeedback(sessionId: string): Observable<RetroFeedback> {
    return this.http.get<RetroFeedback>(`${this.apiUrl}/${sessionId}/feedback`);
  }

  getFeedbackByUser(username: string | null): Observable<RetroFeedback> {
    return this.http.get<RetroFeedback>(`${this.apiUrl}/feedback/user/${username}`);
  }

  generateOutput(sessionId: string): Observable<{
    message: string,
    fileName: string
  }> {
    return this.http.post<{ message: string, fileName: string }>(`${this.apiUrl}/${sessionId}/generate`, {});
  }
}
