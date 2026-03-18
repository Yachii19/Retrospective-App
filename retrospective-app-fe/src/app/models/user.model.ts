export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
}

export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  success: boolean;
  user: User;
}

export interface UpdateUsernameResponse {
  success: boolean;
  message: string;
  username?: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}