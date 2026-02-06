export interface RetroSession {
  _id: string;
  sessionName: string;
  team: string;
  sections: RetroSection[];
  members: Member[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface RetroSection {
  key: string;
  title: string;
}

export interface Member {
  sessionMember: User;
  joinedAt: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface SessionResponse {
  message: string;
  data: RetroSession | RetroSession[]; // Can be single or array
  membersCount?: number; // Optional, only in getSessionById
}

export interface CreateSessionResponse {
  message: string;
  data: RetroSession;
}

export interface JoinSessionResponse {
  message: string;
  data: RetroSession;
}