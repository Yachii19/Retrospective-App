import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RetroSession } from '../../models/session.model';
import { SessionService } from '../../services/session.service';
import { AuthService } from '../../services/auth.service';
import { NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { JoinSessionModalComponent } from '../shared/join-session-modal/join-session-modal.component';

@Component({
  selector: 'app-session-cards',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, JoinSessionModalComponent],
  templateUrl: './session-cards.component.html',
  styleUrl: './session-cards.component.scss'
})
export class SessionCardsComponent {
  allSessions: RetroSession[] = [];
  joiningSessionId: string | null = null;

  constructor(
      private sessionService: SessionService,
      private authService: AuthService,
      private router: Router,
      private modal: NzModalService
    ) {}
  
  ngOnInit(): void {
    this.loadAllSessions();
  }

  loadAllSessions(): void {
    this.sessionService.getAllSessions().subscribe({
      next: (response: any) => {
        let sessions = response.data;
        if(Array.isArray(sessions)) {
          this.allSessions = sessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        } else {
          this.allSessions = [];
        }
      },
      error: (err) => {
        console.error(`Error loading sessions: ${err}`);
        this.allSessions = [];
      }
    })
  }

  get mysTeamSessions() {
    return this.allSessions.filter(session => session.team === 'MYS Team');
  }

  get csmTeamSessions() {
    return this.allSessions.filter(session => session.team === 'CSM Team')
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
