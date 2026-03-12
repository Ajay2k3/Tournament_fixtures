"use client";

import { useState } from "react";
import { Match, Participant } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { updateMatchResult } from "@/lib/db";
import { toast } from "sonner";

interface MatchResultDialogProps {
  match: Match | null;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MatchResultDialog({ 
  match, 
  participants, 
  open, 
  onOpenChange, 
  onSuccess 
}: MatchResultDialogProps) {
  const [loading, setLoading] = useState(false);
  const [score1, setScore1] = useState(match?.score1?.toString() || "0");
  const [score2, setScore2] = useState(match?.score2?.toString() || "0");
  const [status, setStatus] = useState<"completed" | "in_progress">(match?.status === 'completed' ? 'completed' : 'in_progress');
  const [winnerId, setWinnerId] = useState<string | null>(match?.winnerId || null);

  if (!match) return null;

  const p1 = participants.find(p => p.id === match.participant1Id);
  const p2 = participants.find(p => p.id === match.participant2Id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateMatchResult(match.id, {
        score1: parseInt(score1),
        score2: parseInt(score2),
        winnerId: status === 'completed' ? winnerId : null,
        status: status,
      });
      toast.success("Match result updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error updating match: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-md border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Enter Match Result</DialogTitle>
          <DialogDescription>
            Update scores and status for Round {match.round} - Match {match.matchNumber}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase truncate block">
                {p1?.name || "Participant 1"}
              </Label>
              <Input
                type="number"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                className="bg-muted/50 text-center text-xl font-black h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase truncate block text-right">
                {p2?.name || "Participant 2"}
              </Label>
              <Input
                type="number"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                className="bg-muted/50 text-center text-xl font-black h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Match Status</Label>
            <Select 
              value={status} 
              onValueChange={(v: any) => setStatus(v)}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'completed' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label>Winner</Label>
              <Select 
                value={winnerId || "none"} 
                onValueChange={(v) => setWinnerId(v === "none" ? null : v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select Winner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Draw / No Winner</SelectItem>
                  {p1 && <SelectItem value={p1.id}>{p1.name}</SelectItem>}
                  {p2 && <SelectItem value={p2.id}>{p2.name}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full h-12 font-bold shadow-lg" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Result</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
