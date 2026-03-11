"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, Trash2, UserPlus, Trophy, ShieldCheck, Loader2 } from "lucide-react";
import { getTournamentById } from "@/lib/db";
import { Tournament } from "@/types";

// Tournament registration page for dynamic entry management
export default function TournamentRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gameId, setGameId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [members, setMembers] = useState<Array<{ name: string; isCaptain: boolean }>>([
    { name: "", isCaptain: true }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTournament() {
      const data = await getTournamentById(id);
      setTournament(data);
    }
    loadTournament();
  }, [id]);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please login to register for a tournament");
      router.push("/login");
    }
    if (dbUser && !name) {
      setName(dbUser.name || "");
      setPhone(dbUser.phone || "");
      setAge(dbUser.age?.toString() || "");
    }
  }, [user, dbUser, loading, router, name]);

  const handleAddMember = () => {
    if (tournament?.teamSize && members.length >= tournament.teamSize.max) {
        toast.error(`Maximum team size is ${tournament.teamSize.max}`);
        return;
    }
    setMembers([...members, { name: "", isCaptain: false }]);
  };

  const handleRemoveMember = (index: number) => {
    if (members[index].isCaptain && members.length > 1) {
        // Transfer captaincy if possible
        const next = [...members];
        next.splice(index, 1);
        next[0].isCaptain = true;
        setMembers(next);
    } else {
        setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dbUser || !tournament) return;

    // Validate team size
    if (tournament.entryType === 'team') {
        if (members.length < (tournament.teamSize?.min || 1)) {
            toast.error(`Minimum ${tournament.teamSize?.min} members required`);
            return;
        }
        if (members.some(m => !m.name.trim())) {
            toast.error("All member names must be filled");
            return;
        }
    }

    setSubmitting(true);
    try {
      const participantId = `${id}_${user.uid}`;
      
      const pDoc = await getDoc(doc(db, "participants", participantId));
      if (pDoc.exists()) {
         toast.error("You are already registered for this tournament!");
         setSubmitting(false);
         return;
      }

      const participantData: any = {
        id: participantId,
        userId: user.uid,
        name: tournament.entryType === 'team' ? teamName : name,
        phone,
        tournamentId: id,
        gameId,
        registeredAt: Date.now()
      };

      if (tournament.entryType === 'team') {
        participantData.members = members;
        participantData.teamName = teamName;
      } else {
        participantData.age = parseInt(age);
      }

      await setDoc(doc(db, "participants", participantId), participantData);

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
          name, 
          phone: dbUser.phone || phone, 
          age: dbUser.age || parseInt(age),
          role: dbUser.role === 'user' ? 'participant' : dbUser.role 
      }, { merge: true });

      toast.success("Registration successful!");
      router.push(`/tournaments/${id}`);

    } catch (error: any) {
      toast.error("Failed to register: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="container max-w-2xl py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-primary/20 shadow-[0_0_40px_-10px_rgba(var(--primary),0.15)] bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-3xl text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">
            Tournament Registration
          </CardTitle>
          <CardDescription className="text-base">
             Fill out your details to secure your slot in the tournament. Admins will verify your entry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
             <div className="bg-primary/10 border border-primary/20 rounded-md p-4 flex gap-3 text-sm text-primary/90 mb-6">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>Your private details (Phone, Email) will <strong>only</strong> be visible to administrators. {tournament?.entryType === 'team' ? "The roster will be public." : "Public profiles show name/team."}</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/50">
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone Number *</Label>
                  <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50" placeholder="+1 234 567 890" />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest pl-1">For critical tournament updates</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gameId">In-Game ID (Optional)</Label>
                  <Input id="gameId" value={gameId} onChange={(e) => setGameId(e.target.value)} className="bg-background/50" placeholder="e.g. Player#1234" />
                </div>
             </div>

             {tournament?.entryType === 'team' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                        <Label htmlFor="teamName" className="text-lg font-bold text-primary flex items-center gap-2">
                            <Trophy className="h-5 w-5" /> Team Name *
                        </Label>
                        <Input id="teamName" required value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-background/50 h-12 text-lg font-bold" placeholder="Elite Warriors" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <UserPlus className="h-4 w-4" /> Team Roster ({members.length})
                            </Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddMember} className="h-8 border-primary/30 text-primary hover:bg-primary/10 font-bold">
                                + Add Member
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {members.map((member, index) => (
                                <div key={index} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
                                    <div className="relative flex-1">
                                        <Input 
                                            value={member.name} 
                                            onChange={(e) => {
                                                const newMembers = [...members];
                                                newMembers[index].name = e.target.value;
                                                setMembers(newMembers);
                                            }}
                                            placeholder={`Player ${index + 1} Name`}
                                            className={`bg-background/50 pl-10 ${member.isCaptain ? 'border-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]' : ''}`}
                                            required
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            {member.isCaptain ? <ShieldCheck className="h-4 w-4 text-primary" /> : <div className="h-2 w-2 rounded-full bg-muted-foreground/30 ml-1" />}
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        type="button" 
                                        variant={member.isCaptain ? "default" : "ghost"} 
                                        size="sm" 
                                        className={`h-10 text-[10px] font-black uppercase tracking-tighter ${member.isCaptain ? 'shadow-lg shadow-primary/20' : 'text-muted-foreground'}`}
                                        onClick={() => {
                                            const next = members.map((m, i) => ({ ...m, isCaptain: i === index }));
                                            setMembers(next);
                                        }}
                                    >
                                        {member.isCaptain ? "Captain" : "Set Cap"}
                                    </Button>

                                    {members.length > (tournament?.teamSize?.min || 1) && (
                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMember(index)} className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name *</Label>
                      <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input id="age" type="number" required value={age} onChange={(e) => setAge(e.target.value)} className="bg-background/50" min="13" />
                    </div>
                </div>
             )}

            <Button type="submit" className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-[1.01] mt-8" disabled={submitting}>
              {submitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Finalizing Entry...</>
              ) : (
                  tournament?.entryType === 'team' ? "Confirm Team Registration" : "Confirm Secure Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
