import { supabase } from '@/lib/supabase-client';

export interface RoundStructure {
  round: number;
  groups: number;
  teams_per_group: number;
  matches_per_group: number;
}

export interface RoundQualification {
  round: number;
  teams_qualifying: number;
  per_group: number;
}

export interface PrizePlacement {
  position: number;
  label: string;
  amount: number;
}

export interface PointsEntry {
  position: number;
  points: number;
}

export interface Tournament {
  id: string;
  organization_id: string;
  name: string;
  poster_url: string | null;
  entry_type: 'free' | 'paid';
  entry_fee: number;
  prize_pool: number;
  total_slots: number;
  total_rounds: number;
  registration_start: string;
  registration_end: string;
  structure: RoundStructure[];
  qualification: RoundQualification[];
  prize_distribution: PrizePlacement[];
  points_system: PointsEntry[];
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface TournamentInput {
  name: string;
  poster_url?: string | null;
  entry_type: 'free' | 'paid';
  entry_fee?: number;
  prize_pool: number;
  total_slots: number;
  total_rounds: number;
  registration_start: string;
  registration_end: string;
  structure: RoundStructure[];
  qualification: RoundQualification[];
  prize_distribution: PrizePlacement[];
  points_system: PointsEntry[];
}

export async function listTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase
    .from('tg_tournaments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Tournament[];
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tg_tournaments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Tournament | null;
}

export async function createTournament(input: TournamentInput): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tg_tournaments')
    .insert({
      name: input.name,
      poster_url: input.poster_url ?? null,
      entry_type: input.entry_type,
      entry_fee: input.entry_fee ?? 0,
      prize_pool: input.prize_pool,
      total_slots: input.total_slots,
      total_rounds: input.total_rounds,
      registration_start: input.registration_start,
      registration_end: input.registration_end,
      structure: input.structure,
      qualification: input.qualification,
      prize_distribution: input.prize_distribution,
      points_system: input.points_system,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Tournament;
}

export async function updateTournament(
  id: string,
  updates: Partial<TournamentInput>,
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tg_tournaments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Tournament;
}

export async function deleteTournament(id: string): Promise<void> {
  const { error } = await supabase.from('tg_tournaments').delete().eq('id', id);
  if (error) throw error;
}
