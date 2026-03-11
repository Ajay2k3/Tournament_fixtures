"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getRegistrationsByUser, getTournamentsByIds } from "@/lib/db";
import { Tournament, Participant } from "@/types";
import { TournamentCard } from "@/components/tournament-card";
import { Loader2, Trophy, Ghost, Gamepad2, Calendar, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyTournamentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserTournaments() {
      if (!user) return;
      setLoading(true);
      try {
        const registrations = await getRegistrationsByUser(user.uid);
        const tournamentIds = Array.from(new Set(registrations.map(r => r.tournamentId)));
        
        if (tournamentIds.length > 0) {
          const data = await getTournamentsByIds(tournamentIds);
          setTournaments(data);
        }
      } catch (error) {
        console.error("Error loading user tournaments:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadUserTournaments();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Entering the arena...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <Ghost className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Please log in to view your tournament arena.</p>
      </div>
    );
  }

  const live = tournaments.filter(t => t.status === "live");
  const upcoming = tournaments.filter(t => t.status === "upcoming");
  const history = tournaments.filter(t => t.status === "completed" || t.status === "history");

  return (
    <div className="container py-12 space-y-10 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          My Arena
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Track your progress, view upcoming matches, and revisit your past glories.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-8">
          <TabsTrigger value="all" className="px-6 font-bold">All Activity</TabsTrigger>
          <TabsTrigger value="live" className="px-6 font-bold">Ongoing ({live.length})</TabsTrigger>
          <TabsTrigger value="upcoming" className="px-6 font-bold">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history" className="px-6 font-bold">History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-12">
          {tournaments.length === 0 ? (
            <div className="bg-card/40 border border-dashed border-border/50 rounded-3xl p-20 flex flex-col items-center text-center gap-4">
              <Trophy className="h-16 w-16 text-muted-foreground/20" />
              <div>
                <h3 className="text-xl font-bold">Your arena is empty</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  You haven't registered for any tournaments yet. Join a competition to start your legacy!
                </p>
              </div>
            </div>
          ) : (
            <>
              {live.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-sm">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    Ongoing Right Now
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {live.map(t => <TournamentCard key={t.id} tournament={t} />)}
                  </div>
                </section>
              )}

              {upcoming.length > 0 && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-sm">
                    <Gamepad2 className="h-4 w-4" />
                    Upcoming Battles
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map(t => <TournamentCard key={t.id} tournament={t} />)}
                  </div>
                </section>
              )}

              {history.length > 0 && (
                <section className="space-y-6 opacity-80">
                  <div className="flex items-center gap-2 text-muted-foreground font-black uppercase tracking-widest text-sm">
                    <History className="h-4 w-4" />
                    Past Tournaments
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grayscale-[0.5]">
                    {history.map(t => <TournamentCard key={t.id} tournament={t} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="live">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {live.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
            {history.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
