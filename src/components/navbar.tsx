"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { user, dbUser, adminUser, role } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold text-xl text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]">
              Fixers Arena
            </span>
          </Link>
          {user && (
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Tournaments
              </Link>
              <Link 
                href="/my-tournaments" 
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                My Arena
              </Link>
              <Link 
                href="/profile" 
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Profile
              </Link>
              {(role === "tier1" || role === "tier2") && (
                <Link 
                  href="/admin/dashboard" 
                  className="flex items-center text-sm font-medium text-primary/80 transition-colors hover:text-primary border-b-2 border-primary/30 pb-0.5"
                >
                  Admin
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {!user ? (
              <div className="flex gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all">
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* User Identity Info */}
                <div className="hidden md:flex flex-col items-end mr-1">
                  <span className="text-[11px] font-bold text-foreground">
                    {dbUser?.name || adminUser?.username || "Account"}
                  </span>
                  <span className="text-[9px] text-primary font-mono uppercase tracking-widest">
                    {role || "User"}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/60 transition-all hover:scale-105 p-0 overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                    >
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
                          {(dbUser?.name?.[0] || adminUser?.username?.[0] || user.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 bg-card/95 backdrop-blur-xl border-primary/20" align="end" sideOffset={8}>
                    <div className="flex items-center justify-start gap-3 p-4 border-b border-border/50 bg-primary/5">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                         {(dbUser?.name?.[0] || adminUser?.username?.[0] || "U").toUpperCase()}
                      </div>
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-bold text-sm text-foreground">
                          {dbUser?.name || adminUser?.username || "Authenticated"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-1 space-y-1">
                      {(role === "tier1" || role === "tier2") && (
                        <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer mb-1">
                          <Link href="/admin/dashboard" className="w-full flex items-center">
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer mb-1 font-semibold">
                        <Link href="/profile" className="w-full flex items-center">
                          My Profile Settings
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="cursor-pointer text-red-500 focus:text-red-500 mt-1 border-t border-border/30 pt-2"
                        onSelect={(e) => {
                          e.preventDefault();
                          handleSignOut();
                        }}
                      >
                        Sign Out Account
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
}
