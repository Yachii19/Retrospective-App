export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
    expiresAt: string;
  };
}

export interface RegisterResponse {
  message: string;
  data: User;
}