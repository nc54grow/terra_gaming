import { supabase } from "@/lib/supabase-client";

export interface Team {
  id: string;
  name: string;
  code: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  player_code: string | null;
  team_role: "owner" | "member" | null;
  team_id: string | null;
  join_request_status: "pending" | "rejected" | null;
  join_request_team_id: string | null;
  join_request_created_at: string | null;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  pendingRequests: TeamMember[];
}

function generateTeamCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  for (let i = 0; i < 4; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

function generatePlayerCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureUniqueTeamCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateTeamCode();
    const { data } = await supabase
      .from("tg_teams")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique team code");
}

async function ensureUniquePlayerCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generatePlayerCode();
    const { data } = await supabase
      .from("tg_users")
      .select("id")
      .eq("player_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique player code");
}

export async function ensurePlayerCode(userId: string): Promise<string | null> {
  const { data: user } = await supabase
    .from("tg_users")
    .select("player_code")
    .eq("id", userId)
    .maybeSingle();
  if (user?.player_code) return user.player_code;

  const code = await ensureUniquePlayerCode();
  const { error } = await supabase
    .from("tg_users")
    .update({ player_code: code, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
  return code;
}

export async function createTeam(name: string): Promise<Team> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("tg_users")
    .select("team_id, join_request_status")
    .eq("id", user.id)
    .maybeSingle();
  if (existing?.team_id) throw new Error("You are already in a team");
  if (existing?.join_request_status === "pending")
    throw new Error("You have a pending join request. Cancel it first.");

  const code = await ensureUniqueTeamCode();

  const { data: team, error: teamError } = await supabase
    .from("tg_teams")
    .insert({ name: name.trim(), code, owner_id: user.id })
    .select("*")
    .single();
  if (teamError) throw teamError;

  const { error: userError } = await supabase
    .from("tg_users")
    .update({
      team_id: team.id,
      team_role: "owner",
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (userError) throw userError;

  return team as Team;
}

export async function requestJoinTeam(code: string): Promise<Team> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const upperCode = code.toUpperCase().trim();
  if (!/^[A-Z]{4}[0-9]{4}$/.test(upperCode))
    throw new Error("Invalid team code format (e.g. ABCD1234)");

  const { data: self } = await supabase
    .from("tg_users")
    .select("team_id, join_request_status")
    .eq("id", user.id)
    .maybeSingle();
  if (self?.team_id) throw new Error("You are already in a team");
  if (self?.join_request_status === "pending")
    throw new Error("You already have a pending request. Cancel it first.");

  const { data: team } = await supabase
    .from("tg_teams")
    .select("*")
    .eq("code", upperCode)
    .maybeSingle();
  if (!team) throw new Error("No team found with that code");

  const { error } = await supabase
    .from("tg_users")
    .update({
      join_request_status: "pending",
      join_request_team_id: team.id,
      join_request_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw error;

  return team as Team;
}

export async function cancelJoinRequest(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tg_users")
    .update({
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw error;
}

export async function approveJoinRequest(userId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // Get owner info
  const { data: owner, error: ownerError } = await supabase
    .from("tg_users")
    .select("team_id, team_role")
    .eq("id", user.id)
    .maybeSingle();
  
  if (!owner?.team_id || owner.team_role !== "owner") {
    throw new Error("Only team owners can approve requests");
  }
  // Get requester info BEFORE update
  const { data: requesterBefore, error: requesterError } = await supabase
    .from("tg_users")
    .select("id, display_name, email, join_request_status, join_request_team_id, team_id, team_role")
    .eq("id", userId)
    .maybeSingle();
  
  if (requesterError) console.error("❌ Requester error:", requesterError);

  if (!requesterBefore || requesterBefore.join_request_status !== "pending") {
    throw new Error("No pending request from this user");
  }
  
  if (requesterBefore.join_request_team_id !== owner.team_id) {
    throw new Error("This user requested to join a different team");
  }
  // Update the user with .select() to get the updated record
  const { data: updatedData, error: updateError } = await supabase
    .from("tg_users")
    .update({
      team_id: owner.team_id,
      team_role: "member",
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(); // This returns the updated record

  if (updateError) {
    throw updateError;
  }
  // Verify the update worked by fetching the user again
  const { data: requesterAfter, error: verifyError } = await supabase
    .from("tg_users")
    .select("id, display_name, email, join_request_status, join_request_team_id, team_id, team_role")
    .eq("id", userId)
    .maybeSingle();
  if (verifyError) console.error("❌ Verify error:", verifyError);
  if (!requesterAfter || requesterAfter.team_id !== owner.team_id) {
    console.error("❌ Verification failed! Team_id not set correctly");
    throw new Error("Failed to update user - verification failed");
  }
  const stats = await getTeamStats(owner.team_id);
  
  // Determine role - add as member by default
  let role = 'member';
  
  // If main team is full, add as substitute
  if (stats.mainMembers >= 4) {
    if (stats.substitutes >= 2) {
      throw new Error("Team is full (4 main + 2 substitutes). Cannot add more members.");
    }
    role = 'substitute';
  }

  // Update the user with the determined role
  const { error } = await supabase
    .from("tg_users")
    .update({
      team_id: owner.team_id,
      team_role: role,
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function rejectJoinRequest(userId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Use the database function
  const { data, error } = await supabase.rpc('reject_join_request', {
    p_requester_id: userId,
    p_owner_id: user.id
  });

  if (error) {
    console.error("❌ Rejection error:", error);
    throw new Error(error.message);
  }

  console.log("✅ Rejection successful:", data);
}

export async function recruitByPlayerCode(playerCode: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get recruiter's team info
  const { data: self } = await supabase
    .from("tg_users")
    .select("team_id, team_role, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!self?.team_id) throw new Error("You must be in a team to recruit");

  const upperCode = playerCode.toUpperCase().trim();
  const { data: target, error: targetError } = await supabase
    .from("tg_users")
    .select("id, team_id, join_request_status, email, display_name")
    .eq("player_code", upperCode)
    .maybeSingle();
  
  if (targetError) throw targetError;
  if (!target) throw new Error("No player found with that code");
  if (target.id === user.id) throw new Error("You cannot recruit yourself");
  if (target.team_id) throw new Error("That player is already in a team");
  
  // Check if they already have a pending request (any team)
  if (target.join_request_status === "pending") {
    throw new Error("That player already has a pending request");
  }

  // Get team details for the invitation
  const { data: team } = await supabase
    .from("tg_teams")
    .select("name, code")
    .eq("id", self.team_id)
    .single();

  // Create the join request
  const { error: updateError } = await supabase
    .from("tg_users")
    .update({
      join_request_status: "pending",
      join_request_team_id: self.team_id,
      join_request_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", target.id);

  if (updateError) {
    console.error("❌ Error updating target user:", updateError);
    throw updateError;
  }

  // Log the invitation for tracking (optional - you could create a notifications table)
  console.log(`📨 Invitation sent to ${target.email} for team ${team?.name}`);
}

export async function recruitByEmail(email: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: self } = await supabase
    .from("tg_users")
    .select("team_id, team_role")
    .eq("id", user.id)
    .maybeSingle();
  if (!self?.team_id) throw new Error("You must be in a team to recruit");

  const { data: target } = await supabase
    .from("tg_users")
    .select("id, team_id, join_request_status, email")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();
  if (!target) throw new Error("No player found with that email");
  if (target.id === user.id) throw new Error("You cannot recruit yourself");
  if (target.team_id) throw new Error("That player is already in a team");
  if (target.join_request_status === "pending")
    throw new Error("That player already has a pending request");

  const { error } = await supabase
    .from("tg_users")
    .update({
      join_request_status: "pending",
      join_request_team_id: self.team_id,
      join_request_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", target.id);
  if (error) throw error;
}

export async function leaveTeam(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: self } = await supabase
    .from("tg_users")
    .select("team_id, team_role")
    .eq("id", user.id)
    .maybeSingle();
  
  if (!self?.team_id) throw new Error("You are not in a team");

  if (self.team_role === "owner") {
    const { count } = await supabase
      .from("tg_users")
      .select("id", { count: "exact", head: true })
      .eq("team_id", self.team_id);
    
    if ((count || 0) > 1) {
      throw new Error(
        "Owners cannot leave while other members remain. Transfer ownership or remove members first.",
      );
    }
    
    // If owner is the only member, delete the team
    const { error: deleteError } = await supabase
      .from("tg_teams")
      .delete()
      .eq("id", self.team_id);
    
    if (deleteError) throw deleteError;
  }

  // Clear the user's team data
  const { error } = await supabase
    .from("tg_users")
    .update({
      team_id: null,
      team_role: null,
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw error;
}

export async function getTeamStats(teamId: string): Promise<{
  mainMembers: number;
  substitutes: number;
  maxMain: number;
  maxSubs: number;
  hasSlots: boolean;
}> {
  const { data: members } = await supabase
    .from("tg_users")
    .select("team_role")
    .eq("team_id", teamId);

  const mainCount = members?.filter(m => m.team_role === 'owner' || m.team_role === 'member').length || 0;
  const subCount = members?.filter(m => m.team_role === 'substitute').length || 0;

  return {
    mainMembers: mainCount,
    substitutes: subCount,
    maxMain: 4,
    maxSubs: 2,
    hasSlots: mainCount < 4 || subCount < 2
  };
}

export async function checkTeamCapacity(teamId: string, role: 'member' | 'substitute' | 'owner'): Promise<{
  allowed: boolean;
  message: string;
}> {
  const stats = await getTeamStats(teamId);
  
  if (role === 'member' || role === 'owner') {
    if (stats.mainMembers >= 4) {
      return { 
        allowed: false, 
        message: "Team already has 4 main players. Only substitutes can be added." 
      };
    }
  }
  
  if (role === 'substitute') {
    if (stats.substitutes >= 2) {
      return { 
        allowed: false, 
        message: "Team already has 2 substitutes. Maximum team size is 6." 
      };
    }
  }
  
  return { allowed: true, message: "Slot available" };
}

export async function getMyTeamContext(): Promise<{
  team: Team | null;
  members: TeamMember[];
  pendingRequests: TeamMember[];
  myRole: "owner" | "member" | null;
  myPlayerCode: string | null;
  myJoinRequest: {
    status: "pending" | "rejected" | null;
    team: Team | null;
    createdAt: string | null;
  };
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get fresh user data with no caching
  const { data: self } = await supabase
    .from("tg_users")
    .select(
      "team_id, team_role, player_code, join_request_status, join_request_team_id, join_request_created_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  let team: Team | null = null;
  let members: TeamMember[] = [];
  let pendingRequests: TeamMember[] = [];

  if (self?.team_id) {
    // Get fresh team data
    const { data: teamData } = await supabase
      .from("tg_teams")
      .select("*")
      .eq("id", self.team_id)
      .maybeSingle();
    team = teamData as Team | null;

    if (team) {
      // Get all members of the team (including the one just approved)
      const { data: memberRows } = await supabase
        .from("tg_users")
        .select(
          "id, email, display_name, avatar_url, player_code, team_role, team_id, join_request_status, join_request_team_id, join_request_created_at"
        )
        .eq("team_id", team.id)
        .order("team_role", { ascending: false })
        .order("display_name", { ascending: true });

      members = (memberRows || []) as TeamMember[];

      // Get pending requests (should be empty after approval)
      const { data: pendingRows } = await supabase
        .from("tg_users")
        .select(
          "id, email, display_name, avatar_url, player_code, team_role, team_id, join_request_status, join_request_team_id, join_request_created_at"
        )
        .eq("join_request_status", "pending")
        .eq("join_request_team_id", team.id)
        .order("join_request_created_at", { ascending: true });

      pendingRequests = (pendingRows || []) as TeamMember[];
    }
  }

  let joinRequestTeam: Team | null = null;
  if (self?.join_request_status === "pending" && self.join_request_team_id) {
    const { data: jrTeam } = await supabase
      .from("tg_teams")
      .select("*")
      .eq("id", self.join_request_team_id)
      .maybeSingle();
    joinRequestTeam = jrTeam as Team | null;
  }

  
  const result = {
    team,
    members,
    pendingRequests,
    myRole: (self?.team_role as "owner" | "member" | null) || null,
    myPlayerCode: self?.player_code || null,
    myJoinRequest: {
      status: (self?.join_request_status as "pending" | "rejected" | null) || null,
      team: joinRequestTeam,
      createdAt: self?.join_request_created_at || null,
    },
  };

   console.log("✅ Final result:", {
    hasTeam: !!result.team,
    memberCount: result.members.length,
    pendingCount: result.pendingRequests.length,
    myRole: result.myRole,
  });

  return result
}

export async function transferOwnership(newOwnerId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current user's team info
  const { data: currentUser, error: currentError } = await supabase
    .from("tg_users")
    .select("team_id, team_role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!currentUser?.team_id || currentUser.team_role !== "owner") {
    throw new Error("Only team owners can transfer ownership");
  }

  // Verify the new owner exists and is in the same team
  const { data: newOwner, error: newOwnerError } = await supabase
    .from("tg_users")
    .select("id, team_id, team_role")
    .eq("id", newOwnerId)
    .maybeSingle();

  if (newOwnerError) throw newOwnerError;
  if (!newOwner) throw new Error("User not found");
  if (newOwner.team_id !== currentUser.team_id) {
    throw new Error("User is not in your team");
  }
  if (newOwner.team_role === "owner") {
    throw new Error("User is already the team owner");
  }

  // Start a transaction: Update both users
  const { error: updateNewOwnerError } = await supabase
    .from("tg_users")
    .update({
      team_role: "owner",
      updated_at: new Date().toISOString(),
    })
    .eq("id", newOwnerId);

  if (updateNewOwnerError) throw updateNewOwnerError;

  const { error: updateCurrentError } = await supabase
    .from("tg_users")
    .update({
      team_role: "member",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateCurrentError) throw updateCurrentError;

  // Update the team's owner_id
  const { error: teamError } = await supabase
    .from("tg_teams")
    .update({
      owner_id: newOwnerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentUser.team_id);

  if (teamError) throw teamError;
}

export async function disbandTeam(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current user's team info
  const { data: currentUser, error: currentError } = await supabase
    .from("tg_users")
    .select("team_id, team_role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!currentUser?.team_id || currentUser.team_role !== "owner") {
    throw new Error("Only team owners can disband the team");
  }

  const teamId = currentUser.team_id;

  // Get all members of the team
  const { data: members, error: membersError } = await supabase
    .from("tg_users")
    .select("id")
    .eq("team_id", teamId);

  if (membersError) throw membersError;

  // Remove all members from the team - UPDATE THEM FIRST
  const memberIds = members.map((m) => m.id);
  
  // Update all members to remove team association
  const { error: updateError } = await supabase
    .from("tg_users")
    .update({
      team_id: null,
      team_role: null,
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .in("id", memberIds);

  if (updateError) {
    console.error("❌ Error updating members:", updateError);
    throw updateError;
  }

  console.log(`✅ Updated ${memberIds.length} members, removed team association`);

  // Now delete the team
  const { error: deleteError } = await supabase
    .from("tg_teams")
    .delete()
    .eq("id", teamId);

  if (deleteError) {
    console.error("❌ Error deleting team:", deleteError);
    throw deleteError;
  }

  console.log(`✅ Team ${teamId} deleted successfully`);
}


export async function getTeamMembersForTransfer(): Promise<TeamMember[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUser, error: currentError } = await supabase
    .from("tg_users")
    .select("team_id, team_role")
    .eq("id", user.id)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!currentUser?.team_id || currentUser.team_role !== "owner") {
    throw new Error("Only team owners can transfer ownership");
  }

  const { data: members, error: membersError } = await supabase
    .from("tg_users")
    .select(
      "id, email, display_name, avatar_url, player_code, team_role, team_id"
    )
    .eq("team_id", currentUser.team_id)
    .neq("id", user.id) // Exclude the owner
    .order("display_name", { ascending: true });

  if (membersError) throw membersError;

  return members as TeamMember[];
}

export async function getPendingInvitations(): Promise<{
  team_id: string;
  team_name: string;
  team_code: string;
  invited_by?: string;
  invited_by_name?: string;
  created_at: string;
}[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get the user's pending join request
  const { data: userData, error: userError } = await supabase
    .from("tg_users")
    .select("join_request_status, join_request_team_id, join_request_created_at")
    .eq("id", user.id)
    .eq("join_request_status", "pending")
    .maybeSingle();

  if (userError) throw userError;
  if (!userData) return [];

  // Get team details
  const { data: team, error: teamError } = await supabase
    .from("tg_teams")
    .select("id, name, code, owner_id")
    .eq("id", userData.join_request_team_id)
    .single();

  if (teamError) throw teamError;

  // Get owner info (who invited them)
  const { data: owner } = await supabase
    .from("tg_users")
    .select("display_name, email")
    .eq("id", team.owner_id)
    .maybeSingle();

  return [{
    team_id: team.id,
    team_name: team.name,
    team_code: team.code,
    invited_by: team.owner_id,
    invited_by_name: owner?.display_name || owner?.email || "Team Owner",
    created_at: userData.join_request_created_at || new Date().toISOString()
  }];
}

export async function acceptInvitation(teamId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if user has a pending request for this team
  const { data: userData, error: userError } = await supabase
    .from("tg_users")
    .select("join_request_status, join_request_team_id")
    .eq("id", user.id)
    .eq("join_request_status", "pending")
    .eq("join_request_team_id", teamId)
    .maybeSingle();

  if (userError) throw userError;
  if (!userData) throw new Error("No pending invitation found");

  // Join the team
  const { error: updateError } = await supabase
    .from("tg_users")
    .update({
      team_id: teamId,
      team_role: "member",
      join_request_status: null,
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) throw updateError;
}

export async function rejectInvitation(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: updateError } = await supabase
    .from("tg_users")
    .update({
      join_request_status: "rejected",
      join_request_team_id: null,
      join_request_created_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .eq("join_request_status", "pending");

  if (updateError) throw updateError;
}

// Add a function to get sent invitations
export async function getSentInvitations(teamId: string): Promise<{
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}[]> {
  const { data, error } = await supabase
    .from("tg_users")
    .select("id, email, display_name, join_request_created_at")
    .eq("join_request_status", "pending")
    .eq("join_request_team_id", teamId)
    .order("join_request_created_at", { ascending: true });

  if (error) throw error;
  
  // Map the data to match the return type
  return (data || []).map((item) => ({
    id: item.id,
    email: item.email,
    display_name: item.display_name,
    created_at: item.join_request_created_at,
  }));
}