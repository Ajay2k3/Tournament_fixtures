import { Match, Participant, Tournament } from "@/types";
import { db } from "./firebase";
import { collection, doc, writeBatch } from "firebase/firestore";

/**
 * Generates a Knockout bracket for a tournament.
 * If number of participants is not a power of 2, some will get a 'bye' or TBD slots will be created.
 */
export const generateKnockoutFixtures = (tournament: Tournament, participants: Participant[]): Match[] => {
  const matches: Match[] = [];
  const count = participants.length;
  
  // Find next power of 2
  const powerOf2 = Math.pow(2, Math.ceil(Math.log2(count)));
  const totalRounds = Math.log2(powerOf2);
  
  let matchCounter = 1;
  let currentRoundMatches: Match[] = [];

  // Round 1
  for (let i = 0; i < powerOf2 / 2; i++) {
    const p1 = participants[i * 2] || null;
    const p2 = participants[i * 2 + 1] || null;

    const match: Match = {
      id: `${tournament.id}_R1_M${matchCounter}`,
      tournamentId: tournament.id,
      round: 1,
      matchNumber: matchCounter++,
      participant1Id: p1?.id || null,
      participant2Id: p2?.id || null,
      status: 'pending'
    };
    
    // If one is missing, it's a 'Bye' - we handle this later in progression
    currentRoundMatches.push(match);
    matches.push(match);
  }

  // Future Rounds
  let prevRoundMatches = currentRoundMatches;
  for (let r = 2; r <= totalRounds; r++) {
    const nextRoundMatches: Match[] = [];
    for (let i = 0; i < prevRoundMatches.length; i += 2) {
      const match: Match = {
        id: `${tournament.id}_R${r}_M${matchCounter}`,
        tournamentId: tournament.id,
        round: r,
        matchNumber: matchCounter++,
        participant1Id: null, // TBD from previous round winners
        participant2Id: null,
        status: 'pending'
      };
      
      // Map previous matches to this one
      prevRoundMatches[i].nextMatchId = match.id;
      if (prevRoundMatches[i+1]) {
          prevRoundMatches[i+1].nextMatchId = match.id;
      }

      nextRoundMatches.push(match);
      matches.push(match);
    }
    prevRoundMatches = nextRoundMatches;
  }

  return matches;
};

/**
 * Generates a Round Robin (League) schedule.
 */
export const generateLeagueFixtures = (tournament: Tournament, participants: Participant[]): Match[] => {
  const matches: Match[] = [];
  const n = participants.length;
  const tempParticipants = [...participants];
  
  if (n % 2 !== 0) {
    tempParticipants.push({ id: 'BYE' } as any);
  }

  const numParticipants = tempParticipants.length;
  const rounds = numParticipants - 1;
  const matchesPerRound = numParticipants / 2;

  let matchCounter = 1;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const p1 = tempParticipants[i];
      const p2 = tempParticipants[numParticipants - 1 - i];

      if (p1.id !== 'BYE' && p2.id !== 'BYE') {
        matches.push({
          id: `${tournament.id}_L_M${matchCounter}`,
          tournamentId: tournament.id,
          round: r + 1,
          matchNumber: matchCounter++,
          participant1Id: p1.id,
          participant2Id: p2.id,
          status: 'pending'
        });
      }
    }
    // Rotate participants for next round (keep first one fixed)
    tempParticipants.splice(1, 0, tempParticipants.pop()!);
  }

  return matches;
};

export const saveFixturesToDb = async (matches: Match[]) => {
    const batch = writeBatch(db);
    matches.forEach(m => {
        const docRef = doc(collection(db, 'matches'), m.id);
        batch.set(docRef, m);
    });
    await batch.commit();
};
