"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { UsernameService } from "@/lib/username-service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ShieldCheck,
  User as UserIcon,
  Gamepad2,
  Phone,
  Calendar,
  AtSign,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Activity,
  Mail,
  Loader2,
  Save,
  LogOut,
} from "lucide-react";

export default function ProfilePage() {
  const { user, dbUser, loading, role } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [updating, setUpdating] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (dbUser) {
      setName(dbUser.name || "");
      setUsername(dbUser.username || "");
      setPhone(dbUser.phone || "");
      setAge(dbUser.age?.toString() || "");
    }
  }, [user, dbUser, loading, router]);

  // Debounced username availability check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!username || username.length < 3) { setUsernameStatus("idle"); return; }
      if (username.toLowerCase() === dbUser?.username?.toLowerCase()) { setUsernameStatus("available"); return; }
      setUsernameStatus("checking");
      const avail = await UsernameService.isAvailable(username);
      setUsernameStatus(avail ? "available" : "taken");
    }, 600);
    return () => clearTimeout(timer);
  }, [username, dbUser?.username]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase());
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (usernameStatus === "taken") { toast.error("Username is already taken."); return; }

    setUpdating(true);
    try {
      if (username !== dbUser?.username) {
        await UsernameService.updateUsername(user.uid, username, dbUser?.username);
      }
      await setDoc(doc(db, "users", user.uid), {
        name,
        phone,
        age: parseInt(age) || null,
        username,
        email: user.email,
        role: dbUser?.role || "participant",
        updatedAt: Date.now(),
      }, { merge: true });
      toast.success("Profile saved!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm animate-pulse">Loading your profile...</p>
      </div>
    );
  }

  if (!user) return null;

  const displayName = name || dbUser?.name || user.email?.split("@")[0] || "Player";
  const displayRole = (role || "participant").toUpperCase();
  const initial = displayName[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* ── Hero Banner ── */}
        <div className="relative rounded-3xl overflow-hidden border border-border/40 bg-gradient-to-br from-primary/10 via-card to-card shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-8 md:p-12 flex flex-col sm:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/30 flex items-center justify-center text-5xl font-black text-primary shadow-xl">
                {initial}
              </div>
              <span className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{displayName}</h1>
                {username && (
                  <p className="text-primary/70 text-sm font-mono mt-1">@{username}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge className="bg-primary/15 text-primary border-primary/25 gap-1.5 px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> {displayRole}
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </Badge>
              </div>
            </div>

            {/* Quick stat */}
            <div className="hidden md:flex flex-col items-center justify-center bg-background/50 backdrop-blur-md border border-border/50 rounded-2xl px-8 py-5 shrink-0 text-center gap-1">
              <Trophy className="h-7 w-7 text-yellow-500 mx-auto mb-1 opacity-70" />
              <span className="text-2xl font-black text-foreground">0</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Tournaments</span>
            </div>
          </div>
        </div>

        {/* ── Two Equal Columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left: Edit Form */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <CardHeader className="px-6 pt-6 pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" /> Edit Profile
              </CardTitle>
              <CardDescription>Update your identity in the arena.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleUpdate} className="space-y-4">

                {/* Username */}
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wide flex items-center justify-between">
                    Unique Handle
                    <span className={`text-[10px] font-black transition-colors ${
                      usernameStatus === "available" ? "text-green-500" :
                      usernameStatus === "taken" ? "text-red-500" : "text-transparent"
                    }`}>
                      {usernameStatus === "available" ? "✓ Available" : usernameStatus === "taken" ? "✗ Taken" : "."}
                    </span>
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={handleUsernameChange}
                      className={`pl-9 h-11 transition-all ${
                        usernameStatus === "available" ? "border-green-500/50 focus-visible:ring-green-500/30" :
                        usernameStatus === "taken" ? "border-red-500/50 focus-visible:ring-red-500/30" : ""
                      }`}
                      placeholder="your_handle"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === "available" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {usernameStatus === "taken" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground pl-1">Lowercase letters, numbers and underscores only.</p>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide">Display Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wide">Age</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="pl-9 h-11"
                      placeholder="Minimum 13"
                      min="13"
                    />
                  </div>
                </div>

                <Separator className="my-2" />

                <Button
                  type="submit"
                  className="w-full h-11 font-bold gap-2"
                  disabled={updating || usernameStatus === "checking" || usernameStatus === "taken"}
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Right: Status & Activity */}
          <div className="flex flex-col gap-6">

            {/* Role Card */}
            <Card className="border-border/40 bg-card/60 shadow-lg rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
              <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> My Access Level
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className={`rounded-xl p-4 border ${
                  dbUser?.role === "tier1" ? "bg-primary/10 border-primary/30" :
                  dbUser?.role === "tier2" ? "bg-blue-500/10 border-blue-500/30" :
                  "bg-muted/40 border-border/40"
                }`}>
                  <p className="text-sm font-semibold mb-1">
                    {dbUser?.role === "tier1" ? "🛡️ Super Admin"
                    : dbUser?.role === "tier2" ? "⚙️ Moderator"
                    : "🎮 Participant"}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dbUser?.role === "tier1"
                      ? "You have full control over the platform — admins, tournaments, and settings."
                      : dbUser?.role === "tier2"
                      ? "You can manage tournaments, brackets, and participant records."
                      : "You can browse tournaments, register, and compete in the arena."}
                  </p>
                </div>

                {(dbUser?.role === "tier1" || dbUser?.role === "tier2") && (
                  <Button
                    variant="outline"
                    className="w-full h-11 font-bold border-primary/40 text-primary hover:bg-primary/10 gap-2"
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    <ShieldCheck className="h-4 w-4" /> Go to Admin Panel
                  </Button>
                )}

                <Separator className="my-2" />

                <Button
                  variant="destructive"
                  className="w-full h-11 font-bold gap-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  onClick={async () => {
                    if (confirm("Are you sure you want to sign out?")) {
                      await signOut(auth);
                      router.push("/login");
                    }
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sign Out Account
                </Button>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card className="flex-1 border-border/40 bg-card/60 shadow-lg rounded-2xl overflow-hidden border-dashed">
              <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" /> Arena Activity
                </CardTitle>
                <CardDescription>Your tournament registrations.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 flex flex-col items-center justify-center gap-4 py-10 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">No Active Registrations</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Join a tournament to get started on your journey!</p>
                </div>
                <Button variant="secondary" className="gap-2 font-bold" onClick={() => router.push("/")}>
                  <Gamepad2 className="h-4 w-4" /> Browse Tournaments
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
