"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, IndianRupee, Users, Search, ListFilter as Filter, Trophy, ChevronRight, Grid3x3, List, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { listTournaments, type Tournament } from "@/lib/tournament-api";

// Tournament Card Component
function TournamentCard({ tournament }: { tournament: Tournament }) {
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

  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className="group border-border/60 bg-card/50 transition-all duration-200 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 cursor-pointer h-full">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                {tournament.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tournament.total_rounds} rounds · {tournament.total_slots}{" "}
                slots
              </p>
            </div>
            <Badge className={getStatusColor(tournament.status)}>
              {tournament.status}
            </Badge>
          </div>

          <div className="mt-auto pt-3 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {Number(tournament.prize_pool).toLocaleString("en-IN")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {tournament.total_slots}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(tournament.registration_start).toLocaleDateString()}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {tournament.entry_type === "paid" && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Entry: ₹{tournament.entry_fee}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Skeleton Loader
function TournamentSkeleton() {
  return (
    <Card className="border-border/60 bg-card/50 animate-pulse">
      <CardContent className="p-5">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-3">
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-12" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
          <div className="h-4 w-4 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

function TournamentsContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Use the same working listTournaments function
  useEffect(() => {
    let mounted = true;
    listTournaments()
      .then((data) => mounted && setTournaments(data))
      .catch(() => mounted && setTournaments([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Filter tournaments
  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status counts
  const statusCounts = tournaments.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <DashboardShell
      role="user"
      title="Tournaments"
      subtitle="Browse and join tournaments"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{tournaments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-success">
              {statusCounts.published || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ongoing</p>
            <p className="text-2xl font-bold text-primary">
              {statusCounts.ongoing || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {statusCounts.completed || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <TournamentSkeleton key={i} />
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/30 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-muted/50 p-4">
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Tournaments Found</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "No tournaments are available at the moment. Check back later!"}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-4"
          }
        >
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && filteredTournaments.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          Showing {filteredTournaments.length} of {tournaments.length}{" "}
          tournaments
        </p>
      )}
    </DashboardShell>
  );
}

export default function TournamentsPage() {
  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <TournamentsContent />
    </ProtectedRoute>
  );
}
