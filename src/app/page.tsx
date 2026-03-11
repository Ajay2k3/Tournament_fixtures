"use client";

import { useEffect, useState } from "react";
import { TournamentCard } from "@/components/tournament-card";
import { getTournaments, getGlobalStats } from "@/lib/db";
import { Tournament } from "@/types";
import { Gamepad2, Trophy, Clock, Search, Zap, Users, Calendar, X, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function SectionHeader({
  icon: Icon,
  title,
  count,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-4">
      <div className="flex items-center gap-3">
        {title === "Live Now" ? (
          <div className="relative">
            <span className="absolute -inset-1 rounded-full bg-red-500/25 animate-ping" />
            <div className="relative h-3 w-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          </div>
        ) : (
          <Icon className={`h-5 w-5 ${iconClass}`} />
        )}
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <Badge variant="secondary" className="text-xs font-bold px-2.5 py-1">
        {count} {count === 1 ? "event" : "events"}
      </Badge>
    </div>
  );
}

function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-64 rounded-xl bg-muted/40 animate-pulse border border-border/30" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-dashed border-border/50 bg-card/20 text-center">
      <Trophy className="h-10 w-10 text-muted-foreground/30" />
      <p className="text-muted-foreground text-sm font-medium">{message}</p>
    </div>
  );
}

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    upcomingCount: 0,
    pastCount: 0,
    totalPlayers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeType, setActiveType] = useState<string>("All");

  const TYPES = ["All", "Esports", "Cricket", "Football", "Chess", "Sports"];

  useEffect(() => {
    async function fetchData() {
      try {
        const [tData, sData] = await Promise.all([
          getTournaments(),
          getGlobalStats()
        ]);
        setTournaments(tData);
        setStats(sData);
      } catch (error: any) {
        console.error("Error fetching arena data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === "All" || t.type === activeType;
    return matchesSearch && matchesType;
  });

  const totalResults = filtered.length;
  const hasFilters = searchTerm !== "" || activeType !== "All";

  const live = filtered.filter((t) => t.status === "live");
  const upcoming = filtered.filter((t) => t.status === "upcoming");
  const history = filtered.filter((t) => t.status === "completed" || t.status === "history");

  const statConfig = [
    { label: "Active Now", value: stats.activeCount.toLocaleString(), icon: Zap, color: "text-red-500" },
    { label: "Planned Events", value: stats.upcomingCount.toLocaleString(), icon: Calendar, color: "text-primary" },
    { label: "Hall of Fame", value: stats.pastCount.toLocaleString() + "+", icon: Trophy, color: "text-yellow-500" },
    { label: "Total Fighters", value: stats.totalPlayers.toLocaleString(), icon: Users, color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen animate-in fade-in duration-700">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(var(--primary),0.12)_0%,_transparent_60%)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -mr-64 -mt-64" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/30 gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest">
              <Zap className="h-3.5 w-3.5" /> Premier Global Arena
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]">
              Compete.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                Conquer.
              </span>{" "}
              <br className="hidden md:block" />
              Rise.
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed">
              The ultimate destination for competitive gaming and sports. 
              Track real-time standings, join elite tournaments, and build your professional legacy.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl">
            {statConfig.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-card/50 backdrop-blur border border-border/40 rounded-2xl p-4 flex flex-col gap-2 hover:border-primary/30 transition-all hover:translate-y-[-2px]"
              >
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <p className="text-2xl font-black text-foreground">{loading ? "..." : value}</p>
                  <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Search & Filter Bar ── */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="tournament-search"
                placeholder="Search tournaments by name or sport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-11 bg-background border-border/50 focus-visible:ring-primary/30 text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
              {TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                    activeType === type
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                      : "bg-muted/50 text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {hasFilters && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black uppercase text-muted-foreground whitespace-nowrap">
                  <span className="text-foreground">{totalResults}</span> Result{totalResults !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => { setSearchTerm(""); setActiveType("All"); }}
                >
                  <X className="h-3 w-3" /> Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Syncing with cloud...</p>
          </div>
        ) : (
          <>
            {/* Live */}
            <section className="space-y-6">
              <SectionHeader
                icon={Zap}
                title="Live Now"
                iconClass="text-red-500"
                count={live.length}
              />
              {live.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {live.map((t) => (
                    <TournamentCard key={t.id} tournament={t} variant="live" />
                  ))}
                </div>
              ) : (
                <EmptyState message="No live tournaments right now. Ready to host one?" />
              )}
            </section>

            {/* Upcoming */}
            <section className="space-y-6">
              <SectionHeader
                icon={Clock}
                title="Upcoming Tournaments"
                iconClass="text-blue-500"
                count={upcoming.length}
              />
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
                  ))}
                </div>
              ) : (
                <EmptyState message="No upcoming tournaments scheduled. Check back later!" />
              )}
            </section>

            {/* History */}
            <section className="space-y-6 opacity-80">
              <SectionHeader
                icon={Gamepad2}
                title="Tournament History"
                iconClass="text-muted-foreground"
                count={history.length}
              />
              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((t) => (
                    <TournamentCard key={t.id} tournament={t} variant="history" />
                  ))}
                </div>
              ) : (
                <EmptyState message="No past tournaments on record yet." />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
