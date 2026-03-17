import { Component, input, Input } from '@angular/core';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import { ReplyService } from '../../../services/reply.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reply } from '../../../models/reply.model';
import { AuthService } from '../../../services/auth.service';
import { AvatarColorPipe } from '../../../pipes/avatar-color.pipe';

@Component({
  selector: 'app-reply-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe, AvatarColorPipe],
  templateUrl: './reply-list.component.html',
  styleUrl: './reply-list.component.scss'
})
export class ReplyListComponent {
  replies: Reply[] = [];
  replyInput: string = '';
  currentUserInitial: string = '';
  currentUsername: string = '';

  showError: boolean = false;
  errorMessage: string = '';
  showReplies: boolean = false;
  isFocused: boolean = false;


  @Input() feedbackId!: string

  constructor(
    private authService: AuthService,
    private replyService: ReplyService
  ) {}

  ngOnInit(): void {
    this.loadReplies();
    const user = this.authService.getUser();
    this.currentUserInitial = user.username.charAt(0).toUpperCase();
    this.currentUsername = user.username
  }


  loadReplies(): void {
    if (!this.feedbackId) return

    this.replyService.getRepliesByFeedbacks(this.feedbackId).subscribe({
      next: (response) => {
        if(Array.isArray(response.data)) {
          this.replies = response.data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
        } else {
          this.replies = [];
        }
      },
      error: (err) => {
        console.error(`${err?.error?.message}`);
        this.replies = [];
      }
    })
  }

  onInputChange(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  toggleReplies(): void {
    this.showReplies = !this.showReplies;
  }

  sendReply(event?: Event): void {
    if (event) event.preventDefault();

    if(!this.replyInput.trim()) {
      this.showError = true;
      this.errorMessage = 'Please provide a message reply!';
      return
    }

    this.replyService.createReply(this.feedbackId, this.replyInput).subscribe({
      next: (response) => {
        this.loadReplies();
        this.replyInput = '';
        this.showError = false;
        this.errorMessage = '';
        this.showReplies = true;
      },
      error: (err) => {
        this.showError = true;
        this.errorMessage = 'Please provide a message reply!'
      }
    });
  }
}
