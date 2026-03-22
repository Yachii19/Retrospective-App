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
    const token = localStorage.getItem('token') ?? ''; // ← grab token from localStorage

    this.socket = io(environment.apiBaseUrl.replace('/api', ''), {
      transports: ['polling', 'websocket'], // ← polling first, upgrades to WS after
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      auth: { token }  // ← pass token in handshake instead of relying on cookies
      // ← removed withCredentials: true (this was causing incognito issues)
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }

  joinSession(sessionId: string): void {
    this.socket.emit('join:session', sessionId);
  }

  leaveSession(sessionId: string): void {
    this.socket.emit('leave:session', sessionId);
  }

  onFeedbackAdded(): Observable<{ sectionKey: string; feedback: any }> {
    return new Observable(observer => {
      this.socket.on('feedback:added', (data) => observer.next(data));
    });
  }

  onFeedbackVoted(): Observable<{ feedbackId: string; votes: number; votedBy: any[] }> {
    return new Observable(observer => {
      this.socket.on('feedback:voted', (data) => observer.next(data));
    });
  }

  onSectionAdded(): Observable<{ section: { title: string; key: string } }> {
    return new Observable(observer => {
      this.socket.on('section:added', (data) => observer.next(data));
    });
  }

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