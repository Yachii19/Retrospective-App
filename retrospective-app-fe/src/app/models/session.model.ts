export interface RetroSession {
  sessionId: string;
  sessionName: string;
  team: string;
  sections: RetroSection[];
  members?: Member[];
  createdBy?: string;
  createdAt: string;
}

export interface RetroSection {
  key: string;
  title: string;
}

export interface Member {
  email: string;
  username: string;
  joinedAt: string;
}