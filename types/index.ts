export type Meeting = {
  id: string | number;
  meetingName: string;
  startTime: number;
  votes: number;
  hasVotes: boolean;
  winnerAvatarUrl?: string;
  votingEndTime: number;
  participants?: string[];
  votingStartTime?: number;
  [key: string]: any;
};

export type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt?: string;
  isAdmin?: boolean;
  [key: string]: any;
};

export type Vote = {
  email: string;
  [key: string]: any;
};
