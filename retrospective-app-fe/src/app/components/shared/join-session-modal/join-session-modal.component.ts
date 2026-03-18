import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { SessionService } from '../../../services/session.service';
import { RetroSession } from '../../../models/session.model';

@Component({
  selector: 'app-join-session-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './join-session-modal.component.html',
  styleUrl: './join-session-modal.component.scss'
})
export class JoinSessionModalComponent {
  isLoading = false;

  constructor(
    private modalRef: NzModalRef,
    private sessionService: SessionService,
    @Inject(NZ_MODAL_DATA) public data: { session: RetroSession }
  ) {}

  confirm(): void {
    this.isLoading = true;

    this.sessionService.joinSession(this.data.session._id).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalRef.close('joined');
      },
      error: () => {
        this.isLoading = false;
        this.modalRef.close('joined');
      }
    });
  }

  cancel(): void {
    this.modalRef.close('cancelled');
  }
}