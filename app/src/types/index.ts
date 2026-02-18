export type UserRole = 'admin' | 'manager' | 'recruiter';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  team?: Team;
}

export interface Team {
  id: string;
  name: string;
  manager_ids: string[];
  created_at: string;
  managers?: User[];
  members?: User[];
}

export interface DailyMetrics {
  id: string;
  user_id: string;
  date: string;
  rp: number;
  mp: number;
  subs: number;
  jo: number;
  fti: number;
  placement_amount: number;
  placement_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export type MetricType = 'sales' | 'fti' | 'jo' | 'rp' | 'mp' | 'subs';

export interface Goal {
  id: string;
  user_id: string | null;
  team_id: string | null;
  year: number;
  month: number | null;
  metric_type: MetricType;
  target_value: number;
  created_at: string;
}

export type FTIStatus = 'submitted' | 'scheduled' | 'completed';

export interface FTISchedule {
  id: string;
  candidate_name: string;
  position: string;
  company: string;
  interview_date: string | null;
  status: FTIStatus;
  recruiter_id: string;
  team_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  recruiter?: User;
  team?: Team;
}

export interface Placement {
  id: string;
  candidate_name: string;
  position: string;
  company: string;
  placement_date: string;
  fee_amount: number;
  recruiter_id: string;
  team_id: string;
  created_at: string;
  recruiter?: User;
  team?: Team;
}

export type CandidateSource = 
  | 'ATS' 
  | 'LinkedIn Email' 
  | 'LinkedIn CR Msg' 
  | 'Zoominfo Cold Call' 
  | 'Reply from Talent Bulletin' 
  | 'Referral' 
  | 'Applied via Website';

export type DealClassification = 
  | 'Candidate Sourced 25%' 
  | 'Candidate Submission 25%' 
  | 'Client MP 25%' 
  | 'Client JO 25%';

export type DealStatus = 'pending' | 'invoiced' | 'paid' | 'overdue';

export interface PipelineDeal {
  id: string;
  company: string;
  job_title: string;
  candidate_name: string;
  amount: number;
  invoice_number: string | null;
  invoice_date: string | null;
  payment_due_date: string | null;
  classification: DealClassification;
  is_retainer: boolean;
  candidate_source: CandidateSource;
  recruiter_id: string;
  team_id: string;
  status: DealStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  recruiter?: User;
  team?: Team;
}

export interface DashboardKPI {
  label: string;
  actual: number;
  goal: number;
  percent_to_goal: number;
}

export interface TeamPerformance {
  team_id: string;
  team_name: string;
  sales_actual: number;
  sales_goal: number;
  sales_percent: number;
  fti_actual: number;
  fti_goal: number;
  fti_percent: number;
  jo_actual: number;
  jo_goal: number;
  jo_percent: number;
  status: 'ahead' | 'on_track' | 'behind';
}

export interface MonthlyTracking {
  month: number;
  month_name: string;
  placements: number;
  interviews: number;
  job_orders: number;
  revenue: number;
}

export interface YearlyTrackingData {
  team_id: string;
  team_name: string;
  monthly_data: MonthlyTracking[];
  ytd_placements: number;
  ytd_interviews: number;
  ytd_job_orders: number;
  ytd_revenue: number;
}
