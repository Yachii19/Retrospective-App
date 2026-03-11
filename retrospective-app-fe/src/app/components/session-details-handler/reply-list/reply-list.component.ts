import { Component, input, Input } from '@angular/core';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { ReplyService } from '../../../services/reply.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reply-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe],
  templateUrl: './reply-list.component.html',
  styleUrl: './reply-list.component.scss'
})
export class ReplyListComponent {
  replyInput: string = '';

  showError: boolean = false;
  errorMessage: string = '';

  @Input() feedbackId!: string

  constructor( 
    private replyService: ReplyService
  ) {}

  ngOnInit(): void {
    this.loadReplies();
  }

  loadReplies(): void {

  }

  sendReply(): void {
    console.log(this.replyInput);
    if(!this.replyInput.trim()) {
      this.showError = true;
      this.errorMessage = 'Please provide a message reply!'
    }

    this.replyService.createReply(this.feedbackId, this.replyInput).subscribe({
      next: (response) => {
        this.loadReplies();
        this.replyInput = '';
        this.showError = false;
        this.errorMessage = '';
      },
      error: (err) => {
        this.showError = true;
        this.errorMessage = err?.error?.message
      }
    });
  }
}
