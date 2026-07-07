"use client";

import { X, Users, UserMinus, AlertTriangle } from "lucide-react";

interface LeaveOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: () => void;
  onDisband: () => void;
}

export function LeaveOptionsModal({
  isOpen,
  onClose,
  onTransfer,
  onDisband,
}: LeaveOptionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg border border-[#2A251E] bg-[#232019] p-6 md:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-2xl tracking-wide text-[#F0EBE1]">
            Leave Team Options
          </h3>
          <button
            onClick={onClose}
            className="text-[#6B6459] transition-colors hover:text-[#F0EBE1]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-6 text-sm text-[#8A8175]">
          You are the team owner. Choose how you want to proceed:
        </p>

        <div className="space-y-4">
          {/* Option 1: Transfer Ownership */}
          <button
            onClick={onTransfer}
            className="w-full border border-[#2A251E] bg-[#1D1A15] p-5 text-left transition-colors hover:border-[#C84B1F] hover:bg-[#2A251E] group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full bg-[#C84B1F]/10 p-2 group-hover:bg-[#C84B1F]/20">
                <Users className="h-5 w-5 text-[#C84B1F]" />
              </div>
              <div>
                <h4 className="font-semibold text-[#F0EBE1] group-hover:text-[#C84B1F]">
                  Transfer Ownership
                </h4>
                <p className="mt-1 text-sm text-[#8A8175]">
                  Choose a new team owner, then leave the team. The team
                  continues with a new leader.
                </p>
                <span className="mt-2 inline-block text-xs font-bold uppercase tracking-wider text-[#C84B1F]">
                  Recommended →
                </span>
              </div>
            </div>
          </button>

          {/* Option 2: Disband Team */}
          <button
            onClick={onDisband}
            className="w-full border border-red-500/20 bg-red-500/5 p-5 text-left transition-colors hover:border-red-500 hover:bg-red-500/10 group"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full bg-red-500/10 p-2 group-hover:bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-semibold text-[#F0EBE1] group-hover:text-red-400">
                  Disband Team
                </h4>
                <p className="mt-1 text-sm text-[#8A8175]">
                  Remove all members and permanently delete the team. This
                  action cannot be undone.
                </p>
                <span className="mt-2 inline-block text-xs font-bold uppercase tracking-wider text-red-400">
                  ⚠️ Irreversible
                </span>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8A8175] transition-colors hover:bg-[#2A251E]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
