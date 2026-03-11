export type Role = 'tier1' | 'tier2' | 'user' | 'participant';

export interface User {
  id: string; // from Firebase Auth UID
  name: string;
  username?: string; // unique handle
  email: string;
  role: Role;
  phone?: string;
  age?: number;
  verified: boolean;
  createdAt: number;
}

export interface Admin {
  id: string; // matches User ID
  username: string;
  role: 'tier1' | 'tier2';
  createdBy?: string; // ID of tier1 admin who created this
  createdAt: number;
}

export type TournamentStatus = 'live' | 'upcoming' | 'completed' | 'history';
export type TournamentFormat = 'knockout' | 'league' | 'groups_knockout' | 'fixed_matches';
export type EntryType = 'single' | 'team';

export interface Tournament {
  id: string;
  name: string;
  type: string; // e.g., 'Cricket', 'Esports'
  status: TournamentStatus;
  format: TournamentFormat;
  entryType: EntryType;
  teamSize?: {
    min: number;
    max: number;
  };
  startDate: number;
  endDate: number;
  registrationDeadline: number;
  maxParticipants: number;
  createdBy: string; // Admin ID
}

export interface Participant {
  id: string;
  userId: string;
  name: string; // Player name or Team name
  phone: string;
  age?: number;
  tournamentId: string;
  gameId?: string;
  teamName?: string;
  members?: Array<{
    name: string;
    isCaptain: boolean;
  }>;
  registeredAt: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  participant1Id: string | null; // null means 'To Be Decided' (for knockout)
  participant2Id: string | null;
  score1?: number;
  score2?: number;
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduledAt?: number;
  nextMatchId?: string; // For knockout progression
}

export interface LeaderboardEntry {
  id: string;
  tournamentId: string;
  participantId: string;
  playerName: string;
  points: number;
  matchesPlayed: number;
  rank?: number;
}
