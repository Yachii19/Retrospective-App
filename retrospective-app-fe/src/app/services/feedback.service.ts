import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:3000/feedback';

  constructor(private http: HttpClient) {};

  getFeedbackByUser(userEmail: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${encodeURIComponent(userEmail)}`);
  }
}
