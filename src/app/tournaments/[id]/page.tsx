"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { 
  getTournamentById, 
  getLeaderboardByTournament, 
  getMatchesByTournament,
  getParticipantsByTournament 
} from "@/lib/db";
import { Tournament, LeaderboardEntry, Match, Participant } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, Users, Trophy, Swords, Crown, Clock, CheckCircle2, Ghost, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_EMOJI: Record<string, string> = {
  Esports: "🎮", Cricket: "🏏", Football: "⚽", Chess: "♟️", Sports: "🏅",
};

export default function TournamentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tData, lData, mData, pData] = await Promise.all([
          getTournamentById(id),
          getLeaderboardByTournament(id),
          getMatchesByTournament(id),
          getParticipantsByTournament(id),
        ]);
        setTournament(tData);
        setLeaderboard(lData);
        setMatches(mData);
        setParticipants(pData);
      } catch (error) {
         console.error("Error loading tournament details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-20 flex justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-5xl">
          <div className="h-40 bg-muted/40 rounded-3xl" />
          <div className="h-10 bg-muted/30 rounded-lg w-64" />
          <div className="h-96 bg-muted/30 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container py-20 text-center space-y-4">
        <Ghost className="h-16 w-16 mx-auto text-muted-foreground/30" />
        <h2 className="text-2xl font-bold">Tournament Disappeared</h2>
        <p className="text-muted-foreground">The arena you are looking for doesn't exist or has been archived.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const isLive    = tournament.status === "live";
  const isOpen    = tournament.status === "upcoming";
  const isHistory = tournament.status === "history" || tournament.status === "completed";
  const emoji     = TYPE_EMOJI[tournament.type] || "🏆";

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      {/* ── Hero Banner ── */}
      <section className={`relative overflow-hidden border-b ${
        isLive    ? "bg-gradient-to-br from-red-500/10 via-background to-background border-red-500/20"
        : isHistory ? "bg-gradient-to-br from-muted/20 via-background to-background border-border/30"
        : "bg-gradient-to-br from-primary/10 via-background to-background border-primary/20"
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-3xl -mr-48 -mt-48 rounded-full" />
        <div className="container max-w-5xl mx-auto px-4 py-12 relative z-10 space-y-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/60">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">{tournament.name}</span>
          </div>

          {/* Title + badges */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-background/50">{tournament.type}</Badge>
              {isLive && (
                <Badge className="bg-red-500 text-white gap-1.5 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)] border-none font-black text-[10px] tracking-widest px-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  LIVE NOW
                </Badge>
              )}
              {isHistory && <Badge variant="secondary" className="font-black text-[10px] tracking-widest">COMPLETED</Badge>}
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              {tournament.name} 
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg font-medium leading-relaxed">
              Experience the pinnacle of {tournament.type} competition. 
              {isOpen ? " Registration is currently open for all eligible participants." : " Follow the live standings and recent battle results below."}
            </p>
          </div>

          {/* Key Stats Row */}
          <div className="flex flex-wrap items-center gap-8 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capacity</p>
                <p className="text-xl font-black">{leaderboard.length}/{tournament.maxParticipants}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timeline</p>
                <p className="text-sm font-black whitespace-nowrap">
                  {format(new Date(tournament.startDate), "MMM d")} - {format(new Date(tournament.endDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prize Pool</p>
                <p className="text-xl font-black">₹ 15,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Tabs ── */}
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <Tabs defaultValue="leaderboard" className="space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/40 pb-6 relative">
            <TabsList className="bg-muted/40 p-1 h-12 rounded-2xl border border-border/40">
              <TabsTrigger value="leaderboard" className="rounded-xl px-8 h-10 font-bold uppercase tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:shadow-lg">
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="matches" className="rounded-xl px-8 h-10 font-bold uppercase tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:shadow-lg">
                Matches
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4">
               {/* Registration Button Logic */}
               {isOpen && (
                Date.now() < tournament.registrationDeadline ? (
                  <Button asChild size="lg" className="h-12 px-10 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-105">
                    <Link href={`/tournaments/${id}/register`}>Join the Fight</Link>
                  </Button>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <Button disabled size="lg" className="h-12 px-10 rounded-2xl font-black uppercase tracking-widest opacity-50 bg-muted cursor-not-allowed">
                       Registration Closed
                    </Button>
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter pr-2">Deadline Exceeded</span>
                  </div>
                )
               )}
               {isLive && (
                 <Badge variant="outline" className="h-12 px-6 rounded-2xl border-red-500/50 text-red-500 bg-red-500/5 font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    BATTLES IN PROGRESS
                 </Badge>
               )}
            </div>
          </div>

          <TabsContent value="leaderboard" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {leaderboard.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground border border-dashed border-border/50 rounded-3xl bg-card/20 space-y-4">
                <Users className="h-12 w-12 mx-auto opacity-10" />
                <p className="font-bold uppercase tracking-widest text-xs">Waiting for participants to join the arena...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black uppercase tracking-tight">{isHistory ? "the victors" : "top contenders"}</h2>
                  <Badge variant="secondary" className="font-black text-[10px] tracking-widest">{leaderboard.length} Fighters</Badge>
                </div>
                <LeaderboardTable entries={leaderboard} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {matches.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground border border-dashed border-border/50 rounded-3xl bg-card/20 space-y-4">
                <Swords className="h-12 w-12 mx-auto opacity-10" />
                <p className="font-bold uppercase tracking-widest text-xs">The arena is quiet... No matches scheduled.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xl font-black uppercase tracking-tight">Battle Schedule</h2>
                  <Badge variant="secondary" className="font-black text-[10px] tracking-widest">{matches.length} Matches</Badge>
                </div>
                
                {/* Group matches by round */}
                {Array.from(new Set(matches.map(m => m.round))).sort((a, b) => a - b).map(round => (
                  <div key={round} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-background px-3 py-1 border border-border/50 rounded-full">
                        Round {round}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches.filter(m => m.round === round).map((match) => {
                        const p1 = participants.find(p => p.id === match.participant1Id);
                        const p2 = participants.find(p => p.id === match.participant2Id);
                        
                        return (
                          <Card key={match.id} className="border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-all group rounded-2xl overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-5 border-b border-border/30 pb-3">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  <Clock className="h-3 w-3 text-primary" />
                                  {match.scheduledAt ? format(new Date(match.scheduledAt), "MMM d · HH:mm") : "TBD"}
                                </div>
                                <Badge className={`text-[9px] font-black uppercase tracking-tighter border-none px-2 py-0 ${
                                  match.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                                  match.status === 'in_progress' ? 'bg-red-500/10 text-red-500 animate-pulse' : 
                                  'bg-muted/60 text-muted-foreground'
                                }`}>
                                   {match.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className={`flex-1 text-right space-y-1 ${match.winnerId && match.winnerId === match.participant1Id ? "text-foreground" : "opacity-40"}`}>
                                  <p className="font-black text-sm truncate uppercase tracking-tight">
                                    {p1?.name || (match.participant1Id ? "Loading..." : "TBD")}
                                  </p>
                                  {match.winnerId === match.participant1Id && (
                                    <div className="flex items-center justify-end gap-1">
                                      <Crown className="h-3 w-3 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                      <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">Victor</span>
                                    </div>
                                  )}
                                </div>
                                <div className="shrink-0 bg-muted/60 border border-border/40 rounded-2xl px-4 py-2 min-w-[80px] text-center shadow-inner group-hover:bg-primary/5 transition-colors">
                                  <p className="text-lg font-black tracking-widest text-primary drop-shadow-sm">
                                    {match.status === 'completed' ? `${match.score1} - ${match.score2}` : "VS"}
                                  </p>
                                </div>
                                <div className={`flex-1 space-y-1 ${match.winnerId && match.winnerId === match.participant2Id ? "text-foreground" : "opacity-40"}`}>
                                  <p className="font-black text-sm truncate uppercase tracking-tight">
                                    {p2?.name || (match.participant2Id ? "Loading..." : "TBD")}
                                  </p>
                                  {match.winnerId === match.participant2Id && (
                                    <div className="flex items-center gap-1">
                                      <Crown className="h-3 w-3 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                      <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest">Victor</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
