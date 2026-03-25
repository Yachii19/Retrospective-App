import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TeamService } from '../../../services/team.service';
import { UserService } from '../../../services/user.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { Team } from '../../../models/team.model';

@Component({
  selector: 'app-create-team-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzModalModule, NzSelectModule, NzFormModule, NzInputModule],
  templateUrl: './create-team-modal.component.html',
  styleUrl: './create-team-modal.component.scss'
})
export class CreateTeamModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() teamCreated = new EventEmitter<Team>();

  internalVisible: boolean = false;
  form!: FormGroup;
  isSubmitting: boolean = false;
  memberOptions: { label: string; value: string }[] = [];
  isSearching: boolean = false;
  nzFilterOption = () => true;
  private searchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private userService: UserService,
    private notification: NzNotificationService
  ) {}

   ngOnChanges(changes: SimpleChanges): void {
      if (changes['isVisible']?.currentValue === true) {
        this.internalVisible = this.isVisible;
      }
    }

  ngOnInit(): void {
    this.form = this.fb.group({
      teamName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      emails: [[], [Validators.required]]
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isSearching = true;
        return this.userService.searchUsers(query);
      })
    ).subscribe({
      next: (users) => {
        this.memberOptions = users.map(u => ({ label: `${u.username} (${u.email})`, value: u.email }));
        this.isSearching = false;
      },
      error: () => { this.isSearching = false; }
    });
  }

  onSearch(query: string): void {
    if (query) this.searchSubject.next(query);
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.close();
    }
  }

  close(): void {
    this.internalVisible = false;
    this.isVisibleChange.emit(false);
    this.form.reset({ emails: [] });
    this.memberOptions = [];
    this.isSubmitting = false;
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }

    const { teamName, emails } = this.form.value;
    this.isSubmitting = true;

    this.teamService.createTeam(teamName, emails).subscribe({
      next: (res) => {
        this.notification.success('Success', `Team "${teamName}" created successfully`);
        if (res.notFound?.length) {
          this.notification.warning('Warning', `Emails not found: ${res.notFound.join(', ')}`);
        }
        this.close();
        this.teamCreated.emit(res.data as Team);
      },
      error: (err) => {
        this.notification.error('Error', err.error?.message || 'Failed to create team');
        this.isSubmitting = false;
      }
    });
  }
}