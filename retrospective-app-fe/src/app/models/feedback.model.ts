export interface RetroFeedback {
  _id: string;
  feedbackSession: Session;
  feedbackPoster: Poster;
  sections: FeedbackSection[];
  votes: number;
  votedBy: Poster[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface UserRetroFeedback {
  _id: string;
  sessionName: string;
  team: string;
  feedbacks: RetroFeedback[]; 
}

export interface Session {
  _id: string;
  sessionName: string;
  team: string;
}

export interface FeedbackSection {
  key: string;
  title: string;
  items: string[];
  actionItems: ActionItems;
}

export interface ActionItems {
  status: 'Open' | 'Closed';
  assignee: string | null;
  dueDate: string | null;
  updatedAt: string;
}

export interface Poster {
  _id: string;
  username: string;
  email: string;
}

export interface FeedbackResponse {
  message: string;
  data: RetroFeedback[] | RetroFeedback;
}

export interface UserFeedbackResponse {
  message: string;
  data: UserRetroFeedback[] | UserRetroFeedback;
}

export interface AddFeedbackRequest {
  sectionKey: string;
  feedbackText: string;
}

export interface ToggleVisibilityRequest {
  key: string;
}

export interface UpdateActionItemsRequest {
  key: string;
  assignee?: string | null;
  dueDate?: string | null;
}