"use client";

import { useState, useEffect } from "react";
import { Crown, Loader2, X, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { getTeamMembersForTransfer, type TeamMember } from "@/lib/team-api";

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (newOwnerId: string) => Promise<void>;
}

export function TransferOwnershipModal({
  isOpen,
  onClose,
  onTransfer,
}: TransferOwnershipModalProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembersForTransfer();
      setMembers(data);
      if (data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedId) {
      toast.error("Please select a member to transfer ownership to");
      return;
    }

    setTransferring(true);
    try {
      await onTransfer(selectedId);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setTransferring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md border border-[#2A251E] bg-[#232019] p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-[#C84B1F]" />
            <h3 className="font-display text-2xl tracking-wide text-[#F0EBE1]">
              Transfer Ownership
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6459] transition-colors hover:text-[#F0EBE1]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-6 text-sm text-[#8A8175]">
          Select a member to become the new team owner. You will become a
          regular member and can then leave the team.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#C84B1F]" />
          </div>
        ) : members.length === 0 ? (
          <div className="rounded border border-yellow-600/30 bg-yellow-600/5 p-4 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-[#8A8175]" />
            <p className="text-sm text-[#F0EBE1]">No other members found</p>
            <p className="text-xs text-[#8A8175]">
              You must have at least one other member to transfer ownership.
            </p>
          </div>
        ) : (
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedId(member.id)}
                className={`flex w-full items-center gap-3 border p-3 transition-colors ${
                  selectedId === member.id
                    ? "border-[#C84B1F] bg-[#C84B1F]/10"
                    : "border-[#2A251E] hover:border-[#3A352D]"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center bg-[#1D1A15]">
                  <span className="text-sm font-bold text-[#C84B1F]">
                    {(member.display_name || member.email)
                      .split("@")[0]
                      .split(/[\s._-]/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((s) => s[0]?.toUpperCase())
                      .join("") || "?"}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-[#F0EBE1]">
                    {member.display_name || member.email.split("@")[0]}
                  </p>
                  <p className="text-xs text-[#8A8175]">{member.email}</p>
                </div>
                {selectedId === member.id && (
                  <Check className="h-5 w-5 text-[#C84B1F]" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
            disabled={transferring}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={transferring || members.length === 0 || !selectedId}
            className="flex-1 bg-[#C84B1F] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#F0EBE1] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {transferring ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Transferring...
              </span>
            ) : (
              "Transfer & Leave"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
