"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { Loader2, Activity, User, Target, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  targetId: string;
  timestamp: any;
}

export default function AuditLogsPage() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!loading && role !== "tier1") {
      router.push("/admin/dashboard");
    } else if (role === "tier1") {
      const fetchLogs = async () => {
        try {
          const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(50));
          const querySnap = await getDocs(q);
          const logList = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
          setLogs(logList);
        } catch (error) {
          console.error("Error fetching logs:", error);
        } finally {
          setDataLoaded(true);
        }
      };
      fetchLogs();
    }
  }, [role, loading, router]);

  if (loading || role !== "tier1") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
          <Activity className="h-8 w-8" />
          System Audit Logs
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Track all administrative actions across the platform.</p>
      </div>

      <Card className="bg-card/40 backdrop-blur border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead><Clock className="h-4 w-4" /></TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Admin ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!dataLoaded ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                    No system logs recorded yet.
                  </TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id} className="text-sm">
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                      log.action === 'CREATE_ADMIN' ? 'bg-green-500/10 text-green-500' : 
                      log.action === 'DELETE_ADMIN' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                    }`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{log.details}</TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {log.performedBy}
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
