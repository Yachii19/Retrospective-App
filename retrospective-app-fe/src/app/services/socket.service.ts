import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io(environment.apiBaseUrl.replace('/api', ''), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
  }

  // Join a session room
  joinSession(sessionId: string): void {
    this.socket.emit('join:session', sessionId);
  }

  // Leave a session room
  leaveSession(sessionId: string): void {
    this.socket.emit('leave:session', sessionId);
  }

  // Listen to feedback added
  onFeedbackAdded(): Observable<{ sectionKey: string; feedback: any }> {
    return new Observable(observer => {
      this.socket.on('feedback:added', (data) => observer.next(data));
    });
  }

  // Listen to vote updates
  onFeedbackVoted(): Observable<{ feedbackId: string; votes: number; votedBy: any[] }> {
    return new Observable(observer => {
      this.socket.on('feedback:voted', (data) => observer.next(data));
    });
  }

  // Listen to section added
  onSectionAdded(): Observable<{ section: { title: string; key: string } }> {
    return new Observable(observer => {
      this.socket.on('section:added', (data) => observer.next(data));
    });
  }

  // Listen to section deleted
  onSectionDeleted(): Observable<{ key: string }> {
    return new Observable(observer => {
      this.socket.on('section:deleted', (data) => observer.next(data));
    });
  }

  onMemberJoined(): Observable<{ membersCount: number; members: any[] }> {
    return new Observable(observer => {
      this.socket.on('member:joined', (data) => observer.next(data));
    });
  }

  onReplyAdded(): Observable<{ message: string; data: any }> {
    return new Observable(observer => {
      this.socket.on('reply:created', (data) => observer.next(data));
    });
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}