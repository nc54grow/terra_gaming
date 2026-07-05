export type UserRole = 'user' | 'organization' | 'admin' | null;

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationProfile {
  id: string;
  email: string;
  name: string;
  description: string | null;
  status: 'active' | 'disabled';
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  role: UserRole;
  profile: UserProfile | OrganizationProfile | AdminProfile | null;
  loading: boolean;
}

export const ROLE_DASHBOARD: Record<NonNullable<UserRole>, string> = {
  user: '/dashboard',
  organization: '/organization-dashboard',
  admin: '/admin-dashboard',
};
