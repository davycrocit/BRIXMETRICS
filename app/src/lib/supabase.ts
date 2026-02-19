import { createClient } from '@supabase/supabase-js';
import type { User, Team, DailyMetrics, Goal, FTISchedule, Placement, PipelineDeal } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const hasValidCredentials =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20;

if (!hasValidCredentials) {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ======================
// AUTH FUNCTIONS
// ======================

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Sign in error:', error);
    return { data: null, error };
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Fetch user profile WITHOUT embedded team join
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    // Fetch team separately
    let team: Team | null = null;
    const teamId = (user as any).team_id as string | null | undefined;

    if (teamId) {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) {
        console.error('Team lookup failed:', teamError);
      } else {
        team = teamData as Team;
      }
    }

    return { ...(user as any), team } as User;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// ======================
// USER FUNCTIONS
// ======================

export async function getUsers(): Promise<{ data: User[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, team:teams(*)')
      .order('last_name');
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateUser(id: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ======================
// TEAM FUNCTIONS
// ======================

export async function getTeams(): Promise<{ data: Team[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ======================
// DAILY METRICS
// ======================

export async function getDailyMetrics(filters?: {
  user_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  try {
    let query = supabase
      .from('daily_metrics')
      .select('*, user:users(first_name, last_name, team_id)')
      .order('date', { ascending: false });

    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.start_date) query = query.gte('date', filters.start_date);
    if (filters?.end_date) query = query.lte('date', filters.end_date);

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
