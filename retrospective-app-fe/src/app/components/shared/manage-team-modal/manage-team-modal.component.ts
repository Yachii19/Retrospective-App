import { Component, EventEmitter, Input, OnChanges, OnInit, Output, signal, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TeamService } from '../../../services/team.service';
import { UserService } from '../../../services/user.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { Team } from '../../../models/team.model';

@Component({
  selector: 'app-manage-team-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzModalModule, NzSelectModule, NzFormModule],
  templateUrl: './manage-team-modal.component.html',
  styleUrl: './manage-team-modal.component.scss'
})
export class ManageTeamModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() team: Team | null = null;
  @Output() isVisibleChange = new EventEmitter<boolean>();
  @Output() teamUpdated = new EventEmitter<Team>();
  @Output() teamDeleted = new EventEmitter<string>();

  internalVisible: boolean = false;
  internalTeam = signal<Team | null>(null);

  addMembersForm!: FormGroup;
  isAddingMembers: boolean = false;
  isRemovingMember: string | null = null;
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
      this.internalVisible = true;
    }

    if (changes['team']?.currentValue) {
      this.internalTeam.set(changes['team'].currentValue);
    }
  }

  ngOnInit(): void {
    this.addMembersForm = this.fb.group({
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

  close(): void {
    this.internalVisible = false;
    this.isVisibleChange.emit(false);
    this.addMembersForm.reset({ emails: [] });
    this.memberOptions = [];
  }

  submitAddMembers(): void {
    if (this.addMembersForm.invalid || !this.internalTeam()) return;

    const { emails } = this.addMembersForm.value;
    this.isAddingMembers = true;

    this.teamService.addMembers(this.internalTeam()!._id, emails).subscribe({
      next: (res) => {
        this.notification.success('Success', 'Members added successfully');
        if (res.notFound?.length) {
          this.notification.warning('Warning', `Emails not found: ${res.notFound.join(', ')}`);
        }
        this.isAddingMembers = false;
        this.addMembersForm.reset({ emails: [] });
        this.memberOptions = [];
        this.internalTeam.set(res.data as Team);
        this.teamUpdated.emit(res.data as Team);
      },
      error: (err) => {
        this.notification.error('Error', err.error?.message || 'Failed to add members');
        this.isAddingMembers = false;
      }
    });
  }

  removeMember(userId: string): void {
    if (!this.internalTeam()) return;
    this.isRemovingMember = userId;

    this.teamService.removeMember(this.internalTeam()!._id, userId).subscribe({
      next: (res) => {
        this.notification.success('Success', 'Member removed successfully');
        this.isRemovingMember = null;
        this.internalTeam.set(res.data as Team);
        this.teamUpdated.emit(res.data as Team);
      },
      error: (err) => {
        this.notification.error('Error', err.error?.message || 'Failed to remove member');
        this.isRemovingMember = null;
      }
    });
  }

  deleteTeam(): void {
    if (!this.internalTeam()) return;

    this.teamService.deleteTeam(this.internalTeam()!._id).subscribe({
      next: () => {
        this.notification.success('Success', 'Team deleted successfully');
        this.teamDeleted.emit(this.internalTeam()!._id);
        this.close();
      },
      error: (err) => {
        this.notification.error('Error', err.error?.message || 'Failed to delete team');
      }
    });
  }
}