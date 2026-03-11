"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

export default function InitAdminPage() {
  const [uid, setUid] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInit = async () => {
    if (!uid || !username) {
      toast.error("Please provide both UID and Username");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await setDoc(userRef, {
          ...userSnap.data(),
          role: "tier1"
        }, { merge: true });
      } else {
        await setDoc(userRef, {
          id: uid,
          name: username,
          role: "tier1",
          createdAt: Date.now()
        });
      }

      await setDoc(doc(db, "admins", uid), {
        id: uid,
        username: username,
        role: "tier1",
        createdAt: Date.now()
      });

      toast.success("Tier 1 Admin initialized successfully!");
    } catch (error: any) {
      console.error("Initialization error:", error);
      toast.error("Failed to initialize: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-20">
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <ShieldAlert className="h-5 w-5" />
            <CardTitle>System Initialization</CardTitle>
          </div>
          <CardDescription>
            This is a developer-only tool to bootstrap the first Tier 1 Admin.
            Use with extreme caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">User UID (from Firebase Auth)</label>
            <Input 
              value={uid} 
              onChange={(e) => setUid(e.target.value)} 
              placeholder="e.g. abc123def456"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Username</label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="e.g. superadmin"
            />
          </div>
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleInit}
            disabled={loading}
          >
            {loading ? "Initializing..." : "Promote to Tier 1 Admin"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
