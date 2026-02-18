import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Briefcase, Calendar, Users, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Team } from '@/types';

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function YearlyTracking() {
  const { user } = useAuth();
  const { canViewAllData } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState('placements');
  const [teamData, setTeamData] = useState<any[]>([]);
  const [ytdTotals, setYtdTotals] = useState({
    placements: 0,
    interviews: 0,
    job_orders: 0,
    revenue: 0,
  });

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedTeam]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: teamsData } = await supabase.from('teams').select('*');
      setTeams(teamsData || []);

      let teamIds: string[] = [];
      if (selectedTeam !== 'all') {
        teamIds = [selectedTeam];
      } else if (!canViewAllData() && user?.team_id) {
        teamIds = [user.team_id];
      } else {
        teamIds = teamsData?.map((t: any) => t.id) || [];
      }

      const yearlyData: any[] = [];

      for (const teamId of teamIds) {
        const team = teamsData?.find((t: any) => t.id === teamId);
        if (!team) continue;

        const { data: teamUsers } = await supabase
          .from('users')
          .select('id')
          .eq('team_id', teamId);

        const userIds = teamUsers?.map((u: any) => u.id) || [];

        const { data: placements } = await supabase
          .from('placements')
          .select('*')
          .eq('team_id', teamId)
          .gte('placement_date', `${selectedYear}-01-01`)
          .lte('placement_date', `${selectedYear}-12-31`);

        const { data: ftis } = await supabase
          .from('fti_schedules')
          .select('*')
          .eq('team_id', teamId)
          .gte('interview_date', `${selectedYear}-01-01`)
          .lte('interview_date', `${selectedYear}-12-31`);

        const { data: metrics } = await supabase
          .from('daily_metrics')
          .select('*')
          .in('user_id', userIds)
          .gte('date', `${selectedYear}-01-01`)
          .lte('date', `${selectedYear}-12-31`);

        const monthlyData = months.map((monthName, index) => {
          const monthPlacements = (placements || []).filter(
            (p: any) => new Date(p.placement_date).getMonth() === index
          );
          const monthFTIs = (ftis || []).filter(
            (f: any) => new Date(f.interview_date).getMonth() === index
          );
          const monthJOs = (metrics || []).filter((m: any) => new Date(m.date).getMonth() === index);

          return {
            month: index + 1,
            monthName,
            placements: monthPlacements.length,
            interviews: monthFTIs.length,
            job_orders: monthJOs.reduce((sum: number, m: any) => sum + (m.jo || 0), 0),
            revenue: monthPlacements.reduce((sum: number, p: any) => sum + (p.fee_amount || 0), 0),
          };
        });

        yearlyData.push({
          team_id: teamId,
          team_name: team.name,
          monthly_data: monthlyData,
          ytd_placements: monthlyData.reduce((sum: number, m: any) => sum + m.placements, 0),
          ytd_interviews: monthlyData.reduce((sum: number, m: any) => sum + m.interviews, 0),
          ytd_job_orders: monthlyData.reduce((sum: number, m: any) => sum + m.job_orders, 0),
          ytd_revenue: monthlyData.reduce((sum: number, m: any) => sum + m.revenue, 0),
        });
      }

      setTeamData(yearlyData);

      setYtdTotals({
        placements: yearlyData.reduce((sum, t) => sum + t.ytd_placements, 0),
        interviews: yearlyData.reduce((sum, t) => sum + t.ytd_interviews, 0),
        job_orders: yearlyData.reduce((sum, t) => sum + t.ytd_job_orders, 0),
        revenue: yearlyData.reduce((sum, t) => sum + t.ytd_revenue, 0),
      });
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportToCSV = () => {
    let csv = 'Team,Metric,' + months.join(',') + ',YTD Total\n';

    teamData.forEach((team: any) => {
      csv += `${team.team_name},Placements,${team.monthly_data
        .map((m: any) => m.placements)
        .join(',')},${team.ytd_placements}\n`;
      csv += `${team.team_name},Interviews,${team.monthly_data
        .map((m: any) => m.interviews)
        .join(',')},${team.ytd_interviews}\n`;
      csv += `${team.team_name},Job Orders,${team.monthly_data
        .map((m: any) => m.job_orders)
        .join(',')},${team.ytd_job_orders}\n`;
      csv += `${team.team_name},Revenue,${team.monthly_data
        .map((m: any) => m.revenue)
        .join(',')},${team.ytd_revenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yearly-tracking-${selectedYear}.csv`;
    a.click();
  };

  const getChartData = () => {
    return months.map((month, index) => {
      const data: any = { month };
      teamData.forEach((team: any) => {
        const monthData = team.monthly_data[index];
        if (activeTab === 'placements') {
          data[team.team_name] = monthData.placements;
        } else if (activeTab === 'interviews') {
          data[team.team_name] = monthData.interviews;
        } else if (activeTab === 'joborders') {
          data[team.team_name] = monthData.job_orders;
        } else if (activeTab === 'revenue') {
          data[team.team_name] = monthData.revenue;
        }
      });
      return data;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const chartData = getChartData();
  const colors = ['#1e3a5f', '#c75b2a', '#22c55e'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yearly Tracking</h1>
          <p className="text-gray-500">Annual performance by team</p>
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
          {canViewAllData() && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Placements</p>
                <p className="text-2xl font-bold">{ytdTotals.placements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Interviews</p>
                <p className="text-2xl font-bold">{ytdTotals.interviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Job Orders</p>
                <p className="text-2xl font-bold">{ytdTotals.job_orders.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(ytdTotals.revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="joborders">Job Orders</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'placements' && 'Monthly Placements'}
                {activeTab === 'interviews' && 'Monthly Interviews'}
                {activeTab === 'joborders' && 'Monthly Job Orders'}
                {activeTab === 'revenue' && 'Monthly Revenue'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(v) =>
                        activeTab === 'revenue' ? `$${v / 1000}k` : v
                      }
                    />
                    <Tooltip
                      formatter={(v: number) =>
                        activeTab === 'revenue' ? formatCurrency(v) : v
                      }
                    />
                    {teamData.map((team: any, index: number) => (
                      <Bar
                        key={team.team_id}
                        dataKey={team.team_name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold">Team</th>
                      {months.map((m) => (
                        <th key={m} className="text-center py-3 px-2 font-semibold text-sm">
                          {m}
                        </th>
                      ))}
                      <th className="text-right py-3 px-4 font-semibold">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamData.map((team: any) => (
                      <tr key={team.team_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{team.team_name}</td>
                        {team.monthly_data.map((m: any) => (
                          <td key={m.month} className="text-center py-3 px-2 text-sm">
                            {activeTab === 'placements' && m.placements}
                            {activeTab === 'interviews' && m.interviews}
                            {activeTab === 'joborders' && m.job_orders.toFixed(2)}
                            {activeTab === 'revenue' && formatCurrency(m.revenue)}
                          </td>
                        ))}
                        <td className="text-right py-3 px-4 font-bold">
                          {activeTab === 'placements' && team.ytd_placements}
                          {activeTab === 'interviews' && team.ytd_interviews}
                          {activeTab === 'joborders' && team.ytd_job_orders.toFixed(2)}
                          {activeTab === 'revenue' && formatCurrency(team.ytd_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
