"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase-client";
import { Settings, AlertCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { TransitionLink } from "@/components/TransitionLink";

function OrgProfileContent() {
  const { user, profile, refreshRole } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const orgProfile = profile as {
    name?: string;
    description?: string;
    email?: string;
    status?: string;
    logo_url?: string;
    created_at?: string;
  } | null;

  useEffect(() => {
    setName(orgProfile?.name || "");
    setDescription(orgProfile?.description || "");
  }, [orgProfile]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("tg_organizations")
        .update({
          name,
          description: description || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);
      if (error) throw error;
      await refreshRole();
      toast.success("Organization profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const isDisabled = orgProfile?.status === "disabled";

  const initials =
    (orgProfile?.name || "O")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "O";

  return (
    <DashboardShell
      role="organization"
      title="Profile Settings"
      subtitle="Manage your organization's profile information."
    >
      <TransitionLink
        href="/organization-dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </TransitionLink>

      {isDisabled && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm text-warning">
            Your organization account is currently{" "}
            <span className="font-semibold">disabled</span> by an administrator.
            Some features may be unavailable. Contact support to restore access.
          </p>
        </div>
      )}

      {/* Org banner */}
      <Card className="mb-8 overflow-hidden border-border/60 bg-card/50">
        <div className="h-24 bg-gradient-to-r from-warning/20 via-primary/10 to-warning/20" />
        <CardContent className="relative -mt-12 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 border-4 border-card bg-secondary">
              <AvatarImage src={orgProfile?.logo_url || undefined} />
              <AvatarFallback className="bg-warning/10 text-2xl font-bold text-warning">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-2">
              <h2 className="text-xl font-bold">
                {orgProfile?.name || "Unnamed Organization"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {orgProfile?.email}
              </p>
              <div className="mt-2 flex gap-2">
                <Badge
                  className="bg-warning/10 text-warning hover:bg-warning/20"
                  variant="secondary"
                >
                  Organization
                </Badge>
                <Badge
                  className={
                    isDisabled
                      ? "bg-destructive/15 text-destructive"
                      : "bg-success/15 text-success"
                  }
                  variant="secondary"
                >
                  {isDisabled ? "Disabled" : "Active"}
                </Badge>
              </div>
            </div>
            <div className="pb-2 text-sm text-muted-foreground">
              Member since{" "}
              {orgProfile?.created_at
                ? new Date(orgProfile.created_at).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile settings */}
      <Card className="border-border/60 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Organization Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                disabled
                placeholder="Your organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Email</Label>
              <Input
                id="org-email"
                value={orgProfile?.email || ""}
                disabled
                className="opacity-60"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the community about your organization..."
              rows={3}
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleSaveProfile} disabled={saving || isDisabled}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

export default function OrganizationProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["organization"]}>
      <OrgProfileContent />
    </ProtectedRoute>
  );
}
