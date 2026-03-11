"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getTournaments } from "@/lib/db";
import { Tournament } from "@/types";
import { Copy, PlusCircle, Trophy, Calendar, CheckCircle2, Gamepad2, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

export default function AdminHistoryPage() {
  const { role, user } = useAuth();
  const [history, setHistory] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allTournaments = await getTournaments(user.uid);
      const completed = allTournaments.filter(t => t.status === "completed" || t.status === "history");
      setHistory(completed);
    } catch (error) {
      toast.error("Failed to load history archive");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/tournaments/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Tournament results link copied!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]">
            Tournament History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Review your finalized competitions and results.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Import Placeholder */}
        <Card className="bg-card/40 backdrop-blur border-border/50 border-dashed hover:bg-card/60 transition-all flex flex-col items-center justify-center min-h-[280px] cursor-pointer group hover:border-primary/30">
          <div className="rounded-2xl bg-primary/5 p-4 mb-4 group-hover:bg-primary/10 transition-colors border border-primary/10">
            <PlusCircle className="h-8 w-8 text-primary opacity-60 group-hover:opacity-100" />
          </div>
          <p className="font-bold text-sm text-muted-foreground group-hover:text-foreground">Import Legacy History</p>
          <p className="text-[10px] text-muted-foreground mt-1 opacity-60">Upload CSV or JSON results</p>
        </Card>

        {loading ? (
          <div className="md:col-span-2 lg:col-span-2 flex flex-col items-center justify-center min-h-[280px] bg-muted/20 rounded-2xl border border-border/40 border-dashed">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground font-medium">Syncing archives...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-2 flex flex-col items-center justify-center min-h-[280px] bg-muted/10 rounded-2xl border border-border/40 border-dashed text-center p-6">
            <Trophy className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-bold text-foreground">No History Found</p>
            <p className="text-xs text-muted-foreground mt-1">Once you complete a tournament, it will appear here in the archives.</p>
          </div>
        ) : (
          history.map((t) => (
            <Card key={t.id} className="bg-card/60 backdrop-blur border-border/50 transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <CardHeader className="relative pb-2">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary uppercase text-[10px] font-bold px-2 py-0">
                    {t.type}
                  </Badge>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-black tracking-widest uppercase">
                    {t.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                  {t.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
                  <Calendar className="h-3 w-3" />
                  Concluded {format(new Date(t.endDate), "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 flex-1 relative flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sport Type</Label>
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                       <Gamepad2 className="h-4 w-4 text-primary" />
                       {t.type}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Participants</Label>
                    <p className="font-bold text-sm flex items-center gap-1.5">
                       <CheckCircle2 className="h-4 w-4 text-green-500" />
                       {t.maxParticipants} Confirmed
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/30">
                   <Button 
                    variant="secondary" 
                    size="sm"
                    className="w-full justify-between h-9 bg-muted/40 hover:bg-primary/10 hover:text-primary transition-all group/btn font-bold text-xs" 
                    onClick={() => handleCopyLink(t.id)}
                   >
                      <span className="flex items-center gap-2">
                        <LinkIcon className="h-3 w-3 opacity-60" />
                        /results/{t.id.slice(0, 8)}
                      </span>
                      <Copy className="h-3.5 w-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
