"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Crown,
  Copy,
  Check,
  Clock,
  Circle as XCircle,
  CircleCheck as CheckCircle,
  X,
  Loader as Loader2,
  Mail,
  Hash,
  LogOut,
  CircleAlert as AlertCircle,
  Shield,
} from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyTeamContext,
  createTeam,
  requestJoinTeam,
  cancelJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  recruitByPlayerCode,
  recruitByEmail,
  leaveTeam,
  ensurePlayerCode,
  type Team,
  type TeamMember,
  disbandTeam,
  transferOwnership,
  getPendingInvitations,
  rejectInvitation,
  acceptInvitation,
  getSentInvitations, // Add this import
} from "@/lib/team-api";
import { toast } from "sonner";
import { getTeamStats } from "@/lib/team-api";
import { LeaveOptionsModal } from "@/components/LeaveOptionsModal";
import { DisbandTeamModal } from "@/components/DisbandTeamModal";
import { TransferOwnershipModal } from "@/components/TransferOwnershipModal";

type RecruitMode = "code" | "email";

export default function TeamPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
  const [myRole, setMyRole] = useState<"owner" | "member" | null>(null);
  const [myPlayerCode, setMyPlayerCode] = useState<string | null>(null);
  const [joinRequest, setJoinRequest] = useState<{
    status: "pending" | "rejected" | null;
    team: Team | null;
    createdAt: string | null;
  }>({ status: null, team: null, createdAt: null });

  // Modal state
  const [showLeaveOptions, setShowLeaveOptions] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [recruitMode, setRecruitMode] = useState<RecruitMode>("code");
  const [recruitCode, setRecruitCode] = useState("");
  const [recruitEmail, setRecruitEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [teamStats, setTeamStats] = useState<{
    mainMembers: number;
    substitutes: number;
  }>({ mainMembers: 0, substitutes: 0 });
  const [isTeamFull, setIsTeamFull] = useState(false);

  // Add state for pending invitation
  const [pendingInvitation, setPendingInvitation] = useState<{
    team_id: string;
    team_name: string;
    team_code: string;
    invited_by?: string; // Make optional
    invited_by_name?: string; // Make optional
    created_at: string;
  } | null>(null);

  // Add state for sent invitations (owner only)
  const [sentInvitations, setSentInvitations] = useState<
    {
      id: string;
      email: string;
      display_name: string;
      created_at: string;
    }[]
  >([]);

  const [refreshKey, setRefreshKey] = useState(0);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      const ctx = await getMyTeamContext();
      setTeam(ctx.team);
      setMembers(ctx.members);
      setPendingRequests(ctx.pendingRequests);
      setMyRole(ctx.myRole);
      setMyPlayerCode(ctx.myPlayerCode);
      setJoinRequest(ctx.myJoinRequest);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingInvitation = useCallback(async () => {
    try {
      const invites = await getPendingInvitations();
      if (invites.length > 0) {
        setPendingInvitation(invites[0]);
      } else {
        setPendingInvitation(null);
      }
    } catch (error) {
      console.error("Error fetching pending invitation:", error);
    }
  }, []);

  const fetchSentInvitations = useCallback(async () => {
    if (!team?.id || myRole !== "owner") {
      setSentInvitations([]);
      return;
    }
    try {
      const invites = await getSentInvitations(team.id);
      setSentInvitations(invites);
    } catch (error) {
      console.error("Error fetching sent invitations:", error);
    }
  }, [team?.id, myRole]);

  const refreshData = useCallback(async () => {
    await fetchContext();
    await fetchPendingInvitation();
    await fetchSentInvitations();
    setRefreshKey((prev) => prev + 1);
  }, [fetchContext, fetchPendingInvitation, fetchSentInvitations]);

  // Single useEffect for initial data fetching
  useEffect(() => {
    if (user?.id) {
      ensurePlayerCode(user.id).catch(() => {});
      refreshData();
    } else {
      setLoading(false);
    }
  }, [user?.id, refreshData]);

  // Fetch team stats when team changes
  useEffect(() => {
    if (team?.id) {
      getTeamStats(team.id).then((stats) => {
        setIsTeamFull(stats.mainMembers + stats.substitutes >= 6);
      });
    }
  }, [team]);

  // Handle functions
  const handleAcceptInvitation = async (teamId: string) => {
    setActionLoading(true);
    try {
      await acceptInvitation(teamId);
      toast.success("You have joined the team!");
      setPendingInvitation(null);
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectInvitation = async () => {
    setActionLoading(true);
    try {
      await rejectInvitation();
      toast.success("Invitation rejected");
      setPendingInvitation(null);
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject invitation");
    } finally {
      setActionLoading(false);
    }
  };

  async function handleCreate() {
    if (!createName.trim()) {
      toast.error("Team name is required");
      return;
    }
    setActionLoading(true);
    try {
      await createTeam(createName);
      toast.success("Team created successfully");
      setCreateOpen(false);
      setCreateName("");
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) {
      toast.error("Team code is required");
      return;
    }
    setActionLoading(true);
    try {
      const t = await requestJoinTeam(joinCode);
      toast.success(`Request sent to join ${t.name}`);
      setJoinOpen(false);
      setJoinCode("");
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join team");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRequest() {
    setActionLoading(true);
    try {
      await cancelJoinRequest();
      toast.success("Join request cancelled");
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove(memberId: string) {
    setActionLoading(true);
    try {
      await approveJoinRequest(memberId);
      toast.success("Member approved and added to team");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await refreshData();
    } catch (err) {
      console.error("Approval error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(memberId: string) {
    setActionLoading(true);
    try {
      await rejectJoinRequest(memberId);
      toast.success("Request rejected");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRecruit() {
    setActionLoading(true);
    try {
      if (recruitMode === "code") {
        if (!recruitCode.trim()) {
          toast.error("Player code is required");
          setActionLoading(false);
          return;
        }
        await recruitByPlayerCode(recruitCode);
        toast.success("Invitation sent");
      } else {
        if (!recruitEmail.trim()) {
          toast.error("Email is required");
          setActionLoading(false);
          return;
        }
        await recruitByEmail(recruitEmail);
        toast.success("Invitation sent");
      }
      setRecruitOpen(false);
      setRecruitCode("");
      setRecruitEmail("");
      await refreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to recruit");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    try {
      await leaveTeam();
      toast.success("You left the team");
      setLeaveOpen(false);
      setTeam(null);
      setMembers([]);
      setPendingRequests([]);
      setMyRole(null);
      await refreshData();
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave team");
    } finally {
      setActionLoading(false);
    }
  }

  const handleLeaveClick = () => {
    if (myRole === "owner" && members.length > 1) {
      setShowLeaveOptions(true);
    } else {
      setLeaveOpen(true);
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    try {
      await transferOwnership(newOwnerId);
      toast.success(
        "Ownership transferred successfully. You are now a member.",
      );
      await refreshData();
      setLeaveOpen(true);
    } catch (error: any) {
      console.error("Error transferring ownership:", error);
      toast.error(error.message || "Failed to transfer ownership");
      throw error;
    }
  };

  const handleDisbandTeam = async () => {
    try {
      await disbandTeam();
      toast.success("Team has been disbanded");
      setTeam(null);
      setMembers([]);
      setPendingRequests([]);
      setMyRole(null);
      await refreshData();
      window.location.reload();
    } catch (error: any) {
      console.error("Error disbanding team:", error);
      toast.error(error.message || "Failed to disband team");
      throw error;
    }
  };

  function copyCode() {
    if (!team?.code) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyPlayerCode() {
    if (!myPlayerCode) return;
    navigator.clipboard.writeText(myPlayerCode);
    toast.success("Player code copied");
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          eyebrow="Squad"
          title="Your Team"
          blurb="Manage your roster, roles, and recruit new operators for the drop zone."
        />
        <div className="flex items-center justify-center px-8 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#C84B1F]" />
        </div>
      </div>
    );
  }

  return (
    <div key={refreshKey}>
      <PageHeader
        eyebrow="Squad"
        title="Your Team"
        blurb="Manage your roster, roles, and recruit new operators for the drop zone."
      />
      <div className="px-8 py-8 md:px-12">
        {/* ===== PENDING INVITATION ===== */}
        {!team && pendingInvitation && (
          <div className="mx-auto max-w-2xl">
            <div className="relative border border-[#C84B1F]/40 bg-[#C84B1F]/5 p-8">
              <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#C84B1F]/15">
                  <Users size={24} className="text-[#C84B1F]" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl tracking-wide text-[#F0EBE1]">
                    Team Invitation
                  </h2>
                  <p className="mt-1 text-sm text-[#8A8175]">
                    You've been invited to join{" "}
                    <span className="text-[#F0EBE1]">
                      {pendingInvitation.team_name}
                    </span>
                  </p>

                  <div className="mt-5 border border-[#2A251E] bg-[#1D1A15] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#F0EBE1]">
                          {pendingInvitation.team_name}
                        </p>
                        <p className="mt-1 font-mono text-xs tracking-widest text-[#C84B1F]">
                          {pendingInvitation.team_code}
                        </p>
                        <p className="mt-2 text-xs text-[#8A8175]">
                          Invited by: {pendingInvitation.invited_by_name}
                        </p>
                        {pendingInvitation.created_at && (
                          <p className="mt-1 text-[10px] text-[#6B6459]">
                            Invited{" "}
                            {new Date(
                              pendingInvitation.created_at,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() =>
                        handleAcceptInvitation(pendingInvitation.team_id)
                      }
                      disabled={actionLoading}
                      className="flex-1 bg-[#C84B1F] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-[#F0EBE1] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Accept Invitation"
                      )}
                    </button>
                    <button
                      onClick={handleRejectInvitation}
                      disabled={actionLoading}
                      className="flex-1 border border-red-500/40 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== NO TEAM + NO PENDING REQUEST ===== */}
        {!team && !pendingInvitation && joinRequest.status !== "pending" && (
          <div className="mx-auto max-w-2xl">
            <div className="relative border border-[#2A251E] bg-[#232019] p-10 text-center">
              <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center bg-[#C84B1F]/10">
                <Users size={32} className="text-[#C84B1F]" />
              </div>
              <h2 className="font-display text-3xl tracking-wide text-[#F0EBE1]">
                No Squad Yet
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#8A8175]">
                You haven&apos;t joined a team. Create a new squad or join an
                existing one with a team code.
              </p>

              {joinRequest.status === "rejected" && (
                <div className="mt-6 flex items-center justify-center gap-2 border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <AlertCircle size={16} />
                  Your last join request was rejected. Try another team.
                </div>
              )}

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="bg-[#C84B1F] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#F0EBE1] transition-opacity hover:opacity-90"
                  style={{ clipPath: "polygon(0 0,100% 0,96% 100%,0 100%)" }}
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={16} />
                    Create New Team
                  </span>
                </button>
                <button
                  onClick={() => setJoinOpen(true)}
                  className="border border-[#3A352D] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#F0EBE1] transition-colors hover:bg-[#C84B1F] hover:border-[#C84B1F]"
                >
                  <span className="flex items-center gap-2">
                    <Hash size={16} />
                    Join Team
                  </span>
                </button>
              </div>

              {myPlayerCode && (
                <div className="mt-8 border-t border-[#2A251E] pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B6459]">
                    Your Player Code
                  </p>
                  <button
                    onClick={copyPlayerCode}
                    className="mt-2 inline-flex items-center gap-2 bg-[#1D1A15] px-4 py-2 font-mono text-lg tracking-widest text-[#C84B1F] transition-colors hover:bg-[#2A251E]"
                  >
                    {myPlayerCode}
                    <Copy size={14} className="text-[#6B6459]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== PENDING JOIN REQUEST ===== */}
        {!team && joinRequest.status === "pending" && (
          <div className="mx-auto max-w-2xl">
            <div className="relative border border-yellow-600/40 bg-yellow-600/5 p-8">
              <span className="absolute left-0 top-0 h-full w-0.5 bg-yellow-600" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-yellow-600/15">
                  <Clock size={24} className="text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl tracking-wide text-[#F0EBE1]">
                    Request Pending
                  </h2>
                  <p className="mt-1 text-sm text-[#8A8175]">
                    Waiting for approval from the team owner.
                  </p>

                  {joinRequest.team && (
                    <div className="mt-5 border border-[#2A251E] bg-[#1D1A15] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#F0EBE1]">
                            {joinRequest.team.name}
                          </p>
                          <p className="mt-1 font-mono text-xs tracking-widest text-[#C84B1F]">
                            {joinRequest.team.code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                          <Clock size={14} />
                          Pending
                        </div>
                      </div>
                      {joinRequest.createdAt && (
                        <p className="mt-3 text-[10px] uppercase tracking-wider text-[#6B6459]">
                          Requested{" "}
                          {new Date(joinRequest.createdAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleCancelRequest}
                    disabled={actionLoading}
                    className="mt-5 flex items-center gap-2 border border-red-500/40 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                    Cancel Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== TEAM DASHBOARD ===== */}
        {team && (
          <div className="space-y-8">
            {/* Team header */}
            <div className="relative border border-[#2A251E] bg-[#232019] p-6 md:p-8">
              <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center bg-[#C84B1F]/10">
                      <Shield size={28} className="text-[#C84B1F]" />
                    </div>
                    <div>
                      <h2 className="font-display text-3xl tracking-wide text-[#F0EBE1]">
                        {team.name}
                      </h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#6B6459]">
                        {members.length} Member
                        {members.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B6459]">
                      Team Code
                    </p>
                    <button
                      onClick={copyCode}
                      className="mt-1 flex items-center gap-2 bg-[#1D1A15] px-4 py-2.5 font-mono text-xl tracking-widest text-[#C84B1F] transition-colors hover:bg-[#2A251E]"
                    >
                      {team.code}
                      {copied ? (
                        <Check size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} className="text-[#6B6459]" />
                      )}
                    </button>
                  </div>
                  {myPlayerCode && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B6459]">
                        Your Player Code
                      </p>
                      <button
                        onClick={copyPlayerCode}
                        className="mt-1 flex items-center gap-2 bg-[#1D1A15] px-3 py-1.5 font-mono text-sm tracking-widest text-[#8A8175] transition-colors hover:bg-[#2A251E]"
                      >
                        {myPlayerCode}
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-3 border-t border-[#2A251E] pt-6">
                <button
                  onClick={() => setRecruitOpen(true)}
                  disabled={isTeamFull}
                  className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] ${
                    isTeamFull
                      ? "bg-[#2A251E] text-[#6B6459] cursor-not-allowed"
                      : "bg-[#C84B1F] text-[#F0EBE1] hover:opacity-90"
                  }`}
                >
                  <UserPlus size={14} />
                  {isTeamFull ? "Team Full" : "Recruit"}
                </button>
                <button
                  onClick={handleLeaveClick}
                  className="flex items-center gap-2 border border-[#3A352D] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:border-red-500 hover:text-red-400"
                >
                  <LogOut size={14} />
                  Leave Team
                </button>
              </div>
            </div>

            {/* Show sent invitations (owner only) */}
            {myRole === "owner" && sentInvitations.length > 0 && (
              <div className="relative border border-[#2A251E] bg-[#232019] p-4">
                <span className="absolute left-0 top-0 h-full w-0.5 bg-yellow-500" />
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#F0EBE1]">
                  <Clock size={16} className="text-yellow-500" />
                  Pending Invitations ({sentInvitations.length})
                </h4>
                <div className="space-y-2">
                  {sentInvitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between border border-[#2A251E] bg-[#1D1A15] p-3"
                    >
                      <div>
                        <p className="text-sm text-[#F0EBE1]">
                          {invite.display_name || invite.email}
                        </p>
                        <p className="text-xs text-[#8A8175]">
                          Invited {new Date(invite.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-yellow-500">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Approvals (owner only) */}
            {myRole === "owner" && pendingRequests.length > 0 && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 font-display text-2xl tracking-wide text-[#F0EBE1]">
                  <Clock size={20} className="text-yellow-500" />
                  Pending Approvals
                  <span className="bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-500">
                    {pendingRequests.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="relative flex flex-col gap-4 border border-yellow-600/30 bg-yellow-600/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center bg-yellow-600/15">
                          <Users size={18} className="text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#F0EBE1]">
                            {req.display_name || req.email.split("@")[0]}
                          </p>
                          <p className="text-xs text-[#8A8175]">{req.email}</p>
                          {req.player_code && (
                            <p className="mt-0.5 font-mono text-[10px] tracking-widest text-[#6B6459]">
                              {req.player_code}
                            </p>
                          )}
                          {req.join_request_created_at && (
                            <p className="mt-0.5 text-[10px] text-[#6B6459]">
                              {new Date(
                                req.join_request_created_at,
                              ).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 bg-green-600/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-green-500 transition-colors hover:bg-green-600 hover:text-white disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 bg-red-600/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-400 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roster */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 font-display text-2xl tracking-wide text-[#F0EBE1]">
                <Users size={20} className="text-[#C84B1F]" />
                Roster
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="relative border border-[#2A251E] bg-[#232019] p-4"
                  >
                    {m.team_role === "owner" && (
                      <span className="absolute right-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center bg-[#1D1A15]">
                        <span className="text-sm font-bold text-[#C84B1F]">
                          {(m.display_name || m.email)
                            .split("@")[0]
                            .split(/[\s._-]/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((s) => s[0]?.toUpperCase())
                            .join("") || "?"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-[#F0EBE1]">
                            {m.display_name || m.email.split("@")[0]}
                          </p>
                          {m.team_role === "owner" && (
                            <Crown
                              size={14}
                              className="shrink-0 text-[#C84B1F]"
                            />
                          )}
                        </div>
                        <p className="truncate text-xs text-[#8A8175]">
                          {m.email}
                        </p>
                        {m.player_code && (
                          <p className="mt-0.5 font-mono text-[10px] tracking-widest text-[#6B6459]">
                            {m.player_code}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          m.team_role === "owner"
                            ? "bg-[#C84B1F]/15 text-[#C84B1F]"
                            : "bg-[#2A251E] text-[#8A8175]"
                        }`}
                      >
                        {m.team_role || "member"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="Create New Team">
          {/* ... existing modal content ... */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B8A68A]">
                Team Name
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. Phoenix Squad"
                className="mt-2 w-full bg-[#232019] border border-[#3A352D] px-4 py-3 text-sm text-[#F0EBE1] outline-none transition-colors placeholder:text-[#6B6459] focus:border-[#C84B1F]"
                autoFocus
              />
            </div>
            <p className="text-xs text-[#8A8175]">
              A unique 8-character team code will be auto-generated. You will
              become the team owner.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCreateOpen(false)}
                className="flex-1 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="flex-1 bg-[#C84B1F] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#F0EBE1] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Team"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {joinOpen && (
        <Modal onClose={() => setJoinOpen(false)} title="Join Team">
          {/* ... existing modal content ... */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B8A68A]">
                Team Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={8}
                className="mt-2 w-full bg-[#232019] border border-[#3A352D] px-4 py-3 font-mono text-sm tracking-widest text-[#F0EBE1] outline-none transition-colors placeholder:text-[#6B6459] focus:border-[#C84B1F]"
                autoFocus
              />
            </div>
            <p className="text-xs text-[#8A8175]">
              Enter the 8-character code shared by a team owner. Your request
              must be approved before you join.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setJoinOpen(false)}
                className="flex-1 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="flex-1 bg-[#C84B1F] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#F0EBE1] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {recruitOpen && (
        <Modal onClose={() => setRecruitOpen(false)} title="Recruit Player">
          {/* ... existing modal content ... */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setRecruitMode("code")}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  recruitMode === "code"
                    ? "bg-[#C84B1F] text-[#F0EBE1]"
                    : "border border-[#3A352D] text-[#8A8175] hover:bg-[#2A251E]"
                }`}
              >
                <Hash size={14} />
                By Code
              </button>
              <button
                onClick={() => setRecruitMode("email")}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  recruitMode === "email"
                    ? "bg-[#C84B1F] text-[#F0EBE1]"
                    : "border border-[#3A352D] text-[#8A8175] hover:bg-[#2A251E]"
                }`}
              >
                <Mail size={14} />
                By Email
              </button>
            </div>

            {recruitMode === "code" ? (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B8A68A]">
                  Player Code
                </label>
                <input
                  type="text"
                  value={recruitCode}
                  onChange={(e) => setRecruitCode(e.target.value.toUpperCase())}
                  placeholder="A1B2C3"
                  maxLength={6}
                  className="mt-2 w-full bg-[#232019] border border-[#3A352D] px-4 py-3 font-mono text-sm tracking-widest text-[#F0EBE1] outline-none transition-colors placeholder:text-[#6B6459] focus:border-[#C84B1F]"
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B8A68A]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={recruitEmail}
                  onChange={(e) => setRecruitEmail(e.target.value)}
                  placeholder="player@arena.gg"
                  className="mt-2 w-full bg-[#232019] border border-[#3A352D] px-4 py-3 text-sm text-[#F0EBE1] outline-none transition-colors placeholder:text-[#6B6459] focus:border-[#C84B1F]"
                  autoFocus
                />
              </div>
            )}

            <p className="text-xs text-[#8A8175]">
              This creates a join request for the invited player. The team owner
              must approve it.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setRecruitOpen(false)}
                className="flex-1 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
              >
                Cancel
              </button>
              <button
                onClick={handleRecruit}
                disabled={actionLoading}
                className="flex-1 bg-[#C84B1F] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#F0EBE1] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Send Invite"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {leaveOpen && (
        <Modal onClose={() => setLeaveOpen(false)} title="Leave Team">
          <div className="space-y-4">
            <div className="flex items-start gap-3 border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
              <p className="text-sm text-[#F0EBE1]">
                Are you sure you want to leave{" "}
                <span className="font-semibold">{team?.name}</span>?
                {myRole === "owner" && (
                  <span className="mt-2 block text-xs text-red-400">
                    As the owner, leaving will disband the team if you are the
                    only member.
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLeaveOpen(false)}
                className="flex-1 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
              >
                Cancel
              </button>
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="flex-1 bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Leaving...
                  </span>
                ) : (
                  "Leave Team"
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <LeaveOptionsModal
        isOpen={showLeaveOptions}
        onClose={() => setShowLeaveOptions(false)}
        onTransfer={() => {
          setShowLeaveOptions(false);
          setShowTransferModal(true);
        }}
        onDisband={() => {
          setShowLeaveOptions(false);
          setShowDisbandModal(true);
        }}
      />

      <TransferOwnershipModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={handleTransferOwnership}
      />

      <DisbandTeamModal
        isOpen={showDisbandModal}
        onClose={() => setShowDisbandModal(false)}
        onDisband={handleDisbandTeam}
        teamName={team?.name || ""}
      />
    </div>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md border border-[#2A251E] bg-[#1C1A17] p-6 shadow-2xl">
        <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl tracking-wide text-[#F0EBE1]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[#6B6459] transition-colors hover:text-[#F0EBE1]"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
