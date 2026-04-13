export interface Reply {
    _id: string;
    feedback: string;
    content: string;
    createdBy: User;
    createdAt: string,
    updatedAt: string
}

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface ReplyResponse {
    message: string;
    data: Reply | Reply[];
}