"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Participant } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function ManageParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const q = query(collection(db, "participants"));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
        setParticipants(data);
      } catch (error) {
         console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = participants.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gameId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Participants</h1>
          <p className="text-muted-foreground mt-1">Review player registrations and details.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name, game ID, or team..." 
          className="pl-9 bg-card/50 backdrop-blur border-border/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="bg-card/40 backdrop-blur border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Player Name</TableHead>
                <TableHead>In-Game ID</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Private Contact</TableHead>
                <TableHead className="text-center">Age</TableHead>
                <TableHead className="text-right">Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Loading data...</TableCell>
                </TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                  <TableCell className="text-primary">{p.gameId || "-"}</TableCell>
                  <TableCell>{p.teamName || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono">{p.phone}</TableCell>
                  <TableCell className="text-center">{p.age}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(new Date(p.registeredAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
