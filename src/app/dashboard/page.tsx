import { Trophy, Swords, Users, Crosshair } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import StatCard from "@/components/dashboard/stat-card";
import { useAuth } from "@/contexts/AuthContext";

const ACTIVITY = [
  { title: "Squad wiped in Erangel Finals", tag: "Match", time: "2h ago" },
  {
    title: "Registered for Winter Clash Cup",
    tag: "Tournament",
    time: "6h ago",
  },
  { title: "GhostFire joined your squad", tag: "Team", time: "1d ago" },
  { title: "Chicken Dinner on Miramar", tag: "Match", time: "2d ago" },
];

export default function DashboardHomePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Command Center"
        title="Welcome Back, Commander"
        blurb="Your battleground at a glance — track your squad, upcoming clashes, and recent drops."
      />

      <div className="px-8 py-8 md:px-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Matches"
            value="248"
            detail="+12 this week"
            icon={Swords}
          />
          <StatCard
            label="Wins"
            value="63"
            detail="25% win rate"
            icon={Trophy}
          />
          <StatCard
            label="Squad Rank"
            value="#14"
            detail="Regional ladder"
            icon={Users}
          />
          <StatCard
            label="Avg. Kills"
            value="7.2"
            detail="Per match"
            icon={Crosshair}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="mb-4 font-display text-2xl tracking-wide text-[#F0EBE1]">
              Recent Activity
            </h2>
            <div className="divide-y divide-[#2A251E] border border-[#2A251E] bg-[#232019]">
              {ACTIVITY.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="h-8 w-0.5 bg-[#C84B1F]" />
                    <div>
                      <p className="text-sm font-medium text-[#F0EBE1]">
                        {item.title}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A8175]">
                        {item.tag}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#6B6459]">{item.time}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-2xl tracking-wide text-[#F0EBE1]">
              Next Drop
            </h2>
            <div className="relative border border-[#2A251E] bg-[#232019] p-6">
              <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C84B1F]">
                Live Soon
              </p>
              <p className="mt-3 font-display text-3xl tracking-wide text-[#F0EBE1]">
                Winter Clash Cup
              </p>
              <p className="mt-2 text-sm text-[#8A8175]">
                Erangel · Squads · Round of 16
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-[#F0EBE1]">
                <span className="font-display text-4xl tracking-wide">02</span>
                <span className="text-xs uppercase tracking-widest text-[#8A8175]">
                  days
                </span>
                <span className="mx-1 font-display text-4xl tracking-wide">
                  14
                </span>
                <span className="text-xs uppercase tracking-widest text-[#8A8175]">
                  hrs
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { ProtectedRoute } from "@/components/ProtectedRoute";
// import { DashboardShell } from "@/components/DashboardShell";
// import { useAuth } from "@/contexts/AuthContext";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { supabase } from "@/lib/supabase-client";
// import { useState, useEffect } from "react";
// import { toast } from "sonner";
// import { Calendar, IndianRupee, Users, ChevronRight } from "lucide-react";
// import { listTournaments, type Tournament } from "@/lib/tournament-api";
// import Link from "next/link";

// function UserDashboardContent() {
//   const { user, profile, refreshRole } = useAuth();
//   const [displayName, setDisplayName] = useState("");
//   const [saving, setSaving] = useState(false);
//   const [tournaments, setTournaments] = useState<Tournament[]>([]);
//   const [loadingTournaments, setLoadingTournaments] = useState(true);

//   const userProfile = profile as {
//     display_name?: string;
//     avatar_url?: string;
//     email?: string;
//     created_at?: string;
//   } | null;

//   useEffect(() => {
//     setDisplayName(userProfile?.display_name || "");
//   }, [userProfile]);

//   // Use the same working listTournaments function
//   useEffect(() => {
//     let mounted = true;
//     listTournaments()
//       .then((data) => {
//         if (mounted) {
//           // Show only published and ongoing tournaments on dashboard
//           const filtered = data.filter(
//             (t) => t.status === "published" || t.status === "ongoing",
//           );
//           setTournaments(filtered.slice(0, 4)); // Show only 4
//         }
//       })
//       .catch(() => mounted && setTournaments([]))
//       .finally(() => mounted && setLoadingTournaments(false));
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   async function handleSaveProfile() {
//     setSaving(true);
//     try {
//       const { error } = await supabase
//         .from("tg_users")
//         .update({
//           display_name: displayName || null,
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", user!.id);
//       if (error) throw error;
//       await refreshRole();
//       toast.success("Profile updated successfully");
//     } catch {
//       toast.error("Failed to update profile");
//     } finally {
//       setSaving(false);
//     }
//   }

//   const initials =
//     (userProfile?.display_name || userProfile?.email || "U")
//       .split("@")[0]
//       .split(/[\s._-]/)
//       .filter(Boolean)
//       .slice(0, 2)
//       .map((s) => s[0]?.toUpperCase())
//       .join("") || "U";

//   return (
//     <DashboardShell
//       role="user"
//       title={`Welcome back, ${userProfile?.display_name || userProfile?.email?.split("@")[0] || "Gamer"}`}
//       subtitle="Your gaming stats, recent activity, and profile management."
//     >
//       {/* Profile banner */}
//       <Card className="mb-8 overflow-hidden border-border/60 bg-card/50">
//         <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20" />
//         <CardContent className="relative -mt-12 pb-6">
//           <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
//             <Avatar className="h-24 w-24 border-4 border-card bg-secondary">
//               <AvatarImage src={userProfile?.avatar_url || undefined} />
//               <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
//                 {initials}
//               </AvatarFallback>
//             </Avatar>
//             <div className="flex-1 pb-2">
//               <h2 className="text-xl font-bold">
//                 {userProfile?.display_name || "Unnamed Gamer"}
//               </h2>
//               <p className="text-sm text-muted-foreground">
//                 {userProfile?.email}
//               </p>
//               <Badge
//                 className="mt-2 bg-primary/10 text-primary hover:bg-primary/20"
//                 variant="secondary"
//               >
//                 Registered User
//               </Badge>
//             </div>
//             <div className="pb-2 text-sm text-muted-foreground">
//               Member since{" "}
//               {userProfile?.created_at
//                 ? new Date(userProfile.created_at).toLocaleDateString()
//                 : "—"}
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Profile settings */}
//       <Card className="mb-8 border-border/60 bg-card/50">
//         <CardHeader>
//           <CardTitle className="text-lg">Profile Settings</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//             <div className="space-y-2">
//               <Label htmlFor="display-name">Display Name</Label>
//               <Input
//                 id="display-name"
//                 value={displayName}
//                 onChange={(e) => setDisplayName(e.target.value)}
//                 placeholder="Your gamer tag"
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="email">Email</Label>
//               <Input
//                 id="email"
//                 value={userProfile?.email || ""}
//                 disabled
//                 className="opacity-60"
//               />
//             </div>
//           </div>
//           <div className="mt-4">
//             <Button onClick={handleSaveProfile} disabled={saving}>
//               {saving ? "Saving..." : "Save Changes"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Tournaments Section */}
//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <h3 className="text-lg font-semibold">Recent Tournaments</h3>
//           <Link href="/tournaments">
//             <Button variant="ghost" size="sm" className="text-primary">
//               View All
//               <ChevronRight className="ml-1 h-4 w-4" />
//             </Button>
//           </Link>
//         </div>

//         {loadingTournaments ? (
//           <Card className="border-border/60 bg-card/50">
//             <CardContent className="flex items-center justify-center py-12">
//               <p className="text-sm text-muted-foreground">
//                 Loading tournaments...
//               </p>
//             </CardContent>
//           </Card>
//         ) : tournaments.length === 0 ? (
//           <Card className="border-dashed border-border/60 bg-card/30 p-8 text-center">
//             <div className="flex flex-col items-center gap-2">
//               <div className="rounded-full bg-muted/50 p-3">
//                 <Calendar className="h-6 w-6 text-muted-foreground" />
//               </div>
//               <h4 className="font-medium">No Tournaments Available</h4>
//               <p className="text-sm text-muted-foreground">
//                 Check back later for new tournaments to join!
//               </p>
//             </div>
//           </Card>
//         ) : (
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
//             {tournaments.map((t) => (
//               <Link key={t.id} href={`/tournaments/${t.id}`}>
//                 <Card className="group border-border/60 bg-card/50 transition-colors hover:border-primary/40 hover:shadow-md cursor-pointer">
//                   <CardContent className="p-5">
//                     <div className="flex items-start justify-between gap-2">
//                       <div className="min-w-0">
//                         <p className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
//                           {t.name}
//                         </p>
//                         <p className="text-xs text-muted-foreground mt-0.5">
//                           {t.total_rounds} rounds · {t.total_slots} slots
//                         </p>
//                       </div>
//                       <Badge
//                         variant="secondary"
//                         className={
//                           t.status === "published"
//                             ? "bg-success/15 text-success"
//                             : t.status === "ongoing"
//                               ? "bg-primary/15 text-primary"
//                               : t.status === "completed"
//                                 ? "bg-muted text-muted-foreground"
//                                 : "bg-warning/15 text-warning"
//                         }
//                       >
//                         {t.status}
//                       </Badge>
//                     </div>
//                     <div className="mt-4 flex items-center justify-between">
//                       <div className="flex items-center gap-4 text-xs text-muted-foreground">
//                         <span className="flex items-center gap-1">
//                           <IndianRupee className="h-3.5 w-3.5" />
//                           {Number(t.prize_pool).toLocaleString("en-IN")}
//                         </span>
//                         <span className="flex items-center gap-1">
//                           <Users className="h-3.5 w-3.5" />
//                           {t.total_slots}
//                         </span>
//                         <span className="flex items-center gap-1">
//                           <Calendar className="h-3.5 w-3.5" />
//                           {new Date(t.registration_start).toLocaleDateString()}
//                         </span>
//                       </div>
//                       <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </DashboardShell>
//   );
// }

// export default function UserDashboardPage() {
//   return (
//     <ProtectedRoute allowedRoles={["user"]}>
//       <UserDashboardContent />
//     </ProtectedRoute>
//   );
// }
