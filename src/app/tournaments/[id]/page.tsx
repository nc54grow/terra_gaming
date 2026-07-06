"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { supabase } from "@/lib/supabase-client";
import { getTournament, type Tournament } from "@/lib/tournament-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  IndianRupee,
  Users,
  ArrowLeft,
  Trophy,
  Loader2,
  Clock,
  Gamepad2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function TournamentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const tournamentId = params.id as string;

  useEffect(() => {
    let mounted = true;

    async function fetchTournamentDetails() {
      try {
        // Use the working getTournament function
        const data = await getTournament(tournamentId);

        if (!data) {
          toast.error("Tournament not found");
          router.push("/tournaments");
          return;
        }

        if (mounted) {
          setTournament(data);

          // Check if user is registered
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { data: registration } = await supabase
              .from("tournament_registrations")
              .select("id")
              .eq("tournament_id", tournamentId)
              .eq("user_id", userData.user.id)
              .maybeSingle();

            setIsRegistered(!!registration);
          }
        }
      } catch (error) {
        console.error("Error fetching tournament:", error);
        toast.error("Failed to load tournament details");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (tournamentId) {
      fetchTournamentDetails();
    }

    return () => {
      mounted = false;
    };
  }, [tournamentId, router]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Please login to register");
        return;
      }

      const { error } = await supabase.from("tournament_registrations").insert({
        tournament_id: tournamentId,
        user_id: userData.user.id,
        status: "pending",
      });

      if (error) throw error;
      setIsRegistered(true);
      toast.success("Successfully registered for tournament!");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to register for tournament");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell role="user" title="Loading..." subtitle="Please wait">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  if (!tournament) {
    return (
      <DashboardShell role="user" title="Tournament Not Found" subtitle="">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            The tournament you're looking for doesn't exist.
          </p>
          <Link href="/tournaments">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tournaments
            </Button>
          </Link>
        </Card>
      </DashboardShell>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-success/15 text-success";
      case "ongoing":
        return "bg-primary/15 text-primary";
      case "completed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-warning/15 text-warning";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <Calendar className="h-4 w-4" />;
      case "ongoing":
        return <Gamepad2 className="h-4 w-4" />;
      case "completed":
        return <Trophy className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <DashboardShell
      role="user"
      title={tournament.name}
      subtitle="Tournament Details"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/tournaments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </Button>
        </Link>

        {/* Tournament Info */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-border/60 bg-card/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {tournament.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(tournament.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(tournament.status)}
                        {tournament.status}
                      </span>
                    </Badge>
                    <Badge variant="outline">
                      {tournament.entry_type === "paid"
                        ? `₹${tournament.entry_fee}`
                        : "Free"}
                    </Badge>
                  </div>
                </div>
                {tournament.poster_url && (
                  <div className="h-20 w-20 rounded-lg overflow-hidden">
                    <img
                      src={tournament.poster_url}
                      alt={tournament.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Prize Pool</p>
                  <p className="flex items-center gap-1 font-semibold text-lg">
                    <IndianRupee className="h-4 w-4" />
                    {Number(tournament.prize_pool).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Slots</p>
                  <p className="flex items-center gap-1 font-semibold text-lg">
                    <Users className="h-4 w-4" />
                    {tournament.total_slots}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Rounds</p>
                  <p className="flex items-center gap-1 font-semibold text-lg">
                    <Trophy className="h-4 w-4" />
                    {tournament.total_rounds}
                  </p>
                </div>
              </div>

              {tournament.structure && tournament.structure.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Round Structure</h4>
                  <div className="space-y-2">
                    {tournament.structure.map((round, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm border-b border-border/40 pb-2"
                      >
                        <span className="font-medium">Round {round.round}</span>
                        <span className="text-muted-foreground">
                          {round.groups} groups · {round.teams_per_group}{" "}
                          teams/group · {round.matches_per_group} matches
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tournament.prize_distribution &&
                tournament.prize_distribution.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Prize Distribution
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {tournament.prize_distribution.map((prize, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded"
                        >
                          <span>{prize.label}</span>
                          <span className="font-semibold">
                            ₹{prize.amount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Registration Card */}
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Registration Start
                  </span>
                  <span className="font-medium">
                    {new Date(
                      tournament.registration_start,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Registration End
                  </span>
                  <span className="font-medium">
                    {new Date(tournament.registration_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entry Fee</span>
                  <span className="font-medium">
                    {tournament.entry_type === "paid"
                      ? `₹${tournament.entry_fee}`
                      : "Free"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Prize Pool
                  </span>
                  <span className="font-medium">
                    ₹{tournament.prize_pool.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button
                  className="w-full"
                  onClick={handleRegister}
                  disabled={
                    registering ||
                    isRegistered ||
                    tournament.status === "completed"
                  }
                >
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : isRegistered ? (
                    "✓ Registered"
                  ) : tournament.status === "completed" ? (
                    "Tournament Completed"
                  ) : tournament.status === "cancelled" ? (
                    "Tournament Cancelled"
                  ) : (
                    "Register Now"
                  )}
                </Button>

                {isRegistered && (
                  <p className="text-xs text-center text-success mt-2">
                    You are registered for this tournament!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function TournamentDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <TournamentDetailContent />
    </ProtectedRoute>
  );
}
