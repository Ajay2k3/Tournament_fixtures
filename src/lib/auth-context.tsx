"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User, Admin, Role } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: User | null;
  adminUser: Admin | null;
  loading: boolean;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  adminUser: null,
  loading: true,
  role: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);

      if (firebaseUser) {
        try {
          // ── Super-admin bootstrap ──────────────────────────────────────
          // If this email is the designated super admin, ensure their
          // Firestore documents always carry the tier1 role.
          const SUPER_ADMIN_EMAIL = "luserajay@gmail.com";
          if (firebaseUser.email === SUPER_ADMIN_EMAIL) {
            const uid = firebaseUser.uid;
            const userRef = doc(db, "users", uid);
            const adminRef = doc(db, "admins", uid);
            await setDoc(userRef, {
              id: uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "Super Admin",
              role: "tier1",
            }, { merge: true });
            await setDoc(adminRef, {
              id: uid,
              email: firebaseUser.email,
              username: "superadmin",
              role: "tier1",
            }, { merge: true });
          }
          // ── End super-admin bootstrap ─────────────────────────────────

          // Check users collection first
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setDbUser(userData);
            setRole(userData.role);
          } else {
             // Check admins collection if not a regular user
             const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
             if (adminDoc.exists()) {
                const adminData = adminDoc.data() as Admin;
                setAdminUser(adminData);
                setRole(adminData.role);
             }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setDbUser(null);
        setAdminUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, dbUser, adminUser, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}
