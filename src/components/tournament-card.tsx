import { Tournament } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { format } from "date-fns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import Link from "next/link";
import { CalendarDays, Gamepad2, Users, Trophy, Clock, Zap } from "lucide-react";

interface TournamentCardProps {
  tournament: Tournament;
  variant?: "default" | "live" | "history";
}

const TYPE_EMOJI: Record<string, string> = {
  Esports: "🎮",
  Cricket: "🏏",
  Football: "⚽",
  Chess: "♟️",
  Sports: "🏅",
  Basketball: "🏀",
  Badminton: "🏸",
};

export function TournamentCard({ tournament, variant = "default" }: TournamentCardProps) {
  const isLive = tournament.status === "live";
  const isCompleted = tournament.status === "completed" || tournament.status === "history";
  const isUpcoming = tournament.status === "upcoming";
  const emoji = TYPE_EMOJI[tournament.type] || "🏆";

  return (
    <Card className={`group relative overflow-hidden border bg-card/60 backdrop-blur-sm transition-all duration-300
      hover:-translate-y-1 hover:shadow-xl
      ${isLive ? "border-red-500/40 hover:border-red-500/70 hover:shadow-red-500/10" : ""}
      ${isCompleted ? "border-border/40 opacity-90" : ""}
      ${isUpcoming ? "border-primary/30 hover:border-primary/60 hover:shadow-primary/10" : ""}
    `}>

      {/* Top accent strip */}
      <div className={`h-1 w-full ${isLive ? "bg-gradient-to-r from-red-600 via-red-400 to-red-600 animate-pulse" : isCompleted ? "bg-gradient-to-r from-muted to-muted-foreground/30" : "bg-gradient-to-r from-primary/40 via-primary to-primary/40"}`} />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden>{emoji}</span>
              <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-border/50 text-muted-foreground">
                {tournament.type}
              </Badge>
            </div>
            <CardTitle className="text-base font-bold tracking-tight group-hover:text-primary transition-colors leading-snug line-clamp-2">
              {tournament.name}
            </CardTitle>
          </div>

          {/* Status Badge */}
          {isLive && (
            <Badge className="shrink-0 bg-red-500 hover:bg-red-500 text-white gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" /> LIVE
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="secondary" className="shrink-0 bg-muted text-muted-foreground gap-1.5">
              <Trophy className="h-3 w-3" /> Ended
            </Badge>
          )}
          {isUpcoming && (
            <Badge className="shrink-0 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/20 gap-1.5">
              <Zap className="h-3 w-3" /> Open
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide font-bold">
                {isCompleted ? "Was held" : "Starts"}
              </span>
            </div>
            <p className="font-semibold text-foreground">
              {format(new Date(tournament.startDate), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-wide font-bold">Ends</span>
            </div>
            <p className="font-semibold text-foreground">
              {format(new Date(tournament.endDate), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm bg-muted/40 rounded-lg px-3 py-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground text-[11px] font-bold uppercase tracking-wide">Capacity</span>
          <span className="ml-auto font-black text-foreground">{tournament.maxParticipants}</span>
          <span className="text-muted-foreground text-xs">players</span>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5">
        <Button
          asChild
          className="w-full font-bold"
          variant={isCompleted ? "outline" : isLive ? "destructive" : "default"}
          size="sm"
        >
          <Link href={`/tournaments/${tournament.id}`}>
            {isCompleted ? (
              <><Trophy className="h-4 w-4 mr-2" /> View Results & History</>
            ) : isLive ? (
              <><span className="h-2 w-2 rounded-full bg-white mr-2 animate-pulse" /> Watch Live Standings</>
            ) : Date.now() >= tournament.registrationDeadline ? (
              "Registration Closed"
            ) : (
              "Register Now →"
            )}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
