import { createClient } from '@supabase/supabase-js';
import type { User, Team, DailyMetrics, Goal, FTISchedule, Placement, PipelineDeal } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate credentials
const hasValidCredentials = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20;

if (!hasValidCredentials) {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
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
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// User functions
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

export async function createUser(userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  team_id?: string;
}) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        team_id: userData.team_id || null,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return { data: profile, error: null };
  } catch (error: any) {
    console.error('Create user error:', error);
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

// Team functions
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

export async function createTeam(teamData: { name: string; manager_ids?: string[] }) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateTeam(id: string, updates: Partial<Team>) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Daily Metrics functions
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

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.start_date) {
      query = query.gte('date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('date', filters.end_date);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function upsertDailyMetrics(metrics: Partial<DailyMetrics>) {
  try {
    const { data, error } = await supabase
      .from('daily_metrics')
      .upsert(metrics, { onConflict: 'user_id,date' })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Goals functions
export async function getGoals(filters?: {
  user_id?: string;
  team_id?: string;
  year?: number;
  month?: number;
}) {
  try {
    let query = supabase.from('goals').select('*');

    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.year) query = query.eq('year', filters.year);
    if (filters?.month !== undefined) query = query.eq('month', filters.month);

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function upsertGoal(goal: Partial<Goal>) {
  try {
    const { data, error } = await supabase
      .from('goals')
      .upsert(goal, { onConflict: 'user_id,team_id,year,month,metric_type' })
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// FTI functions
export async function getFTISchedules(filters?: {
  team_id?: string;
  recruiter_id?: string;
  status?: string;
}) {
  try {
    let query = supabase
      .from('fti_schedules')
      .select('*, recruiter:users(first_name, last_name), team:teams(name)')
      .order('created_at', { ascending: false });

    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.recruiter_id) query = query.eq('recruiter_id', filters.recruiter_id);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createFTISchedule(fti: Partial<FTISchedule>) {
  try {
    const { data, error } = await supabase
      .from('fti_schedules')
      .insert(fti)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateFTISchedule(id: string, updates: Partial<FTISchedule>) {
  try {
    const { data, error } = await supabase
      .from('fti_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Pipeline/Deals functions
export async function getPipelineDeals(filters?: {
  team_id?: string;
  recruiter_id?: string;
  status?: string;
}) {
  try {
    let query = supabase
      .from('pipeline_deals')
      .select('*, recruiter:users(first_name, last_name), team:teams(name)')
      .order('payment_due_date', { ascending: true });

    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.recruiter_id) query = query.eq('recruiter_id', filters.recruiter_id);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createPipelineDeal(deal: Partial<PipelineDeal>) {
  try {
    const { data, error } = await supabase
      .from('pipeline_deals')
      .insert(deal)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updatePipelineDeal(id: string, updates: Partial<PipelineDeal>) {
  try {
    const { data, error } = await supabase
      .from('pipeline_deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Placements functions
export async function getPlacements(filters?: {
  team_id?: string;
  recruiter_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  try {
    let query = supabase
      .from('placements')
      .select('*, recruiter:users(first_name, last_name), team:teams(name)')
      .order('placement_date', { ascending: false });

    if (filters?.team_id) query = query.eq('team_id', filters.team_id);
    if (filters?.recruiter_id) query = query.eq('recruiter_id', filters.recruiter_id);
    if (filters?.start_date) query = query.gte('placement_date', filters.start_date);
    if (filters?.end_date) query = query.lte('placement_date', filters.end_date);

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}
