export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  teams?: string[];
  role: string; // ✅ add this
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
    teams?: string[];
    role: string;
  };
}

export interface UserProfileResponse {
  message: string;
  user: User; // ✅ now includes role
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