import { supabase } from '@/lib/supabase-client';
import type { OrganizationProfile, AdminProfile } from '@/lib/types';

function getFunctionUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${url}/functions/v1/admin-orgs`;
}

async function callAdminOrgs(path: string, method: string, body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${getFunctionUrl()}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

export async function listOrganizations(): Promise<OrganizationProfile[]> {
  const data = await callAdminOrgs('', 'GET');
  return data.organizations || [];
}

export async function listAdmins(): Promise<AdminProfile[]> {
  const data = await callAdminOrgs('', 'GET');
  return data.admins || [];
}

export async function createOrganization(params: {
  email: string;
  password: string;
  name: string;
  description?: string;
}): Promise<OrganizationProfile> {
  const data = await callAdminOrgs('', 'POST', params);
  return data.organization;
}

export async function updateOrganization(
  id: string,
  updates: Partial<Pick<OrganizationProfile, 'name' | 'description' | 'status' | 'logo_url'>>
): Promise<OrganizationProfile> {
  const data = await callAdminOrgs(`/${id}`, 'PUT', updates);
  return data.organization;
}

export async function deleteOrganization(id: string): Promise<void> {
  await callAdminOrgs(`/${id}`, 'DELETE');
}

export async function createAdmin(params: {
  email: string;
  password: string;
  display_name?: string;
}): Promise<AdminProfile> {
  const data = await callAdminOrgs('/admins', 'POST', params);
  return data.admin;
}

export async function deleteAdmin(id: string): Promise<void> {
  await callAdminOrgs(`/admins/${id}`, 'DELETE');
}
