"use client";

import { AdminSidebar } from "@/components/admin-sidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!role || (role !== "tier1" && role !== "tier2")) {
        router.push("/");
      }
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm animate-pulse">Verifying Admin Access...</p>
      </div>
    );
  }

  if (!role || (role !== "tier1" && role !== "tier2")) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <AdminSidebar />
      <main className="flex-1 bg-muted/30">
        <div className="container p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
