"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function UserDashboardContent() {
  const { user, profile, refreshRole } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const userProfile = profile as {
    display_name?: string;
    avatar_url?: string;
    email?: string;
    created_at?: string;
  } | null;

  useEffect(() => {
    setDisplayName(userProfile?.display_name || "");
  }, [userProfile]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tg_users")
        .update({
          display_name: displayName || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
      if (error) throw error;
      await refreshRole();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const initials =
    (userProfile?.display_name || userProfile?.email || "U")
      .split("@")[0]
      .split(/[\s._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <DashboardShell
      role="user"
      title={`Welcome back, ${userProfile?.display_name || userProfile?.email?.split("@")[0] || "Gamer"}`}
      subtitle="Your gaming stats, recent activity, and profile management."
    >
      {/* Profile banner */}
      <Card className="mb-8 overflow-hidden border-border/60 bg-card/50">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20" />
        <CardContent className="relative -mt-12 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 border-4 border-card bg-secondary">
              <AvatarImage src={userProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold">
                {userProfile?.display_name || "Unnamed Gamer"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {userProfile?.email}
              </p>
              <Badge
                className="mt-2 bg-primary/10 text-primary hover:bg-primary/20"
                variant="secondary"
              >
                Registered User
              </Badge>
            </div>
            <div className="pb-2 text-sm text-muted-foreground">
              Member since{" "}
              {userProfile?.created_at
                ? new Date(userProfile.created_at).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Profile settings */}
      <Card className="mt-6 border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your gamer tag"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={userProfile?.email || ""}
                disabled
                className="opacity-60"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export default function UserDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <UserDashboardContent />
    </ProtectedRoute>
  );
}
