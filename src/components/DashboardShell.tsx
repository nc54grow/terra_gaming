"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gamepad2, LogOut, Settings, User as UserIcon } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { ROLE_DASHBOARD } from "@/lib/types";

interface DashboardShellProps {
  role: NonNullable<UserRole>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const roleLabels: Record<NonNullable<UserRole>, string> = {
  user: "User",
  organization: "Organization",
  admin: "Administrator",
};

const roleColors: Record<NonNullable<UserRole>, string> = {
  user: "text-primary",
  organization: "text-warning",
  admin: "text-success",
};

export function DashboardShell({
  role,
  title,
  subtitle,
  children,
}: DashboardShellProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const displayName =
    (profile as { display_name?: string; name?: string })?.display_name ||
    (profile as { name?: string })?.name ||
    user?.email ||
    "";

  const initials =
    displayName
      .split("@")[0]
      .split(/[\s._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                TerraGaming
              </span>
              <span className={`text-xs font-medium ${roleColors[role]}`}>
                {roleLabels[role]} Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-secondary"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage
                      src={
                        (profile as { avatar_url?: string })?.avatar_url ||
                        (profile as { logo_url?: string })?.logo_url ||
                        undefined
                      }
                    />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline-block">
                    {displayName.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(ROLE_DASHBOARD[role])}
                  className="cursor-pointer"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut().then(() => router.push("/login"))}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
