import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FeedbackResponse, RetroFeedback, AddFeedbackRequest, ToggleVisibilityRequest, UserRetroFeedback, UserFeedbackResponse, UpdateActionItemsRequest } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/api/feedback';

  constructor(private http: HttpClient) {};

  getFeedbackByUser(): Observable<UserFeedbackResponse> {
    return this.http.get<UserFeedbackResponse>(`${this.apiUrl}/user/session-feedbacks`);
  }

  addFeedback(sessionId: string, feedbackData: AddFeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<{ message: string, data: RetroFeedback }>(`${this.apiUrl}/${sessionId}`, feedbackData);
  }

  getSessionFeedbacks(sessionId: string): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.apiUrl}/${sessionId}`);
  }

  getFeedbackBySection(sessionId: string, sectionKey: string): Observable<{message: string, data: RetroFeedback[]}> {
    return this.http.get<{message: string, data: RetroFeedback[]}>(`${this.apiUrl}/${sessionId}/section/${sectionKey}`);
  }

  voteFeedback(feedbackId: string): Observable<FeedbackResponse> {
    return this.http.patch<{ message: string, data: RetroFeedback }>(`${this.apiUrl}/${feedbackId}/vote`, {});
  }
  unvoteFeedback(feedbackId: string): Observable<FeedbackResponse> {
    return this.http.patch<{ message: string, data: RetroFeedback }>(`${this.apiUrl}/${feedbackId}/unvote`, {});
  }

  toggleFeedbackVisibility(feedbackId: string, data: ToggleVisibilityRequest): Observable<FeedbackResponse> {
    return this.http.patch<{ message: string, data: RetroFeedback }>(
      `${this.apiUrl}/${feedbackId}/toggle-visibility`,
      data
    );
  }

  getFeedbackById(feedbackId: string): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.apiUrl}/${feedbackId}`);
  }

  updateActionItems(feedbackId: string, data: UpdateActionItemsRequest): Observable<FeedbackResponse> {
    return this.http.patch<FeedbackResponse>(`http://localhost:3000/api/feedback/${feedbackId}/action-items`, data);
  }
}
