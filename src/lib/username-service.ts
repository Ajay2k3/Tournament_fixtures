import { db } from "./firebase";
import { doc, getDoc, writeBatch } from "firebase/firestore";

/**
 * Service to handle unique username operations in Firestore
 * This ensures that usernames are globally unique across all accounts.
 */
export const UsernameService = {
  /**
   * Check if a username is available
   * @param username The username to check
   * @returns Promise<boolean> True if available, false if taken
   */
  async isAvailable(username: string): Promise<boolean> {
    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername || cleanUsername.length < 3) return false;
    
    // Check in the 'usernames' collection which acts as a unique registry
    const usernameRef = doc(db, "usernames", cleanUsername);
    const snap = await getDoc(usernameRef);
    return !snap.exists();
  },

  /**
   * Reserve a username for a user.
   * Uses a batch to update both the user profile and the username lookup.
   */
  async updateUsername(uid: string, newUsername: string, oldUsername?: string) {
    const batch = writeBatch(db);
    const newUsernameClean = newUsername.toLowerCase().trim();
    const oldUsernameClean = oldUsername?.toLowerCase().trim();
    
    // 1. Check availability again (safety first)
    if (newUsernameClean !== oldUsernameClean) {
        const isAvail = await this.isAvailable(newUsernameClean);
        if (!isAvail) {
          throw new Error("This username is already taken by another user.");
        }

        // 2. Reference the new username lookup
        const newRef = doc(db, "usernames", newUsernameClean);
        batch.set(newRef, { uid });

        // 3. Upsert the user document (create if doesn't exist)
        const userRef = doc(db, "users", uid);
        batch.set(userRef, { username: newUsername.trim() }, { merge: true });

        // 4. Delete old username lookup if it changed
        if (oldUsernameClean && oldUsernameClean !== newUsernameClean) {
          const oldRef = doc(db, "usernames", oldUsernameClean);
          batch.delete(oldRef);
        }
    }

    await batch.commit();
  }
};
