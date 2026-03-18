import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { JoinSessionModalComponent } from '../shared/join-session-modal/join-session-modal.component';

@Component({
  selector: 'app-recent-session-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, JoinSessionModalComponent],
  templateUrl: './recent-session-cards.component.html',
  styleUrl: './recent-session-cards.component.scss'
})
export class RecentSessionCardsComponent {
  recentSessions: RetroSession[] = [];
  joiningSessionId: string | null = '';

  constructor(
      private authService: AuthService,
      private sessionService: SessionService,
      private router: Router,
      private modal: NzModalService,
    ) {}
  
  ngOnInit(): void {
    this.loadRecentSessions();
  }

  loadRecentSessions(): void {
    this.sessionService.getAllSessions().subscribe({
      next: (response: any) => {
        let sessions = response.data;
        if(Array.isArray(sessions)) {
          this.recentSessions = sessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 9);
          
        } else {
          this.recentSessions = [];
        }
      },
      error: (err) => {
        console.error(`Error loading sessions: ${err}`);
        this.recentSessions = [];
      }
    })

     
  }

  viewSession(session: RetroSession): void {
    const user = this.authService.getUser();
    if (!user) {
        this.router.navigate(['/']);
        return;
    }

    const isAlreadyMember = session.members.some(
      (m: any) => (m.sessionMember?._id || m.sessionMember) === user._id
    );

    if (isAlreadyMember) {
      this.router.navigate(['/session', session._id]);
      return;
    }
    const modalRef: NzModalRef = this.modal.create({
      nzTitle: '',
      nzFooter: null,
      nzClosable: false,
      nzMaskClosable: true,
      nzCentered: true,
      nzWidth: 400,
      nzContent: JoinSessionModalComponent,
      nzData: { session }
    });

    modalRef.afterClose.subscribe((result) => {
      if (result === 'joined') {
        this.router.navigate(['/session', session._id]);
      }
    });
  }
}
