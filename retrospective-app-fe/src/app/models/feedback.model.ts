export interface RetroFeedback {
  feedbackId: number;
  sessionId: string;
  username: string;
  sections: FeedbackSection[];
  votes: number;
  votedBy: string[];
  createdAt: string;
}

export interface FeedbackSection {
  key: string;
  title: string;
  items: string[];
  actionItem: ActionItem;
}

export interface ActionItem {
  status: 'Open' | 'Closed';
  assignee: string | null;
  dueDate: string | null;
  updatedAt?: string;
}