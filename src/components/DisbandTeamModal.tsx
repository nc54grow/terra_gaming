"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface DisbandTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDisband: () => Promise<void>;
  teamName: string;
}

export function DisbandTeamModal({
  isOpen,
  onClose,
  onDisband,
  teamName,
}: DisbandTeamModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [disbanding, setDisbanding] = useState(false);

  if (!isOpen) return null;

  const handleDisband = async () => {
    if (!confirmed) {
      toast.error("Please confirm you understand this action");
      return;
    }

    setDisbanding(true);
    try {
      await onDisband();
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setDisbanding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md border border-red-500/30 bg-[#232019] p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="font-display text-2xl tracking-wide text-[#F0EBE1]">
              Disband Team
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B6459] transition-colors hover:text-[#F0EBE1]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="rounded border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-400">
              ⚠️ Warning: This action cannot be undone!
            </p>
            <p className="mt-2 text-sm text-[#F0EBE1]">
              You are about to disband <strong>{teamName}</strong>. This will:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#8A8175]">
              <li>Remove all team members</li>
              <li>Delete the team permanently</li>
              <li>Clear all team data and settings</li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 border-[#3A352D] bg-[#1D1A15] text-[#C84B1F] focus:ring-[#C84B1F]"
            />
            <span className="text-sm text-[#8A8175]">
              I understand that this action cannot be undone and I want to
              permanently disband {teamName}
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
            disabled={disbanding}
          >
            Cancel
          </button>
          <button
            onClick={handleDisband}
            disabled={!confirmed || disbanding}
            className="flex-1 bg-red-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {disbanding ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Disbanding...
              </span>
            ) : (
              "Disband Team"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
