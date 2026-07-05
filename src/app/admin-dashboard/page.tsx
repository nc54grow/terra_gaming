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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Power,
  Pencil,
  Users,
  Shield,
  Activity,
  Loader2,
  ShieldPlus,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  listOrganizations,
  listAdmins,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createAdmin,
  deleteAdmin,
} from "@/lib/admin-api";
import type { OrganizationProfile, AdminProfile } from "@/lib/types";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AdminDashboardContent() {
  const { user, profile } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationProfile[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrganizationProfile | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<OrganizationProfile | null>(null);
  const [deleteAdminTarget, setDeleteAdminTarget] =
    useState<AdminProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orgs, adminList] = await Promise.all([
        listOrganizations(),
        listAdmins(),
      ]);
      setOrganizations(orgs);
      setAdmins(adminList);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (admin.display_name || "")
        .toLowerCase()
        .includes(adminSearch.toLowerCase()),
  );

  const activeCount = organizations.filter((o) => o.status === "active").length;
  const disabledCount = organizations.length - activeCount;

  const stats = [
    {
      icon: Building2,
      label: "Total Organizations",
      value: organizations.length,
      color: "text-primary",
    },
    {
      icon: Activity,
      label: "Active",
      value: activeCount,
      color: "text-success",
    },
    {
      icon: Shield,
      label: "Disabled",
      value: disabledCount,
      color: "text-destructive",
    },
    {
      icon: Users,
      label: "Admins",
      value: admins.length,
      color: "text-warning",
    },
  ];

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createOrganization({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
      });
      toast.success("Organization created successfully");
      setCreateOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create organization",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createAdmin({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        display_name: (formData.get("display_name") as string) || undefined,
      });
      toast.success("Admin created successfully");
      setCreateAdminOpen(false);
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create admin",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editOrg) return;
    setActionLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateOrganization(editOrg.id, {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
      });
      toast.success("Organization updated");
      setEditOrg(null);
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update organization",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleStatus(org: OrganizationProfile) {
    const newStatus = org.status === "active" ? "disabled" : "active";
    try {
      await updateOrganization(org.id, { status: newStatus });
      toast.success(
        `Organization ${newStatus === "active" ? "enabled" : "disabled"}`,
      );
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    }
  }

  async function handleDeleteOrg() {
    if (!deleteOrg) return;
    setActionLoading(true);
    try {
      await deleteOrganization(deleteOrg.id);
      toast.success("Organization deleted");
      setDeleteOrg(null);
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete organization",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAdmin() {
    if (!deleteAdminTarget) return;
    setActionLoading(true);
    try {
      await deleteAdmin(deleteAdminTarget.id);
      toast.success("Admin deleted");
      setDeleteAdminTarget(null);
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete admin",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const adminProfile = profile as {
    display_name?: string;
    email?: string;
  } | null;

  return (
    <DashboardShell
      role="admin"
      title="Admin Command Center"
      subtitle={`Manage all organizations and admins in the TerraGaming ecosystem. Signed in as ${adminProfile?.email || "admin"}.`}
    >
      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border/60 bg-card/50 transition-colors hover:border-primary/40"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="organizations">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="organizations">
            <Building2 className="mr-1.5 h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="mr-1.5 h-4 w-4" />
            Admins
          </TabsTrigger>
        </TabsList>

        {/* Organizations tab */}
        <TabsContent value="organizations">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Organizations
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search organizations..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 sm:w-64"
                    />
                  </div>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button className="glow-primary">
                        <Plus className="mr-1.5 h-4 w-4" />
                        New Org
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Organization</DialogTitle>
                        <DialogDescription>
                          Create a new organization account. The organization
                          can sign in with the provided credentials.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-name">Organization Name</Label>
                          <Input
                            id="create-name"
                            name="name"
                            placeholder="Acme Gaming"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-email">Email</Label>
                          <Input
                            id="create-email"
                            name="email"
                            type="email"
                            placeholder="org@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-password">Password</Label>
                          <Input
                            id="create-password"
                            name="password"
                            type="password"
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-description">
                            Description{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <Textarea
                            id="create-description"
                            name="description"
                            placeholder="What does this organization do?"
                            rows={3}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={actionLoading}>
                            {actionLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Create Organization
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredOrgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No organizations found</p>
                  <p className="text-xs text-muted-foreground">
                    {search
                      ? "Try a different search term."
                      : "Create your first organization to get started."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Description
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgs.map((org) => (
                      <TableRow key={org.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {org.name
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((w) => w[0]?.toUpperCase())
                                  .join("") || "O"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{org.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {org.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden max-w-xs sm:table-cell">
                          <p className="truncate text-sm text-muted-foreground">
                            {org.description || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              org.status === "active"
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                            }
                          >
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditOrg(org)}
                                className="cursor-pointer"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(org)}
                                className="cursor-pointer"
                              >
                                <Power className="mr-2 h-4 w-4" />
                                {org.status === "active" ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteOrg(org)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins tab */}
        <TabsContent value="admins">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-warning" />
                  Admins
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search admins..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-9 sm:w-64"
                    />
                  </div>
                  <Dialog
                    open={createAdminOpen}
                    onOpenChange={setCreateAdminOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="glow-primary">
                        <ShieldPlus className="mr-1.5 h-4 w-4" />
                        New Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Admin</DialogTitle>
                        <DialogDescription>
                          Create a new admin account with full access to the
                          command center.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-admin-name">
                            Display Name{" "}
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            id="create-admin-name"
                            name="display_name"
                            placeholder="Admin Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-admin-email">Email</Label>
                          <Input
                            id="create-admin-email"
                            name="email"
                            type="email"
                            placeholder="admin@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-admin-password">
                            Password
                          </Label>
                          <Input
                            id="create-admin-password"
                            name="password"
                            type="password"
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCreateAdminOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={actionLoading}>
                            {actionLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Create Admin
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No admins found</p>
                  <p className="text-xs text-muted-foreground">
                    {adminSearch
                      ? "Try a different search term."
                      : "Create your first admin to get started."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Display Name
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarFallback className="bg-warning/10 text-xs font-semibold text-warning">
                                {(admin.display_name || admin.email)
                                  .split("@")[0]
                                  .split(/[\s._-]/)
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((s) => s[0]?.toUpperCase())
                                  .join("") || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {admin.email}
                              </p>
                              {admin.id === user?.id && (
                                <Badge
                                  variant="secondary"
                                  className="mt-0.5 bg-primary/10 text-primary"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <p className="text-sm text-muted-foreground">
                            {admin.display_name || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {admin.id === user?.id ? (
                            <span className="text-xs text-muted-foreground">
                              Current account
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteAdminTarget(admin)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog
        open={!!editOrg}
        onOpenChange={(open) => !open && setEditOrg(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update the organization's name and description.
            </DialogDescription>
          </DialogHeader>
          {editOrg && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editOrg.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editOrg.description || ""}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOrg(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete org confirmation */}
      <AlertDialog
        open={!!deleteOrg}
        onOpenChange={(open) => !open && setDeleteOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold text-foreground">
                {deleteOrg?.name}
              </span>{" "}
              and its auth account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrg}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete admin confirmation */}
      <AlertDialog
        open={!!deleteAdminTarget}
        onOpenChange={(open) => !open && setDeleteAdminTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the admin account for{" "}
              <span className="font-semibold text-foreground">
                {deleteAdminTarget?.email}
              </span>{" "}
              and its auth credentials. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
