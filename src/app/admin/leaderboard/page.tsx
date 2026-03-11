"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { getTournaments, getLeaderboardByTournament } from "@/lib/db";
import { Tournament, LeaderboardEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, RefreshCcw, Loader2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminLeaderboardPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingLeaderboard, setFetchingLeaderboard] = useState(false);

  useEffect(() => {
    async function loadTournaments() {
      if (!user) return;
      try {
        const data = await getTournaments(user.uid);
        setTournaments(data);
        if (data.length > 0) {
          setSelectedTournament(data[0].id);
        }
      } catch (error) {
        toast.error("Failed to load tournaments");
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) {
      loadTournaments();
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!selectedTournament) return;
      setFetchingLeaderboard(true);
      try {
        const data = await getLeaderboardByTournament(selectedTournament);
        setLeaderboard(data.sort((a, b) => (b.points || 0) - (a.points || 0)));
      } catch (error) {
        toast.error("Error fetching leaderboard");
      } finally {
        setFetchingLeaderboard(false);
      }
    }
    fetchLeaderboard();
  }, [selectedTournament]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Syncing Rankings...</p>
      </div>
    );
  }

  const currentTournament = tournaments.find(t => t.id === selectedTournament);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]">
            Leaderboard Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor and override standings for your tournaments.</p>
        </div>

        {tournaments.length > 0 && (
          <div className="flex items-center gap-3">
             <span className="text-xs font-black uppercase text-muted-foreground">Select Arena:</span>
             <Select value={selectedTournament} onValueChange={setSelectedTournament}>
               <SelectTrigger className="w-[240px] bg-card/50">
                 <SelectValue placeholder="Select tournament" />
               </SelectTrigger>
               <SelectContent>
                 {tournaments.map(t => (
                   <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
        )}
      </div>
      
      <div className="bg-primary/5 text-primary p-4 rounded-2xl border border-primary/20 flex gap-4 items-center mb-6 shadow-inner">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-tight opacity-80">
            Points are typically updated automatically via Smart Match calculations, but you can override values here if there are discrepancies.
          </p>
      </div>

      <div className="grid gap-6">
        {tournaments.length === 0 ? (
          <Card className="bg-card/40 backdrop-blur border-border/50 border-dashed py-20">
            <CardContent className="flex flex-col items-center text-center gap-4">
               <Gamepad2 className="h-12 w-12 text-muted-foreground/20" />
               <div>
                  <h3 className="text-lg font-bold">No Arenas Found</h3>
                  <p className="text-sm text-muted-foreground">Create a tournament first to manage its leaderboard.</p>
               </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden shadow-xl">
            <CardHeader className="bg-muted/30 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight">
                  {currentTournament?.name || "Tournament Standings"}
                </CardTitle>
                <CardDescription className="font-bold flex items-center gap-2 uppercase text-[10px] mt-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${currentTournament?.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
                  {currentTournament?.status || "Unknown"} • {leaderboard.length} Combatants
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden sm:flex font-bold text-[10px] uppercase tracking-widest h-9"
                onClick={() => setSelectedTournament(selectedTournament)}
                disabled={fetchingLeaderboard}
              >
                {fetchingLeaderboard ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCcw className="mr-2 h-3 w-3" />}
                Refresh Standings
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {fetchingLeaderboard ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recalculating Arena stats...</p>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/5 gap-3">
                   <Trophy className="h-10 w-10 opacity-10" />
                   <p className="text-xs font-bold uppercase tracking-widest">No rankings recorded yet for this arena.</p>
                </div>
              ) : (
                <div className="p-4">
                  <LeaderboardTable entries={leaderboard} />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
