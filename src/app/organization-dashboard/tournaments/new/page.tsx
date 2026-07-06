"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader as Loader2,
  Trophy,
  Layers,
  Target,
  IndianRupee,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TransitionLink } from "@/components/TransitionLink";
import { createTournament } from "@/lib/tournament-api";
import type {
  RoundStructure,
  RoundQualification,
  PrizePlacement,
  PointsEntry,
} from "@/lib/tournament-api";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Tournament Details", icon: Trophy },
  { id: 2, label: "Tournament Structure", icon: Layers },
  { id: 3, label: "Qualification Criteria", icon: Target },
  { id: 4, label: "Prize Pool Distribution", icon: IndianRupee },
  { id: 5, label: "Points System", icon: Star },
];

const DEFAULT_PRIZE_LABELS = ["First", "Second", "Third", "Fourth", "Fifth"];

const DEFAULT_POINTS: PointsEntry[] = [
  { position: 1, points: 15 },
  { position: 2, points: 12 },
  { position: 3, points: 10 },
  { position: 4, points: 8 },
  { position: 5, points: 6 },
  { position: 6, points: 4 },
  { position: 7, points: 2 },
  { position: 8, points: 1 },
  { position: 9, points: 0 },
  { position: 10, points: 0 },
];

function TournamentCreateContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — details
  const [name, setName] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [entryType, setEntryType] = useState<"free" | "paid">("free");
  const [entryFee, setEntryFee] = useState("");
  const [totalSlots, setTotalSlots] = useState("");
  const [totalRounds, setTotalRounds] = useState("");
  const [regStart, setRegStart] = useState("");
  const [regEnd, setRegEnd] = useState("");

  // Step 2 — structure (per round)
  const [structure, setStructure] = useState<RoundStructure[]>([]);

  // Step 3 — qualification (per round)
  const [qualification, setQualification] = useState<RoundQualification[]>([]);

  // Step 4 — prize distribution
  const [prizeDistribution, setPrizeDistribution] = useState<PrizePlacement[]>(
    DEFAULT_PRIZE_LABELS.map((label, i) => ({
      position: i + 1,
      label,
      amount: 0,
    })),
  );

  // Step 5 — points system
  const [pointsSystem, setPointsSystem] =
    useState<PointsEntry[]>(DEFAULT_POINTS);

  function ensureRounds(nextRounds: number) {
    const n = Math.max(1, Math.min(20, nextRounds || 1));
    setStructure((prev) => {
      const next = [...prev];
      while (next.length < n) {
        next.push({
          round: next.length + 1,
          groups: 1,
          teams_per_group: 0,
          matches_per_group: 0,
        });
      }
      next.length = n;
      return next.map((r, i) => ({ ...r, round: i + 1 }));
    });
    setQualification((prev) => {
      const next = [...prev];
      while (next.length < n) {
        next.push({
          round: next.length + 1,
          teams_qualifying: 0,
          per_group: 0,
        });
      }
      next.length = n;
      return next.map((r, i) => ({ ...r, round: i + 1 }));
    });
  }

  function updateStructure(round: number, patch: Partial<RoundStructure>) {
    setStructure((prev) =>
      prev.map((r) => (r.round === round ? { ...r, ...patch } : r)),
    );
  }

  function updateQualification(
    round: number,
    patch: Partial<RoundQualification>,
  ) {
    setQualification((prev) =>
      prev.map((r) => (r.round === round ? { ...r, ...patch } : r)),
    );
  }

  function addPrizePlacement() {
    setPrizeDistribution((prev) => [
      ...prev,
      { position: prev.length + 1, label: "", amount: 0 },
    ]);
  }

  function updatePrizePlacement(
    position: number,
    patch: Partial<PrizePlacement>,
  ) {
    setPrizeDistribution((prev) =>
      prev.map((p) => (p.position === position ? { ...p, ...patch } : p)),
    );
  }

  function removePrizePlacement(position: number) {
    setPrizeDistribution((prev) =>
      prev
        .filter((p) => p.position !== position)
        .map((p, i) => ({ ...p, position: i + 1 })),
    );
  }

  function updatePoints(position: number, points: number) {
    setPointsSystem((prev) =>
      prev.map((p) => (p.position === position ? { ...p, points } : p)),
    );
  }

  function addPointsRow() {
    setPointsSystem((prev) => [
      ...prev,
      { position: prev.length + 1, points: 0 },
    ]);
  }

  function removePointsRow(position: number) {
    setPointsSystem((prev) =>
      prev
        .filter((p) => p.position !== position)
        .map((p, i) => ({ ...p, position: i + 1 })),
    );
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!name.trim()) return "Tournament name is required";
      if (!totalSlots || Number(totalSlots) <= 0)
        return "Total slots must be greater than 0";
      if (!totalRounds || Number(totalRounds) <= 0)
        return "Number of rounds must be greater than 0";
      if (!regStart || !regEnd) return "Registration dates are required";
      if (new Date(regEnd) <= new Date(regStart))
        return "Registration end must be after start";
      if (entryType === "paid" && (!entryFee || Number(entryFee) <= 0))
        return "Entry fee is required for paid tournaments";
    }
    if (s === 2) {
      for (const r of structure) {
        if (r.groups <= 0) return `Round ${r.round}: groups must be > 0`;
        if (r.teams_per_group <= 0)
          return `Round ${r.round}: teams per group must be > 0`;
        if (r.matches_per_group < 0)
          return `Round ${r.round}: matches per group cannot be negative`;
      }
    }
    if (s === 3) {
      for (const q of qualification) {
        if (q.teams_qualifying < 0)
          return `Round ${q.round}: qualifying teams cannot be negative`;
        if (q.per_group < 0)
          return `Round ${q.round}: per-group qualifiers cannot be negative`;
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    if (step === 1) {
      ensureRounds(Number(totalRounds));
    }
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    const err = validateStep(1) || validateStep(2) || validateStep(3);
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      await createTournament({
        name: name.trim(),
        poster_url: null,
        entry_type: entryType,
        entry_fee: entryType === "paid" ? Number(entryFee) : 0,
        prize_pool: Number(prizePool) || 0,
        total_slots: Number(totalSlots),
        total_rounds: Number(totalRounds),
        registration_start: new Date(regStart).toISOString(),
        registration_end: new Date(regEnd).toISOString(),
        structure,
        qualification,
        prize_distribution: prizeDistribution,
        points_system: pointsSystem,
      });
      toast.success("Tournament created successfully");
      router.push("/organization-dashboard");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to create tournament",
      );
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell
      role="organization"
      title="Host a Tournament"
      subtitle="Create a new tournament in 5 quick steps."
    >
      <TransitionLink
        href="/organization-dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </TransitionLink>

      {/* Stepper */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-warning/50 bg-warning/10 text-warning"
                    : done
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border bg-card/50 text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {s.id}. {s.label}
                </span>
                <span className="sm:hidden">{s.id}</span>
                {done && <Check className="h-3.5 w-3.5" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px w-4 bg-border sm:w-8" />
              )}
            </div>
          );
        })}
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {(() => {
              const Icon = STEPS[step - 1].icon;
              return <Icon className="h-5 w-5 text-warning" />;
            })()}
            Step {step}: {STEPS[step - 1].label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* STEP 1 — Tournament Details */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Tournament Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BGMI Pro League Season 1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizePool">Prize Pool (₹)</Label>
                <Input
                  id="prizePool"
                  type="number"
                  min={0}
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Entry Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={entryType === "free" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEntryType("free")}
                  >
                    Free
                  </Button>
                  <Button
                    type="button"
                    variant={entryType === "paid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEntryType("paid")}
                  >
                    Paid
                  </Button>
                </div>
              </div>

              {entryType === "paid" && (
                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee (₹)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min={0}
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="totalSlots">Total Slots</Label>
                <Input
                  id="totalSlots"
                  type="number"
                  min={1}
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                  placeholder="e.g. 100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalRounds">Number of Rounds</Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min={1}
                  max={20}
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  placeholder="e.g. 5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regStart">Registration Start</Label>
                <Input
                  id="regStart"
                  type="datetime-local"
                  value={regStart}
                  onChange={(e) => setRegStart(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regEnd">Registration End</Label>
                <Input
                  id="regEnd"
                  type="datetime-local"
                  value={regEnd}
                  onChange={(e) => setRegEnd(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Tournament poster:
                  </span>{" "}
                  optional — leave as null for now. Image upload will be added
                  later.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — Tournament Structure */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {Number(totalRounds) || 0} round
                {Number(totalRounds) === 1 ? "" : "s"} configured. Set groups,
                teams per group, and matches per group for each round.
              </p>
              {structure.map((r) => (
                <div
                  key={r.round}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className="bg-warning/15 text-warning">
                      Round {r.round}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Groups</Label>
                      <Input
                        type="number"
                        min={1}
                        value={r.groups}
                        onChange={(e) =>
                          updateStructure(r.round, {
                            groups: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teams per Group</Label>
                      <Input
                        type="number"
                        min={1}
                        value={r.teams_per_group}
                        onChange={(e) =>
                          updateStructure(r.round, {
                            teams_per_group: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Matches per Group</Label>
                      <Input
                        type="number"
                        min={0}
                        value={r.matches_per_group}
                        onChange={(e) =>
                          updateStructure(r.round, {
                            matches_per_group: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Max teams in round {r.round}: {r.groups * r.teams_per_group}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 — Qualification Criteria */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define how many teams qualify from each round (e.g. 44 teams
                qualify from round 1 — top 11 from each of 4 groups).
              </p>
              {qualification.map((q) => (
                <div
                  key={q.round}
                  className="rounded-lg border border-border/60 bg-muted/20 p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Badge className="bg-primary/15 text-primary">
                      Round {q.round}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Teams Qualifying (total)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={q.teams_qualifying}
                        onChange={(e) =>
                          updateQualification(q.round, {
                            teams_qualifying: Number(e.target.value),
                          })
                        }
                        placeholder="e.g. 44"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Per Group (top N)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={q.per_group}
                        onChange={(e) =>
                          updateQualification(q.round, {
                            per_group: Number(e.target.value),
                          })
                        }
                        placeholder="e.g. 11"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4 — Prize Pool Distribution */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Distribute the prize pool (₹
                {Number(prizePool).toLocaleString("en-IN") || 0}) across
                placements. Add more placements as needed.
              </p>
              <div className="space-y-3">
                {prizeDistribution.map((p) => (
                  <div
                    key={p.position}
                    className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label>Position {p.position} Label</Label>
                      <Input
                        value={p.label}
                        onChange={(e) =>
                          updatePrizePlacement(p.position, {
                            label: e.target.value,
                          })
                        }
                        placeholder={`e.g. ${DEFAULT_PRIZE_LABELS[p.position - 1] || "Placement"}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={p.amount}
                        onChange={(e) =>
                          updatePrizePlacement(p.position, {
                            amount: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removePrizePlacement(p.position)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPrizePlacement}
              >
                Add Placement
              </Button>
            </div>
          )}

          {/* STEP 5 — Points System */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pre-filled points per placement. Edit any value or add more.
              </p>
              <div className="space-y-3">
                {pointsSystem.map((p) => (
                  <div
                    key={p.position}
                    className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input
                        type="number"
                        value={p.position}
                        disabled
                        className="opacity-60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min={0}
                        value={p.points}
                        onChange={(e) =>
                          updatePoints(p.position, Number(e.target.value))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removePointsRow(p.position)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPointsRow}
              >
                Add Position
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 1 || submitting}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            {step < 5 ? (
              <Button type="button" onClick={next} disabled={submitting}>
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="glow-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Trophy className="mr-1.5 h-4 w-4" />
                    Create Tournament
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export default function TournamentNewPage() {
  return (
    <ProtectedRoute allowedRoles={["organization"]}>
      <TournamentCreateContent />
    </ProtectedRoute>
  );
}
