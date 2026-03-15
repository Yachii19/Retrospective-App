export interface Reply {
    _id: string;
    feedbackId: string;
    content: string;
    createdBy: User;
    createdAt: string,
    updatedAt: string
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface ReplyResponse {
    message: string;
    data: Reply[];
}