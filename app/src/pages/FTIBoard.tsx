import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { FTISchedule, Team } from '@/types';

const statusColors = {
  submitted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels = {
  submitted: 'Submitted',
  scheduled: 'Scheduled',
  completed: 'Completed',
};

export default function FTIBoard() {
  const { user } = useAuth();
  const { canViewAllData, canViewTeamData } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);
  const [ftis, setFtis] = useState<FTISchedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFTI, setNewFTI] = useState<Partial<FTISchedule>>({
    candidate_name: '',
    position: '',
    company: '',
    interview_date: null,
    status: 'submitted',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [selectedTeam, selectedStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: teamsData } = await supabase.from('teams').select('*');
      setTeams(teamsData || []);

      let query = supabase
        .from('fti_schedules')
        .select('*, recruiter:users(first_name, last_name), team:teams(name)')
        .order('created_at', { ascending: false });

      if (selectedTeam !== 'all') {
        query = query.eq('team_id', selectedTeam);
      }
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      if (!canViewAllData() && user?.team_id) {
        query = query.eq('team_id', user.team_id);
      }

      const { data: ftisData } = await query;
      setFtis(ftisData || []);
    } catch (error) {
      console.error('Error fetching FTI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFTI = async () => {
    if (!user?.team_id) {
      toast.error('You must be assigned to a team to create FTIs');
      return;
    }

    try {
      const { error } = await supabase.from('fti_schedules').insert({
        candidate_name: newFTI.candidate_name,
        position: newFTI.position,
        company: newFTI.company,
        interview_date: newFTI.interview_date,
        status: newFTI.status || 'submitted',
        recruiter_id: user.id,
        team_id: user.team_id,
        notes: newFTI.notes,
      });

      if (error) throw error;

      toast.success('FTI created successfully!');
      setIsDialogOpen(false);
      setNewFTI({
        candidate_name: '',
        position: '',
        company: '',
        interview_date: null,
        status: 'submitted',
        notes: '',
      });
      await fetchData();
    } catch (error) {
      toast.error('Failed to create FTI. Please try again.');
    }
  };

  const handleUpdateStatus = async (ftiId: string, newStatus: 'submitted' | 'scheduled' | 'completed') => {
    try {
      const { error } = await supabase
        .from('fti_schedules')
        .update({ status: newStatus })
        .eq('id', ftiId);

      if (error) throw error;

      toast.success('Status updated!');
      await fetchData();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const getStatusCounts = () => {
    return {
      submitted: ftis.filter((f) => f.status === 'submitted').length,
      scheduled: ftis.filter((f) => f.status === 'scheduled').length,
      completed: ftis.filter((f) => f.status === 'completed').length,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FTI Board</h1>
          <p className="text-gray-500">First Time Interview Tracking</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-[#1e3a5f] hover:bg-[#152a45]">
            <Plus className="mr-2 h-4 w-4" />
            Add FTI
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New FTI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Candidate Name</Label>
                <Input
                  value={newFTI.candidate_name}
                  onChange={(e) => setNewFTI({ ...newFTI, candidate_name: e.target.value })}
                  placeholder="Enter candidate name"
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={newFTI.position}
                  onChange={(e) => setNewFTI({ ...newFTI, position: e.target.value })}
                  placeholder="Enter position title"
                />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={newFTI.company}
                  onChange={(e) => setNewFTI({ ...newFTI, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-2">
                <Label>Interview Date</Label>
                <Input
                  type="datetime-local"
                  value={newFTI.interview_date || ''}
                  onChange={(e) => setNewFTI({ ...newFTI, interview_date: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newFTI.status}
                  onValueChange={(v) => setNewFTI({ ...newFTI, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newFTI.notes || ''}
                  onChange={(e) => setNewFTI({ ...newFTI, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
              <Button onClick={handleCreateFTI} className="w-full bg-[#1e3a5f] hover:bg-[#152a45]">
                Add FTI
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.submitted}</p>
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
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {canViewAllData() && (
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by team" />
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
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* FTI Table */}
      <Card>
        <CardHeader>
          <CardTitle>All FTIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold">Candidate</th>
                  <th className="text-left py-3 px-4 font-semibold">Position</th>
                  <th className="text-left py-3 px-4 font-semibold">Company</th>
                  <th className="text-left py-3 px-4 font-semibold">Interview Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Team</th>
                  <th className="text-left py-3 px-4 font-semibold">Recruiter</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  {canViewTeamData() && <th className="text-center py-3 px-4 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {ftis.map((fti) => (
                  <tr key={fti.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{fti.candidate_name}</td>
                    <td className="py-3 px-4">{fti.position}</td>
                    <td className="py-3 px-4">{fti.company}</td>
                    <td className="py-3 px-4">
                      {fti.interview_date 
                        ? new Date(fti.interview_date).toLocaleString() 
                        : 'Not scheduled'}
                    </td>
                    <td className="py-3 px-4">{fti.team?.name}</td>
                    <td className="py-3 px-4">
                      {fti.recruiter?.first_name} {fti.recruiter?.last_name}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge className={statusColors[fti.status]}>
                        {statusLabels[fti.status]}
                      </Badge>
                    </td>
                    {canViewTeamData() && (
                      <td className="text-center py-3 px-4">
                        <Select
                          value={fti.status}
                          onValueChange={(v) => handleUpdateStatus(fti.id, v as any)}
                        >
                          <SelectTrigger className="w-32 mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    )}
                  </tr>
                ))}
                {ftis.length === 0 && (
                  <tr>
                    <td colSpan={canViewTeamData() ? 8 : 7} className="text-center py-8 text-gray-500">
                      No FTIs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
