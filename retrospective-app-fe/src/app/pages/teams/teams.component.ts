import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TeamService } from '../../services/team.service';
import { Team } from '../../models/team.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { CreateTeamModalComponent } from '../../components/shared/create-team-modal/create-team-modal.component';
import { ManageTeamModalComponent } from '../../components/shared/manage-team-modal/manage-team-modal.component';


@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    CreateTeamModalComponent,
    ManageTeamModalComponent
  ],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  isLoading: boolean = false;

  isCreateModalVisible: boolean = false;
  isManageModalVisible: boolean = false;
  selectedTeam: Team | null = null;

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
    private notification: NzNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    const user = this.authService.getUser();
    if (user?.role !== 'admin') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadTeams();
  }

  loadTeams(): void {
    this.isLoading = true;
    this.teamService.getAllTeams().subscribe({
      next: (res) => {
        this.teams = res.data as Team[];
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.teams = [];
        }
        this.isLoading = false;
      }
    });
  }

  // ── Modal triggers ────────────────────────────────────────────────────────

  showCreateModal(): void {
    this.isCreateModalVisible = true;
  }

  showManageModal(team: Team): void {
    this.selectedTeam = team;
    this.isManageModalVisible = true;
  }

  // ── Event handlers from modal components ──────────────────────────────────

  onTeamCreated(): void {
    this.loadTeams();
  }

  onTeamUpdated(): void {
    this.loadTeams();
    // ✅ Refresh selected team so manage modal reflects latest data
    this.teamService.getAllTeams().subscribe(res => {
      this.selectedTeam = (res.data as Team[]).find(
        t => t._id === this.selectedTeam?._id
      ) || null;
    });
  }

  onTeamDeleted(): void {
    this.selectedTeam = null;
    this.isManageModalVisible = false;
    this.loadTeams();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getMemberPreview(team: Team): string {
    return team.members.slice(0, 3).map(m => m.username).join(', ')
      + (team.members.length > 3 ? ` +${team.members.length - 3} more` : '');
  }

  getTotalMembers(): number {
    const allIds = new Set(this.teams.flatMap(t => t.members.map(m => m._id)));
    return allIds.size;
  }
}