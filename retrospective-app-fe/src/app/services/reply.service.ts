import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReplyResponse } from '../models/reply.model';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ReplyService {
  private apiUrl = `${environment.apiBaseUrl}/replies`;

  constructor(
    private http: HttpClient
  ) {}

  createReply(feedbackId: string, content: string): Observable<ReplyResponse> {
    return this.http.post<ReplyResponse>(`${this.apiUrl}/add-reply/${feedbackId}`, { content });
  }

  getRepliesByFeedbacks(feedbackId: string): Observable<ReplyResponse> {
    return this.http.get<ReplyResponse>(`${this.apiUrl}/${feedbackId}`)
  }
}
