import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { TeamResponse } from '../models/team.model';


@Injectable({ providedIn: 'root' })
export class TeamService {
  private apiUrl = `${environment.apiBaseUrl}/admin/teams`;

  constructor(private http: HttpClient) {}

  getAllTeams(): Observable<TeamResponse> {
    return this.http.get<TeamResponse>(`${this.apiUrl}/`);
  }

  getTeamById(teamId: string): Observable<TeamResponse> {
    return this.http.get<TeamResponse>(`${this.apiUrl}/${teamId}`);
  }

  createTeam(teamName: string, emails: string[]): Observable<TeamResponse> {
    return this.http.post<TeamResponse>(`${this.apiUrl}/create-team`, { teamName, emails });
  }

  addMembers(teamId: string, emails: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${teamId}/add-members`, { emails });
  }

  removeMember(teamId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${teamId}/members/${userId}`);
  }

  deleteTeam(teamId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${teamId}`);
  }
}