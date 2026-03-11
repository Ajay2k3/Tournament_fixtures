"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getTournaments, createTournament, generateFixtures } from "@/lib/db";
import { Tournament, TournamentStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Loader2, Calendar, Trophy, Users, Gamepad2, Swords } from "lucide-react";
import { toast } from "sonner";

export default function ManageTournamentsPage() {
  const { role, user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "Esports",
    status: "upcoming" as TournamentStatus,
    entryType: "single" as "single" | "team",
    format: "knockout" as any,
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxParticipants: "32",
    teamSizeMin: "2",
    teamSizeMax: "5",
  });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTournaments(user.uid);
      setTournaments(data);
    } catch (error) {
      toast.error("Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const start = new Date(formData.startDate).getTime();
    const end = new Date(formData.endDate).getTime();
    const deadline = new Date(formData.registrationDeadline).getTime();

    if (deadline > start) {
      toast.error("Registration deadline must be before start date");
      return;
    }

    if (start > end) {
      toast.error("Start date must be before end date");
      return;
    }

    setSubmitting(true);
    try {
      const tournamentData: Omit<Tournament, 'id'> = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        entryType: formData.entryType,
        format: formData.format,
        startDate: start,
        endDate: end,
        registrationDeadline: deadline,
        maxParticipants: parseInt(formData.maxParticipants),
        createdBy: user.uid,
      };

      if (formData.entryType === 'team') {
        tournamentData.teamSize = {
          min: parseInt(formData.teamSizeMin),
          max: parseInt(formData.teamSizeMax),
        };
      }

      await createTournament(tournamentData);
      toast.success("Tournament created successfully!");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        type: "Esports",
        status: "upcoming",
        entryType: "single",
        format: "knockout",
        startDate: "",
        endDate: "",
        registrationDeadline: "",
        maxParticipants: "32",
        teamSizeMin: "2",
        teamSizeMax: "5",
      });
      loadData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (role !== 'tier1') {
      toast.error("Only Tier 1 Admins can delete tournaments");
      return;
    }
    toast.success("Deletion logic coming soon!");
  };

  const handleGenerateFixtures = async (id: string) => {
    try {
      await toast.promise(generateFixtures(id), {
        loading: 'Generating battlefield schedule...',
        success: 'Fixtures generated successfully!',
        error: (err) => `Failed to generate: ${err.message}`,
      });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const TYPE_OPTIONS = ["Esports", "Cricket", "Football", "Chess", "Sports", "Others"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.2)]">
            Manage Tournaments
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Create, update, and monitor active competitions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={
            <Button className="shadow-[0_0_15px_rgba(var(--primary),0.4)] hover:shadow-primary/60 transition-all font-bold">
              <Plus className="h-4 w-4 mr-2" /> New Tournament
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-md border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Trophy className="h-6 w-6" /> Create Tournament
              </DialogTitle>
              <DialogDescription>
                Fill in the details to launch a new competition in the arena.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Winter Clash 2025"
                  className="bg-muted/50 focus-visible:ring-primary/50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <Select 
                    value={formData.entryType} 
                    onValueChange={(v) => setFormData({ ...formData, entryType: (v as any) || "single" })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select entry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Player</SelectItem>
                      <SelectItem value="team">Team Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tournament Format</Label>
                  <Select 
                    value={formData.format} 
                    onValueChange={(v) => setFormData({ ...formData, format: (v as any) || "knockout" })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="knockout">Knockout (Bracket)</SelectItem>
                      <SelectItem value="league">League (Round Robin)</SelectItem>
                      <SelectItem value="groups_knockout">Groups then Knockout</SelectItem>
                      <SelectItem value="fixed_matches">Fixed Matches per Player</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.entryType === 'team' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="teamSizeMin">Min Team Size</Label>
                    <Input
                      id="teamSizeMin"
                      type="number"
                      value={formData.teamSizeMin}
                      onChange={(e) => setFormData({ ...formData, teamSizeMin: e.target.value })}
                      className="bg-muted/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamSizeMax">Max Team Size</Label>
                    <Input
                      id="teamSizeMax"
                      type="number"
                      value={formData.teamSizeMax}
                      onChange={(e) => setFormData({ ...formData, teamSizeMax: e.target.value })}
                      className="bg-muted/50"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sports / Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({ ...formData, type: v || "Others" })}
                  >
                    <SelectTrigger className="bg-muted/50 border-input">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">{formData.entryType === 'team' ? 'Max Teams' : 'Max Participants'}</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    className="bg-muted/50"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="bg-muted/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-muted/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="bg-muted/50 pl-10"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest pl-1">
                  Registration will close automatically at this time.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Initial Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: (v as TournamentStatus) || "upcoming" })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming (Registration Open)</SelectItem>
                    <SelectItem value="live">Live (Active Matches)</SelectItem>
                    <SelectItem value="completed">Completed / History</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="submit" className="w-full h-11 font-bold shadow-lg" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Launching...</>
                  ) : "Create Tournament"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/40 backdrop-blur border-border/50 overflow-hidden shadow-xl">
        <CardHeader className="bg-muted/20 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
             <Gamepad2 className="h-5 w-5 text-primary" /> Active Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold">Name</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Timeline</TableHead>
                  <TableHead className="text-center font-bold">Capacity</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-48">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-muted-foreground">Syncing tournaments...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-48 py-10">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Trophy className="h-12 w-12 opacity-20" />
                        <p className="font-medium">No tournaments found.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)} className="mt-2">
                           Create your first one
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : tournaments.map((t) => (
                  <TableRow key={t.id} className="transition-all hover:bg-muted/30 group">
                    <TableCell className="font-black text-foreground py-4">
                      {t.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary uppercase text-[10px] font-bold">
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'live' ? 'destructive' : t.status === 'upcoming' ? 'default' : 'secondary'}
                             className={t.status === 'live' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' : ''}>
                        {t.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{format(new Date(t.startDate), "MMM d, yyyy")}</span>
                        <span className="text-[10px] opacity-60">to {format(new Date(t.endDate), "MMM d, yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-sm">{t.maxParticipants}</span>
                        <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-bold">Players</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => handleGenerateFixtures(t.id)}
                          title="Generate Fixtures"
                      >
                        <Swords className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
