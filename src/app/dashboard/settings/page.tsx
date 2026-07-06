"use client";

import { LogOut } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import AuthField from "@/components/auth/auth-field";
import { useTransitionNavigate } from "@/components/transition/page-transition";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useTransitionNavigate();
  const { user, profile, refreshRole } = useAuth();

  const userProfile = profile as {
    display_name?: string;
    avatar_url?: string;
    email?: string;
    created_at?: string;
    team_name?: string | null;
    player_id?: string;
    ign?: string;
  } | null;

  // Form state
  const [form, setForm] = useState({
    player_id: "",
    ign: "",
  });
  const [saving, setSaving] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (userProfile) {
      setForm({
        player_id: userProfile.player_id || "",
        ign: userProfile.ign || "",
      });
    }
  }, [userProfile]);

  const initials =
    (userProfile?.display_name || userProfile?.email || "U")
      .split("@")[0]
      .split(/[\s._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  // Save profile changes - similar logic to UserDashboard
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("tg_users")
        .update({
          player_id: form.player_id || null,
          ign: form.ign || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (error) throw error;

      // Refresh the profile data in context
      await refreshRole();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  // Handle leaving team
  const handleLeaveTeam = async () => {
    // if (!confirm("Are you sure you want to leave your team?")) return;
    // try {
    //   const { error } = await supabase
    //     .from("tg_users")
    //     .update({
    //       team_name: null,
    //       team_id: null, // If you have a team_id field
    //       updated_at: new Date().toISOString(),
    //     })
    //     .eq("id", user!.id);
    //   if (error) throw error;
    //   await refreshRole();
    //   toast.success("You have left the team");
    // } catch (error) {
    //   console.error("Error leaving team:", error);
    //   toast.error("Failed to leave team");
    // }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        blurb="Update your operator profile and manage your session."
      />

      <div className="px-8 py-8 md:px-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="lg:col-span-2">
            <div className="relative border border-[#2A251E] bg-[#232019] p-6 md:p-8">
              <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
              <h2 className="mb-6 font-display text-2xl tracking-wide text-[#F0EBE1]">
                Operator Profile
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <AuthField
                  label="Name"
                  id="player_name"
                  defaultValue={userProfile?.display_name ?? ""}
                  disabled
                />
                <AuthField
                  label="Player ID"
                  id="player_id"
                  value={form.player_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      player_id: e.target.value,
                    })
                  }
                />
                <AuthField
                  label="Email"
                  id="email"
                  type="email"
                  disabled
                  defaultValue={userProfile?.email ?? ""}
                />
                <AuthField
                  label="In-Game Name"
                  id="ign"
                  value={form.ign}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ign: e.target.value,
                    })
                  }
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#F0EBE1]">
                    Team
                  </label>

                  {userProfile?.team_name ? (
                    <div className="flex items-center justify-between rounded border border-[#3A352D] bg-[#1D1A15] px-4 py-3">
                      <span className="text-[#F0EBE1]">
                        {userProfile.team_name}
                      </span>

                      <button
                        type="button"
                        onClick={handleLeaveTeam}
                        className="rounded border border-red-500 px-3 py-1 text-xs uppercase text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        Leave Team
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard/team")}
                      className="rounded bg-[#C84B1F] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Join Team
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-8 bg-[#C84B1F] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#F0EBE1] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
        <div className="relative flex flex-col border border-[#2A251E] bg-[#232019] p-6">
          <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B1F]" />
          <h2 className="mb-2 font-display text-2xl tracking-wide text-[#F0EBE1]">
            Session
          </h2>
          <p className="text-sm leading-relaxed text-[#8A8175]">
            Sign out of the command center. You&apos;ll need to authenticate
            again to re-enter the arena.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex items-center justify-center gap-2 border border-[#3A352D] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#F0EBE1] transition-colors hover:bg-[#C84B1F] hover:border-[#C84B1F]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
