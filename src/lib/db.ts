import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { User, Admin, Tournament, Participant, Match, LeaderboardEntry, TournamentStatus } from '../types';
import { generateKnockoutFixtures, generateLeagueFixtures, saveFixturesToDb } from './fixtures';

// Generic helper functions
export const getUserById = async (id: string): Promise<User | null> => {
  const docRef = doc(db, 'users', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
};

export const getAdminById = async (id: string): Promise<Admin | null> => {
  const docRef = doc(db, 'admins', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Admin : null;
};

export const computeTournamentStatus = (t: Omit<Tournament, 'id'> | Tournament): TournamentStatus => {
  const now = Date.now();
  if (now > t.endDate) return 'history';
  if (now > t.startDate) return 'live';
  return 'upcoming';
};

export const getTournaments = async (adminId?: string): Promise<Tournament[]> => {
  const colRef = collection(db, 'tournaments');
  const q = adminId ? query(colRef, where('createdBy', '==', adminId)) : colRef;
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => {
    const data = doc.data() as Tournament;
    return { 
      ...data, 
      id: doc.id,
      status: computeTournamentStatus(data) 
    };
  });
};

export const createTournament = async (tournament: Omit<Tournament, 'id'>): Promise<string> => {
  const colRef = collection(db, 'tournaments');
  const docRef = doc(colRef);
  // Ensure we don't save undefined for optional teamSize
  const data = { ...tournament, id: docRef.id };
  if (data.entryType === 'single') {
    delete data.teamSize;
  }
  await setDoc(docRef, data);
  return docRef.id;
};

export const generateFixtures = async (tournamentId: string) => {
  const tournament = await getTournamentById(tournamentId);
  if (!tournament) throw new Error("Tournament not found");

  const participants = await getParticipantsByTournament(tournamentId);
  if (participants.length < 2) throw new Error("At least 2 participants required");

  let matches: Match[] = [];
  
  if (tournament.format === 'knockout') {
    matches = generateKnockoutFixtures(tournament, participants);
  } else if (tournament.format === 'league') {
    matches = generateLeagueFixtures(tournament, participants);
  } else {
    // For now fallback to knockout or handle other formats
    matches = generateKnockoutFixtures(tournament, participants);
  }

  await saveFixturesToDb(matches);
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  const docRef = doc(db, 'tournaments', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data() as Tournament;
  return { ...data, id: docSnap.id, status: computeTournamentStatus(data) };
};

export const getParticipantsByTournament = async (tournamentId: string): Promise<Participant[]> => {
  const q = query(collection(db, 'participants'), where('tournamentId', '==', tournamentId));
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
};

export const getMatchesByTournament = async (tournamentId: string): Promise<Match[]> => {
  const q = query(collection(db, 'matches'), where('tournamentId', '==', tournamentId));
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
};

export const getLeaderboardByTournament = async (tournamentId: string): Promise<LeaderboardEntry[]> => {
  const q = query(collection(db, 'leaderboard'), where('tournamentId', '==', tournamentId));
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardEntry));
};

export const getRegistrationsByUser = async (userId: string): Promise<Participant[]> => {
  const q = query(collection(db, 'participants'), where('userId', '==', userId));
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
};

export const getTournamentsByIds = async (ids: string[]): Promise<Tournament[]> => {
  if (ids.length === 0) return [];
  const q = query(collection(db, 'tournaments'), where('id', 'in', ids));
  const querySnap = await getDocs(q);
  return querySnap.docs.map(doc => {
    const data = doc.data() as Tournament;
    return { ...data, id: doc.id, status: computeTournamentStatus(data) };
  });
};

export const getRecentRegistrations = async (adminId: string, limitCount: number = 5): Promise<Participant[]> => {
  const tournaments = await getTournaments(adminId);
  const tIds = tournaments.map(t => t.id);
  if (tIds.length === 0) return [];
  
  const q = query(
    collection(db, 'participants'), 
    where('tournamentId', 'in', tIds.slice(0, 10)), // Limit to first 10 tournaments due to Firestore 'in' limit
    // Note: We'd need a different approach for 10+ tournaments, but for this demo/starter it's fine
  );
  
  const querySnap = await getDocs(q);
  const participants = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
  return participants.sort((a, b) => b.registeredAt - a.registeredAt).slice(0, limitCount);
};

export const getDashboardSummary = async (adminId: string) => {
  const tournaments = await getTournaments(adminId);
  const tIds = tournaments.map(t => t.id);
  
  if (tIds.length === 0) {
    return { tournaments: [], participantsCount: 0, matchesCount: 0, liveCount: 0, upcomingCount: 0 };
  }

  // Fetch all participants for these tournaments
  let totalParticipants = 0;
  let totalMatches = 0;

  // We do this in parallel for efficiency
  await Promise.all(tIds.slice(0, 10).map(async (id) => {
    const [p, m] = await Promise.all([
      getParticipantsByTournament(id),
      getMatchesByTournament(id)
    ]);
    totalParticipants += p.length;
    totalMatches += m.length;
  }));

  return {
    tournaments,
    participantsCount: totalParticipants,
    matchesCount: totalMatches,
    liveCount: tournaments.filter(t => t.status === 'live').length,
    upcomingCount: tournaments.filter(t => t.status === 'upcoming').length
  };
};

export const updateMatchResult = async (
  matchId: string, 
  results: { 
    score1: number; 
    score2: number; 
    winnerId: string | null;
    status: 'completed' | 'in_progress'
  }
) => {
  const matchRef = doc(db, 'matches', matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error("Match not found");
  
  const match = matchSnap.data() as Match;
  
  // Update the current match
  await updateDoc(matchRef, {
    score1: results.score1,
    score2: results.score2,
    winnerId: results.winnerId,
    status: results.status,
    updatedAt: Date.now()
  });

  // If match is completed and has a winner and a nextMatchId, advance the winner
  if (results.status === 'completed' && results.winnerId && match.nextMatchId) {
    const nextMatchRef = doc(db, 'matches', match.nextMatchId);
    const nextMatchSnap = await getDoc(nextMatchRef);
    
    if (nextMatchSnap.exists()) {
      const nextMatch = nextMatchSnap.data() as Match;
      
      // Determine which participant slot to fill in the next match
      // We use matchNumber/round logic or simply fill the first null slot
      // In our generateKnockoutFixtures, we link two matches to one nextMatchId
      // So we check which slot is available or based on match index
      
      if (!nextMatch.participant1Id) {
        await updateDoc(nextMatchRef, { participant1Id: results.winnerId });
      } else if (!nextMatch.participant2Id && nextMatch.participant1Id !== results.winnerId) {
        await updateDoc(nextMatchRef, { participant2Id: results.winnerId });
      }
    }
  }
};

export const getGlobalStats = async () => {
  const [tSnap, pSnap] = await Promise.all([
    getDocs(collection(db, 'tournaments')),
    getDocs(collection(db, 'participants'))
  ]);

  const tournaments = tSnap.docs.map(doc => {
    const data = doc.data() as Tournament;
    return { ...data, status: computeTournamentStatus(data) };
  });
  
  return {
    activeCount: tournaments.filter(t => t.status === 'live').length,
    upcomingCount: tournaments.filter(t => t.status === 'upcoming').length,
    pastCount: tournaments.filter(t => t.status === 'history').length,
    totalPlayers: pSnap.size
  };
};
