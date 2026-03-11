import { LeaderboardEntry } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  compact?: boolean;
}

export function LeaderboardTable({ entries, compact = false }: LeaderboardTableProps) {
  const sorted = [...entries].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.matchesPlayed - b.matchesPlayed;
  });

  const getRankBadge = (index: number) => {
    if (index === 0) return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-500/10 border border-yellow-500/30">
        <Trophy className="h-4 w-4 text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
      </div>
    );
    if (index === 1) return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-400/10 border border-slate-400/30">
        <Medal className="h-4 w-4 text-slate-400" />
      </div>
    );
    if (index === 2) return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-700/10 border border-amber-700/30">
        <Award className="h-4 w-4 text-amber-700" />
      </div>
    );
    return (
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted/60">
        <span className="text-xs font-black text-muted-foreground">{index + 1}</span>
      </div>
    );
  };

  const getWinRate = (entry: LeaderboardEntry) => {
    if (!entry.matchesPlayed) return 0;
    // Approximate: 3 points per win in most systems
    const approxWins = Math.round(entry.points / 3);
    return Math.min(100, Math.round((approxWins / entry.matchesPlayed) * 100));
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-2xl">
        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
        <p className="font-medium text-sm">No standings available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b-border/40 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-16 text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
              Rank
            </TableHead>
            <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Player / Team
            </TableHead>
            {!compact && (
              <>
                <TableHead className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Played
                </TableHead>
                <TableHead className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Win Rate
                </TableHead>
              </>
            )}
            <TableHead className="text-right text-xs font-black uppercase tracking-widest text-primary">
              Points
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry, index) => {
            const isTop = index < 3;
            const winRate = getWinRate(entry);
            return (
              <TableRow
                key={entry.id}
                className={`border-b-border/20 transition-colors ${
                  index === 0
                    ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                    : "hover:bg-muted/30"
                }`}
              >
                <TableCell className="text-center py-4">
                  {getRankBadge(index)}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-black border ${
                      index === 0 ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600" :
                      index === 1 ? "bg-slate-400/10 border-slate-400/30 text-slate-400" :
                      index === 2 ? "bg-amber-700/10 border-amber-700/30 text-amber-700" :
                      "bg-muted/50 border-border/30 text-muted-foreground"
                    }`}>
                      {entry.playerName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${index === 0 ? "text-yellow-600" : "text-foreground"}`}>
                        {entry.playerName}
                      </p>
                      {isTop && (
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 mt-0.5 ${
                          index === 0 ? "border-yellow-500/30 text-yellow-600" :
                          index === 1 ? "border-slate-400/30 text-slate-400" :
                          "border-amber-700/30 text-amber-700"
                        }`}>
                          {index === 0 ? "🥇 1st Place" : index === 1 ? "🥈 2nd Place" : "🥉 3rd Place"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                {!compact && (
                  <>
                    <TableCell className="text-center py-4 text-muted-foreground font-medium">
                      {entry.matchesPlayed}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${winRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground w-8">{winRate}%</span>
                      </div>
                    </TableCell>
                  </>
                )}
                <TableCell className="text-right py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrendingUp className={`h-3.5 w-3.5 ${index === 0 ? "text-yellow-500" : "text-primary"}`} />
                    <span className={`text-lg font-black ${index === 0 ? "text-yellow-500" : "text-primary"}`}>
                      {entry.points}
                    </span>
                    <span className="text-[10px] text-muted-foreground">pts</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
