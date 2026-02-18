import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { CalendarIcon, Save, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import type { DailyMetrics, User } from '@/types';

interface MonthlyData {
  date: Date;
  rp: number;
  mp: number;
  goalRp: number;
  goalMp: number;
}

interface TeamMemberData {
  user: User;
  monthlyRp: number;
  monthlyMp: number;
  rpGoal: number;
  mpGoal: number;
}

export default function DailyMetrics() {
  const { user } = useAuth();
  const { canViewTeamData } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<Partial<DailyMetrics>>({
    rp: 0,
    mp: 0,
    subs: 0,
    jo: 0,
    fti: 0,
    placement_amount: 0,
    placement_count: 0,
    notes: '',
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [teamRankings, setTeamRankings] = useState<TeamMemberData[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch metrics for selected date
      if (user) {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data: existingMetrics } = await supabase
          .from('daily_metrics')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', dateStr)
          .single();

        if (existingMetrics) {
          setMetrics(existingMetrics);
        } else {
          setMetrics({
            rp: 0,
            mp: 0,
            subs: 0,
            jo: 0,
            fti: 0,
            placement_amount: 0,
            placement_count: 0,
            notes: '',
          });
        }
      }

      await fetchMonthlyData();

      if (canViewTeamData()) {
        await fetchTeamRankings();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });

    const { data: monthMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', user?.id)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'));

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .eq('year', selectedDate.getFullYear())
      .eq('month', selectedDate.getMonth() + 1);

    const rpGoal = goals?.find((g: any) => g.metric_type === 'rp')?.target_value || 0;
    const mpGoal = goals?.find((g: any) => g.metric_type === 'mp')?.target_value || 0;
    const dailyRpGoal = rpGoal / days.length;
    const dailyMpGoal = mpGoal / days.length;

    const data: MonthlyData[] = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayMetrics = monthMetrics?.find((m: any) => m.date === dayStr);
      return {
        date: day,
        rp: dayMetrics?.rp || 0,
        mp: dayMetrics?.mp || 0,
        goalRp: dailyRpGoal,
        goalMp: dailyMpGoal,
      };
    });

    setMonthlyData(data);
  };

  const fetchTeamRankings = async () => {
    let query = supabase.from('users').select('*').eq('is_active', true);
    if (!canViewTeamData() && user?.team_id) {
      query = query.eq('team_id', user.team_id);
    }

    const { data: users } = await query;

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const memberData: TeamMemberData[] = [];

    for (const u of users || []) {
      const { data: userMetrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', u.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      const { data: userGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', u.id)
        .eq('year', selectedDate.getFullYear())
        .eq('month', selectedDate.getMonth() + 1);

      const monthlyRp = userMetrics?.reduce((sum: number, m: any) => sum + (m.rp || 0), 0) || 0;
      const monthlyMp = userMetrics?.reduce((sum: number, m: any) => sum + (m.mp || 0), 0) || 0;
      const rpGoal = userGoals?.find((g: any) => g.metric_type === 'rp')?.target_value || 0;
      const mpGoal = userGoals?.find((g: any) => g.metric_type === 'mp')?.target_value || 0;

      memberData.push({
        user: u as User,
        monthlyRp,
        monthlyMp,
        rpGoal,
        mpGoal,
      });
    }

    memberData.sort((a, b) => {
      const aPercent = a.rpGoal > 0 ? a.monthlyRp / a.rpGoal : 0;
      const bPercent = b.rpGoal > 0 ? b.monthlyMp / b.mpGoal : 0;
      return bPercent - aPercent;
    });

    setTeamRankings(memberData);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { error } = await supabase
        .from('daily_metrics')
        .upsert({
          user_id: user.id,
          date: dateStr,
          rp: metrics.rp || 0,
          mp: metrics.mp || 0,
          subs: metrics.subs || 0,
          jo: metrics.jo || 0,
          fti: metrics.fti || 0,
          placement_amount: metrics.placement_amount || 0,
          placement_count: metrics.placement_count || 0,
          notes: metrics.notes || '',
        }, { onConflict: 'user_id,date' });

      if (error) throw error;

      toast.success('Metrics saved successfully!');
      await fetchMonthlyData();
      if (canViewTeamData()) {
        await fetchTeamRankings();
      }
    } catch (error) {
      toast.error('Failed to save metrics. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof DailyMetrics, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setMetrics((prev) => ({ ...prev, [field]: numValue }));
  };

  const getStatusColor = (actual: number, goal: number) => {
    if (goal === 0) return 'text-gray-500';
    const percent = (actual / goal) * 100;
    if (percent >= 100) return 'text-green-600';
    if (percent >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const monthlyTotals = monthlyData.reduce(
    (acc, day) => ({
      rp: acc.rp + day.rp,
      mp: acc.mp + day.mp,
      goalRp: acc.goalRp + day.goalRp,
      goalMp: acc.goalMp + day.goalMp,
    }),
    { rp: 0, mp: 0, goalRp: 0, goalMp: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Metrics</h1>
        <p className="text-gray-500">Track your daily recruiting activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Enter Today's Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rp">RP (Recruiting Presentations)</Label>
                <Input
                  id="rp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={metrics.rp || ''}
                  onChange={(e) => handleInputChange('rp', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mp">MP (Marketing Presentations)</Label>
                <Input
                  id="mp"
                  type="number"
                  step="0.01"
                  min="0"
                  value={metrics.mp || ''}
                  onChange={(e) => handleInputChange('mp', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subs">Submissions</Label>
                <Input
                  id="subs"
                  type="number"
                  step="0.01"
                  min="0"
                  value={metrics.subs || ''}
                  onChange={(e) => handleInputChange('subs', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jo">Job Orders</Label>
                <Input
                  id="jo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={metrics.jo || ''}
                  onChange={(e) => handleInputChange('jo', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fti">First Time Interviews</Label>
                <Input
                  id="fti"
                  type="number"
                  step="0.01"
                  min="0"
                  value={metrics.fti || ''}
                  onChange={(e) => handleInputChange('fti', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="placement_count">Placements</Label>
                <Input
                  id="placement_count"
                  type="number"
                  step="0.01"
                  min="0"
                  value={metrics.placement_count || ''}
                  onChange={(e) => handleInputChange('placement_count', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placement_amount">Placement Revenue ($)</Label>
              <Input
                id="placement_amount"
                type="number"
                step="0.01"
                min="0"
                value={metrics.placement_amount || ''}
                onChange={(e) => handleInputChange('placement_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={metrics.notes || ''}
                onChange={(e) => setMetrics((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#1e3a5f] hover:bg-[#152a45]"
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Metrics
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Progress - {format(selectedDate, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">RP Progress</p>
                    <p className={`text-2xl font-bold ${getStatusColor(monthlyTotals.rp, monthlyTotals.goalRp)}`}>
                      {monthlyTotals.rp.toFixed(2)} / {monthlyTotals.goalRp.toFixed(2)}
                    </p>
                  </div>
                  {monthlyTotals.rp >= monthlyTotals.goalRp ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {monthlyTotals.goalRp > 0 ? ((monthlyTotals.rp / monthlyTotals.goalRp) * 100).toFixed(1) : 0}% of goal
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">MP Progress</p>
                    <p className={`text-2xl font-bold ${getStatusColor(monthlyTotals.mp, monthlyTotals.goalMp)}`}>
                      {monthlyTotals.mp.toFixed(2)} / {monthlyTotals.goalMp.toFixed(2)}
                    </p>
                  </div>
                  {monthlyTotals.mp >= monthlyTotals.goalMp ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {monthlyTotals.goalMp > 0 ? ((monthlyTotals.mp / monthlyTotals.goalMp) * 100).toFixed(1) : 0}% of goal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {monthlyData.map((day, index) => {
                const isToday = isSameDay(day.date, new Date());
                const hasData = day.rp > 0 || day.mp > 0;
                const rpDiff = day.rp - day.goalRp;
                const mpDiff = day.mp - day.goalMp;

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[80px] p-2 border rounded-lg text-sm
                      ${isToday ? 'border-[#1e3a5f] border-2' : 'border-gray-200'}
                      ${hasData ? 'bg-gray-50' : ''}
                    `}
                  >
                    <div className="font-medium text-gray-700">{format(day.date, 'd')}</div>
                    {hasData && (
                      <div className="mt-1 space-y-1">
                        <div className={`text-xs ${rpDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          RP: {day.rp.toFixed(2)}
                        </div>
                        <div className={`text-xs ${mpDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          MP: {day.mp.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Rankings */}
      {canViewTeamData() && teamRankings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Rankings - {format(selectedDate, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-right py-3 px-4 font-semibold">RP</th>
                    <th className="text-right py-3 px-4 font-semibold">RP Goal</th>
                    <th className="text-right py-3 px-4 font-semibold">RP %</th>
                    <th className="text-right py-3 px-4 font-semibold">MP</th>
                    <th className="text-right py-3 px-4 font-semibold">MP Goal</th>
                    <th className="text-right py-3 px-4 font-semibold">MP %</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRankings.map((member, index) => {
                    const rpPercent = member.rpGoal > 0 ? (member.monthlyRp / member.rpGoal) * 100 : 0;
                    const mpPercent = member.mpGoal > 0 ? (member.monthlyMp / member.mpGoal) * 100 : 0;
                    const avgPercent = (rpPercent + mpPercent) / 2;

                    return (
                      <tr key={member.user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Badge
                            variant={index < 3 ? 'default' : 'secondary'}
                            className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : ''}
                          >
                            #{index + 1}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {member.user.first_name} {member.user.last_name}
                        </td>
                        <td className="text-right py-3 px-4">{member.monthlyRp.toFixed(2)}</td>
                        <td className="text-right py-3 px-4 text-gray-500">{member.rpGoal.toFixed(2)}</td>
                        <td className={`text-right py-3 px-4 ${getStatusColor(member.monthlyRp, member.rpGoal)}`}>
                          {rpPercent.toFixed(1)}%
                        </td>
                        <td className="text-right py-3 px-4">{member.monthlyMp.toFixed(2)}</td>
                        <td className="text-right py-3 px-4 text-gray-500">{member.mpGoal.toFixed(2)}</td>
                        <td className={`text-right py-3 px-4 ${getStatusColor(member.monthlyMp, member.mpGoal)}`}>
                          {mpPercent.toFixed(1)}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge
                            className={
                              avgPercent >= 100 ? 'bg-green-500' :
                              avgPercent >= 80 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }
                          >
                            {avgPercent >= 100 ? 'On Track' : avgPercent >= 80 ? 'Caution' : 'Behind'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
