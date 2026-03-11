"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDashboardSummary, getRecentRegistrations } from "@/lib/db";
import { Participant, Tournament } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Trophy, 
  Gamepad2, 
  ArrowUpRight, 
  Loader2, 
  Activity, 
  UserPlus, 
  Clock,
  ExternalLink 
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    participantsCount: 0,
    matchesCount: 0,
    liveCount: 0,
    upcomingCount: 0,
    tournaments: [] as Tournament[]
  });
  const [recentRegistrations, setRecentRegistrations] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (role !== "tier1" && role !== "tier2"))) {
      router.push("/");
    }
  }, [user, role, authLoading, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const [summary, registrations] = await Promise.all([
          getDashboardSummary(user.uid),
          getRecentRegistrations(user.uid)
        ]);
        setStats(summary as any);
        setRecentRegistrations(registrations);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing arena data...</p>
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back to the admin portal. You have <strong className="text-foreground">{role.toUpperCase()}</strong> access.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 backdrop-blur border-border/50 hover:border-primary/20 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.participantsCount.toLocaleString()}</div>
            <p className="text-[10px] text-green-500 font-bold flex items-center mt-1 uppercase tracking-tighter">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> Live synchronization
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur border-border/50 hover:border-red-500/20 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground group-hover:text-red-500 transition-colors">Active Events</CardTitle>
            <Trophy className="h-4 w-4 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.tournaments.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter">
              {stats.liveCount} Live, {stats.upcomingCount} Upcoming
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-border/50 hover:border-primary/20 transition-all group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Matches Logged</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{stats.matchesCount.toLocaleString()}</div>
            <p className="text-[10px] text-primary font-bold flex items-center mt-1 uppercase tracking-tighter opacity-70">
              <Activity className="h-3 w-3 mr-1" /> Ongoing activity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 backdrop-blur hover:bg-primary/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-primary">System Status</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-black text-primary uppercase tracking-tight">OPERATIONAL</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tighter opacity-70">Cloud Sync Active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        {/* Analytics Section */}
        <Card className="col-span-4 bg-card/30 border-border/50 backdrop-blur border-dashed overflow-hidden flex flex-col min-h-[400px]">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Tournament Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            {stats.tournaments.length === 0 ? (
               <>
                <Ghost className="h-12 w-12 text-muted-foreground/20" />
                <div>
                  <p className="text-sm font-bold text-foreground">No data to visualize</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first tournament to see analytics.</p>
                </div>
               </>
            ) : (
              <div className="w-full space-y-4">
                 <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <span>Performance Analytics</span>
                    <span>{stats.tournaments.length} Active</span>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    {stats.tournaments.slice(0, 4).map(t => (
                      <div key={t.id} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                          <span>{t.name}</span>
                          <span className="text-primary">{t.status.toUpperCase()}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${t.status === 'live' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary'}`} 
                            style={{ width: t.status === 'live' ? '85%' : '40%' }} 
                          />
                        </div>
                      </div>
                    ))}
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-4 italic font-medium">
                    * Interactive charts will unlock as more match data is logged.
                 </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="col-span-3 bg-card/30 border-border/50 backdrop-blur overflow-hidden flex flex-col min-h-[400px]">
           <CardHeader className="border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Activity
            </CardTitle>
            <Link href="/admin/participants" className="text-[10px] font-black uppercase text-primary hover:underline flex items-center gap-1">
              View All <ExternalLink className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {recentRegistrations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
                 <UserPlus className="h-10 w-10 text-muted-foreground/20" />
                 <p className="text-xs text-muted-foreground font-medium">No recent registrations found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {recentRegistrations.map((reg) => (
                  <div key={reg.id} className="p-4 hover:bg-muted/20 transition-colors flex items-center gap-3 group">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <UserPlus className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{reg.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">Registered for {reg.teamName || 'Solo Entry'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-primary/70">{format(new Date(reg.registeredAt), "HH:mm")}</p>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase">{format(new Date(reg.registeredAt), "MMM d")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
