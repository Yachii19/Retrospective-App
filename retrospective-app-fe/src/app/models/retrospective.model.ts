export interface RetroFeedback {
  sessionId: string;
  username: string;
  createdAt: string;
  wentWell: string[];
  needsImprovement: string[];
  actionItems: string[];
}

export interface RetroSession {
  sessionId: string;
  sessionName: string;
  team: 'MYS Team' | 'CSM Team';
  createdAt: string;
  feedbacks?: RetroFeedback[];
}