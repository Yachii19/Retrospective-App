import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, SidebarComponent, CreateTeamModalComponent, ManageTeamModalComponent],
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss'
})
export class TeamsComponent implements OnInit {
  teams = signal<Team[]>([]);
  isLoading = signal(false);
  isCreateModalVisible = signal(false);
  isManageModalVisible = signal(false);
  selectedTeam = signal<Team | null>(null);

  totalMembers = computed(() => {
    const allIds = new Set(this.teams().flatMap(t => t.members.map(m => m._id)));
    return allIds.size;
  });

  constructor(
    private teamService: TeamService,
    private authService: AuthService,
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
    this.isLoading.set(true);
    this.teamService.getAllTeams().subscribe({
      next: (res) => {
        this.teams.set(res.data as Team[]);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err.status === 404) this.teams.set([]);
        this.isLoading.set(false);
      }
    });
  }

  showCreateModal(): void {
    this.isCreateModalVisible.set(true);
  }

  showManageModal(team: Team): void {
    this.selectedTeam.set(team);
    this.isManageModalVisible.set(true);
  }

  onTeamCreated(newTeam: Team): void {
    this.teams.update(teams => [...teams, newTeam]);
  }

  onTeamUpdated(updatedTeam: Team): void {
    this.teams.update(teams =>
      teams.map(t => t._id === updatedTeam._id ? updatedTeam : t)
    );
    this.selectedTeam.set(updatedTeam);
  }

  onTeamDeleted(teamId: string): void {
    this.teams.update(teams => teams.filter(t => t._id !== teamId));
    this.selectedTeam.set(null);
    this.isManageModalVisible.set(false);
  }
}