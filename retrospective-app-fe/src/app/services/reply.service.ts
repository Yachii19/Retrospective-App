import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ReplyService {
  private apiUrl = `${environment.apiBaseUrl}/replies`;

  constructor(
    private http: HttpClient
  ) {}

  createReply(feedbackId: string, content: string) {
    return this.http.post(`${this.apiUrl}/add-reply/${feedbackId}`, { content });
  }
}
