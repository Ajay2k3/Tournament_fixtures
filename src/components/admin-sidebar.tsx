"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  BarChart3, 
  Trophy, 
  Users, 
  Settings, 
  History, 
  ShieldAlert,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminSidebar() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3, roles: ["tier1", "tier2"] },
    { name: "Tournaments", href: "/admin/tournaments", icon: Trophy, roles: ["tier1", "tier2"] },
    { name: "Participants", href: "/admin/participants", icon: Users, roles: ["tier1", "tier2"] },
    { name: "Leaderboard", href: "/admin/leaderboard", icon: Trophy, roles: ["tier1", "tier2"] },
    { name: "History", href: "/admin/history", icon: History, roles: ["tier1"] },
    { name: "Administrators", href: "/admin/admins", icon: ShieldAlert, roles: ["tier1"] },
  ];

  const filteredLinks = links.filter((link) => role && link.roles.includes(role));

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden fixed top-3 left-3 z-[60]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-xl border-r border-border/50 
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex h-16 items-center px-6 border-b border-border/50">
           <span className="font-bold text-xl tracking-tight text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">
             Admin Panel
           </span>
        </div>
        <div className="py-6 px-4 space-y-2">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                  ${isActive 
                    ? "bg-primary/20 text-primary font-medium shadow-[inset_0_0_20px_rgba(var(--primary),0.2)]" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" : ""}`} />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
