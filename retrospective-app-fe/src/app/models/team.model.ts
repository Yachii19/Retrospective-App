export interface Team {
  _id: string;
  teamName: string;
  members: { _id: string; username: string; email: string }[];
  createdBy: { _id: string; username: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface TeamResponse {
  message: string;
  data: Team | Team[];
  notFound?: string[]; 
  added?: string[];
  alreadyMembers?: string[];
}