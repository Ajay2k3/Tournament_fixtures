"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Trash2, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { db, auth } from "../../../lib/firebase";
import { collection, query, getDocs, doc, setDoc, deleteDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";
import { Admin } from "@/types";

export default function AdminManagementPage() {
  const { role, loading, user: currentUser } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New Admin Form State
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAdmins = async () => {
    try {
      const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
      const querySnap = await getDocs(q);
      const adminList = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Admin));
      setAdmins(adminList);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load administrators");
    } finally {
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    if (!loading && role !== "tier1") {
      router.push("/admin/dashboard");
    } else if (role === "tier1") {
      fetchAdmins();
    }
  }, [role, loading, router]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    try {
      // 1. Create a dummy email for Firebase Auth
      const dummyEmail = `${newUsername.toLowerCase().replace(/\s+/g, '')}@arena.internal`;
      
      // 2. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, newPassword);
      const newUid = userCredential.user.uid;

      // 3. Create entry in admins collection
      const adminData = {
        id: newUid,
        username: newUsername,
        role: "tier2",
        createdBy: currentUser?.uid || "system",
        createdAt: Date.now()
      };
      await setDoc(doc(db, "admins", newUid), adminData);

      // 4. Create entry in users collection (for global role check)
      await setDoc(doc(db, "users", newUid), {
        id: newUid,
        name: newUsername,
        role: "tier2",
        createdAt: Date.now()
      });

      // 5. Log action
      await setDoc(doc(collection(db, "auditLogs")), {
        action: "CREATE_ADMIN",
        details: `Created Tier 2 Admin: ${newUsername}`,
        performedBy: currentUser?.uid,
        targetId: newUid,
        timestamp: serverTimestamp()
      });

      toast.success(`Tier 2 Admin '${newUsername}' created successfully!`);
      setIsDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      fetchAdmins();
    } catch (error: any) {
      console.error("Creation error:", error);
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to remove admin access for ${username}?`)) return;

    try {
      await deleteDoc(doc(db, "admins", id));
      // Note: We don't delete from 'users' to keep their profile, just remove admin access
      await setDoc(doc(db, "users", id), { role: "user" }, { merge: true });
      
      await setDoc(doc(collection(db, "auditLogs")), {
        action: "DELETE_ADMIN",
        details: `Removed admin access for: ${username}`,
        performedBy: currentUser?.uid,
        targetId: id,
        timestamp: serverTimestamp()
      });

      toast.success("Admin access removed");
      fetchAdmins();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  if (loading || role !== "tier1") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]">
              Admin Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Tier 1 Super Admin Panel.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button variant="default" className="shadow-[0_0_15px_rgba(var(--primary),0.4)] hover:shadow-primary/60 transition-all">
               <PlusCircle className="mr-2 h-4 w-4" /> Add Tier 2 Moderator
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-md border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">New Moderator Access</DialogTitle>
              <DialogDescription>
                Create a secondary admin account using just a username and password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. Mod_Alex"
                  className="bg-muted/50 focus-visible:ring-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="bg-muted/50 focus-visible:ring-primary/50"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : "Confirm & Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Existing Administrators</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!dataLoaded ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-48">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p>Syncing security profiles...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                      No secondary admins found.
                    </TableCell>
                  </TableRow>
                ) : admins.map((admin) => (
                  <TableRow key={admin.id} className="transition-colors hover:bg-muted/10">
                    <TableCell className="font-medium text-foreground py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${admin.role === 'tier1' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        {admin.username}
                      </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={admin.role === 'tier1' ? 'default' : 'secondary'} className={admin.role === 'tier1' ? 'bg-primary/20 text-primary border-primary/30' : ''}>
                            {admin.role === 'tier1' ? 'Super Admin' : 'Moderator'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {admin.role !== 'tier1' && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
