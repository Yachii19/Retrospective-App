import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RetroFeedback } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/feedback';

  constructor(private http: HttpClient) {};

  getFeedbackByUser(userEmail: string | null): Observable<{message: string, data: RetroFeedback[] }> {
    if (!userEmail) {
      throw new Error('User email is required');
    }
    return this.http.get<{ message: string, data: RetroFeedback[] }>(`${this.apiUrl}/user/${encodeURIComponent(userEmail)}`);
  }

  addFeedback(sessionId: number, feedbackData: any): Observable<{ message: string, data: RetroFeedback }> {
    return this.http.post<{ message: string, data: RetroFeedback }>(`${this.apiUrl}/${sessionId}`, feedbackData);
  }

  getSessionFeedbacks(sessionId: number): Observable<RetroFeedback[]> {
    return this.http.get<RetroFeedback[]>(`${this.apiUrl}/${sessionId}`);
  }

  getFeedbackBySection(sessiodId: number, sectionkey: string): Observable<{ message: string, data: RetroFeedback[] }> {
    return this.http.get<{ message: string, data: RetroFeedback[] }>(`${this.apiUrl}/${sessiodId}/section/${sectionkey}`);
  }

  voteFeedback(feedbackId: number, username: string): Observable<{ message: string, data: RetroFeedback }> {
    return this.http.post<{ message: string, data: RetroFeedback }>(`${this.apiUrl}/${feedbackId}/vote`, { username });
  }

  unvoteFeedback(feedbackId: number, username: string): Observable<{ message: string, data: RetroFeedback }> {
    return this.http.delete<{ message: string, data: RetroFeedback }>(`${this.apiUrl}/${feedbackId}/vote/${username}`);
  }

  toggleActionItemStatus(feedbackId: number, sectionKey: string, status: 'Open' | 'Closed', userEmail: string): Observable<{ message: string, data: RetroFeedback }> {
    return this.http.post<{ message: string, data: RetroFeedback }>(
      `${this.apiUrl}/${feedbackId}/section/${sectionKey}/action-item/toggle`,
      { status, userEmail }
    );
  }

  updateActionItem(feedbackId: number, sectionKey: string, updateData: { assignee?: string, dueDate?: string }): Observable<{ message: string, data: RetroFeedback }> {
    return this.http.put<{ message: string, data: RetroFeedback }>(
      `${this.apiUrl}/${feedbackId}/section/${sectionKey}/action-item`,
      updateData
    );
  }

  getSessionActionItems(sessionId: number, userEmail: string): Observable<{ message: string, data: any[] }> {
    return this.http.get<{ message: string, data: any[] }>(
      `${this.apiUrl}/session/${sessionId}/action-items?userEmail=${encodeURIComponent(userEmail)}`
    );
  }

  getFeedbackById(feedbackId: number): Observable<RetroFeedback> {
    return this.http.get<RetroFeedback>(`${this.apiUrl}/${feedbackId}`);
  }
}
