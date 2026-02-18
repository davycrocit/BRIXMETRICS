import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Edit2, Users, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Team, User } from '@/types';

export default function TeamManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    manager_ids: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: teamsData } = await supabase.from('teams').select('*');
      setTeams(teamsData || []);

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      const { error } = await supabase.from('teams').insert({
        name: formData.name,
        manager_ids: formData.manager_ids,
      });

      if (error) throw error;

      toast.success('Team created successfully!');
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error('Failed to create team.');
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: formData.name,
          manager_ids: formData.manager_ids,
        })
        .eq('id', editingTeam.id);

      if (error) throw error;

      toast.success('Team updated successfully!');
      setIsDialogOpen(false);
      setEditingTeam(null);
      resetForm();
      await fetchData();
    } catch (error: any) {
      toast.error('Failed to update team.');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const { data: members } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', teamId);

      if (members && members.length > 0) {
        toast.error('Cannot delete team with active members. Please reassign members first.');
        return;
      }

      const { error } = await supabase.from('teams').delete().eq('id', teamId);

      if (error) throw error;

      toast.success('Team deleted successfully!');
      await fetchData();
    } catch (error: any) {
      toast.error('Failed to delete team.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      manager_ids: [],
    });
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      manager_ids: team.manager_ids || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTeam(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getTeamMembers = (teamId: string) => {
    return users.filter((u) => u.team_id === teamId);
  };

  const getManagers = (managerIds: string[]) => {
    return users.filter((u) => managerIds.includes(u.id));
  };

  const addManager = (userId: string) => {
    if (!formData.manager_ids.includes(userId)) {
      setFormData({
        ...formData,
        manager_ids: [...formData.manager_ids, userId],
      });
    }
  };

  const removeManager = (userId: string) => {
    setFormData({
      ...formData,
      manager_ids: formData.manager_ids.filter((id) => id !== userId),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">Manage teams and their managers</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-[#1e3a5f] hover:bg-[#152a45]">
          <Plus className="mr-2 h-4 w-4" />
          Add Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => {
          const members = getTeamMembers(team.id);
          const managers = getManagers(team.manager_ids || []);

          return (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle>{team.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(team)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Managers</p>
                  <div className="flex flex-wrap gap-2">
                    {managers.length > 0 ? (
                      managers.map((manager) => (
                        <Badge key={manager.id} variant="secondary">
                          {manager.first_name} {manager.last_name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No managers assigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Members ({members.length})
                  </p>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {members.length > 0
                        ? members.map((m) => `${m.first_name} ${m.last_name}`).join(', ')
                        : 'No members'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
              />
            </div>

            <div className="space-y-2">
              <Label>Managers</Label>
              <Select onValueChange={addManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a manager" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => !formData.manager_ids.includes(u.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.manager_ids.map((managerId) => {
                  const manager = users.find((u) => u.id === managerId);
                  if (!manager) return null;
                  return (
                    <Badge key={managerId} variant="secondary" className="flex items-center gap-1">
                      {manager.first_name} {manager.last_name}
                      <button
                        onClick={() => removeManager(managerId)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
              className="w-full bg-[#1e3a5f] hover:bg-[#152a45]"
            >
              {editingTeam ? 'Update Team' : 'Create Team'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
