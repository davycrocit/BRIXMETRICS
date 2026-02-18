import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Briefcase, Calendar, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TeamPerformance } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const { canViewAllData } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('ytd');
  const [kpis, setKpis] = useState({
    sales_ytd: 0,
    sales_goal: 400000,
    placements_ytd: 0,
    placements_goal: 20,
    fti_ytd: 0,
    fti_goal: 150,
    jo_ytd: 0,
    jo_goal: 50,
  });
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, selectedPeriod]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const startOfYear = `${selectedYear}-01-01`;
      const today = new Date().toISOString().split('T')[0];

      // Fetch metrics
      let query = supabase
        .from('daily_metrics')
        .select('*')
        .gte('date', startOfYear)
        .lte('date', today);

      if (!canViewAllData() && user?.team_id) {
        const { data: teamUsers } = await supabase
          .from('users')
          .select('id')
          .eq('team_id', user.team_id);
        
        if (teamUsers) {
          query = query.in('user_id', teamUsers.map((u: any) => u.id));
        }
      }

      const { data: metrics } = await query;

      // Calculate totals
      const totals = (metrics || []).reduce(
        (acc: any, m: any) => ({
          sales_ytd: acc.sales_ytd + (m.placement_amount || 0),
          placements_ytd: acc.placements_ytd + (m.placement_count || 0),
          fti_ytd: acc.fti_ytd + (m.fti || 0),
          jo_ytd: acc.jo_ytd + (m.jo || 0),
        }),
        { sales_ytd: 0, placements_ytd: 0, fti_ytd: 0, jo_ytd: 0 }
      );

      setKpis((prev) => ({ ...prev, ...totals }));

      // Fetch team performance
      await fetchTeamPerformance();

      // Fetch top performers
      await fetchTopPerformers();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamPerformance = async () => {
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: allMetrics } = await supabase
      .from('daily_metrics')
      .select('*, user:users(team_id)')
      .gte('date', `${selectedYear}-01-01`);

    const performance: TeamPerformance[] = (teams || []).map((team: any) => {
      const teamMetrics = (allMetrics || []).filter((m: any) => m.user?.team_id === team.id);
      const sales_actual = teamMetrics.reduce((sum: number, m: any) => sum + (m.placement_amount || 0), 0);
      const fti_actual = teamMetrics.reduce((sum: number, m: any) => sum + (m.fti || 0), 0);
      const jo_actual = teamMetrics.reduce((sum: number, m: any) => sum + (m.jo || 0), 0);

      const sales_goal = 80000;
      const fti_goal = 30;
      const jo_goal = 10;

      const sales_percent = sales_goal > 0 ? (sales_actual / sales_goal) * 100 : 0;

      return {
        team_id: team.id,
        team_name: team.name,
        sales_actual,
        sales_goal,
        sales_percent,
        fti_actual,
        fti_goal,
        fti_percent: fti_goal > 0 ? (fti_actual / fti_goal) * 100 : 0,
        jo_actual,
        jo_goal,
        jo_percent: jo_goal > 0 ? (jo_actual / jo_goal) * 100 : 0,
        status: sales_percent >= 100 ? 'ahead' : sales_percent >= 80 ? 'on_track' : 'behind',
      };
    });

    setTeamPerformance(performance);
  };

  const fetchTopPerformers = async () => {
    const { data: users } = await supabase
      .from('users')
      .select('*, team:teams(name)')
      .eq('is_active', true);

    const { data: metrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('date', `${selectedYear}-01-01`);

    const rankings = (users || []).map((user: any) => {
      const userMetrics = (metrics || []).filter((m: any) => m.user_id === user.id);
      const rp_total = userMetrics.reduce((sum: number, m: any) => sum + (m.rp || 0), 0);
      
      return {
        user_id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        team_name: user.team?.name || 'No Team',
        rp_total,
      };
    }).sort((a: any, b: any) => b.rp_total - a.rp_total).slice(0, 5);

    setTopPerformers(rankings);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 100) return 'text-green-600';
    if (percent >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percent: number) => {
    if (percent >= 100) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (percent >= 80) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Sales YTD',
      actual: kpis.sales_ytd,
      goal: kpis.sales_goal,
      icon: DollarSign,
      format: 'currency' as const,
    },
    {
      label: 'Placements YTD',
      actual: kpis.placements_ytd,
      goal: kpis.placements_goal,
      icon: Briefcase,
      format: 'number' as const,
    },
    {
      label: 'FTI YTD',
      actual: kpis.fti_ytd,
      goal: kpis.fti_goal,
      icon: Calendar,
      format: 'number' as const,
    },
    {
      label: 'Job Orders YTD',
      actual: kpis.jo_ytd,
      goal: kpis.jo_goal,
      icon: Target,
      format: 'number' as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.first_name}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const percentToGoal = kpi.goal > 0 ? (kpi.actual / kpi.goal) * 100 : 0;
          const Icon = kpi.icon;

          return (
            <Card key={kpi.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {kpi.format === 'currency' ? formatCurrency(kpi.actual) : formatNumber(kpi.actual)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${percentToGoal >= 80 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Icon className={`h-5 w-5 ${percentToGoal >= 80 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">
                      Goal: {kpi.format === 'currency' ? formatCurrency(kpi.goal) : formatNumber(kpi.goal)}
                    </span>
                    <span className={getStatusColor(percentToGoal)}>
                      {percentToGoal.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Math.min(percentToGoal, 100)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Team Performance */}
      {canViewAllData() && (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Team</th>
                    <th className="text-right py-3 px-4 font-semibold">Sales</th>
                    <th className="text-right py-3 px-4 font-semibold">% to Goal</th>
                    <th className="text-right py-3 px-4 font-semibold">FTI</th>
                    <th className="text-right py-3 px-4 font-semibold">% to Goal</th>
                    <th className="text-right py-3 px-4 font-semibold">JO</th>
                    <th className="text-right py-3 px-4 font-semibold">% to Goal</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.map((team) => (
                    <tr key={team.team_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{team.team_name}</td>
                      <td className="text-right py-3 px-4">{formatCurrency(team.sales_actual)}</td>
                      <td className={`text-right py-3 px-4 ${getStatusColor(team.sales_percent)}`}>
                        {team.sales_percent.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatNumber(team.fti_actual)}</td>
                      <td className={`text-right py-3 px-4 ${getStatusColor(team.fti_percent)}`}>
                        {team.fti_percent.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">{formatNumber(team.jo_actual)}</td>
                      <td className={`text-right py-3 px-4 ${getStatusColor(team.jo_percent)}`}>
                        {team.jo_percent.toFixed(1)}%
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge
                          className={
                            team.status === 'ahead' ? 'bg-green-500' :
                            team.status === 'on_track' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }
                        >
                          {team.status === 'ahead' ? 'Ahead' : team.status === 'on_track' ? 'On Track' : 'Behind'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="team_name" />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="sales_actual" fill="#1e3a5f" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers - Recruiting Presentations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.user_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-gray-500">{performer.team_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatNumber(performer.rp_total)}</p>
                    <p className="text-sm text-gray-500">RPs</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
